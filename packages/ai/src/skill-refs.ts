// Original work by the same author.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { withoutMarkers } from "./conditional.js";

const NAME = "[a-z0-9]+(?:-[a-z0-9]+)*";

// Host slash commands and filesystem roots share the /name shape.
// shortcut: denylist, extend when a skill uses a new non-skill /name.
const NOT_SKILLS = new Set(["plugin", "reload-plugins", "tmp", "ask", "improve"]);

export type SkillRefIssue = { path: string; message: string };

/** Names passed to the Skill tool: the author asserts these are skills. */
export function toolRefNames(text: string): string[] {
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
export function slashRefNames(text: string): string[] {
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

/**
 * Refs whose name is installed in no kind. Skill-tool calls count
 * everywhere (the author asserts a skill); /names and bare backticked
 * tokens only when they name the kit universe (/routes and prose words
 * are not references). Backticked tokens additionally require a
 * kit-origin file, where a kit name is a reference by convention — in
 * user-authored files the same token is an ordinary word. `installed` is
 * the union of installed skill, agent and command names.
 */
export function danglingKitRefs(
  files: readonly RefFile[],
  installed: ReadonlySet<string>,
  universe: RefUniverse,
): SkillRefIssue[] {
  const issues: SkillRefIssue[] = [];
  for (const file of files) {
    const seen = new Set<string>();
    const report = (name: string): void => {
      if (installed.has(name) || seen.has(name)) return;
      seen.add(name);
      issues.push({
        path: file.path,
        message: `references ${kindOf(name, universe) ?? "skill"} "${name}", which this preset does not install`,
      });
    };
    for (const name of toolRefNames(file.text)) report(name);
    for (const name of slashRefNames(file.text)) {
      if (kindOf(name, universe) !== undefined) report(name);
    }
    if (!file.kitOrigin) continue;
    for (const name of backtickedRefNames(file.text)) {
      if (kindOf(name, universe) !== undefined) report(name);
    }
  }
  return issues;
}
