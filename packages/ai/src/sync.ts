// Original work by the same author.
import {
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, sep } from "node:path";
import { err, ok, tryCatch, type Result } from "@zedtech/zedkit-core";
import type { AgentHeader } from "./agent-header.js";
import { resolveConditionals, type Availability } from "./conditional.js";
import {
  generateAgent,
  generateMuseAgent,
  hasMarker,
  isReservedMuseDest,
  markerSource,
  museNativeName,
  museSourceName,
  MUSE_NAME_ALIAS,
} from "./generate.js";
import { ALL_PROVIDERS, type Action } from "./install.js";
import { adoptRel, kitDir } from "./kit.js";
import { isKitCopy } from "./legacy.js";
import { isGenerated, PROVIDER_KEYS } from "./provider-keys.js";
import { loadAgent, loadPolicy, resolveRoute } from "./route.js";
import type { Tokenomics } from "./tokenomics.js";

function unmarkedAliasSources(dir: string): Set<string> {
  const entries = tryCatch(() => readdirSync(dir));
  const sources = new Set<string>();
  if (!entries.ok) return sources;
  for (const file of entries.value) {
    if (!file.endsWith(".md") || file.endsWith(KIT_SUFFIX)) continue;
    const stem = file.slice(0, -3);
    if (museSourceName(stem) !== stem) continue;
    const text = readText(join(dir, file));
    if (text !== undefined && !hasMarker(text)) sources.add(stem);
  }
  return sources;
}

