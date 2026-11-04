// Original work by the same author.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Provider } from "./install.js";

const PRETTIER_CONFIG = [
  ".prettierrc",
  ".prettierrc.json",
  ".prettierrc.yaml",
  ".prettierrc.yml",
  ".prettierrc.js",
  "prettier.config.js",
  "prettier.config.mjs",
] as const;

export function kitPrettierIgnoreCandidates(providers: readonly Provider[] | undefined): string[] {
  const all = providers === undefined;
  const paths = [".agents/"];
  if (all || providers.some((p) => p === "cursor")) {
    paths.push(".cursor/skills/", ".cursor/agents/", ".cursor/commands/");
  }
  if (all || providers.some((p) => p === "claude")) {
    paths.push(".claude/");
  }
  return paths;
}

function prettierIgnoreLines(root: string): string[] {
  const file = join(root, ".prettierignore");
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

function covered(line: string, path: string): boolean {
  const p = path.replace(/\/$/, "");
  const r = line.replace(/\/$/, "");
  return r === p || p.startsWith(`${r}/`);
}

export function kitPathsMissingFromPrettierIgnore(
  root: string,
  providers: readonly Provider[] | undefined,
): string[] {
  const ignore = prettierIgnoreLines(root);
  return kitPrettierIgnoreCandidates(providers).filter((path) => !ignore.some((line) => covered(line, path)));
}

export function repoUsesPrettier(root: string): boolean {
  const pkg = join(root, "package.json");
  if (existsSync(pkg)) {
    const j = JSON.parse(readFileSync(pkg, "utf8")) as {
      devDependencies?: Record<string, string>;
      dependencies?: Record<string, string>;
      scripts?: Record<string, string>;
    };
    const deps = { ...j.dependencies, ...j.devDependencies };
    if (Object.keys(deps).some((k) => k === "prettier" || k.startsWith("prettier-"))) return true;
    if (Object.values(j.scripts ?? {}).some((s) => /\bprettier\b/u.test(s))) return true;
  }
  return PRETTIER_CONFIG.some((name) => existsSync(join(root, name)));
}

/** Lines printed after a successful init/setup (not dry-run). */
export function installNextStepLines(
  root: string,
  providers: readonly Provider[] | undefined,
): string[] {
  const lines = [
    "next: run /setup-ai, then npx zedkit-ai validate",
    "note: setup+validate ok ≠ product.md; phase C adds product.md, domain/*.md, personas.md, design.md, glossary — .agents/skills/setup-ai/templates/README.md",
  ];
  if (!repoUsesPrettier(root)) return lines;
  const missing = kitPathsMissingFromPrettierIgnore(root, providers);
  if (missing.length === 0) return lines;
  lines.push("prettier: add to .prettierignore:");
  lines.push(...missing);
  return lines;
}
