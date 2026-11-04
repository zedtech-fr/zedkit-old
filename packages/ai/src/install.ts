// Original work by the same author.
import {
  copyFileSync,
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, sep } from "node:path";
import { err, ok, tryCatch, type Result } from "@zedtech/zedkit-core";
import { parseFrontmatter } from "./frontmatter.js";
import { agentsForPreset, commandsForPreset, kitDir, readManifest, type KitManifest } from "./kit.js";
import { setLensStatus } from "./lenses.js";
import { danglingSkillRefs, skillRefFiles } from "./skill-refs.js";

/** Providers that get an installer layer or shared-source wiring. */
export type Provider = "claude" | "cursor" | "codex";

/** @deprecated Use {@link Provider}. Kept so `--target` and old callers keep working. */
export type Target = Provider;

/** Shared-source runtime id (not part of the public {@link Provider} union). */
type SharedSourceProvider = "muse";

type WireProvider = Provider | SharedSourceProvider;

export type InstallOptions = {
  /** Project directory to install into. */
  dest: string;
  /** Preset name from kit.json. Default `starter`. */
  preset?: string;
  /** Providers to wire. Default: all supported runtimes. Extra runtime ids are accepted at runtime. */
  providers?: readonly (Provider | string)[];
  /** @deprecated Use `providers`. */
  targets?: readonly (Provider | string)[];
  /** Report what would happen without touching the disk. */
  dryRun?: boolean;
  /**
   * On a name collision keep the user file and write the kit version next to
   * it (`review.kit.md` for files, `zk-review` for skill folders).
   */
  adopt?: boolean;
  /** Custom kit directory (default: the bundled kit). */
  kit?: string;
};

export type Action = {
  kind: "copy" | "link" | "write" | "append" | "skip";
  path: string;
  /** Why it was skipped, what was appended, or what a link points to. */
  note?: string;
};

/** Every runtime the installer can wire; the CLI accepts these plus `all`. */
export const ALL_PROVIDERS: readonly WireProvider[] = ["claude", "cursor", "codex", "muse"];

const CURSOR_RULE = `---
description: Project rules
alwaysApply: true
---

Read and follow /AGENTS.md at the repo root, and use the skills in .agents/skills.
`;

type Ctx = { dest: string; kit: string; dryRun: boolean; adopt: boolean; actions: Action[] };

function lstatOf(path: string): ReturnType<typeof lstatSync> | undefined {
  const stat = tryCatch(() => lstatSync(path));
  return stat.ok ? stat.value : undefined;
}

function isDirectory(path: string): boolean {
  const stat = tryCatch(() => statSync(path));
  return stat.ok && stat.value.isDirectory();
}

// Why `rel` cannot be created, or undefined when the way is free. The path
// itself is taken if anything (even a dangling symlink) is there; a parent
// that is not a directory would make the write fail halfway.
function obstacle(ctx: Ctx, rel: string): string | undefined {
  const parts = rel.split(sep);
  for (let i = 1; i < parts.length; i++) {
    const parent = join(ctx.dest, ...parts.slice(0, i));
    if (lstatOf(parent) && !isDirectory(parent)) {
      return `${parts.slice(0, i).join(sep)} is not a directory`;
    }
  }
  return lstatOf(join(ctx.dest, rel)) ? "already exists, left untouched" : undefined;
}

// Provider layer dirs are link targets, never sidecarred: a `.claude/zk-skills`
// link is dead (no provider reads it), so a blocked layer dir is just
// skipped. Sidecars exist only for files (`*.kit.md`) and skill folders
// (`zk-<name>`).
const LAYER_DIRS: ReadonlySet<string> = new Set(
  ["skills", "agents", "commands"].map((kind) => join(".claude", kind)).concat(join(".cursor", "skills")),
);

