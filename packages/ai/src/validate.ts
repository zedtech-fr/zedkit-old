// Original work by the same author.
import { existsSync, lstatSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { tryCatch } from "@zedtech/zedkit-core";
import type { Action } from "./install.js";
import { hasMarker } from "./generate.js";
import { loadPolicy } from "./route.js";
import { availabilityOf, isCheckedUnchanged, museGenerated, resolvedAgentText, sourceNames, syncAgents } from "./sync.js";
import { adoptRel, kitDir, kitUniverse, readManifest } from "./kit.js";
import { parseFrontmatter } from "./frontmatter.js";
import { HEADER_KEYS, KIT_HEADERS, SIDECAR, parseAgentHeader, readSidecar } from "./agent-header.js";
import { checkTokenomics, parseTokenomics } from "./tokenomics.js";
import { lensClosureIssues } from "./lenses.js";
import { danglingKitRefs, skillRefFiles } from "./skill-refs.js";
import { resolveConditionals, withoutMarkers, type Availability } from "./conditional.js";

export type Issue = { path: string; message: string };

const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_NAME = 64;
const MAX_DESCRIPTION = 1024;

function read(path: string): string {
  return readFileSync(path, "utf8");
}

function dirsIn(path: string): string[] {
  if (!existsSync(path)) return [];
  return readdirSync(path).filter((entry) => statSync(join(path, entry)).isDirectory());
}

function mdFiles(dir: string): string[] {
  return readdirSync(dir).filter((file) => file.endsWith(".md") && !file.endsWith(".kit.md"));
}

function checkName(name: unknown, expected: string, path: string, issues: Issue[]): void {
  if (name !== expected) {
    issues.push({ path, message: `name must equal "${expected}" (got ${JSON.stringify(name)})` });
  }
  if (!NAME.test(expected) || expected.length > MAX_NAME) {
    issues.push({ path, message: `name must be lowercase-hyphen, at most ${MAX_NAME} characters` });
  }
}

// True when `description:` is a plain or quoted scalar that fits on one line.
// A block scalar (`>`, `|`) can be shown literally in an agent list, and a
// continuation line is just as invisible to simple parsers.
function isSingleLineDescription(raw: string): boolean {
  const lines = raw.split("\n");
  const at = lines.findIndex((line) => /^description:/.test(line));
  if (at < 0) return true;
  const value = (lines[at] ?? "").slice("description:".length).trim();
  const next = lines[at + 1];
  return value !== "" && !/^[>|]/.test(value) && !(next !== undefined && /^[ \t]+\S/.test(next));
}

function checkDescription(value: unknown, path: string, issues: Issue[]): void {
  if (typeof value !== "string" || value.trim() === "") {
    issues.push({ path, message: "description is required and must be a non-empty string" });
  } else if (value.length > MAX_DESCRIPTION) {
    issues.push({ path, message: `description is ${value.length} characters (max ${MAX_DESCRIPTION})` });
  }
}

function parseText(rel: string, text: string, issues: Issue[]): { data: Record<string, unknown>; raw: string } | undefined {
  const parsed = parseFrontmatter(text);
  if (!parsed.ok) {
    issues.push({ path: rel, message: parsed.error.message });
    return undefined;
  }
  return parsed.value;
}

function checkSkill(root: string, name: string, issues: Issue[]): void {
  const file = join(root, "skills", name, "SKILL.md");
  const path = relative(root, file);
  if (!existsSync(file)) {
    issues.push({ path: join("skills", name), message: "skill folder has no SKILL.md" });
    return;
  }
  const front = parseText(path, read(file), issues);
  if (!front) return;
  checkName(front.data.name, name, path, issues);
  checkDescription(front.data.description, path, issues);
  // No single-line check here, deliberately: skill descriptions are read
  // through YAML-aware loaders (this kit's `yaml` parse, providers), so a
  // folded block always renders single-line. The raw-text rule exists only
  // for agent/command lists shown by naive parsers. See #484.
}

// `strict_headers: true` in the project's tokenomics.md: every agent needs a full header.
function strictHeaders(root: string): boolean {
  const file = join(root, "tokenomics.md");
  if (!existsSync(file)) return false;
  const layer = parseTokenomics(read(file));
  return layer.ok && layer.value.strict_headers === true;
}

function toolList(value: unknown): string[] {
  const items = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  return items.map((item) => String(item).trim());
}

const WRITE_TOOLS = ["Write", "Edit", "NotebookEdit"];

// The header contract lives in `agents.meta.json`, never in agent frontmatter:
// a tool drops (silently) an agent whose frontmatter has a key it does not know.
function checkNoHeaderKeys(data: Record<string, unknown>, path: string, issues: Issue[]): void {
  const found = [...HEADER_KEYS, "needs", "kind"].filter((key) => data[key] !== undefined);
  if (found.length > 0) {
    issues.push({ path, message: `${found.join(", ")} must not be in the agent file (some tools skip agents with unknown keys); put the header in ${SIDECAR}` });
  }
}

// The sidecar (role, default_needs, kinds, default_kind per agent). A missing
// entry is fine unless strict: kit-name agents fall back to the shipped
// table. An agent that cannot be invoked as `build` must also deny the write
// tools in its own file, the one enforcement every tool honors.
function checkSidecar(root: string, strict: boolean, issues: Issue[]): void {
  const sidecar = readSidecar(root);
  if (!sidecar.ok) {
    issues.push({ path: SIDECAR, message: sidecar.error.message.replace(`${SIDECAR}: `, "") });
    return;
  }
  const dir = join(root, "agents");
  const installed = new Set(existsSync(dir) ? mdFiles(dir).map((file) => file.replace(/\.md$/, "")) : []);
  for (const [name, entry] of Object.entries(sidecar.value)) {
    const path = SIDECAR;
    if (!installed.has(name) && !KIT_HEADERS[name]) {
      issues.push({ path, message: `${name}: no agents/${name}.md in this directory` });
    }
    for (const message of parseAgentHeader(entry, true).issues) issues.push({ path, message: `${name}: ${message}` });
    const kinds = entry.kinds;
    if (Array.isArray(kinds) && kinds.length > 0 && !kinds.includes("build") && installed.has(name)) {
      const file = join(dir, `${name}.md`);
      if (hasMarker(read(file))) continue;
      const denied = toolList(readDenied(file));
      if (!WRITE_TOOLS.every((tool) => denied.includes(tool))) {
        issues.push({ path: join("agents", `${name}.md`), message: `kinds has no build in ${SIDECAR}, so the file must set disallowedTools: ${WRITE_TOOLS.join(", ")}` });
      }
    }
  }
  if (strict) {
    for (const name of installed) {
      if (hasMarker(read(join(dir, `${name}.md`)))) continue;
      if (sidecar.value[name] === undefined) issues.push({ path: SIDECAR, message: `${name}: no header (strict_headers is on)` });
    }
  }
}

function readDenied(file: string): unknown {
  const front = parseFrontmatter(read(file));
  return front.ok ? front.value.data.disallowedTools : undefined;
}

function checkAgent(root: string, file: string, issues: Issue[]): void {
  const path = join("agents", file);
  const rawText = read(join(root, path));
  // Marked files are a provider dialect (Muse), not the portable source.
  if (hasMarker(rawText)) return;
  const front = parseText(path, rawText, issues);
  if (!front) return;
  const { data, raw } = front;
  checkName(data.name, file.replace(/\.md$/, ""), path, issues);
  checkDescription(data.description, path, issues);
  if (!isSingleLineDescription(raw)) {
    issues.push({ path, message: "description must be a single line (no `>` or `|` block, no continuation lines)" });
  }
  // An id the tool does not know falls back silently, and the kit is
  // tool-agnostic: only `inherit` is portable.
  if (data.model !== undefined && data.model !== "inherit") {
    issues.push({ path, message: 'model must be omitted or "inherit" (pin a model in your project, after listing what your tool accepts)' });
  }
  // `readonly` is a single-tool field, and at least one tool drops the
  // whole definition when it sees an unknown key. Read-only stays in the
  // prompt body plus `disallowedTools`, which every tool tolerates.
  if (data.readonly !== undefined) {
    issues.push({ path, message: "readonly is not portable: some tools skip agent files that set it (use disallowedTools instead)" });
  }
  checkNoHeaderKeys(data, path, issues);
}

function checkCommand(root: string, file: string, skills: Set<string>, issues: Issue[]): void {
  const path = join("commands", file);
  const base = file.replace(/\.md$/, "");
  if (!NAME.test(base) || base.length > MAX_NAME) {
    issues.push({ path, message: `name must be lowercase-hyphen, at most ${MAX_NAME} characters` });
  }
  const text = read(join(root, path));
  const front = parseText(path, text, issues);
  if (!front) return;
  checkDescription(front.data.description, path, issues);
  if (!isSingleLineDescription(front.raw)) {
    issues.push({ path, message: "description must be a single line (no `>` or `|` block, no continuation lines)" });
  }
  // Commands have no routing path: they always run on the session model.
  if (front.data.model !== undefined && front.data.model !== "inherit") {
    issues.push({ path, message: 'model must be omitted or "inherit" (commands always use the session model)' });
  }
  // A command runs a skill by name: it must name at least one installed one.
  const names = [...skills].filter((name) => text.includes(`\`${name}\``));
  if (names.length === 0) {
    issues.push({ path, message: "names no installed skill (a command runs a `skill` by name)" });
  }
}

function checkLineEndings(root: string, issues: Issue[]): void {
  const entries = readdirSync(root, { recursive: true, encoding: "utf8" });
  for (const entry of entries) {
    const full = join(root, entry);
    if (entry.endsWith(".md") && !entry.endsWith(".kit.md") && statSync(full).isFile() && read(full).includes("\r")) {
      issues.push({ path: entry, message: "CR found: use LF line endings" });
    }
  }
}

// Markdown link targets outside fenced blocks, in order, duplicates kept.
function linkTargets(text: string): string[] {
  const targets: string[] = [];
  let fenced = false;
  for (const line of text.split("\n")) {
    if (/^\s*(`{3,}|~{3,})/.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    for (const match of line.matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+[^)]*)?\)/g)) {
      targets.push(match[1] ?? "");
    }
  }
  return targets;
}

// Flag relative links that resolve nowhere (skip web, mailto, #anchor, fenced).
// Every skill dir counts, kit or repo-authored: a broken link in an
// agent-facing skill is a defect whoever wrote it.
function checkLinks(root: string, kit: string, issues: Issue[]): void {
  const universe = kitUniverse(kit);
  const entries = readdirSync(root, { recursive: true, encoding: "utf8" });
  for (const entry of entries) {
    if (!entry.endsWith(".md") || entry.endsWith(".kit.md")) continue;
    const [top, name, nested] = entry.split(sep);
    const base = (name ?? "").replace(/\.md$/, "");
    const scoped =
      (entry === "personas.md" && existsSync(join(kit, "personas.template.md"))) ||
      (top === "skills" && nested !== undefined) ||
      (nested === undefined &&
        ((top === "agents" && universe.agents.has(base)) || (top === "commands" && universe.commands.has(base))));
    if (!scoped) continue;
    const full = join(root, entry);
    if (!statSync(full).isFile()) continue;
    const seen = new Set<string>();
    for (const target of linkTargets(read(full))) {
      if (/^(#|https?:\/\/|mailto:)/.test(target) || seen.has(target)) continue;
      seen.add(target);
      if (!existsSync(join(dirname(full), target.split(/[?#]/)[0] ?? ""))) {
        issues.push({ path: entry, message: `broken link to "${target}" (no such file)` });
      }
    }
  }
}

const LADDER_SKILLS = ["plan", "implement", "review", "ponytail-review"];

// The ponytail ladder must survive in the skills that ask it and in the
// template every setup inherits. Only checked where the file exists, so
// minimal or foreign layouts are unaffected.
function checkLadder(root: string, issues: Issue[]): void {
  for (const name of LADDER_SKILLS) {
    const file = join(root, "skills", name, "SKILL.md");
    if (existsSync(file) && !read(file).toLowerCase().includes("ladder")) {
      issues.push({
        path: relative(root, file),
        message: "must state the ponytail ladder (regression: the 7 questions vanished)",
      });
    }
  }
  const template = join(root, "AGENTS.template.md");
  if (existsSync(template) && !read(template).toLowerCase().includes("ladder")) {
    issues.push({
      path: "AGENTS.template.md",
      message: "must state the ponytail ladder (every setup inherits this file)",
    });
  }
}

function checkManifest(root: string, issues: Issue[]): void {
  if (!existsSync(join(root, "kit.json"))) return;
  const manifest = readManifest(root);
  if (!manifest.ok) {
    issues.push({ path: "kit.json", message: manifest.error.message });
    return;
  }
  const skills = new Set(dirsIn(join(root, "skills")));
  const agents = new Set(namesIn(root, "agents"));
  for (const [preset, names] of Object.entries(manifest.value.presets)) {
    for (const name of names === "*" ? [] : names) {
      if (!skills.has(name)) issues.push({ path: "kit.json", message: `preset "${preset}" lists missing skill "${name}"` });
    }
  }
  for (const name of manifest.value.agents) {
    if (!agents.has(name)) issues.push({ path: "kit.json", message: `lists missing agent "${name}"` });
  }
  const commands = new Set(namesIn(root, "commands"));
  for (const name of manifest.value.commands ?? []) {
    if (!commands.has(name)) issues.push({ path: "kit.json", message: `lists missing command "${name}"` });
  }
}

function namesIn(root: string, dir: string): string[] {
  const full = join(root, dir);
  if (!existsSync(full)) return [];
  return mdFiles(full).map((file) => file.replace(/\.md$/, ""));
}

// Reference closure: refs must resolve in their demanded kind; bare backticked
// and hyphenated whole words match any kind in kit-origin files only.

function checkSkillRefs(root: string, skills: Set<string>, kit: string, issues: Issue[]): void {
  const agents = namesIn(root, "agents");
  const commands = namesIn(root, "commands");
  const universe = kitUniverse(kit);
  const installedSkills = new Set(skills);
  const installed = { skills: installedSkills, agents: new Set(agents), commands: new Set(commands) };
  const shadowed = new Set<string>();
  for (const name of skills) {
    if (!name.startsWith("zk-")) continue;
    installedSkills.add(name.slice("zk-".length));
    shadowed.add(join("skills", name.slice("zk-".length), "SKILL.md"));
  }
  for (const dir of ["agents", "commands"]) {
    const full = join(root, dir);
    if (!existsSync(full)) continue;
    for (const file of readdirSync(full).filter((entry) => entry.endsWith(".kit.md"))) {
      shadowed.add(join(dir, file.replace(/\.kit\.md$/, ".md")));
    }
  }
  const isKitOrigin = (path: string): boolean => {
    if (shadowed.has(path)) return false;
    const [top, name] = path.split(sep);
    if (top === "skills" && name !== undefined) {
      const base = name.startsWith("zk-") ? name.slice("zk-".length) : name;
      return universe.skills.has(base);
    }
    if (top === "agents" && name !== undefined) return universe.agents.has(name.replace(/\.md$/, ""));
    if (top === "commands" && name !== undefined) return universe.commands.has(name.replace(/\.md$/, ""));
    return false;
  };
  const files = skillRefFiles(root, [...skills], agents, commands, isKitOrigin);
  for (const issue of danglingKitRefs(files, installed, universe)) issues.push(issue);
  // Top-level kit docs: personas.md ships from a kit template, so its
  // references close like any kit file. THIRD_PARTY_NOTICES.md names every
  // vendored skill by design (attribution, not invocation) and is exempt;
  // any other top-level file is the user's own and unscanned.
  const personas = join(root, "personas.md");
  if (existsSync(personas) && existsSync(join(kit, "personas.template.md"))) {
    const text = readFileSync(personas, "utf8");
    const docs = [{ path: "personas.md", text, kitOrigin: true }];
    for (const issue of danglingKitRefs(docs, installed, universe)) issues.push(issue);
  }
}

function checkDuplicateSkillNames(root: string, skills: Set<string>, issues: Issue[]): void {
  const claimants = new Map<string, string[]>();
  for (const name of [...skills].sort()) {
    const file = join(root, "skills", name, "SKILL.md");
    const raw = tryCatch(() => readFileSync(file, "utf8"));
    if (!raw.ok) continue;
    const front = parseFrontmatter(raw.value);
    if (!front.ok || typeof front.value.data.name !== "string") continue;
    const paths = claimants.get(front.value.data.name) ?? [];
    paths.push(join("skills", name, "SKILL.md"));
    claimants.set(front.value.data.name, paths);
  }
  for (const [claimed, paths] of [...claimants.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    if (paths.length < 2) continue;
    const ordered = [...paths].sort();
    const sidecar = ordered.find((path) => (path.split(sep)[1] ?? "").startsWith("zk-"));
    if (sidecar !== undefined) {
      const others = ordered.filter((path) => path !== sidecar);
      if (others.length > 0) {
        issues.push({
          path: sidecar,
          message: `duplicate skill name "${claimed}" (also claimed by ${others.join(", ")}); re-run setup to refresh the sidecar, or merge it into your copy and delete it`,
        });
      }
      continue;
    }
    const [first, ...rest] = ordered;
    for (const path of rest) {
      issues.push({
        path,
        message: `duplicate skill name "${claimed}" (also claimed by ${first}); give each skill its own name`,
      });
    }
  }
}

function collect(root: string, kit: string): Issue[] {
  const issues: Issue[] = [];
  const skills = new Set(dirsIn(join(root, "skills")));
  for (const name of skills) checkSkill(root, name, issues);
  checkDuplicateSkillNames(root, skills, issues);
  const agentsDir = join(root, "agents");
  if (existsSync(agentsDir)) {
    for (const file of mdFiles(agentsDir)) {
      checkAgent(root, file, issues);
    }
  }
  checkSidecar(root, strictHeaders(root), issues);
  const commandsDir = join(root, "commands");
  if (existsSync(commandsDir)) {
    for (const file of mdFiles(commandsDir)) {
      checkCommand(root, file, skills, issues);
    }
  }
  checkManifest(root, issues);
  checkPolicy(root, issues);
  checkLadder(root, issues);
  checkLineEndings(root, issues);
  checkSkillRefs(root, skills, kit, issues);
  checkLenses(root, skills, issues);
  checkLinks(root, kit, issues);
  return issues;
}

// The project policy file, when present. The shipped defaults and the stub
// (`tokenomics.defaults.md`, `tokenomics.template.md`) are kit data, not a
// project file, so only `tokenomics.md` is checked here.
function checkPolicy(root: string, issues: Issue[]): void {
  const file = join(root, "tokenomics.md");
  if (!existsSync(file)) return;
  for (const message of checkTokenomics(read(file))) issues.push({ path: "tokenomics.md", message });
}

function checkLenses(root: string, skills: Set<string>, issues: Issue[]): void {
  const file = join(root, "skills", "review", "lenses.md");
  if (!existsSync(file)) return;
  const installed = new Set([...skills, ...namesIn(root, "agents")]);
  for (const issue of lensClosureIssues("skills/review/lenses.md", read(file), installed)) {
    issues.push(issue);
  }
}

/**
 * Check a directory laid out as `skills/<name>/SKILL.md`, `agents/<name>.md`,
 * `commands/<name>.md` and optionally `kit.json`. Returns every problem
 * found; empty means valid. An unreadable entry (dangling symlink,
 * permissions) is reported as a problem instead of throwing. `kit`
 * locates the bundled kit for the reference universe (defaults to this
 * package's kit); an unreadable kit disables the /name, backticked and
 * whole-word forms, while Skill-tool calls still count.
 */
export function validateKit(root: string, kit: string = kitDir()): Issue[] {
  if (!existsSync(root)) {
    return [{ path: root, message: "directory does not exist" }];
  }
  const result = tryCatch(() => collect(root, kit));
  return result.ok ? result.value : [{ path: root, message: `cannot read: ${result.error.message}` }];
}

function isRealDir(path: string): boolean {
  const stat = tryCatch(() => lstatSync(path));
  return stat.ok && stat.value.isDirectory();
}

function linkState(path: string): "missing" | "dangling" | "link" | "dir" | "file" {
  const stat = tryCatch(() => lstatSync(path));
  if (!stat.ok) return "missing";
  if (stat.value.isSymbolicLink()) return existsSync(path) ? "link" : "dangling";
  if (stat.value.isDirectory()) return "dir";
  return "file";
}

function checkDanglingLink(projectRoot: string, path: string, issues: Issue[]): void {
  if (linkState(path) !== "dangling") return;
  issues.push({
    path: relative(projectRoot, path),
    message: "link points at a removed target: re-run init to restore it",
  });
}

function checkLayerSkills(projectRoot: string, source: string, layer: string, issues: Issue[]): void {
  const from = join(source, "skills");
  const to = join(projectRoot, layer, "skills");
  if (!isRealDir(from) || !existsSync(to)) return;
  const stat = tryCatch(() => lstatSync(to));
  if (!stat.ok) return;
  if (stat.value.isSymbolicLink()) return;
  if (!stat.value.isDirectory()) return;
  for (const name of dirsIn(from)) {
    const aliases = [name, `zk-${name}`];
    if (name.startsWith("zk-")) aliases.push(name.slice(3));
    if (aliases.some((alias) => existsSync(join(to, alias)))) continue;
    issues.push({
      path: relative(projectRoot, join(to, name)),
      message: `kit skill "${name}" is unreachable from ${layer}/skills`,
    });
  }
}

function checkLayerCopies(projectRoot: string, source: string, layer: string, kind: string, issues: Issue[]): void {
  const from = join(source, kind);
  const to = join(projectRoot, layer, kind);
  if (!isRealDir(from) || !isRealDir(to)) return;
  for (const file of readdirSync(from).filter((f) => f.endsWith(".md") && !f.endsWith(".kit.md"))) {
    const want = relative(projectRoot, join(from, file));
    const sidecar = join(to, adoptRel(file));
    const target = existsSync(sidecar) ? sidecar : join(to, file);
    if (!existsSync(target)) {
      issues.push({ path: relative(projectRoot, target), message: `copy missing: copy it from ${want} or re-run init` });
    } else if (read(target) !== read(join(from, file))) {
      issues.push({ path: relative(projectRoot, target), message: `differs from ${want}; user copy kept` });
    }
  }
}

// The provider was wired when at least one of its layer entries exists: a
// hand-made provider folder holding only user files is not drift.
function layerWired(projectRoot: string, layer: string): boolean {
  return ["skills", "agents", "commands"].some((kind) => linkState(join(projectRoot, layer, kind)) !== "missing");
}

// Agents (both tools) and Cursor commands are written by `syncAgents`, so the
// check is a dry run of it: whatever it would change is drift. Nothing it
// reports asks to overwrite a user file; a file that is not ours stays and
// only its generated sidecar can be missing.
const SYNC_HINT = "run: npx zedkit-ai sync";

function driftMessage(action: Action): string {
  const note = action.note ?? "";
  if (action.kind === "generate" || action.kind === "link") {
    if (note.includes("replaces a copy of the kit")) return `stale copy of the kit, ${SYNC_HINT}`;
    if (note.includes("replaces a link to the source")) return `link to the source, ${SYNC_HINT} to generate the file`;
    if (note.includes("kit version beside your")) return `user file kept; ${SYNC_HINT} to write the kit version beside it`;
    if (note.includes("regenerated")) return `out of date, ${SYNC_HINT}`;
    return `missing, ${SYNC_HINT}`;
  }
  if (action.kind === "convert") return `link to .agents/agents, ${SYNC_HINT} to generate the files`;
  return `${note || "generated file with no source"}, ${SYNC_HINT}`;
}

function checkGenerated(projectRoot: string, source: string, issues: Issue[]): void {
  const providers = [".cursor", ".claude"]
    .filter((layer) => layerWired(projectRoot, layer))
    .map((layer) => layer.slice(1));
  if (museGenerated(projectRoot)) providers.push("muse");
  if (providers.length === 0) return;
  // A policy that does not parse is reported by the policy check, not here.
  const policy = loadPolicy(source);
  if (!policy.ok) return;
  const actions: Action[] = [];
  const names = (dir: string): string[] =>
    isRealDir(join(source, dir)) ? mdFiles(join(source, dir)).map((f) => f.slice(0, -3)) : [];
  // readdir follows a kit dir-symlink; isRealDir does not, and empty names
  // make every generated Cursor file look like "source agent removed".
  const agentNames = sourceNames(source) ?? names("agents");
  const avail = availabilityOf(source, agentNames);
  syncAgents(
    {
      dest: projectRoot,
      write: false,
      providers,
      policy: policy.value,
      agentsDir: source,
      names: agentNames,
      avail,
      commands: {
        names: names("commands"),
        source: (name) => {
          const text = tryCatch(() => read(join(source, "commands", `${name}.md`)));
          return text.ok ? text.value : undefined;
        },
      },
      source: (name) => resolvedAgentText(projectRoot, name, avail),
    },
    actions,
  );
  for (const action of actions.filter((a) => !isCheckedUnchanged(a))) {
    issues.push({ path: action.path, message: driftMessage(action) });
  }
}

function checkClaudeLayer(projectRoot: string, source: string, issues: Issue[]): void {
  if (!existsSync(join(projectRoot, ".claude")) || !layerWired(projectRoot, ".claude")) return;
  for (const kind of ["skills", "commands"]) {
    const entry = join(projectRoot, ".claude", kind);
    if (linkState(entry) === "missing") {
      issues.push({
        path: relative(projectRoot, entry),
        message: `link missing: re-run init to restore it from ${relative(projectRoot, join(source, kind))}`,
      });
    } else {
      checkDanglingLink(projectRoot, entry, issues);
    }
  }
  checkDanglingLink(projectRoot, join(projectRoot, ".claude", "agents"), issues);
  checkLayerCopies(projectRoot, source, ".claude", "commands", issues);
  checkLayerSkills(projectRoot, source, ".claude", issues);
  const pointer = join(projectRoot, "CLAUDE.md");
  const state = linkState(pointer);
  if (state === "dangling") {
    checkDanglingLink(projectRoot, pointer, issues);
  } else if (state === "missing") {
    const agentsMd = tryCatch(() => statSync(join(projectRoot, "AGENTS.md")));
    if (agentsMd.ok && agentsMd.value.isFile()) {
      issues.push({ path: "CLAUDE.md", message: "link missing: re-run init to restore it from AGENTS.md" });
    }
  }
  // A real CLAUDE.md is the user's own and is skipped silently.
}

/**
 * Compare the provider layers against the shared `source` (usually the
 * project's `.agents/`). Real-file copies (Cursor agents/commands, and the
 * same entries under `.claude/` when they are real dirs) go stale when the
 * source changes, and init never overwrites them: reports each missing or
 * drifted copy. A kit sidecar (`*.kit.md`) matching the source means the
 * user file may differ. A claude layer entry deleted after install, or any
 * provider link pointing at a removed target, is reported with a re-run
 * hint; nothing here ever asks to overwrite a user file. Resolving links
 * and missing folders cannot drift and are skipped silently, as are extra
 * files on the provider side (the user's own) and a hand-made provider
 * folder with no layer entries. Also flags kit skills that a real
 * `skills` directory on either layer does not expose. Paths are relative
 * to `projectRoot`.
 */
export function checkDrift(projectRoot: string, source: string): Issue[] {
  const run = tryCatch(() => {
    const issues: Issue[] = [];
    checkGenerated(projectRoot, source, issues);
    checkDanglingLink(projectRoot, join(projectRoot, ".cursor", "skills"), issues);
    checkLayerSkills(projectRoot, source, ".cursor", issues);
    checkClaudeLayer(projectRoot, source, issues);
    return issues;
  });
  return run.ok ? run.value : [{ path: projectRoot, message: `cannot check drift: ${run.error.message}` }];
}

/**
 * Reference closure for the kit-written root docs: the AGENTS.md the
 * installer writes from the kit template, resolved against the installed
 * sets read from `source` (the project's `.agents/` dir). Verbatim
 * marker-stripped-or-resolved template lines count as kit-written — old
 * installs and the appended ladder match by line too — while user edits
 * and additions are skipped. CLAUDE.md is never scanned: a link carries
 * the same bytes as AGENTS.md, a real file is the user's own. Paths are
 * relative to `projectRoot`.
 */
export function checkKitDocs(projectRoot: string, source: string, kit: string = kitDir()): Issue[] {
  const run = tryCatch(() => {
    const agentsMd = join(projectRoot, "AGENTS.md");
    const stat = tryCatch(() => statSync(agentsMd));
    if (!stat.ok || !stat.value.isFile()) return [];
    const template = tryCatch(() => readFileSync(join(kit, "AGENTS.template.md"), "utf8"));
    if (!template.ok) return [];
    const skills = new Set(dirsIn(join(source, "skills")));
    const avail: Availability = {
      skills,
      agents: new Set(namesIn(source, "agents")),
      commands: new Set(namesIn(source, "commands")),
    };
    const resolved = tryCatch(() => resolveConditionals(template.value, avail));
    if (!resolved.ok) return [];
    // Verbatim lines of either the marker-stripped or the resolved template
    // count as kit-written: old installs match the stripped text (so stale
    // references still fail), fresh installs match the resolved text.
    const kitLines = new Set(
      `${withoutMarkers(template.value)}\n${resolved.value}`
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== ""),
    );
    const text = readFileSync(agentsMd, "utf8");
    const kitText = text
      .split("\n")
      .filter((line) => kitLines.has(line.trim()))
      .join("\n");
    const universe = kitUniverse(kit);
    const files = [{ path: "AGENTS.md", text: kitText, kitOrigin: true }];
    return danglingKitRefs(files, avail, universe);
  });
  return run.ok ? run.value : [];
}

// Flag `](<…>)` placeholder links in installed root docs and `.agents`
// files; kit templates, fenced blocks and symlinks are exempt.
export function checkPlaceholders(projectRoot: string, source: string): Issue[] {
  const run = tryCatch(() => {
    const issues: Issue[] = [];
    const scan = (file: string, rel: string): void => {
      if (linkState(file) !== "file") return;
      const seen = new Set<string>();
      for (const target of linkTargets(read(file))) {
        if (!target.startsWith("<") || seen.has(target)) continue;
        seen.add(target);
        issues.push({ path: rel, message: `placeholder link to "${target}" (replace <...> with a real path)` });
      }
    };
    for (const name of ["AGENTS.md", "CLAUDE.md"]) scan(join(projectRoot, name), name);
    if (existsSync(source)) {
      for (const entry of readdirSync(source, { recursive: true, encoding: "utf8" })) {
        if (!entry.endsWith(".md") || entry.endsWith(".kit.md") || entry.endsWith(".template.md") || entry.endsWith(".defaults.md")) continue;
        scan(join(source, entry), relative(projectRoot, join(source, entry)));
      }
    }
    return issues;
  });
  return run.ok ? run.value : [];
}
