// Original work by the same author.
import { existsSync, lstatSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { tryCatch } from "@zedtech/zedkit-core";
import { readManifest } from "./kit.js";
import { parseFrontmatter } from "./frontmatter.js";
import { lensClosureIssues } from "./lenses.js";
import { danglingSkillRefs, skillRefFiles } from "./skill-refs.js";

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

function checkSkill(root: string, name: string, issues: Issue[]): void {
  const file = join(root, "skills", name, "SKILL.md");
  const path = relative(root, file);
  if (!existsSync(file)) {
    issues.push({ path: relative(root, join(root, "skills", name)), message: "skill folder has no SKILL.md" });
    return;
  }
  const parsed = parseFrontmatter(read(file));
  if (!parsed.ok) {
    issues.push({ path, message: parsed.error.message });
    return;
  }
  checkName(parsed.value.data.name, name.replace(/^zk-/, ""), path, issues);
  checkDescription(parsed.value.data.description, path, issues);
  // No single-line check here, deliberately: skill descriptions are read
  // through YAML-aware loaders (this kit's `yaml` parse, providers), so a
  // folded block always renders single-line. The raw-text rule exists only
  // for agent/command lists shown by naive parsers. See #484.
}

function checkAgent(root: string, file: string, issues: Issue[]): void {
  const path = join("agents", file);
  const parsed = parseFrontmatter(read(join(root, path)));
  if (!parsed.ok) {
    issues.push({ path, message: parsed.error.message });
    return;
  }
  const { data, raw } = parsed.value;
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
}

function checkCommand(root: string, file: string, skills: Set<string>, issues: Issue[]): void {
  const path = join("commands", file);
  const base = file.replace(/\.md$/, "");
  if (!NAME.test(base) || base.length > MAX_NAME) {
    issues.push({ path, message: `name must be lowercase-hyphen, at most ${MAX_NAME} characters` });
  }
  const text = read(join(root, path));
  const parsed = parseFrontmatter(text);
  if (!parsed.ok) {
    issues.push({ path, message: parsed.error.message });
    return;
  }
  checkDescription(parsed.value.data.description, path, issues);
  if (!isSingleLineDescription(parsed.value.raw)) {
    issues.push({ path, message: "description must be a single line (no `>` or `|` block, no continuation lines)" });
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
  const agents = new Set(
    existsSync(join(root, "agents")) ? mdFiles(join(root, "agents")).map((f) => f.replace(/\.md$/, "")) : [],
  );
  for (const [preset, names] of Object.entries(manifest.value.presets)) {
    for (const name of names === "*" ? [] : names) {
      if (!skills.has(name)) issues.push({ path: "kit.json", message: `preset "${preset}" lists missing skill "${name}"` });
    }
  }
  for (const name of manifest.value.agents) {
    if (!agents.has(name)) issues.push({ path: "kit.json", message: `lists missing agent "${name}"` });
  }
  const commands = new Set(
    existsSync(join(root, "commands")) ? mdFiles(join(root, "commands")).map((f) => f.replace(/\.md$/, "")) : [],
  );
  for (const name of manifest.value.commands ?? []) {
    if (!commands.has(name)) issues.push({ path: "kit.json", message: `lists missing command "${name}"` });
  }
}

function namesIn(root: string, dir: string): string[] {
  const full = join(root, dir);
  if (!existsSync(full)) return [];
  return mdFiles(full).map((file) => file.replace(/\.md$/, ""));
}

// A skill, agent or command that tells the agent to run a skill must name
// one that is installed in this tree. Checked on the files present, so a
// preset that omitted the target fails the same way the full kit would.
function checkSkillRefs(root: string, skills: Set<string>, issues: Issue[]): void {
  const files = skillRefFiles(root, [...skills], namesIn(root, "agents"), namesIn(root, "commands"));
  for (const issue of danglingSkillRefs(files, skills)) issues.push(issue);
}

function collect(root: string): Issue[] {
  const issues: Issue[] = [];
  const skills = new Set(dirsIn(join(root, "skills")));
  for (const name of skills) checkSkill(root, name, issues);
  const agentsDir = join(root, "agents");
  if (existsSync(agentsDir)) {
    for (const file of mdFiles(agentsDir)) {
      checkAgent(root, file, issues);
    }
  }
  const commandsDir = join(root, "commands");
  if (existsSync(commandsDir)) {
    for (const file of mdFiles(commandsDir)) {
      checkCommand(root, file, skills, issues);
    }
  }
  checkManifest(root, issues);
  checkLadder(root, issues);
  checkLineEndings(root, issues);
  checkSkillRefs(root, skills, issues);
  checkLenses(root, skills, issues);
  return issues;
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
 * permissions) is reported as a problem instead of throwing.
 */
export function validateKit(root: string): Issue[] {
  if (!existsSync(root)) {
    return [{ path: root, message: "directory does not exist" }];
  }
  const result = tryCatch(() => collect(root));
  return result.ok ? result.value : [{ path: root, message: `cannot read: ${result.error.message}` }];
}

function isRealDir(path: string): boolean {
  const stat = tryCatch(() => lstatSync(path));
  return stat.ok && stat.value.isDirectory();
}

function kitSidecar(file: string): string {
  return file.replace(/\.md$/, ".kit.md");
}

function checkCursorSkills(projectRoot: string, source: string, issues: Issue[]): void {
  const from = join(source, "skills");
  const to = join(projectRoot, ".cursor", "skills");
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
      message: `kit skill "${name}" is unreachable from .cursor/skills`,
    });
  }
}

/**
 * Compare the provider copies (`.cursor/agents`, `.cursor/commands`) against
 * the shared `source` (usually the project's `.agents/`). Copies are real
 * files because that provider does not follow a symlinked folder here; when
 * the source changes they go stale, and init never overwrites them. Reports
 * each missing or drifted copy. A kit sidecar (`*.kit.md`) matching the
 * source means the user file may differ. Links and missing folders cannot
 * drift and are skipped silently, as are extra files on the provider side
 * (the user's own). Also flags kit skills that a real `.cursor/skills`
 * directory does not expose. Paths are relative to `projectRoot`.
 */
export function checkDrift(projectRoot: string, source: string): Issue[] {
  const run = tryCatch(() => {
    const issues: Issue[] = [];
    for (const kind of ["agents", "commands"]) {
      const from = join(source, kind);
      const to = join(projectRoot, ".cursor", kind);
      if (!isRealDir(from) || !isRealDir(to)) continue;
      for (const file of readdirSync(from).filter((f) => f.endsWith(".md") && !f.endsWith(".kit.md"))) {
        const want = relative(projectRoot, join(from, file));
        const sidecar = join(to, kitSidecar(file));
        const target = join(to, file);
        if (existsSync(sidecar)) {
          if (read(sidecar) !== read(join(from, file))) {
            issues.push({
              path: relative(projectRoot, sidecar),
              message: `differs from ${want}; user copy kept`,
            });
          }
          continue;
        }
        if (!existsSync(target)) {
          issues.push({ path: relative(projectRoot, target), message: `copy missing: copy it from ${want} or re-run init` });
        } else if (read(target) !== read(join(from, file))) {
          issues.push({
            path: relative(projectRoot, target),
            message: `differs from ${want}; user copy kept`,
          });
        }
      }
    }
    checkCursorSkills(projectRoot, source, issues);
    return issues;
  });
  return run.ok ? run.value : [{ path: projectRoot, message: `cannot check drift: ${run.error.message}` }];
}
