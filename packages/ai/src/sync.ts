// Original work by the same author.
import {
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { err, ok, tryCatch, type Result } from "@zedtech/zedkit-core";
import { generateAgent, hasMarker } from "./generate.js";
import { ALL_PROVIDERS, type Action } from "./install.js";
import { adoptRel } from "./kit.js";
import { isGenerated, PROVIDER_KEYS } from "./provider-keys.js";
import { loadAgent, loadPolicy, resolveRoute } from "./route.js";

export type SyncOptions = {
  /** Project directory (the one that holds `.agents/`). */
  dest: string;
  /**
   * Providers to sync. Omitted: inferred from the non-empty `.cursor/` and
   * `.claude/` layers; nothing to infer is an error. Naming them is what
   * allows `prune` to remove generated files of a provider left out.
   */
  providers?: readonly string[];
  /** Report only, write nothing (the caller turns any non-skip action into a failing exit). */
  check?: boolean;
  /** Report what would happen without touching the disk. */
  dryRun?: boolean;
  /** Also remove generated files of providers not in `providers` (needs `providers`). */
  prune?: boolean;
  /** Keep generated files whose source agent no longer exists. */
  noPrune?: boolean;
};

const KIT_SUFFIX = ".kit.md";

type Ctx = {
  dest: string;
  write: boolean;
  actions: Action[];
};

function lstatOf(path: string): ReturnType<typeof lstatSync> | undefined {
  const stat = tryCatch(() => lstatSync(path));
  return stat.ok ? stat.value : undefined;
}

function readText(path: string): string | undefined {
  const read = tryCatch(() => readFileSync(path, "utf8"));
  return read.ok ? read.value : undefined;
}

function nonEmptyDir(path: string): boolean {
  const entries = tryCatch(() => readdirSync(path));
  return entries.ok && entries.value.length > 0;
}

function infer(dest: string): string[] {
  const found: string[] = [];
  if (nonEmptyDir(join(dest, ".cursor"))) found.push("cursor");
  if (nonEmptyDir(join(dest, ".claude"))) found.push("claude");
  return found;
}

function sourceNames(agentsDir: string): string[] | undefined {
  const entries = tryCatch(() => readdirSync(join(agentsDir, "agents")));
  if (!entries.ok) return undefined;
  return entries.value
    .filter((f) => f.endsWith(".md") && !f.endsWith(KIT_SUFFIX))
    .map((f) => f.slice(0, -3))
    .sort();
}

function put(ctx: Ctx, kind: Action["kind"], rel: string, note?: string, text?: string): void {
  ctx.actions.push({ kind, path: rel, ...(note !== undefined && { note }) });
  if (!ctx.write || text === undefined) return;
  const full = join(ctx.dest, rel);
  mkdirSync(join(full, ".."), { recursive: true });
  writeFileSync(full, text);
}

function skip(ctx: Ctx, rel: string, note: string): void {
  ctx.actions.push({ kind: "skip", path: rel, note });
}

// One generated file against what is on disk, per the safety table: never
// overwrite work that is not ours.
function syncFile(ctx: Ctx, rel: string, name: string, source: string, text: string, notes: string[]): void {
  const suffix = notes.length > 0 ? `; ${notes.join("; ")}` : "";
  const full = join(ctx.dest, rel);
  const stat = lstatOf(full);
  if (stat === undefined) {
    put(ctx, "generate", rel, notes.join("; ") || undefined, text);
    return;
  }
  if (stat.isSymbolicLink()) {
    const target = tryCatch(() => readlinkSync(full));
    if (target.ok && target.value === `../../.agents/agents/${name}.md`) {
      if (ctx.write) unlinkSync(full);
      put(ctx, "generate", rel, `replaces a link to the source${suffix}`, text);
      return;
    }
  }
  const current = stat.isSymbolicLink() ? undefined : readText(full);
  if (current !== undefined && hasMarker(current)) {
    if (current === text) skip(ctx, rel, `up to date${suffix}`);
    else put(ctx, "generate", rel, `regenerated${suffix}`, text);
    return;
  }
  if (current !== undefined && current.replace(/\r\n/g, "\n") === source.replace(/\r\n/g, "\n")) {
    put(ctx, "generate", rel, `replaces a copy of the source${suffix}`, text);
    return;
  }
  // A file the user owns: keep it, offer the generated version beside it.
  const sidecar = adoptRel(rel);
  skip(ctx, rel, `user file kept; generated version -> ${sidecar}`);
  const beside = readText(join(ctx.dest, sidecar));
  if (beside === text) skip(ctx, sidecar, "up to date");
  else put(ctx, "generate", sidecar, `kit version beside your ${rel}`, text);
}

// Marked files whose source agent is gone. Only files that carry the marker
// are ever removed.
function pruneOrphans(ctx: Ctx, dirRel: string, names: ReadonlySet<string>, allMarked: boolean): void {
  if (!lstatOf(join(ctx.dest, dirRel))?.isDirectory()) return;
  const files = tryCatch(() => readdirSync(join(ctx.dest, dirRel)));
  if (!files.ok) return;
  for (const file of files.value.filter((f) => f.endsWith(".md")).sort()) {
    const base = file.endsWith(KIT_SUFFIX) ? file.slice(0, -KIT_SUFFIX.length) : file.slice(0, -3);
    if (!allMarked && names.has(base)) continue;
    const rel = join(dirRel, file);
    const text = readText(join(ctx.dest, rel));
    if (text === undefined || !hasMarker(text)) continue;
    if (ctx.write) rmSync(join(ctx.dest, rel));
    ctx.actions.push({ kind: "prune", path: rel, note: allMarked ? "provider not selected" : "source agent removed" });
  }
}

// The directory a provider's agents go in. A link the kit made earlier
// (`.claude/agents -> ../.agents/agents`) becomes a real directory; any other
// link is not ours to touch.
function prepareDir(ctx: Ctx, dirRel: string): "ready" | "blocked" {
  const full = join(ctx.dest, dirRel);
  const stat = lstatOf(full);
  if (stat === undefined) return "ready";
  if (stat.isSymbolicLink()) {
    const target = tryCatch(() => readlinkSync(full));
    if (target.ok && target.value === "../.agents/agents") {
      if (ctx.write) unlinkSync(full);
      ctx.actions.push({ kind: "convert", path: dirRel, note: "link to .agents/agents -> real directory of generated files" });
      return "ready";
    }
    skip(ctx, dirRel, `directory link to ${target.ok ? target.value : "?"} left alone`);
    return "blocked";
  }
  if (!stat.isDirectory()) {
    skip(ctx, dirRel, "not a directory");
    return "blocked";
  }
  return "ready";
}

/**
 * Write each tool's agent files from `.agents/agents` and `.agents/tokenomics.md`.
 * Cursor and Claude get a generated copy per agent with `model` set from the
 * route of the agent's default kind at `standard` stakes (a call with another
 * kind or needs routes at spawn time); Codex and Muse read `.agents/agents`
 * directly and get a note. A file that carries the marker is regenerated, a
 * copy of the source is replaced, anything else is kept and the generated
 * version goes beside it as `<name>.kit.md`. Returns what happened (or, with
 * `check` or `dryRun`, what would). A second run reports only `skip`.
 */
export function syncKit(options: SyncOptions): Result<Action[]> {
  const agentsDir = join(options.dest, ".agents");
  const names = sourceNames(agentsDir);
  if (names === undefined) return err(new Error(`no .agents/agents in ${options.dest} (run 'zedkit-ai init' first)`));
  if (options.prune === true && options.providers === undefined) {
    return err(new Error("--prune needs an explicit --provider (it removes files of providers left out)"));
  }
  const providers = options.providers ?? infer(options.dest);
  if (providers.length === 0) return err(new Error("no provider layers found: pass --provider cursor,claude,codex,muse|all"));
  const unknown = providers.find((p) => !ALL_PROVIDERS.some((known) => known === p));
  if (unknown !== undefined) return err(new Error(`unknown provider "${unknown}" (cursor, claude, codex, muse, all)`));
  const policy = loadPolicy(agentsDir);
  if (!policy.ok) return err(policy.error);

  const ctx: Ctx = { dest: options.dest, write: options.check !== true && options.dryRun !== true, actions: [] };
  const run = tryCatch(() => {
    const known = new Set(names);
    for (const provider of providers) {
      const keys = PROVIDER_KEYS[provider];
      if (!isGenerated(provider) || keys?.agentsDir === undefined) {
        skip(ctx, `.agents/agents`, keys?.note ?? `${provider}: nothing to generate`);
        continue;
      }
      const dirRel = keys.agentsDir;
      if (prepareDir(ctx, dirRel) === "blocked") continue;
      for (const name of names) {
        const agent = loadAgent(agentsDir, name);
        if (!agent.ok) {
          skip(ctx, join(dirRel, `${name}.md`), `not synced: ${agent.error.message}`);
          continue;
        }
        const route = resolveRoute(policy.value, { stakes: "standard", agent: agent.value, provider });
        if (!route.ok) throw new Error(`${name}: ${route.error.message}`);
        const source = readText(join(agentsDir, "agents", `${name}.md`)) ?? "";
        const made = generateAgent({ name, source, model: route.value.model });
        if (!made.ok) throw made.error;
        syncFile(ctx, join(dirRel, `${name}.md`), name, source, made.value.text, made.value.notes);
      }
      if (options.noPrune !== true) pruneOrphans(ctx, dirRel, known, false);
      skip(ctx, dirRel, keys.note);
    }
    if (providers.includes("cursor") && providers.includes("claude")) {
      skip(ctx, ".claude/agents", "cursor reads .cursor/agents before .claude/agents and lists a name once (checked 2026-11-05)");
    }
    if (options.prune === true) {
      for (const provider of ["cursor", "claude"]) {
        const dirRel = PROVIDER_KEYS[provider]?.agentsDir;
        if (dirRel !== undefined && !providers.includes(provider)) pruneOrphans(ctx, dirRel, known, true);
      }
    }
  });
  if (!run.ok) return err(run.error);
  return ok(ctx.actions);
}

/** True when `syncKit` found nothing to change: every action is a `skip`. */
export function inSync(actions: readonly Action[]): boolean {
  return actions.every((action) => action.kind === "skip");
}
