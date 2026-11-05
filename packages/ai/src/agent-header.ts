// Original work by the same author.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { err, ok, tryCatch, type Result } from "@zedtech/zedkit-core";
import { kitDir } from "./kit.js";
import {
  CONTEXT_SIZES,
  EFFORTS,
  KINDS,
  REASONING,
  STAKES,
  type Effort,
  type Kind,
  type Needs,
  type Stakes,
} from "./tokenomics.js";

/**
 * What an agent declares about itself. `default_needs` are defaults only: a
 * call may override them. `kind` is never part of it (it is per invocation);
 * `default_kind` is only the hint used when a caller omits the kind.
 */
export type AgentHeader = {
  /** One lowercase noun phrase, 3-60 letters and spaces, no model or vendor name. */
  role: string;
  default_needs: Needs;
  /** Allowlist of kinds this agent may be invoked as. Absent means all four. */
  kinds?: Kind[];
  default_kind?: Kind;
  /** Per-agent floors; the project's `tokenomics.md` wins when both set one. */
  min_stakes?: Stakes;
  min_effort?: Effort;
};

/** Where a header came from: the project sidecar, the shipped kit table, or the headerless default. */
export type HeaderSource = "sidecar" | "table" | "default";

export type ReadHeader = { header: AgentHeader; source: HeaderSource; note?: string };

export const DEFAULT_NEEDS: Needs = { reasoning: "medium", context: "medium" };
const ROLE = /^[a-z]+(?:[ -][a-z]+)*$/;
const MIN_ROLE = 3;
const MAX_ROLE = 60;

const isObj = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isOneOf = <T extends string>(list: readonly T[], value: unknown): value is T =>
  typeof value === "string" && (list as readonly string[]).includes(value);

/** Header keys, wherever they are stored. */
export const HEADER_KEYS = ["role", "default_needs", "kinds", "default_kind", "min_stakes", "min_effort"] as const;

/** True when `data` carries at least one header key. */
export function hasHeaderKeys(data: Record<string, unknown>): boolean {
  return HEADER_KEYS.some((key) => data[key] !== undefined);
}

/** Name of the sidecar file, in the kit and in a project's `.agents/`. */
export const SIDECAR = "agents.meta.json";

/**
 * Raw sidecar entries of a file: `{ "<agent>": { role, default_needs, ... } }`.
 * Headers live here and not in agent frontmatter: a tool drops (silently) an
 * agent whose frontmatter has a key it does not know, and a sidecar is never
 * parsed as an agent.
 */
export function readSidecar(root: string): Result<Record<string, Record<string, unknown>>> {
  const file = join(root, SIDECAR);
  if (!existsSync(file)) return ok({});
  const text = tryCatch(() => readFileSync(file, "utf8"));
  if (!text.ok) return err(new Error(`${SIDECAR}: ${text.error.message}`));
  const json = tryCatch(() => JSON.parse(text.value) as unknown);
  if (!json.ok) return err(new Error(`${SIDECAR}: not valid JSON (${json.error.message})`));
  if (!isObj(json.value)) return err(new Error(`${SIDECAR}: must be an object keyed by agent name`));
  const entries: Record<string, Record<string, unknown>> = {};
  for (const [name, entry] of Object.entries(json.value)) {
    if (!isObj(entry)) return err(new Error(`${SIDECAR}: "${name}" must be an object`));
    entries[name] = entry;
  }
  return ok(entries);
}

/**
 * Shipped header of every kit agent (`kit/agents.meta.json`; kind is
 * deliberately absent, it is per call). Used for kit-name agents the
 * project's own sidecar does not mention, so an existing install needs no
 * refresh. Loaded once; a broken file is a package bug and yields no table.
 */
export const KIT_HEADERS: Readonly<Record<string, AgentHeader>> = loadKitHeaders();

function loadKitHeaders(): Record<string, AgentHeader> {
  const raw = readSidecar(kitDir());
  const table: Record<string, AgentHeader> = {};
  if (!raw.ok) return table;
  for (const [name, entry] of Object.entries(raw.value)) {
    const parsed = parseAgentHeader(entry, true);
    if (parsed.header) table[name] = parsed.header;
  }
  return table;
}

export type ParsedHeader = { header?: AgentHeader; issues: string[] };

/**
 * Parse the header keys of one agent (frontmatter data, or the entry of a
 * sidecar file: the contract is the same wherever it is stored). `required`
 * means `role` and `default_needs` must be present (strict mode). Returns the
 * header when it is complete and valid; `issues` lists every problem.
 */
