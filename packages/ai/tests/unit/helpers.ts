import { lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach } from "vitest";
import { kitDir, readManifest } from "#kit.js";

const dirs: string[] = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

export function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "zedkit-ai-"));
  dirs.push(dir);
  return dir;
}

export function put(root: string, rel: string, content: string): void {
  const path = join(root, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

export const SKILL = (name: string): string =>
  `---\nname: ${name}\ndescription: "Does ${name}. Use when needed."\n---\n\n# ${name}\n`;

export const AGENT = (name: string, extra = ""): string =>
  `---\nname: ${name}\ndescription: "Agent ${name}. Use when needed."\n${extra}---\n\nBody.\n`;

export const COMMAND = (skill: string, description = "Runs a skill."): string =>
  `---\ndescription: ${description}\n---\n\nRun the \`${skill}\` skill on \`$ARGUMENTS\`.\n`;

/** Raw body cells of the lens registry table (skills/review/lenses.md), header excluded. */
export function lensTableRows(): string[][] {
  const raw = readFileSync(join(kitDir(), "skills/review/lenses.md"), "utf8");
  return raw
    .split("\n")
    .filter((line) => line.startsWith("| "))
    .map((line) => line.split("|").map((c) => c.trim()))
    .filter((cells) => (cells[1] ?? "") !== "Lens" && !/^:?-{3,}:?$/.test(cells[1] ?? ""));
}

/** Skill directory names only: stray files (LICENSE-*) never count as skills. */
export function skillDirs(): string[] {
  return readdirSync(join(kitDir(), "skills"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

/** First-party skill names, the single source: parsed from THIRD_PARTY_NOTICES.md. */
export function firstPartySkills(): string[] {
  const notices = readFileSync(join(kitDir(), "THIRD_PARTY_NOTICES.md"), "utf8");
  const block = /is not\ncovered here: ([\s\S]*?)\. Each upstream/.exec(notices);
  if (!block) throw new Error("THIRD_PARTY_NOTICES.md has no first-party list block");
  return [...(block[1] ?? "").matchAll(/`([a-z][a-z0-9-]*)`/g)]
    .map((m) => m[1] ?? "")
    .sort();
}

/** Every real markdown file under a dir, recursively, never following symlinks. */
export function markdownFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: "utf8" })
    .map((entry) => join(dir, entry))
    .filter((full) => full.endsWith(".md") && !lstatSync(full).isSymbolicLink() && lstatSync(full).isFile());
}

/** The CLI USAGE block, the documented flag contract. */
export function usageText(): string {
  const source = readFileSync(
    fileURLToPath(new URL("../../src/cli.ts", import.meta.url)),
    "utf8",
  );
  const usage = /const USAGE = `([\s\S]*?)`;/u.exec(source)?.[1] ?? "";
  if (usage === "") throw new Error("src/cli.ts has no USAGE block");
  return usage;
}

/** Every `--flag` the USAGE block names. */
export function usageFlags(): string[] {
  return [...new Set([...usageText().matchAll(/--[a-z][a-z0-9-]*/gu)].map((m) => m[0]))];
}

/** Every provider the USAGE `--provider` line accepts. */
export function usageProviders(): string[] {
  return /--provider takes ([a-z,]+)/u.exec(usageText())?.[1]?.split(",") ?? [];
}

/** Every subcommand the USAGE block documents. */
export function usageCommands(): string[] {
  return [...new Set([...usageText().matchAll(/^ {2}([a-z-]+)/gmu)].map((m) => m[1] ?? ""))];
}

/** Every installable name: agents + commands + skill dirs (+ presets when asked). */
export function shippedNames(includePresets = false): Set<string> {
  const manifest = readManifest();
  if (!manifest.ok) throw manifest.error;
  const extra = includePresets ? Object.keys(manifest.value.presets) : [];
  return new Set(
    manifest.value.agents.concat(manifest.value.commands ?? [], skillDirs(), extra),
  );
}
