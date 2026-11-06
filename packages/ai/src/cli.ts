// Original work by the same author.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { err, ok, tryCatch, type Result } from "@zedtech/zedkit-core";
import { checkHardcodedModels } from "./hardcode.js";
import { ALL_PROVIDERS, installKit, type Provider } from "./install.js";
import { installNextStepLines, prettierHintLines } from "./install-next-step.js";
import { kitDir, readManifest } from "./kit.js";
import { loadAgent, loadPolicy, resolveRoute, type Route } from "./route.js";
import { scanRepo } from "./scan.js";
import { inSync, isCheckedUnchanged, syncKit } from "./sync.js";
import {
  checkCriticalLines,
  checkStakesChange,
  gatesFor,
  parseKind,
  parseNeeds,
  parseStakes,
  readAtRef,
} from "./stakes.js";
import {
  CONTEXT_SIZES,
  KINDS,
  POLICY_PROVIDERS,
  REASONING,
  STAKES,
} from "./tokenomics.js";
import { checkDepth } from "./setup-depth.js";
import { checkSetup } from "./setup-check.js";
import { checkDrift, checkKitDocs, checkPlaceholders, validateKit } from "./validate.js";

// Help text lives in kit/usage.txt (shipped data, not code); the one-line
// fallback keeps --help total on a broken install.
function usage(): string {
  const read = tryCatch(() => readFileSync(join(kitDir(), "usage.txt"), "utf8"));
  return read.ok ? read.value.trimEnd() : "zedkit-ai <command>";
}

/** Where the CLI writes: normal lines and error lines. */
export type Sinks = { out: (line: string) => void; err: (line: string) => void };

type Parsed = { values: Record<string, string | boolean | undefined>; positionals: string[] };

const OPTIONS = {
  preset: { type: "string" },
  provider: { type: "string" },
  target: { type: "string" },
  adopt: { type: "boolean" },
  "dry-run": { type: "boolean" },
} as const;

const VALIDATE_OPTIONS = {
  setup: { type: "boolean" },
  plan: { type: "string" },
} as const;

const ROUTE_OPTIONS = {
  kind: { type: "string" },
  stakes: { type: "string" },
  reasoning: { type: "string" },
  context: { type: "string" },
  provider: { type: "string" },
  dir: { type: "string" },
  json: { type: "boolean" },
} as const;

const STAKES_OPTIONS = {
  base: { type: "string" },
  dir: { type: "string" },
  provider: { type: "string" },
  json: { type: "boolean" },
} as const;

const SYNC_OPTIONS = {
  provider: { type: "string" },
  check: { type: "boolean" },
  "dry-run": { type: "boolean" },
  prune: { type: "boolean" },
  "no-prune": { type: "boolean" },
  quiet: { type: "boolean" },
} as const;

function parse(
  args: string[],
  options:
    | Record<string, never>
    | typeof OPTIONS
    | typeof VALIDATE_OPTIONS
    | typeof ROUTE_OPTIONS
    | typeof STAKES_OPTIONS
    | typeof SYNC_OPTIONS,
  maxPositionals: number,
): Result<Parsed> {
  const parsed = tryCatch(() => parseArgs({ args, allowPositionals: true, options }));
  if (!parsed.ok) return err(parsed.error);
  if (parsed.value.positionals.length > maxPositionals) {
    return err(new Error(`unexpected argument "${parsed.value.positionals[maxPositionals]}" (run 'zedkit-ai --help' for usage)`));
  }
  return ok(parsed.value as Parsed);
}

function parseProviders(value: string | boolean | undefined): Result<readonly (Provider | string)[] | undefined> {
  if (value === undefined) return ok(undefined);
  const names = String(value).split(",").map((s) => s.trim());
  if (names.includes("all")) return ok(undefined);
  const bad = names.find((n) => !ALL_PROVIDERS.some((p) => p === n));
  if (bad !== undefined) return err(new Error(`unknown provider "${bad}" (cursor, claude, codex, muse, all)`));
  return ok(names);
}

function fail(message: string, sinks: Sinks): number {
  sinks.err(`error: ${message}`);
  return 2;
}

