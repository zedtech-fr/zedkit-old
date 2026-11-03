// Original work by the same author.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const NAME = "[a-z0-9]+(?:-[a-z0-9]+)*";

// Host slash commands and filesystem roots share the /name shape.
// shortcut: denylist, extend when a skill uses a new non-skill /name.
const NOT_SKILLS = new Set(["plugin", "reload-plugins", "tmp", "ask", "improve"]);

export type SkillRefIssue = { path: string; message: string };

/** Skill names a file tells the agent to run: Skill tool calls and /commands. */
export function skillRefNames(text: string): string[] {
  const names = new Set<string>();
  const tool = new RegExp(
    `Skill tool (?:with|twice, for)\\s+["'\`](${NAME})["'\`](?:\\s+and\\s+["'\`](${NAME})["'\`])?`,
    "gu",
  );
  for (const match of text.matchAll(tool)) {
    if (match[1]) names.add(match[1]);
    if (match[2]) names.add(match[2]);
  }
  // `/name`, `` `/name` ``, or `` `/name extra` ``. Not `` `file`/segment ``.
  const slash = new RegExp(`(?:^|[\\s(["'])\`?\\/(${NAME})(?![A-Za-z0-9_/-])`, "gmu");
  for (const match of text.matchAll(slash)) {
    const name = match[1];
    if (name && !NOT_SKILLS.has(name)) names.add(name);
  }
  return [...names];
}

export function skillRefFiles(
  root: string,
  skills: readonly string[],
  agents: readonly string[],
  commands: readonly string[],
): { path: string; text: string }[] {
  const files: { path: string; text: string }[] = [];
  const add = (path: string): void => {
    const full = join(root, path);
    if (!existsSync(full)) return;
    files.push({ path, text: readFileSync(full, "utf8") });
  };
  for (const name of skills) add(join("skills", name, "SKILL.md"));
  for (const name of agents) add(join("agents", `${name}.md`));
  for (const name of commands) add(join("commands", `${name}.md`));
  return files;
}

/** Refs whose skill directory is not in `installed`. */
export function danglingSkillRefs(
  files: readonly { path: string; text: string }[],
  installed: ReadonlySet<string>,
): SkillRefIssue[] {
  const issues: SkillRefIssue[] = [];
  for (const file of files) {
    for (const name of skillRefNames(file.text)) {
      if (!installed.has(name)) {
        issues.push({
          path: file.path,
          message: `references skill "${name}", which is not installed`,
        });
      }
    }
  }
  return issues;
}
