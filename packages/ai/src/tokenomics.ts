// Original work by the same author.
import { readFileSync, statSync } from "node:fs";
import { err, ok, tryCatch, type Result } from "@zedtech/zedkit-core";
import { parseFrontmatter } from "./frontmatter.js";
import { kitDir } from "./kit.js";

/** How an agent is used for one call. Declared per invocation, never per agent. */
export const KINDS = ["decide", "design", "build", "check"] as const;
/** How much is at risk. Ordered: each value is above the one before. */
export const STAKES = ["trivial", "standard", "sensitive", "critical"] as const;
/** Reasoning effort of a routing cell. Ordered. */
export const EFFORTS = ["low", "medium", "high", "max"] as const;
export const REASONING = ["low", "medium", "high"] as const;
export const CONTEXT_SIZES = ["small", "medium", "large"] as const;
/** Review requirement of a gate. Ordered. */
export const REVIEWS = ["none", "optional", "recommended", "required"] as const;
/** Same ids as the installer's `ALL_PROVIDERS` (a test keeps them equal). */
export const POLICY_PROVIDERS = ["cursor", "claude", "codex", "muse"] as const;

export type Kind = (typeof KINDS)[number];
export type Stakes = (typeof STAKES)[number];
export type Effort = (typeof EFFORTS)[number];
export type Reasoning = (typeof REASONING)[number];
export type ContextSize = (typeof CONTEXT_SIZES)[number];
export type Review = (typeof REVIEWS)[number];
export type PolicyProvider = (typeof POLICY_PROVIDERS)[number];

export type Cell = { model: string; effort: Effort };
export type Needs = { reasoning: Reasoning; context: ContextSize };
export type Gate = {
  review: Review;
  second_review?: "none" | "independent";
  distinct_model?: boolean;
  human?: "none" | "required";
  /** Provider id for the independent second review (`critical` only). Never a model. */
  second_review_provider?: PolicyProvider;
};
export type ProviderPolicy = Record<Kind, Record<Stakes, Cell>> & {
  /** Abstract context size -> token count for this provider (`128k`, `1M`, or an integer). */
  context_windows?: Partial<Record<ContextSize, string | number>>;
};
export type AgentFloor = { min_stakes?: Stakes; min_effort?: Effort };
export type HardcodeConfig = { allow_paths?: string[]; extra_patterns?: string[]; scan_nested?: boolean };

/** A complete policy: the shipped defaults, or a project file merged over them. */
export type Tokenomics = {
  schema: 1;
  default_provider?: PolicyProvider;
  default_needs: Needs;
  strict_headers: boolean;
  providers: Record<PolicyProvider, ProviderPolicy>;
  gates: Record<Stakes, Gate>;
  agents: Record<string, AgentFloor>;
  hardcode: HardcodeConfig;
};

type Obj = Record<string, unknown>;

/** A project file: any subset of a policy (it overrides the defaults key by key). */
export type TokenomicsLayer = Obj;

const TOP_KEYS = ["schema", "default_provider", "default_needs", "strict_headers", "providers", "gates", "agents", "hardcode"];
const GATE_KEYS = ["review", "second_review", "distinct_model", "human", "second_review_provider"];
const SIZE_VALUE = /^\d+(?:\.\d+)?[kKmM]?$/;
const MODEL_VALUE = /^[A-Za-z0-9][\w.:/@+-]*$/;

// Id-shaped model names (section 8 families). A frontmatter value outside
// `providers` that looks like one is an error: names live in the cells only.
const MODEL_ID =
  /\b(?:claude-(?:opus|sonnet|haiku|fable)[\w.-]*|claude-\d[\w.-]*|gpt-?\d[\w.-]*|o[134]-(?:mini|pro|preview)|gemini-?\d[\w.-]*|grok-?\d[\w.-]*|composer-?\d[\w.-]*|llama-?\d[\w.-]*|mistral-[\w.-]+|deepseek-[\w.-]+|qwen\d[\w.-]*|(?:sonnet|opus|haiku)[ -]?\d+(?:[.-]\d+)*)/i;

const isObj = (value: unknown): value is Obj => typeof value === "object" && value !== null && !Array.isArray(value);
const isOneOf = <T extends string>(list: readonly T[], value: unknown): value is T =>
  typeof value === "string" && (list as readonly string[]).includes(value);
