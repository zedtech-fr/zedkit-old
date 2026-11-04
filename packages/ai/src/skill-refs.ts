// Original work by the same author.
import { existsSync, readFileSync } from "node:fs";
import { join, sep } from "node:path";
import { withoutMarkers } from "./conditional.js";

const NAME = "[a-z0-9]+(?:-[a-z0-9]+)*";

// Host slash commands and filesystem roots share the /name shape.
// shortcut: denylist, extend when a skill uses a new non-skill /name.
const NOT_SKILLS = new Set(["plugin", "reload-plugins", "tmp", "ask", "improve"]);

export type SkillRefIssue = { path: string; message: string };

/** Names passed to the Skill tool: the author asserts these are skills. */
function toolRefNames(text: string): string[] {
  const names = new Set<string>();
  const tool = new RegExp(
    `Skill tool (?:with|twice, for)\\s+["'\`](${NAME})["'\`](?:\\s+and\\s+["'\`](${NAME})["'\`])?`,
    "gu",
  );
  for (const match of withoutMarkers(text).matchAll(tool)) {
    if (match[1]) names.add(match[1]);
    if (match[2]) names.add(match[2]);
  }
  return [...names];
}

/** /command names: ambiguous with app routes, so callers gate by universe. */
function slashRefNames(text: string): string[] {
  const names = new Set<string>();
  // `/name`, `` `/name` ``, or `` `/name extra` ``. Not `` `file`/segment ``.
  const slash = new RegExp(`(?:^|[\\s(["'])\`?\\/(${NAME})(?![A-Za-z0-9_/-])`, "gmu");
  for (const match of withoutMarkers(text).matchAll(slash)) {
    const name = match[1];
    if (name && !NOT_SKILLS.has(name)) names.add(name);
  }
  return [...names];
}

/** Skill names a file tells the agent to run: Skill tool calls and /commands. */
export function skillRefNames(text: string): string[] {
  return [...new Set([...toolRefNames(text), ...slashRefNames(text)])];
}

/** "skill `x`" / "agent `x`" pairs, gated by that kind's universe. */
function kindWordRefNames(text: string, universe: RefUniverse): ["skill" | "agent", string][] {
  const names: ["skill" | "agent", string][] = [];
  const labeled = new RegExp(`\\b(skill|agent)\\s+\`(${NAME})\``, "gu");
  for (const [, word, name] of withoutMarkers(text).matchAll(labeled)) {
    if (name && (word === "skill" ? universe.skills : universe.agents).has(name)) names.push([word as "skill" | "agent", name]);
  }
  return names;
}

export type RefFile = { path: string; text: string; kitOrigin: boolean };

export function skillRefFiles(
  root: string,
  skills: readonly string[],
  agents: readonly string[],
  commands: readonly string[],
  isKitOrigin: (path: string) => boolean = () => true,
): RefFile[] {
  const files: RefFile[] = [];
  const add = (path: string): void => {
    const full = join(root, path);
    if (!existsSync(full)) return;
    files.push({ path, text: readFileSync(full, "utf8"), kitOrigin: isKitOrigin(path) });
  };
  for (const name of skills) add(join("skills", name, "SKILL.md"));
  for (const name of agents) add(join("agents", `${name}.md`));
  for (const name of commands) add(join("commands", `${name}.md`));
  return files;
}

/** Hyphenated universe names as whole words (single-word names stay backtick-only). Names match NAME: no escaping. */
export function wordRefNames(text: string, universe: RefUniverse): string[] {
  const hyphenated = [...universe.skills, ...universe.agents, ...universe.commands].filter((name) =>
    name.includes("-"),
  );
  if (hyphenated.length === 0) return [];
  const words = new RegExp(`(?<![A-Za-z0-9-])(${hyphenated.join("|")})(?![A-Za-z0-9-])`, "gu");
  const names = new Set<string>();
  for (const match of withoutMarkers(text).matchAll(words)) {
    if (match[1]) names.add(match[1]);
  }
  return [...names];
}

/** Bare backticked tokens: possible references, filtered against the kit universe by the caller. */
export function backtickedRefNames(text: string): string[] {
  text = withoutMarkers(text);
  const names = new Set<string>();
  const backticked = new RegExp(`\`(${NAME})\``, "gu");
  for (const match of text.matchAll(backticked)) {
    if (match[1]) names.add(match[1]);
  }
  return [...names];
}

export type RefUniverse = {
  skills: ReadonlySet<string>;
  agents: ReadonlySet<string>;
  commands: ReadonlySet<string>;
};

/** Kind of a universe name; skill wins ties (most references name skills). */
function kindOf(name: string, universe: RefUniverse): "skill" | "agent" | "command" | undefined {
  if (universe.skills.has(name)) return "skill";
  if (universe.agents.has(name)) return "agent";
  if (universe.commands.has(name)) return "command";
  return undefined;
}

/** Refs whose demanded kind is missing (Skill-tool/"skill `x`" = skill, "agent `x`" = agent, /name = command if the kit defines one, else any kind; bare backticked/hyphenated words match any kind in kit-origin files; /self satisfied). */
export function danglingKitRefs(
  files: readonly RefFile[],
  installed: RefUniverse,
  universe: RefUniverse,
): SkillRefIssue[] {
  const issues: SkillRefIssue[] = [];
  const all = new Set([...installed.skills, ...installed.agents, ...installed.commands]);
  for (const file of files) {
    const seen = new Set<string>();
    const report = (name: string, has: boolean, kind: "skill" | "agent" | "command"): void => {
      if (has || seen.has(name)) return;
      seen.add(name);
      issues.push({ path: file.path, message: `references ${kind} "${name}", which this preset does not install` });
    };
    for (const name of toolRefNames(file.text)) report(name, installed.skills.has(name), "skill");
    const self = file.path.split(sep)[1]?.replace(/\.md$/, "");
    for (const name of slashRefNames(file.text)) {
      if (universe.commands.has(name) && name !== self) {
        report(name, installed.commands.has(name), "command");
      } else {
        const kind = kindOf(name, universe);
        if (kind !== undefined) report(name, all.has(name), kind);
      }
    }
    for (const [word, name] of kindWordRefNames(file.text, universe)) report(name, installed[`${word}s`].has(name), word);
    if (!file.kitOrigin) continue;
    for (const name of backtickedRefNames(file.text)) {
      const kind = kindOf(name, universe);
      if (kind !== undefined) report(name, all.has(name), kind);
    }
    for (const name of wordRefNames(file.text, universe)) report(name, all.has(name), kindOf(name, universe) ?? "skill");
  }
  return issues;
}