function runInstall(args: string[], sinks: Sinks, kind: "init" | "setup"): number {
  const parsed = parse(args, OPTIONS, 1);
  if (!parsed.ok) return fail(parsed.error.message, sinks);
  const { values, positionals } = parsed.value;
  const providers = parseProviders(values.provider ?? values.target);
  if (!providers.ok) return fail(providers.error.message, sinks);
  const dryRun = values["dry-run"] === true;
  const presetFlag = typeof values.preset === "string" ? values.preset : undefined;
  const preset = presetFlag ?? (kind === "setup" ? "setup" : undefined);
  const adopt = kind === "setup" || values.adopt === true;
  const result = installKit({
    dest: resolve(positionals[0] ?? "."),
    ...(preset !== undefined && { preset }),
    ...(providers.value !== undefined && { providers: providers.value }),
    dryRun,
    adopt,
  });
  if (!result.ok) return fail(result.error.message, sinks);
  for (const action of result.value) {
    sinks.out(`${action.kind.padEnd(5)} ${action.path}${action.note ? `  (${action.note})` : ""}`);
  }
  const dest = resolve(positionals[0] ?? ".");
  if (dryRun) {
    sinks.out("dry run: nothing written");
  } else {
    for (const line of installNextStepLines(dest, providers.value as readonly Provider[] | undefined)) {
      sinks.out(line);
    }
  }
  return 0;
}

function runValidate(args: string[], sinks: Sinks): number {
  const parsed = parse(args, VALIDATE_OPTIONS, 1);
  if (!parsed.ok) return fail(parsed.error.message, sinks);
  const dir = resolve(parsed.value.positionals[0] ?? ".agents");
  if (!existsSync(dir)) return fail(`no such directory: ${dir} (run from the project root, or 'zedkit-ai init' to create it)`, sinks);
  // A project root points at its .agents/; an .agents/ dir drifts against
  // its own parent. Any other dir just has nothing to drift against.
  const nested = join(dir, ".agents");
  const agentsDir = existsSync(nested) ? nested : dir;
  const projectRoot = agentsDir === dir ? dirname(dir) : dir;
  const issues = [
    ...validateKit(agentsDir),
    ...checkDrift(projectRoot, agentsDir),
    ...checkKitDocs(projectRoot, agentsDir),
    ...checkPlaceholders(projectRoot, agentsDir),
    ...checkHardcodedModels(projectRoot, agentsDir),
  ];
  if (parsed.value.values.setup === true) {
    const plan = parsed.value.values.plan;
    const extra = checkSetup(projectRoot, typeof plan === "string" ? { plan } : {});
    issues.push(...extra.issues, ...checkDepth(projectRoot));
    for (const note of extra.notes) sinks.out(note);
  }
  for (const issue of issues) sinks.out(`${issue.path}: ${issue.message}`);
  const failing = issues.filter((issue) => !issue.message.startsWith("warning:"));
  if (failing.length === 0) {
    sinks.out("ok");
    return 0;
  }
  sinks.out(`${failing.length} ${failing.length === 1 ? "problem" : "problems"}`);
  return 1;
}

function oneOf<T extends string>(
  list: readonly T[],
  value: unknown,
  flag: string,
): Result<T | undefined> {
  if (value === undefined) return ok(undefined);
  const found = list.find((item) => item === value);
  return found === undefined
    ? err(
        new Error(
          `${flag} must be one of ${list.join(", ")} (got "${String(value)}")`,
        ),
      )
    : ok(found);
}

function routeLines(agent: string, stakes: string, route: Route): string[] {
  const needs = (field: "reasoning" | "context"): string =>
    `${field}=${route.needs[field]} (${route.needsSource[field]})`;
  const gate = route.gates;
  const lines = [
    `agent: ${agent}`,
    `provider: ${route.provider}`,
    `kind: ${route.kind} (${route.kindSource})`,
    `stakes: ${stakes}, column ${route.column}`,
    `needs: ${needs("reasoning")}, ${needs("context")}`,
    `model: ${route.model}`,
    `effort: ${route.effort}`,
    `context window: ${route.contextWindow ?? "unmapped"}`,
    `gates: review=${gate.review}${gate.second_review === "independent" ? ", second review independent" : ""}${gate.human === "required" ? ", human validation" : ""}`,
    `read-only: ${route.readOnly ? "yes" : "no"}`,
  ];
  const second = route.secondReview;
  if (second)
    lines.push(
      `second review: ${second.provider} model ${second.model} effort ${second.effort}`,
    );
  if (second?.warning) lines.push(`warning: ${second.warning}`);
  if (route.unrouted) lines.push("unrouted: yes");
  for (const note of route.notes) lines.push(`note: ${note}`);
  return lines;
}