const rank = <T extends string>(list: readonly T[], value: T): number => list.indexOf(value);

/** Key-wise recursive merge: objects merge, arrays and scalars in `project` replace. */
function deepMerge(base: unknown, over: unknown): unknown {
  if (!isObj(base) || !isObj(over)) return over === undefined ? base : over;
  const out: Obj = { ...base };
  for (const [key, value] of Object.entries(over)) out[key] = deepMerge(base[key], value);
  return out;
}

/** Merge a project file over the shipped defaults. Never mutates either input. */
export function mergeTokenomics(defaults: Tokenomics, project: TokenomicsLayer): Tokenomics {
  return deepMerge(defaults, project) as Tokenomics;
}

/** Parse a policy file (frontmatter only; the body is prose) into a layer. Structure is checked by {@link checkTokenomics}. */
export function parseTokenomics(text: string): Result<TokenomicsLayer> {
  const front = parseFrontmatter(text);
  return front.ok ? ok(front.value.data) : err(front.error);
}

// Parsing the shipped file costs ~7 ms and every validate/install run would
// repeat it, so the result is kept per file and mtime. Callers get a shared
// object: merge never mutates it, and nobody else should.
const defaultsCache = new Map<string, { mtime: number; policy: Tokenomics }>();

/** The policy shipped in the package (`kit/tokenomics.defaults.md`), read at runtime, never copied into a project. */
export function loadDefaults(kit: string = kitDir()): Result<Tokenomics> {
  const file = `${kit}/tokenomics.defaults.md`;
  const stat = tryCatch(() => statSync(file));
  if (!stat.ok) return err(new Error(`cannot read tokenomics.defaults.md: ${stat.error.message}`));
  const cached = defaultsCache.get(file);
  if (cached?.mtime === stat.value.mtimeMs) return ok(cached.policy);
  const read = tryCatch(() => readFileSync(file, "utf8"));
  if (!read.ok) return err(new Error(`cannot read tokenomics.defaults.md: ${read.error.message}`));
  const layer = parseTokenomics(read.value);
  if (!layer.ok) return err(layer.error);
  const policy = layer.value as unknown as Tokenomics;
  defaultsCache.set(file, { mtime: stat.value.mtimeMs, policy });
  return ok(policy);
}

function unknownKeys(data: Obj, allowed: readonly string[], where: string, issues: string[]): void {
  for (const key of Object.keys(data)) {
    if (!allowed.includes(key)) issues.push(`${where}${key}: unknown key (allowed: ${allowed.join(", ")})`);
  }
}

function checkEnum(list: readonly string[], value: unknown, where: string, issues: string[]): void {
  if (!isOneOf(list, value)) issues.push(`${where}: must be one of ${list.join(", ")} (got ${JSON.stringify(value)})`);
}

function checkMapping(value: unknown, where: string, issues: string[]): value is Obj {
  if (isObj(value)) return true;
  issues.push(`${where}: must be a mapping`);
  return false;
}

function checkNeeds(value: unknown, where: string, issues: string[]): void {
  if (!checkMapping(value, where, issues)) return;
  unknownKeys(value, ["reasoning", "context"], `${where}.`, issues);
  if (value.reasoning !== undefined) checkEnum(REASONING, value.reasoning, `${where}.reasoning`, issues);
  if (value.context !== undefined) checkEnum(CONTEXT_SIZES, value.context, `${where}.context`, issues);
}

function checkCell(value: unknown, where: string, issues: string[]): void {
  if (!checkMapping(value, where, issues)) return;
  unknownKeys(value, ["model", "effort"], `${where}.`, issues);
  if (value.model !== undefined && (typeof value.model !== "string" || !MODEL_VALUE.test(value.model))) {
    issues.push(`${where}.model: must be "inherit" or a model id or alias without spaces`);
  }
  if (value.effort !== undefined) checkEnum(EFFORTS, value.effort, `${where}.effort`, issues);
}

function checkContextWindows(value: unknown, where: string, issues: string[]): void {
  if (!checkMapping(value, where, issues)) return;
  unknownKeys(value, CONTEXT_SIZES, `${where}.`, issues);
  for (const [size, window] of Object.entries(value)) {
    const valid =
      typeof window === "number" ? Number.isInteger(window) && window > 0 : typeof window === "string" && SIZE_VALUE.test(window);
    if (!valid) issues.push(`${where}.${size}: must be a token count such as 128k, 1M or an integer (never a model name)`);
  }
}