export type SyncOptions = {
  /** Project directory (the one that holds `.agents/`). */
  dest: string;
  /**
   * Providers to sync. Omitted: inferred from the non-empty `.cursor/` and
   * `.claude/` layers and from Muse-native marked files in `.agents/agents`;
   * nothing to infer is an error. Naming them is what allows `prune` to
   * remove generated files of a provider left out.
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
  avail: Availability | undefined;
};

function lstatOf(path: string): ReturnType<typeof lstatSync> | undefined {
  const stat = tryCatch(() => lstatSync(path));
  return stat.ok ? stat.value : undefined;
}

function readText(path: string): string | undefined {
  const read = tryCatch(() => readFileSync(path, "utf8"));
  return read.ok ? read.value : undefined;
}

/**
 * Canonical source for one agent: an unmarked regular file in the project,
 * else the kit. Never a marked native file, and never a path reached only
 * by following a directory symlink (writing there would change the kit).
 */
export function resolveAgentSource(projectRoot: string, name: string, kitAgents = join(kitDir(), "agents")): string | undefined {
  const agentsRel = join(".agents", "agents");
  const dir = join(projectRoot, agentsRel);
  const dirStat = lstatOf(dir);
  const parentStat = lstatOf(join(projectRoot, ".agents"));
  if (dirStat?.isSymbolicLink() !== true && parentStat?.isSymbolicLink() !== true) {
    const file = join(dir, `${name}.md`);
    const st = lstatOf(file);
    if (st?.isFile() && st.isSymbolicLink() !== true) {
      const text = readText(file);
      if (text !== undefined && !hasMarker(text)) return text;
    }
  }
  return readText(join(kitAgents, `${name}.md`));
}

function isCheckKind(header: AgentHeader): boolean {
  if (header.default_kind === "check") return true;
  return header.kinds?.length === 1 && header.kinds[0] === "check";
}

function nonEmptyDir(path: string): boolean {
  const entries = tryCatch(() => readdirSync(path));
  return entries.ok && entries.value.length > 0;
}

/**
 * True when this project already has Muse-native generated agents: a real
 * `.agents/agents` directory (not a kit symlink) containing at least one
 * marked file. Used so a bare `sync` / `validate` refreshes Muse without
 * `--provider muse`.
 */
export function museGenerated(dest: string): boolean {
  const dir = join(dest, ".agents", "agents");
  const st = lstatOf(dir);
  if (st === undefined || st.isSymbolicLink() || !st.isDirectory()) return false;
  const files = tryCatch(() => readdirSync(dir));
  if (!files.ok) return false;
  return files.value.some((file) => {
    if (!file.endsWith(".md") || file.endsWith(KIT_SUFFIX)) return false;
    const text = readText(join(dir, file));
    return text !== undefined && hasMarker(text);
  });
}

function infer(dest: string): string[] {
  const found: string[] = [];
  if (nonEmptyDir(join(dest, ".cursor"))) found.push("cursor");
  if (nonEmptyDir(join(dest, ".claude"))) found.push("claude");
  if (museGenerated(dest)) found.push("muse");
  return found;
}

export function sourceNames(agentsDir: string): string[] | undefined {
  const dir = join(agentsDir, "agents");
  const entries = tryCatch(() => readdirSync(dir));
  if (!entries.ok) return undefined;
  const sources = unmarkedAliasSources(dir);
  const names = new Set<string>();
  for (const file of entries.value) {
    if (!file.endsWith(".md") || file.endsWith(KIT_SUFFIX)) continue;
    const stem = file.slice(0, -3);
    const text = readText(join(dir, file));
    if (isReservedMuseDest(stem, { sources, ...(text !== undefined && { destText: text }) })) {
      names.add(markerSource(text ?? "") ?? museSourceName(stem));
      continue;
    }
    names.add(stem);
  }
  return [...names].sort();
}

function withConditionals(text: string, avail: Availability | undefined): string {
  return avail !== undefined && text.includes("<!-- if:") ? resolveConditionals(text, avail) : text;
}

/** Installed skills/agents/commands, for resolving kit conditionals the same way `init` did. */
export function availabilityOf(agentsDir: string, names: readonly string[]): Availability {
  const skills = new Set<string>();
  const listed = tryCatch(() => readdirSync(join(agentsDir, "skills"), { withFileTypes: true }));
  if (listed.ok) {
    for (const entry of listed.value) if (entry.isDirectory()) skills.add(entry.name);
  }
  return {
    skills,
    agents: new Set(names),
    commands: new Set(commandNames(agentsDir)),
  };
}

/** Unmarked/kit source with install-time conditionals applied. Never marked Muse bytes. */
export function resolvedAgentText(
  projectRoot: string,
  name: string,
  avail: Availability,
  kitAgents = join(kitDir(), "agents"),
): string | undefined {
  const raw = resolveAgentSource(projectRoot, name, kitAgents);
  return raw === undefined ? undefined : withConditionals(raw, avail);
}

function commandNames(agentsDir: string): string[] {
  const entries = tryCatch(() => readdirSync(join(agentsDir, "commands")));
  if (!entries.ok) return [];
  return entries.value.filter((f) => f.endsWith(".md") && !f.endsWith(KIT_SUFFIX)).map((f) => f.slice(0, -3)).sort();
}

// A prefix of `rel` that is a symlink (or a non-dir parent). Writes would
// follow it, including a dangling leaf whose target is outside the repo.
function throughLink(ctx: Ctx, rel: string): string | undefined {
  const parts = rel.split(sep);
  for (let i = 1; i <= parts.length; i++) {
    const ancestorRel = parts.slice(0, i).join(sep);
    const st = lstatOf(join(ctx.dest, ancestorRel));
    if (st?.isSymbolicLink()) return ancestorRel;
    if (i < parts.length && st && !st.isDirectory()) return ancestorRel;
  }
  return undefined;
}

function put(ctx: Ctx, kind: Action["kind"], rel: string, note?: string, text?: string): void {
  const blocked = throughLink(ctx, rel);
  if (blocked !== undefined) {
    const st = lstatOf(join(ctx.dest, blocked));
    skip(ctx, blocked, st?.isSymbolicLink() ? "link left alone: writing through it would change its target" : "not a directory");
    return;
  }
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
function syncFile(ctx: Ctx, rel: string, name: string, source: string | undefined, text: string, notes: string[], sidecar = true): void {
  const suffix = notes.length > 0 ? `; ${notes.join("; ")}` : "";
  const full = join(ctx.dest, rel);
  const stat = lstatOf(full);
  if (stat === undefined) {
    // Muse dest is the shared agents dir: a pending kit copy (install dry-run)
    // is the same replace the real run does after `copyFile`.
    const note = !sidecar && source !== undefined ? `replaces a copy of the kit${suffix}` : notes.join("; ") || undefined;
    put(ctx, "generate", rel, note, text);
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
  if (current !== undefined && isKitCopy("agents", name, current, source)) {
    put(ctx, "generate", rel, `replaces a copy of the kit${suffix}`, text);
    return;
  }
  if (current !== undefined && !sidecar && source !== undefined) {
    const resolved = withConditionals(source, ctx.avail);
    if (current.replace(/\r\n/g, "\n") === resolved.replace(/\r\n/g, "\n")) {
      put(ctx, "generate", rel, `replaces a copy of the kit${suffix}`, text);
      return;
    }
  }
  // A file the user owns: keep it. Cursor/Claude get a sidecar; Muse cannot
  // use `*.kit.md` names, and must not overwrite the canonical source.
  if (!sidecar) {
    skip(ctx, rel, "user file kept; Muse may drop it if headers/tools/names are illegal");
    return;
  }
  const sidecarPath = adoptRel(rel);
  skip(ctx, rel, `user file kept; generated version -> ${sidecarPath}`);
  const beside = readText(join(ctx.dest, sidecarPath));
  if (beside === undefined) {
    put(ctx, "generate", sidecarPath, `kit version beside your ${rel}`, text);
    return;
  }
  if (beside === text) {
    skip(ctx, sidecarPath, "up to date");
    return;
  }
  if (hasMarker(beside) || isKitCopy("agents", name, beside, source)) {
    put(ctx, "generate", sidecarPath, `kit version beside your ${rel}`, text);
    return;
  }
  skip(ctx, sidecarPath, "user sidecar kept");
}

// Marked files whose source agent is gone. Only files that carry the marker
// are ever removed.
function pruneOrphans(ctx: Ctx, dirRel: string, names: ReadonlySet<string>, allMarked: boolean): void {
  if (throughLink(ctx, dirRel) !== undefined) return;
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

// A provider layer that is a link (`.cursor -> .agents` in a repo that keeps
// one source) would make a write land in the source itself; a file in its
// place cannot hold anything. Either way, leave it.
function layerBlocked(ctx: Ctx, dirRel: string): boolean {
  const layer = dirname(dirRel);
  const stat = lstatOf(join(ctx.dest, layer));
  if (stat === undefined || (stat.isDirectory() && !stat.isSymbolicLink())) return false;
  skip(ctx, layer, stat.isSymbolicLink() ? "link left alone: writing through it would change its target" : "not a directory");
  return true;
}

// The directory a provider's agents go in. A link the kit made earlier
// (`.claude/agents -> ../.agents/agents`) becomes a real directory; any other
// link is not ours to touch.
function isKitAgentsLink(full: string): boolean {
  const resolved = tryCatch(() => realpathSync(full));
  const kit = tryCatch(() => realpathSync(join(kitDir(), "agents")));
  return resolved.ok && kit.ok && resolved.value === kit.value;
}

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
    if (isKitAgentsLink(full) || (target.ok && target.value === "../packages/ai/kit/agents")) {
      if (ctx.write) unlinkSync(full);
      ctx.actions.push({ kind: "convert", path: dirRel, note: "link to kit agents -> real directory of Muse files" });
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

function makeLink(ctx: Ctx, rel: string, target: string, note: string): void {
  ctx.actions.push({ kind: "link", path: rel, note: `${target}; ${note}` });
  if (!ctx.write) return;
  const full = join(ctx.dest, rel);
  mkdirSync(join(full, ".."), { recursive: true });
  if (lstatOf(full)) unlinkSync(full);
  symlinkSync(target, full);
}

const COMMAND_LINK = /^\.\.\/\.\.\/\.agents\/commands\/(.+)\.md$/;

// Cursor reads commands as plain files, so each one is a link to the source:
// the same bytes, nothing to go stale. A copy of the kit becomes the link, a
// file of the user's stays and the link goes beside it as `<name>.kit.md`,
// and a link to a command that no longer exists is removed.
function syncCommands(ctx: Ctx, names: readonly string[], source: (name: string) => string | undefined, noPrune: boolean): void {
  const dirRel = join(".cursor", "commands");
  if (layerBlocked(ctx, dirRel)) return;
  const dir = lstatOf(join(ctx.dest, dirRel));
  if (dir !== undefined && (dir.isSymbolicLink() || !dir.isDirectory())) {
    skip(ctx, dirRel, dir.isSymbolicLink() ? "directory link left alone" : "not a directory");
    return;
  }
  const known = new Set(names);
  for (const name of names) {
    const rel = join(dirRel, `${name}.md`);
    const target = `../../.agents/commands/${name}.md`;
    const full = join(ctx.dest, rel);
    const stat = lstatOf(full);
    if (stat === undefined) {
      makeLink(ctx, rel, target, "new");
    } else if (stat.isSymbolicLink()) {
      const now = tryCatch(() => readlinkSync(full));
      if (now.ok && now.value === target) skip(ctx, rel, "up to date");
      else skip(ctx, rel, `user link kept (${now.ok ? now.value : "?"})`);
    } else if (stat.isFile()) {
      const text = readText(full) ?? "";
      if (isKitCopy("commands", name, text, source(name))) {
        makeLink(ctx, rel, target, "replaces a copy of the kit");
      } else {
        const beside = adoptRel(rel);
        skip(ctx, rel, `kept user file; link -> ${beside}`);
        if (lstatOf(join(ctx.dest, beside)) === undefined) makeLink(ctx, beside, target, `kit version beside your ${rel}`);
        else skip(ctx, beside, "up to date");
      }
    } else {
      skip(ctx, rel, "not a file");
    }
  }
  if (noPrune || dir === undefined) return;
  const entries = tryCatch(() => readdirSync(join(ctx.dest, dirRel)));
  for (const file of entries.ok ? entries.value.sort() : []) {
    const full = join(ctx.dest, dirRel, file);
    if (!lstatOf(full)?.isSymbolicLink()) continue;
    const now = tryCatch(() => readlinkSync(full));
    const base = now.ok ? COMMAND_LINK.exec(now.value)?.[1] : undefined;
    if (base === undefined || known.has(base) || file !== `${base}.md` && file !== `${base}.kit.md`) continue;
    if (ctx.write) unlinkSync(full);
    ctx.actions.push({ kind: "prune", path: join(dirRel, file), note: "source command removed" });
  }
}

/** What `syncAgents` works from; `installKit` and `syncKit` both fill it in. */
export type AgentSync = {
  dest: string;
  /** False reports the actions and writes nothing. */
  write: boolean;
  providers: readonly string[];
  policy: Tokenomics;
  /** The project's `.agents` directory (for the agent headers in `agents.meta.json`). */
  agentsDir: string;
  /** Agent names, without `.md`. */
  names: readonly string[];
  /** The source text of an agent as the project holds it (or will hold it). */
  source: (name: string) => string | undefined;
  /** Command names and sources, for the Cursor links; omitted: commands are left alone. */
  commands?: { names: readonly string[]; source: (name: string) => string | undefined } | undefined;
  /** Throw on a source that cannot be generated from instead of skipping it with a note. */
  strict?: boolean | undefined;
  prune?: boolean | undefined;
  noPrune?: boolean | undefined;
  /** When set, a resolved kit copy (conditionals applied) counts as a kit copy for Muse. */
  avail?: Availability | undefined;
};

/** The generating half of `syncKit`: appends what it did (or would do) to `actions`. Throws on a source it cannot generate from. */
export function syncAgents(input: AgentSync, actions: Action[]): void {
  const ctx: Ctx = { dest: input.dest, write: input.write, actions, avail: input.avail };
  const known = new Set(input.names);
  for (const name of input.names) {
    const alias = MUSE_NAME_ALIAS[name];
    if (alias !== undefined) known.add(alias);
  }
  for (const provider of input.providers) {
    const keys = PROVIDER_KEYS[provider];
    if (!isGenerated(provider) || keys?.agentsDir === undefined) {
      skip(ctx, `.agents/agents`, keys?.note ?? `${provider}: nothing to generate`);
      continue;
    }
    const dirRel = keys.agentsDir;
    if (layerBlocked(ctx, dirRel) || prepareDir(ctx, dirRel) === "blocked") continue;
    if (provider === "muse") {
      const dirFull = join(ctx.dest, dirRel);
      const listed = tryCatch(() => readdirSync(dirFull, { withFileTypes: true }));
      if (listed.ok && listed.value.some((entry) => entry.isSymbolicLink())) {
        skip(ctx, dirRel, "symlink in .agents/agents would empty the Muse catalog; no Muse writes");
        continue;
      }
    }
    for (const name of input.names) {
      const destText = readText(join(input.agentsDir, "agents", `${name}.md`));
      const sources = unmarkedAliasSources(join(input.agentsDir, "agents"));
      if (
        provider !== "muse" &&
        isReservedMuseDest(name, { sources, ...(destText !== undefined && { destText }) })
      ) {
        continue;
      }
      const agent = loadAgent(input.agentsDir, name);
      if (!agent.ok) {
        skip(ctx, join(dirRel, `${name}.md`), `not synced: ${agent.error.message}`);
        continue;
      }
      const destName = provider === "muse" ? museNativeName(name) : name;
      if (provider === "muse" && destName === undefined) {
        skip(
          ctx,
          join(dirRel, `${name}.md`),
          "muse name is not [a-z-] and has no alias map row; file left if unmarked (limitation)",
        );
        continue;
      }
      const fileName = destName ?? name;
      const route = resolveRoute(input.policy, { stakes: "standard", agent: agent.value, provider });
      if (!route.ok) throw new Error(`${name}: ${route.error.message}`);
      const source = input.source(name) ?? "";
      const kitText = readText(join(kitDir(), "agents", `${name}.md`));
      const made =
        provider === "muse"
          ? generateMuseAgent({ name: fileName, sourceName: name, source, model: route.value.model })
          : generateAgent({
              name,
              source,
              model: route.value.model,
              readonly: provider === "cursor" && isCheckKind(agent.value.header),
            });
      if (!made.ok) {
        if (input.strict === true) throw made.error;
        skip(ctx, join(dirRel, `${fileName}.md`), `not synced: ${made.error.message}`);
        continue;
      }
      // Muse writes into `.agents/agents`: kit-copy detection must use the kit
      // bytes, never the file we are about to replace (that would treat every
      // unmarked custom agent as a kit copy). Aliased names keep the unmarked
      // source file and write the native file beside it.
      syncFile(
        ctx,
        join(dirRel, `${fileName}.md`),
        name,
        provider === "muse" ? kitText : source,
        made.value.text,
        made.value.notes,
        provider !== "muse",
      );
      if (provider === "muse" && fileName !== name && lstatOf(join(ctx.dest, join(dirRel, `${name}.md`))) === undefined && source !== "") {
        put(ctx, "write", join(dirRel, `${name}.md`), "unmarked source beside Muse alias", source);
      }
    }
    if (input.noPrune !== true) pruneOrphans(ctx, dirRel, known, false);
    skip(ctx, dirRel, keys.note);
    if (provider === "cursor" && input.commands !== undefined) {
      syncCommands(ctx, input.commands.names, input.commands.source, input.noPrune === true);
    }
  }
  if (input.providers.includes("cursor") && input.providers.includes("claude")) {
    skip(ctx, ".claude/agents", "cursor reads .cursor/agents before .claude/agents and lists a name once (checked 2026-11-05)");
  }
  if (input.prune === true) {
    for (const provider of ["cursor", "claude", "muse"]) {
      const dirRel = PROVIDER_KEYS[provider]?.agentsDir;
      // Muse dest is the shared source; dropping muse from --provider must
      // not delete project agents.
      if (provider === "muse" || dirRel === undefined || input.providers.includes(provider) || layerBlocked(ctx, dirRel)) {
        continue;
      }
      pruneOrphans(ctx, dirRel, known, true);
    }
  }
}

/**
 * Write each tool's agent files from `.agents/agents` and `.agents/tokenomics.md`.
 * Cursor and Claude get a generated copy per agent with `model` set from the
 * route of the agent's default kind at `standard` stakes (a call with another
 * kind or needs routes at spawn time). Cursor check-kind agents also get
 * `readonly: true`. Muse gets a native marked file in `.agents/agents`
 * (closed frontmatter, Muse tool names); unmarked and kit files stay the
 * canonical source. Codex reads `.agents` and is not generated. A file that
 * carries the marker is regenerated, a copy of the kit is replaced, anything
 * else is kept (Cursor/Claude sidecar as `<name>.kit.md`; Muse never
 * sidecars). Returns what happened (or, with `check` or `dryRun`, what would).
 * A second run reports only `skip`.
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
  const actions: Action[] = [];
  const avail = availabilityOf(agentsDir, names);
  const run = tryCatch(() =>
    syncAgents(
      {
        dest: options.dest,
        write: options.check !== true && options.dryRun !== true,
        providers,
        policy: policy.value,
        agentsDir,
        names,
        avail,
        source: (name) => resolvedAgentText(options.dest, name, avail),
        commands: {
          names: commandNames(agentsDir),
          source: (name) => readText(join(agentsDir, "commands", `${name}.md`)),
        },
        strict: true,
        prune: options.prune,
        noPrune: options.noPrune,
      },
      actions,
    ),
  );
  return run.ok ? ok(actions) : err(run.error);
}

/**
 * True when this action is a real no-op. A Muse catalog-empty skip is unsafe:
 * the provider was selected but writes were blocked, so `--check` / validate
 * must not treat it as unchanged.
 */
export function isCheckedUnchanged(action: Action): boolean {
  return action.kind === "skip" && !(action.note ?? "").includes("would empty the Muse catalog");
}

/** True when `syncKit` found nothing to change: every action is a `skip`. */
export function inSync(actions: readonly Action[]): boolean {
  return actions.every(isCheckedUnchanged);
}
