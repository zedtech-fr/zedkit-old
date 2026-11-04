import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { main } from "#cli.js";
import { checkSetup, suggestPlanRow } from "#setup-check.js";
import { put, SKILL, tempDir } from "./helpers.js";

function gitEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  delete env.GIT_DIR;
  delete env.GIT_WORK_TREE;
  return env;
}

function gitInit(dir: string): void {
  execFileSync("git", ["init"], { cwd: dir, encoding: "utf8", env: gitEnv(), stdio: "ignore" });
}

function run(...argv: string[]): { code: number; text: string; errors: string } {
  const out: string[] = [];
  const errors: string[] = [];
  const code = main(argv, { out: (line) => out.push(line), err: (line) => errors.push(line) });
  return { code, text: out.join("\n"), errors: errors.join("\n") };
}

const GOOD_LOG = "CMD: pnpm test\nSTART\nrunning\nEND\nEXIT:0\n";

describe("checkSetup", () => {
  it("covers a changed path named in the plan", () => {
    const root = tempDir();
    gitInit(root);
    put(root, "PLAN.md", "PLAN.md\nAGENTS.md\n");
    put(root, "AGENTS.md", "x\n");
    expect(checkSetup(root)).toEqual({ issues: [], notes: [] });
  });

  it("issues plan misses for an uncovered path", () => {
    const root = tempDir();
    gitInit(root);
    put(root, "PLAN.md", "PLAN.md\nAGENTS.md\n");
    put(root, "AGENTS.md", "x\n");
    put(root, "lost.txt", "x\n");
    expect(checkSetup(root).issues).toEqual([
      { path: "lost.txt", message: "plan misses lost.txt; add plan row: | lost.txt | edit | <reason> |" },
    ]);
  });

  it("treats a parent dir with a trailing slash as coverage", () => {
    const root = tempDir();
    gitInit(root);
    put(root, "PLAN.md", "PLAN.md\n.agents/\n");
    put(root, ".agents/skills/x/SKILL.md", SKILL("x"));
    expect(checkSetup(root).issues).toEqual([]);
  });

  it("notes a non-git dir without failing", () => {
    const root = tempDir();
    put(root, "PLAN.md", "PLAN.md\n");
    const result = checkSetup(root);
    expect(result.issues).toEqual([]);
    expect(result.notes).toEqual(["not a git repository; skipped change coverage"]);
  });

  it("issues when a gate log tail is not EXIT:<code>", () => {
    const root = tempDir();
    put(root, "PLAN.md", "PLAN.md\n");
    put(root, ".agents/setup-log/gates/run.log", "CMD: pnpm test\nSTART\nEND\noops\n");
    const messages = checkSetup(root).issues.map((i) => i.message);
    expect(messages).toContain("last line must match EXIT:<code>");
  });

  it("accepts a well-formed gate log", () => {
    const root = tempDir();
    gitInit(root);
    put(root, "PLAN.md", "PLAN.md\n.agents/\n");
    put(root, ".agents/setup-log/gates/run.log", GOOD_LOG);
    expect(checkSetup(root)).toEqual({ issues: [], notes: [] });
  });

  it("issues when no plan file exists", () => {
    const root = tempDir();
    expect(checkSetup(root).issues.map((i) => i.message)).toContain("no plan file (pass --plan)");
  });

  it("reads --plan and the setup-log plan fallback", () => {
    const root = tempDir();
    gitInit(root);
    put(root, "custom.md", "custom.md\nlost.txt\n");
    put(root, "lost.txt", "x\n");
    expect(checkSetup(root, { plan: join(root, "custom.md") }).issues).toEqual([]);
    const fallback = tempDir();
    gitInit(fallback);
    put(fallback, ".agents/setup-log/plan.md", ".agents/\n");
    put(fallback, "secret.txt", "x\n");
    expect(checkSetup(fallback).issues).toEqual([
      { path: "secret.txt", message: "plan misses secret.txt; add plan row: | secret.txt | edit | <reason> |" },
    ]);
  });

  it("suggests the exact plan row for an uncovered setup output", () => {
    const root = tempDir();
    gitInit(root);
    put(root, "PLAN.md", "PLAN.md\n");
    put(root, "package.json", "{}\n");
    expect(checkSetup(root).issues).toEqual([
      {
        path: "package.json",
        message: "plan misses package.json; add plan row: | package.json | edit | dependency added by setup |",
      },
    ]);
  });

  it("suggests a generic row for an uncovered unknown path", () => {
    const root = tempDir();
    gitInit(root);
    put(root, "PLAN.md", "PLAN.md\n");
    put(root, "notes.md", "x\n");
    expect(checkSetup(root).issues).toEqual([
      { path: "notes.md", message: "plan misses notes.md; add plan row: | notes.md | edit | <reason> |" },
    ]);
  });
});