function canAdopt(rel: string): boolean {
  if (LAYER_DIRS.has(rel)) return false;
  const [root, kind] = rel.split(sep);
  if (root === ".agents" && (kind === "skills" || kind === "agents" || kind === "commands" || kind === "personas.md")) {
    return true;
  }
  if ((root === ".cursor" || root === ".claude") && (kind === "skills" || kind === "agents" || kind === "commands")) {
    return true;
  }
  return false;
}

function adoptRel(rel: string): string {
  const base = rel.split(sep).pop() ?? rel;
  const dir = dirname(rel);
  if (base.endsWith(".md")) return join(dir, base.replace(/\.md$/, ".kit.md"));
  return join(dir, `zk-${base}`);
}

function treeFiles(root: string): string[] | undefined {
  const entries = tryCatch(() => readdirSync(root, { recursive: true, encoding: "utf8" }));
  if (!entries.ok) return undefined;
  return entries.value.filter((e) => {
    const st = tryCatch(() => statSync(join(root, e)));
    return st.ok && st.value.isFile();
  }).sort();
}

function treesMatch(src: string, dest: string, installed: ReadonlySet<string>): boolean {
  const from = treeFiles(src);
  const to = treeFiles(dest);
  if (!from || !to || from.join("\n") !== to.join("\n")) return false;
  return from.every((rel) => {
    const raw = tryCatch(() => readFileSync(join(src, rel), "utf8"));
    const got = tryCatch(() => readFileSync(join(dest, rel), "utf8"));
    return raw.ok && got.ok && (rel === "lenses.md" ? setLensStatus(raw.value, installed) : raw.value) === got.value;
  });
}

function place(
  ctx: Ctx,
  kind: Exclude<Action["kind"], "skip">,
  rel: string,
  make: (destRel: string) => void,
  note?: string,
): string | undefined {
  const blocked = obstacle(ctx, rel);
  let target = rel;
  let targetNote = note;
  if (blocked) {
    const current = tryCatch(() => readlinkSync(join(ctx.dest, rel)));
    const sameLink = kind === "link" && current.ok && current.value === note;
    if (sameLink) {
      ctx.actions.push({ kind: "skip", path: rel, note: "already linked" });
      return undefined;
    }
    if (ctx.adopt && canAdopt(rel)) {
      const alt = adoptRel(rel);
      const altBlocked = obstacle(ctx, alt);
      ctx.actions.push({ kind: "skip", path: rel, note: `kept user file; kit → ${alt}` });
      if (altBlocked) {
        ctx.actions.push({ kind: "skip", path: alt, note: altBlocked });
        return undefined;
      }
      target = alt;
      targetNote = note !== undefined ? `${note}; user ${rel} kept` : `kit sidecar (user ${rel} kept)`;
    } else {
      ctx.actions.push({ kind: "skip", path: rel, note: blocked });
      return undefined;
    }
  }
  ctx.actions.push({ kind, path: target, ...(targetNote !== undefined && { note: targetNote }) });
  if (ctx.dryRun) return target;
  mkdirSync(dirname(join(ctx.dest, target)), { recursive: true });
  make(target);
  return target;
}

function copyFile(ctx: Ctx, from: string, rel: string): void {
  if (ctx.adopt) {
    const left = tryCatch(() => readFileSync(from));
    const right = tryCatch(() => readFileSync(join(ctx.dest, rel)));
    if (left.ok && right.ok && left.value.equals(right.value)) {
      ctx.actions.push({ kind: "skip", path: rel, note: "already installed" });
      return;
    }
  }
  place(ctx, "copy", rel, (destRel) => copyFileSync(from, join(ctx.dest, destRel)));
}

function link(ctx: Ctx, rel: string, target: string): void {
  place(ctx, "link", rel, (destRel) => symlinkSync(target, join(ctx.dest, destRel)), target);
}