function runRoute(args: string[], sinks: Sinks): number {
  const parsed = parse(args, ROUTE_OPTIONS, 1);
  if (!parsed.ok) return fail(parsed.error.message, sinks);
  const { values, positionals } = parsed.value;
  const name = positionals[0];
  if (name === undefined)
    return fail(
      "route needs an agent name (zedkit-ai route <agent> --stakes <s> ...)",
      sinks,
    );
  const kind = oneOf(KINDS, values.kind, "--kind");
  const stakes = oneOf(STAKES, values.stakes, "--stakes");
  const reasoning = oneOf(REASONING, values.reasoning, "--reasoning");
  const context = oneOf(CONTEXT_SIZES, values.context, "--context");
  const provider = oneOf(POLICY_PROVIDERS, values.provider, "--provider");
  for (const flag of [kind, stakes, reasoning, context, provider])
    if (!flag.ok) return fail(flag.error.message, sinks);
  if (!stakes.ok || stakes.value === undefined)
    return fail(
      "route needs --stakes trivial|standard|sensitive|critical",
      sinks,
    );
  const agentsDir = join(
    resolve(typeof values.dir === "string" ? values.dir : "."),
    ".agents",
  );
  const policy = loadPolicy(agentsDir);
  if (!policy.ok) return fail(policy.error.message, sinks);
  const agent = loadAgent(agentsDir, name);
  if (!agent.ok) return fail(agent.error.message, sinks);
  const needs = {
    ...(reasoning.ok &&
      reasoning.value !== undefined && { reasoning: reasoning.value }),
    ...(context.ok &&
      context.value !== undefined && { context: context.value }),
  };
  const route = resolveRoute(policy.value, {
    ...(kind.ok && kind.value !== undefined && { kind: kind.value }),
    stakes: stakes.value,
    needs,
    agent: { name, header: agent.value.header },
    ...(provider.ok &&
      provider.value !== undefined && { provider: provider.value }),
  });
  if (!route.ok) return fail(route.error.message, sinks);
  if (agent.value.note !== undefined) route.value.notes.push(agent.value.note);
  if (values.json === true)
    sinks.out(
      JSON.stringify(
        { agent: name, stakes: stakes.value, ...route.value },
        null,
        2,
      ),
    );
  else
    for (const line of routeLines(name, stakes.value, route.value))
      sinks.out(line);
  return 0;
}

function runStakes(args: string[], sinks: Sinks): number {
  const parsed = parse(args, STAKES_OPTIONS, 1);
  if (!parsed.ok) return fail(parsed.error.message, sinks);
  const { values, positionals } = parsed.value;
  const target = positionals[0];
  if (target === undefined)
    return fail("stakes needs a file (zedkit-ai stakes <file> [--base <ref>])", sinks);
  const file = resolve(target);
  const read = tryCatch(() => readFileSync(file, "utf8"));
  if (!read.ok) return fail(`cannot read ${target}: ${read.error.message}`, sinks);
  const text = read.value;
  const provider = oneOf(POLICY_PROVIDERS, values.provider, "--provider");
  if (!provider.ok) return fail(provider.error.message, sinks);
  const stakes = parseStakes(text);
  const kind = parseKind(text);
  const needs = parseNeeds(text);
  for (const field of [stakes, kind, needs])
    if (!field.ok) return fail(`${target}: ${field.error.message}`, sinks);
  if (!stakes.ok || !kind.ok || !needs.ok) return 2;
  const agentsDir = join(
    resolve(typeof values.dir === "string" ? values.dir : "."),
    ".agents",
  );
  const policy = loadPolicy(agentsDir);
  if (!policy.ok) return fail(policy.error.message, sinks);
  const level = stakes.value ?? "standard";
  const notes: string[] = [];
  if (stakes.value === undefined)
    notes.push("stakes not set: standard (default); write it explicitly");
  const issues: string[] = [];
  if (typeof values.base === "string") {
    const before = readAtRef(file, values.base);
    if (!before.ok) return fail(before.error.message, sinks);
    if (before.value === undefined) {
      notes.push(`not in ${values.base}: nothing to compare`);
    } else {
      const prev = parseStakes(before.value);
      if (!prev.ok) return fail(`${values.base}: ${prev.error.message}`, sinks);
      issues.push(...checkStakesChange(prev.value, level, text));
    }
  }
  if (level === "critical") issues.push(...checkCriticalLines(text));
  const gates = gatesFor(policy.value, level, provider.value);
  if (gates.secondReview?.warning !== undefined)
    notes.push(gates.secondReview.warning);
  if (values.json === true) {
    sinks.out(
      JSON.stringify(
        { file: target, stakes: level, kind: kind.value, needs: needs.value, gates: gates.gate, secondReview: gates.secondReview, issues, notes },
        null,
        2,
      ),
    );
  } else {
    sinks.out(`stakes: ${level}`);
    if (kind.value !== undefined) sinks.out(`kind: ${kind.value}`);
    const given = Object.entries(needs.value).map(([k, v]) => `${k}=${v}`);
    if (given.length > 0) sinks.out(`needs: ${given.join(", ")}`);
    const g = gates.gate;
    sinks.out(
      `gates: review=${g.review}` +
        (g.second_review !== undefined ? `, second_review=${g.second_review}` : "") +
        (g.distinct_model === true ? ", distinct_model" : "") +
        (g.human !== undefined ? `, human=${g.human}` : ""),
    );
    for (const note of notes) sinks.out(`note: ${note}`);
    for (const issue of issues) sinks.out(`${target}: ${issue}`);
  }
  return issues.length === 0 ? 0 : 1;
}