function checkProviders(value: unknown, issues: string[]): void {
  if (!checkMapping(value, "providers", issues)) return;
  unknownKeys(value, POLICY_PROVIDERS, "providers.", issues);
  for (const [provider, policy] of Object.entries(value)) {
    const base = `providers.${provider}`;
    if (!POLICY_PROVIDERS.some((id) => id === provider) || !checkMapping(policy, base, issues)) continue;
    unknownKeys(policy, [...KINDS, "context_windows"], `${base}.`, issues);
    for (const [kind, row] of Object.entries(policy)) {
      if (kind === "context_windows") {
        checkContextWindows(row, `${base}.context_windows`, issues);
      } else if (KINDS.some((id) => id === kind) && checkMapping(row, `${base}.${kind}`, issues)) {
        unknownKeys(row, STAKES, `${base}.${kind}.`, issues);
        for (const [stakes, cell] of Object.entries(row)) {
          if (STAKES.some((id) => id === stakes)) checkCell(cell, `${base}.${kind}.${stakes}`, issues);
        }
      }
    }
  }
}

function checkGates(value: unknown, issues: string[]): void {
  if (!checkMapping(value, "gates", issues)) return;
  unknownKeys(value, STAKES, "gates.", issues);
  for (const [stakes, gate] of Object.entries(value)) {
    const where = `gates.${stakes}`;
    if (!STAKES.some((id) => id === stakes) || !checkMapping(gate, where, issues)) continue;
    unknownKeys(gate, GATE_KEYS, `${where}.`, issues);
    if (gate.review !== undefined) checkEnum(REVIEWS, gate.review, `${where}.review`, issues);
    if (gate.second_review !== undefined) checkEnum(["none", "independent"], gate.second_review, `${where}.second_review`, issues);
    if (gate.human !== undefined) checkEnum(["none", "required"], gate.human, `${where}.human`, issues);
    if (gate.distinct_model !== undefined && typeof gate.distinct_model !== "boolean") {
      issues.push(`${where}.distinct_model: must be true or false`);
    }
    if (gate.second_review_provider !== undefined) {
      if (stakes !== "critical") issues.push(`${where}.second_review_provider: only gates.critical takes a second review provider`);
      checkEnum(POLICY_PROVIDERS, gate.second_review_provider, `${where}.second_review_provider`, issues);
    }
  }
}

function checkAgents(value: unknown, issues: string[]): void {
  if (!checkMapping(value, "agents", issues)) return;
  for (const [name, floor] of Object.entries(value)) {
    const where = `agents.${name}`;
    if (!checkMapping(floor, where, issues)) continue;
    unknownKeys(floor, ["min_stakes", "min_effort"], `${where}.`, issues);
    if (floor.min_stakes !== undefined) checkEnum(STAKES, floor.min_stakes, `${where}.min_stakes`, issues);
    if (floor.min_effort !== undefined) checkEnum(EFFORTS, floor.min_effort, `${where}.min_effort`, issues);
  }
}

function checkHardcode(value: unknown, issues: string[]): void {
  if (!checkMapping(value, "hardcode", issues)) return;
  unknownKeys(value, ["allow_paths", "extra_patterns", "scan_nested"], "hardcode.", issues);
  for (const key of ["allow_paths", "extra_patterns"]) {
    const list = value[key];
    if (list === undefined) continue;
    if (!Array.isArray(list) || !list.every((item) => typeof item === "string")) {
      issues.push(`hardcode.${key}: must be a list of strings`);
    }
  }
  if (Array.isArray(value.extra_patterns)) {
    for (const pattern of value.extra_patterns) {
      if (typeof pattern === "string" && !tryCatch(() => new RegExp(pattern, "i")).ok) {
        issues.push(`hardcode.extra_patterns: "${pattern}" is not a valid regular expression`);
      }
    }
  }
  if (value.scan_nested !== undefined && typeof value.scan_nested !== "boolean") {
    issues.push("hardcode.scan_nested: must be true or false");
  }
}

