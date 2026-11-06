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
import { adoptRel, agentsForPreset, commandsForPreset, kitDir, kitUniverse, readManifest, type KitManifest } from "./kit.js";
import { setLensStatus } from "./lenses.js";
import { danglingKitRefs, skillRefFiles } from "./skill-refs.js";
import { resolveConditionals, type Availability } from "./conditional.js";
import { loadPolicy } from "./route.js";
import { resolveAgentSource, syncAgents } from "./sync.js";
import { applyTestPolicyToAgentsMd } from "./test-policy.js";
import { loadDefaults } from "./tokenomics.js";

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
  /** `generate`, `convert` and `prune` come from `syncKit`; the rest from `installKit`. */
  kind: "copy" | "link" | "write" | "append" | "skip" | "generate" | "convert" | "prune";
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
Multi-step or multi-lens work goes through the orchestrate skill; atomic fixes stay inline with their check.
`;

type Ctx = {
  dest: string;
  kit: string;
  dryRun: boolean;
  adopt: boolean;
  actions: Action[];
  /** What this preset installs; resolves conditional kit blocks. Set after plan(). */
  avail: Availability;
};

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

function treeFiles(root: string): string[] | undefined {
  const entries = tryCatch(() => readdirSync(root, { recursive: true, encoding: "utf8" }));
  if (!entries.ok) return undefined;
  return entries.value.filter((e) => {
    const st = tryCatch(() => statSync(join(root, e)));
    return st.ok && st.value.isFile();
  }).sort();
}

// Conditional markers resolved; plain files pass through untouched.
function resolveIfNeeded(text: string, avail: Availability): string {
  return text.includes("<!-- if:") ? resolveConditionals(text, avail) : text;
}

function treesMatch(src: string, dest: string, installed: ReadonlySet<string>, avail: Availability): boolean {
  const from = treeFiles(src);
  const to = treeFiles(dest);
  if (!from || !to || from.join("\n") !== to.join("\n")) return false;
  return from.every((rel) => {
    const raw = tryCatch(() => readFileSync(join(src, rel), "utf8"));
    const got = tryCatch(() => readFileSync(join(dest, rel), "utf8"));
    if (!raw.ok || !got.ok) return false;
    const lensed = rel === "lenses.md" ? setLensStatus(raw.value, installed) : raw.value;
    return resolveIfNeeded(lensed, avail) === got.value;
  });
}

// Adopt sidecars must not claim the live skill name: two SKILL.md files with
// one `name:` read as two live skills sharing it. Only that line is
// rewritten (line endings normalize to LF, the validated form), so the
// sidecar stays a faithful kit copy for diffing. Undefined when the file has
// no frontmatter `name:` line to rewrite, or the rewrite does not re-parse
// to the sidecar name (a folded `name:` stays untouched for a human).
function withSidecarSkillName(text: string, sidecarName: string): string | undefined {
  const lines = text.replace(/\r\n/g, "\n").replace(/^\uFEFF/, "").split("\n");
  if (lines[0] !== "---") return undefined;
  const close = lines.findIndex((line, index) => index > 0 && line.trimEnd() === "---");
  if (close < 0) return undefined;
  const at = lines.findIndex((line, index) => index > 0 && index < close && /^name:[ \t]*\S/.test(line));
  if (at < 0) return undefined;
  lines[at] = `name: ${sidecarName}`;
  const next = lines.join("\n");
  const check = parseFrontmatter(next);
  return check.ok && check.value.data.name === sidecarName ? next : undefined;
}

function renameFreshSidecarSkill(skillDir: string, base: string): void {
  const file = join(skillDir, "SKILL.md");
  const raw = tryCatch(() => readFileSync(file, "utf8"));
  if (!raw.ok) return;
  const renamed = withSidecarSkillName(raw.value, `zk-${base}`);
  if (renamed !== undefined) writeFileSync(file, renamed);
}

// A pre-fix adopt run left sidecars claiming the base skill name. A re-run
// rewrites just that line; every other byte (including user margin notes in
// the sidecar) stays untouched, and the user file is never rewritten.
function migrateSidecarSkillName(ctx: Ctx, rel: string, base: string): void {
  const sidecar = adoptRel(rel);
  const file = join(ctx.dest, sidecar, "SKILL.md");
  const raw = tryCatch(() => readFileSync(file, "utf8"));
  if (!raw.ok) return;
  const front = parseFrontmatter(raw.value);
  if (!front.ok || front.value.data.name !== base) return;
  const renamed = withSidecarSkillName(raw.value, `zk-${base}`);
  if (renamed === undefined) return;
  ctx.actions.push({
    kind: "write",
    path: join(sidecar, "SKILL.md"),
    note: `sidecar skill renamed to zk-${base} so /${base} resolves to one skill`,
  });
  if (ctx.dryRun) return;
  writeFileSync(file, renamed);
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

const PERSONAS_V2_COLUMNS = "| Persona | Goals |";

// Phase C rewrites .agents/personas.md in the v2 schema. Sidecarring the kit
// template next to a v2 file as personas.kit.md is noise, so it is kept with
// no sidecar. Anything without v2 headers (v1, hand-written) still gets the
// kit sidecar so the v2 schema stays visible.
function personasCustomized(current: string): boolean {
  return current.replace(/\s+/g, " ").includes(PERSONAS_V2_COLUMNS);
}

function copyFile(ctx: Ctx, from: string, rel: string): void {
  const kit = tryCatch(() => readFileSync(from, "utf8"));
  const text = kit.ok ? resolveIfNeeded(kit.value, ctx.avail) : undefined;
  if (text === undefined) {
    place(ctx, "copy", rel, (destRel) => copyFileSync(from, join(ctx.dest, destRel)));
    return;
  }
  if (ctx.adopt) {
    const current = tryCatch(() => readFileSync(join(ctx.dest, rel), "utf8"));
    if (current.ok && current.value === text) {
      ctx.actions.push({ kind: "skip", path: rel, note: "already installed" });
      return;
    }
    if (current.ok && rel === join(".agents", "personas.md") && personasCustomized(current.value)) {
      ctx.actions.push({ kind: "skip", path: rel, note: "kept (already customized)" });
      return;
    }
  }
  place(ctx, "copy", rel, (destRel) => writeFileSync(join(ctx.dest, destRel), text));
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
  return [...kitUniverse(kit).skills];
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
  const avail: Availability = { skills: new Set(skills), agents: new Set(agents), commands: new Set(commands) };
  const universe = kitUniverse(kit);
  const files = skillRefFiles(kit, skills, agents, commands).map((file) => ({
    ...file,
    text: resolveConditionals(file.text, avail, universe),
  }));
  const issues = danglingKitRefs(files, avail, universe);
  // Root docs resolve at copy time; check their resolved text now so a
  // preset whose template names an uninstalled skill fails before writing.
  // (The attribution notice names every vendored skill by design and is
  // exempt from closure, markers still validated.)
  const rootDocs: Array<[string, string]> = [[join(kit, "AGENTS.template.md"), "AGENTS.md"]];
  const personas = personasTemplate(kit, preset);
  if (personas !== undefined) rootDocs.unshift([personas, "personas.md"]);
  for (const [full, installedPath] of rootDocs) {
    if (!existsSync(full)) continue;
    const text = resolveConditionals(readFileSync(full, "utf8"), avail, universe);
    issues.push(...danglingKitRefs([{ path: installedPath, text, kitOrigin: true }], avail, universe));
  }
  if (issues.length > 0) {
    const detail = issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ");
    throw new Error(`preset "${preset}" has dangling references: ${detail}`);
  }
  // Marker-bearing files outside skills/agents/commands resolve at copy
  // time; validate their markers now so a bad kit fails before writing.
  for (const name of licences) {
    resolveConditionals(readFileSync(join(kit, "skills", name), "utf8"), avail, universe);
  }
  for (const single of ["THIRD_PARTY_NOTICES.md"]) {
    if (existsSync(join(kit, single))) {
      resolveConditionals(readFileSync(join(kit, single), "utf8"), avail, universe);
    }
  }
  return { skills, licences, agents, commands, personas };
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
function ladderSection(kit: string, avail: Availability): string | undefined {
  const template = tryCatch(() => readFileSync(join(kit, "AGENTS.template.md"), "utf8"));
  if (!template.ok) return undefined;
  const start = template.value.indexOf("## Before writing any code");
  if (start < 0) return undefined;
  const rest = template.value.slice(start);
  const next = rest.indexOf("\n## ", 1);
  const section = `${(next < 0 ? rest : rest.slice(0, next)).trimEnd()}\n`;
  return resolveIfNeeded(section, avail);
}

function readDestScripts(dest: string): Record<string, string> | undefined {
  const raw = tryCatch(() => JSON.parse(readFileSync(join(dest, "package.json"), "utf8")) as unknown);
  if (!raw.ok || raw.value === null || typeof raw.value !== "object") return undefined;
  const scripts = (raw.value as { scripts?: unknown }).scripts;
  if (scripts === null || typeof scripts !== "object") return undefined;
  const out: Record<string, string> = {};
  for (const [name, command] of Object.entries(scripts)) {
    if (typeof command === "string") out[name] = command;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function fillAgentsCommands(ctx: Ctx): void {
  if (ctx.dryRun) return;
  const dest = join(ctx.dest, "AGENTS.md");
  const md = tryCatch(() => readFileSync(dest, "utf8"));
  if (!md.ok) return;
  const next = applyTestPolicyToAgentsMd(md.value, readDestScripts(ctx.dest));
  if (next !== md.value) writeFileSync(dest, next);
}

// Fresh projects get the whole template; an existing AGENTS.md is never
// overwritten, but when it lacks the ladder the section is appended (and
// reported as `append`, so dry runs agree with real ones).
function installAgentsMd(ctx: Ctx): void {
  const blocked = obstacle(ctx, "AGENTS.md");
  if (blocked === undefined) {
    copyFile(ctx, join(ctx.kit, "AGENTS.template.md"), "AGENTS.md");
    fillAgentsCommands(ctx);
    return;
  }
  const current = tryCatch(() => readFileSync(join(ctx.dest, "AGENTS.md"), "utf8"));
  if (!current.ok || current.value.toLowerCase().includes("ladder")) {
    ctx.actions.push({ kind: "skip", path: "AGENTS.md", note: blocked });
    return;
  }
  const section = ladderSection(ctx.kit, ctx.avail);
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

function patchConditionals(folder: string, avail: Availability): void {
  const files = tryCatch(() => readdirSync(folder, { recursive: true, encoding: "utf8" }));
  if (!files.ok) return;
  for (const rel of files.value) {
    if (!rel.endsWith(".md")) continue;
    const full = join(folder, rel);
    const raw = tryCatch(() => readFileSync(full, "utf8"));
    if (!raw.ok || !raw.value.includes("<!-- if:")) continue;
    writeFileSync(full, resolveConditionals(raw.value, avail));
  }
}

function installContent(ctx: Ctx, content: ReturnType<typeof plan>): Map<string, string> {
  const installed = new Set([...content.skills, ...content.agents]);
  const skillDest = new Map<string, string>();
  for (const name of content.skills) {
    const rel = join(".agents", "skills", name);
    if (ctx.adopt) migrateSidecarSkillName(ctx, rel, name);
    if (ctx.adopt && treesMatch(join(ctx.kit, "skills", name), join(ctx.dest, rel), installed, ctx.avail)) {
      ctx.actions.push({ kind: "skip", path: rel, note: "already installed" });
      skillDest.set(name, rel);
      continue;
    }
    const destRel = place(ctx, "copy", rel, (target) => {
      cpSync(join(ctx.kit, "skills", name), join(ctx.dest, target), { recursive: true, dereference: true });
      patchLenses(join(ctx.dest, target), installed);
      patchConditionals(join(ctx.dest, target), ctx.avail);
      if (target !== rel) renameFreshSidecarSkill(join(ctx.dest, target), name);
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
  // The policy file is meant to be edited, so it is never adopted: no
  // sidecar, an existing file is left alone. Policy defaults come from the
  // package at runtime, not from this stub.
  if (existsSync(join(ctx.kit, "tokenomics.template.md"))) {
    copyFile(ctx, join(ctx.kit, "tokenomics.template.md"), join(".agents", "tokenomics.md"));
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

function wireSkillsDir(ctx: Ctx, skillsRel: string, content: ReturnType<typeof plan>, skillDest: Map<string, string>): void {
  const existing = lstatOf(join(ctx.dest, skillsRel));
  if (existing?.isDirectory() && !existing.isSymbolicLink()) {
    linkPresentSkills(ctx, skillsRel, content.skills, skillDest);
  } else {
    link(ctx, skillsRel, "../.agents/skills");
  }
}

function wireClaude(ctx: Ctx, content: ReturnType<typeof plan>, skillDest: Map<string, string>): void {
  wireSkillsDir(ctx, join(".claude", "skills"), content, skillDest);
  // Agents are generated by `syncAgents`; commands stay a directory link.
  const layerRel = join(".claude", "commands");
  const layer = lstatOf(join(ctx.dest, layerRel));
  if (layer?.isDirectory() && !layer.isSymbolicLink()) {
    for (const name of content.commands) {
      copyFile(ctx, join(ctx.kit, "commands", `${name}.md`), join(layerRel, `${name}.md`));
    }
  } else {
    link(ctx, layerRel, "../.agents/commands");
  }
  // Only when AGENTS.md is (or will be) a real file: never a dangling link.
  if (agentsMdReady(ctx)) link(ctx, "CLAUDE.md", "AGENTS.md");
  else ctx.actions.push({ kind: "skip", path: "CLAUDE.md", note: "AGENTS.md is not a file" });
}

function wireCursor(ctx: Ctx, content: ReturnType<typeof plan>, skillDest: Map<string, string>): void {
  wireSkillsDir(ctx, join(".cursor", "skills"), content, skillDest);
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
  // Codex has no per-provider folder. Muse native files are written by
  // generateAgents into `.agents/agents`.
}

// Each tool's agent files are generated from `.agents/agents` and the policy,
// the same way `zedkit-ai sync` does. A project policy that does not parse
// must not stop an install, so the shipped defaults stand in and a note says so.
function generateAgents(ctx: Ctx, content: ReturnType<typeof plan>, providers: readonly string[]): void {
  const preset = content.agents;
  const agentsDir = join(ctx.dest, ".agents");
  const onDisk = tryCatch(() => readdirSync(join(agentsDir, "agents")));
  const names = new Set(preset);
  if (onDisk.ok) {
    for (const f of onDisk.value) if (f.endsWith(".md") && !f.endsWith(".kit.md")) names.add(f.slice(0, -3));
  }
  let policy = loadPolicy(agentsDir);
  if (!policy.ok) {
    ctx.actions.push({ kind: "skip", path: join(".agents", "tokenomics.md"), note: `${policy.error.message}; models inherit until it is fixed` });
    policy = loadDefaults();
  }
  if (!policy.ok) throw policy.error;
  syncAgents(
    {
      dest: ctx.dest,
      write: !ctx.dryRun,
      providers,
      policy: policy.value,
      agentsDir,
      names: [...names].sort(),
      commands: {
        names: (() => {
          const listed = new Set(content.commands);
          const disk = tryCatch(() => readdirSync(join(agentsDir, "commands")));
          if (disk.ok) {
            for (const f of disk.value) if (f.endsWith(".md") && !f.endsWith(".kit.md")) listed.add(f.slice(0, -3));
          }
          return [...listed].sort();
        })(),
        source: (name) => {
          const disk = tryCatch(() => readFileSync(join(agentsDir, "commands", `${name}.md`), "utf8"));
          return disk.ok ? disk.value : undefined;
        },
      },
      avail: ctx.avail,
      source: (name) => {
        const resolved = resolveAgentSource(ctx.dest, name, join(ctx.kit, "agents"));
        return resolved === undefined ? undefined : resolveIfNeeded(resolved, ctx.avail);
      },
    },
    ctx.actions,
  );
}

const SCRATCH_IGNORE = ".scratch/";

// Working plans default to `.scratch/` when no tracker is configured; keep
// them out of git. Owner content is never touched: only the exact missing
// line is appended, links are never written through, and a second run is a
// skip.
function ensureScratchIgnored(ctx: Ctx): void {
  const rel = ".gitignore";
  const entry = lstatOf(join(ctx.dest, rel));
  if (entry === undefined) {
    place(
      ctx,
      "write",
      rel,
      (destRel) => writeFileSync(join(ctx.dest, destRel), `# Local working plans and tickets (zedkit-ai)\n${SCRATCH_IGNORE}\n`),
      "ignores .scratch/",
    );
    return;
  }
  if (entry.isSymbolicLink()) {
    ctx.actions.push({ kind: "skip", path: rel, note: "link left alone; add .scratch/ inside its target to keep working plans local" });
    return;
  }
  if (!entry.isFile()) {
    ctx.actions.push({ kind: "skip", path: rel, note: "not a file, left untouched" });
    return;
  }
  const current = tryCatch(() => readFileSync(join(ctx.dest, rel), "utf8"));
  if (!current.ok) {
    ctx.actions.push({ kind: "skip", path: rel, note: "unreadable, left untouched" });
    return;
  }
  if (current.value.split("\n").some((line) => line.trim() === SCRATCH_IGNORE)) {
    ctx.actions.push({ kind: "skip", path: rel, note: "already ignores .scratch/" });
    return;
  }
  ctx.actions.push({ kind: "append", path: rel, note: "ignores .scratch/" });
  if (ctx.dryRun) return;
  const gap = current.value === "" || current.value.endsWith("\n") ? "" : "\n";
  writeFileSync(join(ctx.dest, rel), `${current.value}${gap}${SCRATCH_IGNORE}\n`);
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
 * preset or kit fails before anything is written. `.gitignore` gains the
 * `.scratch/` line for git-ignored local working plans.
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
    avail: { skills: new Set(), agents: new Set(), commands: new Set() },
  };
  const run = tryCatch(() => {
    const content = plan(kit, manifest.value, options.preset ?? "starter");
    ctx.avail = {
      skills: new Set(content.skills),
      agents: new Set(content.agents),
      commands: new Set(content.commands),
    };
    const skillDest = installContent(ctx, content);
    const chosen = (options.providers ?? options.targets ?? ALL_PROVIDERS) as WireProvider[];
    for (const provider of chosen) {
      wireProvider(ctx, provider, content, skillDest);
    }
    generateAgents(ctx, content, chosen);
    ensureScratchIgnored(ctx);
  });
  return run.ok ? ok(ctx.actions) : err(run.error);
}