function runSync(args: string[], sinks: Sinks): number {
  const parsed = parse(args, SYNC_OPTIONS, 1);
  if (!parsed.ok) return fail(parsed.error.message, sinks);
  const { values, positionals } = parsed.value;
  const named = parseProviders(values.provider);
  if (!named.ok) return fail(named.error.message, sinks);
  const dest = resolve(positionals[0] ?? ".");
  if (!existsSync(dest)) return fail(`no such directory: ${dest}`, sinks);
  const check = values.check === true;
  const providers = values.provider === undefined ? undefined : (named.value ?? ALL_PROVIDERS);
  const result = syncKit({
    dest,
    ...(providers !== undefined && { providers }),
    check,
    dryRun: values["dry-run"] === true,
    prune: values.prune === true,
    noPrune: values["no-prune"] === true,
  });
  if (!result.ok) return fail(result.error.message, sinks);
  const changes = result.value.filter((action) => !isCheckedUnchanged(action));
  if (check) {
    for (const action of changes) sinks.out(`${action.path}: out of date, run: npx zedkit-ai sync`);
    sinks.out(inSync(result.value) ? "ok" : `${changes.length} out of date`);
    return inSync(result.value) ? 0 : 1;
  }
  for (const action of values.quiet === true ? changes : result.value) {
    sinks.out(`${action.kind.padEnd(8)} ${action.path}${action.note ? `  (${action.note})` : ""}`);
  }
  if (values["dry-run"] === true) sinks.out("dry run: nothing written");
  return 0;
}

function runScan(args: string[], sinks: Sinks): number {
  const parsed = parse(args, {}, 1);
  if (!parsed.ok) return fail(parsed.error.message, sinks);
  const dir = resolve(parsed.value.positionals[0] ?? ".");
  if (!existsSync(dir)) return fail(`no such directory: ${dir}`, sinks);
  const scan = scanRepo(dir);
  sinks.out(`size: ${scan.size} (${scan.files} files)`);
  sinks.out(`readers: ${scan.readers}`);
  scan.slices.forEach((slice, i) => sinks.out(`slice ${i + 1}: ${slice.files} files: ${slice.paths.join(" + ")}`));
  for (const line of prettierHintLines(dir, undefined)) sinks.out(line);
  return 0;
}

function runList(args: string[], sinks: Sinks): number {
  const parsed = parse(args, {}, 0);
  if (!parsed.ok) return fail(parsed.error.message, sinks);
  const manifest = readManifest();
  if (!manifest.ok) return fail(manifest.error.message, sinks);
  for (const [name, skills] of Object.entries(manifest.value.presets)) {
    sinks.out(`preset ${name}: ${skills === "*" ? "every skill" : skills.join(", ")}`);
  }
  sinks.out(`agents: ${manifest.value.agents.join(", ")}`);
  sinks.out(`commands: ${(manifest.value.commands ?? []).join(", ") || "(none)"}`);
  return 0;
}

/** Run the CLI. Returns the process exit code (0 ok, 1 validation problems, 2 usage or runtime error). */
export function main(argv: string[], sinks: Sinks): number {
  const [command, ...rest] = argv;
  if (command === "setup") return runInstall(rest, sinks, "setup");
  if (command === "init") return runInstall(rest, sinks, "init");
  if (command === "validate") return runValidate(rest, sinks);
  if (command === "scan") return runScan(rest, sinks);
  if (command === "route") return runRoute(rest, sinks);
  if (command === "stakes") return runStakes(rest, sinks);
  if (command === "sync") return runSync(rest, sinks);
  if (command === "list") return runList(rest, sinks);
  const help = command === undefined || command === "--help" || command === "-h";
  (help ? sinks.out : sinks.err)(usage());
  return help ? 0 : 2;
}