function skillNames(manifest: KitManifest, kit: string, preset: string): string[] {
  const entry = Object.hasOwn(manifest.presets, preset) ? manifest.presets[preset] : undefined;
  if (entry === undefined) {
    throw new Error(`unknown preset "${preset}" (have: ${Object.keys(manifest.presets).join(", ")})`);
  }
  if (entry !== "*") return entry;
  return readdirSync(join(kit, "skills"), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

// Resolve everything the install needs from the kit before the first write,
// so a bad preset or manifest never leaves a half install behind.
function plan(kit: string, manifest: KitManifest, preset: string) {
  const skills = skillNames(manifest, kit, preset);
  for (const name of skills) {
    if (!existsSync(join(kit, "skills", name, "SKILL.md"))) throw new Error(`kit has no skill "${name}"`);
  }
  const agents = agentsForPreset(manifest, preset);
  for (const name of agents) {
    if (!existsSync(join(kit, "agents", `${name}.md`))) throw new Error(`kit has no agent "${name}"`);
  }
  const commands = commandsForPreset(manifest, preset);
  for (const name of commands) {
    if (!existsSync(join(kit, "commands", `${name}.md`))) throw new Error(`kit has no command "${name}"`);
  }
  const licences = readdirSync(join(kit, "skills")).filter((f) => f.startsWith("LICENSE-"));
  const issues = danglingSkillRefs(skillRefFiles(kit, skills, agents, commands), new Set(skills));
  if (issues.length > 0) {
    const detail = issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ");
    throw new Error(`preset "${preset}" has dangling skill references: ${detail}`);
  }
  return { skills, licences, agents, commands, personas: personasTemplate(kit, preset) };
}

// setup ships the v2 schema so phase C edits `.agents/personas.md` in place
// instead of replacing the v1 Task/Bar table. Other presets keep v1.
function personasTemplate(kit: string, preset: string): string | undefined {
  if (preset === "setup") {
    const v2 = join(kit, "skills", "setup-ai", "templates", "personas-v2.template.md");
    if (existsSync(v2)) return v2;
  }
  const v1 = join(kit, "personas.template.md");
  return existsSync(v1) ? v1 : undefined;
}

// The ladder section every AGENTS.md must carry, lifted from the bundled
// template so the wording has a single home. Undefined when the kit has
// no template or no ladder section (foreign kits keep working).
function ladderSection(kit: string): string | undefined {
  const template = tryCatch(() => readFileSync(join(kit, "AGENTS.template.md"), "utf8"));
  if (!template.ok) return undefined;
  const start = template.value.indexOf("## Before writing any code");
  if (start < 0) return undefined;
  const rest = template.value.slice(start);
  const next = rest.indexOf("\n## ", 1);
  return `${(next < 0 ? rest : rest.slice(0, next)).trimEnd()}\n`;
}

// Fresh projects get the whole template; an existing AGENTS.md is never
// overwritten, but when it lacks the ladder the section is appended (and
// reported as `append`, so dry runs agree with real ones).
function installAgentsMd(ctx: Ctx): void {
  const blocked = obstacle(ctx, "AGENTS.md");
  if (blocked === undefined) {
    copyFile(ctx, join(ctx.kit, "AGENTS.template.md"), "AGENTS.md");
    return;
  }
  const current = tryCatch(() => readFileSync(join(ctx.dest, "AGENTS.md"), "utf8"));
  if (!current.ok || current.value.toLowerCase().includes("ladder")) {
    ctx.actions.push({ kind: "skip", path: "AGENTS.md", note: blocked });
    return;
  }
  const section = ladderSection(ctx.kit);
  if (section === undefined) {
    ctx.actions.push({ kind: "skip", path: "AGENTS.md", note: blocked });
    return;
  }
  ctx.actions.push({ kind: "append", path: "AGENTS.md", note: "ladder section" });
  if (ctx.dryRun) return;
  const gap = current.value === "" ? "" : current.value.endsWith("\n") ? "\n" : "\n\n";
  writeFileSync(join(ctx.dest, "AGENTS.md"), `${current.value}${gap}${section}`);
}

function patchLenses(folder: string, installed: ReadonlySet<string>): void {
  const file = join(folder, "lenses.md");
  if (!existsSync(file)) return;
  writeFileSync(file, setLensStatus(readFileSync(file, "utf8"), installed));
}

function installContent(ctx: Ctx, content: ReturnType<typeof plan>): Map<string, string> {
  const installed = new Set([...content.skills, ...content.agents]);
  const skillDest = new Map<string, string>();
  for (const name of content.skills) {
    const rel = join(".agents", "skills", name);
    if (ctx.adopt && treesMatch(join(ctx.kit, "skills", name), join(ctx.dest, rel), installed)) {
      ctx.actions.push({ kind: "skip", path: rel, note: "already installed" });
      skillDest.set(name, rel);
      continue;
    }
    const destRel = place(ctx, "copy", rel, (target) => {
      cpSync(join(ctx.kit, "skills", name), join(ctx.dest, target), { recursive: true, dereference: true });
      patchLenses(join(ctx.dest, target), installed);
    });
    skillDest.set(name, destRel ?? rel);
  }
  for (const file of content.licences) {
    copyFile(ctx, join(ctx.kit, "skills", file), join(".agents", "skills", file));
  }
  copyFile(ctx, join(ctx.kit, "THIRD_PARTY_NOTICES.md"), join(".agents", "THIRD_PARTY_NOTICES.md"));
  if (content.personas) {
    copyFile(ctx, content.personas, join(".agents", "personas.md"));
  }
  for (const name of content.agents) {
    copyFile(ctx, join(ctx.kit, "agents", `${name}.md`), join(".agents", "agents", `${name}.md`));
  }
  for (const name of content.commands) {
    copyFile(ctx, join(ctx.kit, "commands", `${name}.md`), join(".agents", "commands", `${name}.md`));
  }
  installAgentsMd(ctx);
  return skillDest;
}

function agentsMdReady(ctx: Ctx): boolean {
  if (ctx.actions.some((a) => a.kind === "copy" && a.path === "AGENTS.md")) return true;
  const stat = tryCatch(() => statSync(join(ctx.dest, "AGENTS.md")));
  return stat.ok && stat.value.isFile();
}

// Name of another rule in .cursor/rules/ that is already always on, if any.
// A second always-on rule would only duplicate (or fight) it, so the
// installer skips project.mdc then. Reads the disk only, so dry runs agree.
function existingAlwaysOnRule(ctx: Ctx): string | undefined {
  const dir = join(ctx.dest, ".cursor", "rules");
  const entries = tryCatch(() => readdirSync(dir, { withFileTypes: true }));
  if (!entries.ok) return undefined;
  for (const entry of entries.value) {
    if (!entry.isFile() || !entry.name.endsWith(".mdc") || entry.name === "project.mdc") continue;
    const read = tryCatch(() => readFileSync(join(dir, entry.name), "utf8"));
    if (!read.ok) continue;
    const front = parseFrontmatter(read.value);
    if (front.ok && front.value.data.alwaysApply === true) return entry.name;
  }
  return undefined;
}

function writeCursorRule(ctx: Ctx): void {
  const rel = join(".cursor", "rules", "project.mdc");
  if (obstacle(ctx, rel) === undefined) {
    const existing = existingAlwaysOnRule(ctx);
    if (existing !== undefined) {
      ctx.actions.push({ kind: "skip", path: rel, note: `always-on rule ${existing} already exists` });
      return;
    }
  }
  place(ctx, "write", rel, (destRel) => writeFileSync(join(ctx.dest, destRel), CURSOR_RULE));
}

function linkPresentSkills(
  ctx: Ctx,
  skillsRel: string,
  preset: readonly string[],
  skillDest: Map<string, string>,
): void {
  const names = new Set(preset);
  const listed = tryCatch(() => readdirSync(join(ctx.dest, ".agents", "skills"), { withFileTypes: true }));
  if (listed.ok) {
    for (const e of listed.value) {
      if (e.isDirectory()) names.add(e.name);
    }
  }
  for (const name of names) {
    const source = skillDest.get(name) ?? join(".agents", "skills", name);
    link(ctx, join(skillsRel, name), join("..", "..", source));
  }
}

function wireClaude(ctx: Ctx, content: ReturnType<typeof plan>, skillDest: Map<string, string>): void {
  const skillsRel = join(".claude", "skills");
  const existing = lstatOf(join(ctx.dest, skillsRel));
  if (existing?.isDirectory() && !existing.isSymbolicLink()) {
    linkPresentSkills(ctx, skillsRel, content.skills, skillDest);
  } else {
    link(ctx, skillsRel, "../.agents/skills");
  }
  for (const kind of ["agents", "commands"] as const) {
    const layerRel = join(".claude", kind);
    const layer = lstatOf(join(ctx.dest, layerRel));
    if (layer?.isDirectory() && !layer.isSymbolicLink()) {
      for (const name of content[kind]) {
        copyFile(ctx, join(ctx.kit, kind, `${name}.md`), join(layerRel, `${name}.md`));
      }
    } else {
      link(ctx, layerRel, `../.agents/${kind}`);
    }
  }
  // Only when AGENTS.md is (or will be) a real file: never a dangling link.
  if (agentsMdReady(ctx)) link(ctx, "CLAUDE.md", "AGENTS.md");
  else ctx.actions.push({ kind: "skip", path: "CLAUDE.md", note: "AGENTS.md is not a file" });
}

function wireCursor(ctx: Ctx, content: ReturnType<typeof plan>, skillDest: Map<string, string>): void {
  const skillsRel = join(".cursor", "skills");
  const existing = lstatOf(join(ctx.dest, skillsRel));
  if (existing?.isDirectory() && !existing.isSymbolicLink()) {
    linkPresentSkills(ctx, skillsRel, content.skills, skillDest);
  } else {
    link(ctx, skillsRel, "../.agents/skills");
  }
  for (const name of content.agents) {
    copyFile(ctx, join(ctx.kit, "agents", `${name}.md`), join(".cursor", "agents", `${name}.md`));
  }
  for (const name of content.commands) {
    copyFile(ctx, join(ctx.kit, "commands", `${name}.md`), join(".cursor", "commands", `${name}.md`));
  }
  writeCursorRule(ctx);
}

function wireProvider(
  ctx: Ctx,
  provider: WireProvider,
  content: ReturnType<typeof plan>,
  skillDest: Map<string, string>,
): void {
  if (provider === "claude") wireClaude(ctx, content, skillDest);
  else if (provider === "cursor") wireCursor(ctx, content, skillDest);
  // codex and muse read the shared source directly (AGENTS.md plus
  // .agents/): no per-provider layer to generate.
}

/**
 * Install the kit into a project. The shared source (skills, subagents,
 * commands, AGENTS.md) is copied into `.agents/` (the project owns it from
 * then on); each chosen provider then gets its thin layer, links where the
 * provider follows them, real files where it does not. Existing files are
 * never overwritten: they are reported as skipped, except an existing
 * AGENTS.md missing the ladder, which gets the ladder section appended
 * (reported as `append`). With `adopt`, a colliding skill/agent/command
 * keeps the user file and the kit version is written beside it. A bad
 * preset or kit fails before anything is written.
 */
export function installKit(options: InstallOptions): Result<Action[]> {
  const kit = options.kit ?? kitDir();
  const manifest = readManifest(kit);
  if (!manifest.ok) return err(manifest.error);
  const ctx: Ctx = {
    dest: options.dest,
    kit,
    dryRun: options.dryRun ?? false,
    adopt: options.adopt ?? false,
    actions: [],
  };
  const run = tryCatch(() => {
    const content = plan(kit, manifest.value, options.preset ?? "starter");
    const skillDest = installContent(ctx, content);
    const chosen = (options.providers ?? options.targets ?? ALL_PROVIDERS) as WireProvider[];
    for (const provider of chosen) {
      wireProvider(ctx, provider, content, skillDest);
    }
  });
  return run.ok ? ok(ctx.actions) : err(run.error);
}
