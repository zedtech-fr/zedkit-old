// Original work by the same author.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { err, ok, tryCatch, type Result } from "@zedtech/zedkit-core";
import { ALL_PROVIDERS, installKit, type Provider } from "./install.js";
import { installNextStepLines } from "./install-next-step.js";
import { kitDir, readManifest } from "./kit.js";
import { checkSetup } from "./setup-check.js";
import { checkDrift, checkKitDocs, validateKit } from "./validate.js";

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

function parse(
  args: string[],
  options: Record<string, never> | typeof OPTIONS | typeof VALIDATE_OPTIONS,
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
  const issues = [...validateKit(agentsDir), ...checkDrift(projectRoot, agentsDir), ...checkKitDocs(projectRoot, agentsDir)];
  if (parsed.value.values.setup === true) {
    const plan = parsed.value.values.plan;
    const extra = checkSetup(projectRoot, typeof plan === "string" ? { plan } : {});
    issues.push(...extra.issues);
    for (const note of extra.notes) sinks.out(note);
  }
  for (const issue of issues) sinks.out(`${issue.path}: ${issue.message}`);
  const summary =
    issues.length === 0
      ? "ok"
      : `${issues.length} ${issues.length === 1 ? "problem" : "problems"}`;
  sinks.out(summary);
  return issues.length === 0 ? 0 : 1;
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
  if (command === "list") return runList(rest, sinks);
  const help = command === undefined || command === "--help" || command === "-h";
  (help ? sinks.out : sinks.err)(usage());
  return help ? 0 : 2;
}