describe("suggestPlanRow", () => {
  it("suggests the dependency row for package.json", () => {
    expect(suggestPlanRow("package.json")).toBe("| package.json | edit | dependency added by setup |");
  });

  it("suggests the lockfile row for pnpm-lock.yaml", () => {
    expect(suggestPlanRow("pnpm-lock.yaml")).toBe("| pnpm-lock.yaml | edit | lockfile follows package.json |");
  });

  it("suggests the lockfile row for package-lock.json", () => {
    expect(suggestPlanRow("package-lock.json")).toBe("| package-lock.json | edit | lockfile follows package.json |");
  });

  it("suggests the lockfile row for yarn.lock", () => {
    expect(suggestPlanRow("yarn.lock")).toBe("| yarn.lock | edit | lockfile follows package.json |");
  });

  it("suggests the lockfile row for bun.lock", () => {
    expect(suggestPlanRow("bun.lock")).toBe("| bun.lock | edit | lockfile follows package.json |");
  });

  it("suggests the ladder row for root AGENTS.md", () => {
    expect(suggestPlanRow("AGENTS.md")).toBe("| AGENTS.md | edit | ladder appended by setup |");
  });

  it("suggests the entry row for CLAUDE.md", () => {
    expect(suggestPlanRow("CLAUDE.md")).toBe("| CLAUDE.md | edit | Claude entry linked by setup |");
  });

  it("suggests the exclusions row for .prettierignore", () => {
    expect(suggestPlanRow(".prettierignore")).toBe("| .prettierignore | edit | exclusions for generated files |");
  });

  it("suggests the provider dir row for a path under .cursor", () => {
    expect(suggestPlanRow(".cursor/commands/setup-ai.md")).toBe("| .cursor/ | edit | Cursor wiring by setup |");
  });

  it("suggests the provider dir row for a path under .claude", () => {
    expect(suggestPlanRow(".claude/settings.json")).toBe("| .claude/ | edit | Claude wiring by setup |");
  });

  it("suggests a generic row with a reason placeholder for an unknown path", () => {
    expect(suggestPlanRow("lost.txt")).toBe("| lost.txt | edit | <reason> |");
  });

  it("suggests a generic row for a nested unknown path", () => {
    expect(suggestPlanRow("docs/notes.md")).toBe("| docs/notes.md | edit | <reason> |");
  });

  it("suggests a generic row for a nested package.json", () => {
    expect(suggestPlanRow("apps/demo/package.json")).toBe("| apps/demo/package.json | edit | <reason> |");
  });

  it("matches known outputs case-sensitively", () => {
    expect(suggestPlanRow("Package.json")).toBe("| Package.json | edit | <reason> |");
  });
});

describe("validate --setup", () => {
  it("leaves plain validate unchanged when a git path is uncovered", () => {
    const root = tempDir();
    gitInit(root);
    put(root, ".agents/skills/alpha/SKILL.md", SKILL("alpha"));
    put(root, "PLAN.md", "PLAN.md\n.agents/\n");
    put(root, "lost.txt", "x\n");
    expect(run("validate", root)).toEqual({ code: 0, text: "ok", errors: "" });
    const setup = run("validate", root, "--setup");
    expect(setup.code).toBe(1);
    expect(setup.text).toContain("plan misses lost.txt");
  });
});