export function parseAgentHeader(data: Record<string, unknown>, required: boolean): ParsedHeader {
  const issues: string[] = [];
  if (data.needs !== undefined) issues.push("needs are per call; use default_needs");
  if (data.kind !== undefined) issues.push("kind is per invocation; use default_kind or kinds");
  const role = checkRole(data.role, required, issues);
  const needs = checkDefaultNeeds(data.default_needs, required, issues);
  const kinds = checkKinds(data.kinds, issues);
  const defaultKind = checkDefaultKind(data.default_kind, kinds, issues);
  const minStakes = optionalEnum(STAKES, data.min_stakes, "min_stakes", issues);
  const minEffort = optionalEnum(EFFORTS, data.min_effort, "min_effort", issues);
  if (issues.length > 0 || role === undefined || needs === undefined) return { issues };
  return {
    issues,
    header: {
      role,
      default_needs: needs,
      ...(kinds && { kinds }),
      ...(defaultKind && { default_kind: defaultKind }),
      ...(minStakes && { min_stakes: minStakes }),
      ...(minEffort && { min_effort: minEffort }),
    },
  };
}

function checkRole(value: unknown, required: boolean, issues: string[]): string | undefined {
  if (value === undefined) {
    if (required) issues.push("role is required (one lowercase noun phrase, 3-60 letters)");
    return undefined;
  }
  if (typeof value !== "string" || value.length < MIN_ROLE || value.length > MAX_ROLE || !ROLE.test(value)) {
    issues.push(`role must be a lowercase noun phrase of ${MIN_ROLE}-${MAX_ROLE} letters, spaces and hyphens, no model or vendor name (got ${JSON.stringify(value)})`);
    return undefined;
  }
  return value;
}

function checkDefaultNeeds(value: unknown, required: boolean, issues: string[]): Needs | undefined {
  if (value === undefined) {
    if (required) issues.push("default_needs is required (reasoning and context)");
    return undefined;
  }
  if (!isObj(value)) {
    issues.push("default_needs must be a mapping with reasoning and context");
    return undefined;
  }
  let bad = false;
  for (const key of Object.keys(value)) {
    if (key !== "reasoning" && key !== "context") {
      issues.push(`default_needs.${key}: unknown key (allowed: reasoning, context)`);
      bad = true;
    }
  }
  if (!isOneOf(REASONING, value.reasoning)) {
    issues.push(`default_needs.reasoning must be one of ${REASONING.join(", ")}`);
    bad = true;
  }
  if (!isOneOf(CONTEXT_SIZES, value.context)) {
    issues.push(`default_needs.context must be one of ${CONTEXT_SIZES.join(", ")}`);
    bad = true;
  }
  return bad ? undefined : (value as Needs);
}

function checkKinds(value: unknown, issues: string[]): Kind[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length === 0 || !value.every((kind) => isOneOf(KINDS, kind))) {
    issues.push(`kinds must be a non-empty list of ${KINDS.join(", ")}`);
    return undefined;
  }
  if (new Set(value).size !== value.length) issues.push("kinds lists a kind twice");
  return value as Kind[];
}

function checkDefaultKind(value: unknown, kinds: Kind[] | undefined, issues: string[]): Kind | undefined {
  if (value === undefined) return undefined;
  if (!isOneOf(KINDS, value)) {
    issues.push(`default_kind must be one of ${KINDS.join(", ")}`);
    return undefined;
  }
  if (kinds && !kinds.includes(value)) issues.push(`default_kind "${value}" is not in kinds`);
  return value;
}

function optionalEnum<T extends string>(list: readonly T[], value: unknown, key: string, issues: string[]): T | undefined {
  if (value === undefined) return undefined;
  if (!isOneOf(list, value)) {
    issues.push(`${key} must be one of ${list.join(", ")}`);
    return undefined;
  }
  return value;
}

/**
 * The header `route` uses for one agent. Order: the project sidecar entry,
 * else the shipped table for a kit-name agent, else the default header of a
 * custom agent (`medium`/`medium`, all kinds; the note says so). An entry
 * that fails to parse falls back the same way; `validate` reports the
 * problems separately.
 */
export function readAgentHeader(name: string, entry: Record<string, unknown> | undefined): ReadHeader {
  if (entry) {
    const parsed = parseAgentHeader(entry, true);
    if (parsed.header) return { header: parsed.header, source: "sidecar" };
  }
  const shipped = KIT_HEADERS[name];
  if (shipped) return { header: shipped, source: "table" };
  return {
    header: { role: "custom agent", default_needs: DEFAULT_NEEDS },
    source: "default",
    note: `${name}: no header in ${SIDECAR}, using the default (reasoning medium, context medium, all kinds)`,
  };
}