// A model name anywhere in the frontmatter except `providers` is an error:
// the cells are the only place a name may live.
function checkModelNames(value: unknown, where: string, issues: string[]): void {
  if (typeof value === "string") {
    const hit = MODEL_ID.exec(value);
    if (hit) issues.push(`${where}: model name "${hit[0]}" outside providers (name models only in providers.<provider>.<kind>.<stakes>.model)`);
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => checkModelNames(item, `${where}[${index}]`, issues));
  } else if (isObj(value)) {
    for (const [key, item] of Object.entries(value)) checkModelNames(item, where === "" ? key : `${where}.${key}`, issues);
  }
}

function checkLayerShape(data: Obj, issues: string[]): void {
  unknownKeys(data, TOP_KEYS, "", issues);
  if (data.schema !== 1) issues.push(`schema: must be 1 (got ${JSON.stringify(data.schema)})`);
  if (data.default_provider !== undefined) checkEnum(POLICY_PROVIDERS, data.default_provider, "default_provider", issues);
  if (data.default_needs !== undefined) checkNeeds(data.default_needs, "default_needs", issues);
  if (data.strict_headers !== undefined && typeof data.strict_headers !== "boolean") {
    issues.push("strict_headers: must be true or false");
  }
  if (data.providers !== undefined) checkProviders(data.providers, issues);
  if (data.gates !== undefined) checkGates(data.gates, issues);
  if (data.agents !== undefined) checkAgents(data.agents, issues);
  if (data.hardcode !== undefined) checkHardcode(data.hardcode, issues);
  for (const [key, value] of Object.entries(data)) {
    // `hardcode` holds scan configuration (allow_paths, extra_patterns) that may legitimately name models.
    if (key !== "providers" && key !== "hardcode") checkModelNames(value, key, issues);
  }
}

// After the merge: every provider has every kind x stakes cell.
function checkCells(merged: Obj, issues: string[]): void {
  const providers = isObj(merged.providers) ? merged.providers : {};
  for (const provider of POLICY_PROVIDERS) {
    const policy = providers[provider];
    if (!isObj(policy)) {
      issues.push(`providers.${provider}: missing provider block`);
      continue;
    }
    for (const kind of KINDS) {
      const row = policy[kind];
      for (const stakes of STAKES) {
        const cell = isObj(row) ? row[stakes] : undefined;
        if (!isObj(cell) || cell.model === undefined || cell.effort === undefined) {
          issues.push(`providers.${provider}.${kind}.${stakes}: missing cell (model and effort are required)`);
        }
      }
    }
  }
}

// A project may strengthen a gate, never weaken a floor.
function checkFloors(merged: Obj, issues: string[]): void {
  const gates = isObj(merged.gates) ? merged.gates : {};
  const gate = (stakes: Stakes): Obj => (isObj(gates[stakes]) ? gates[stakes] : {});
  for (const stakes of ["sensitive", "critical"] as const) {
    const review = gate(stakes).review;
    if (!isOneOf(REVIEWS, review) || rank(REVIEWS, review) < rank(REVIEWS, "required")) {
      issues.push(`gates.${stakes}.review: floor is "required" (a project may strengthen a gate, never weaken it)`);
    }
  }
  const critical = gate("critical");
  if (critical.second_review !== "independent") {
    issues.push('gates.critical.second_review: floor is "independent"');
  }
  if (critical.distinct_model !== true) issues.push("gates.critical.distinct_model: floor is true");
  if (critical.human !== "required") issues.push('gates.critical.human: floor is "required"');
}

/**
 * Check a policy file: schema, enums, unknown keys, a model name outside
 * `providers` (frontmatter only; the prose body is not scanned), then,
 * after the merge over `defaults`, all 16 cells per provider and the gate
 * floors. Returns one message per problem; empty means valid. `defaults`
 * is the shipped policy unless given.
 */
export function checkTokenomics(text: string, defaults?: Tokenomics): string[] {
  const layer = parseTokenomics(text);
  if (!layer.ok) return [layer.error.message];
  const issues: string[] = [];
  checkLayerShape(layer.value, issues);
  const base = defaults ? ok(defaults) : loadDefaults();
  if (!base.ok) return [...issues, base.error.message];
  const merged = mergeTokenomics(base.value, layer.value) as unknown as Obj;
  checkCells(merged, issues);
  checkFloors(merged, issues);
  return issues;
}
