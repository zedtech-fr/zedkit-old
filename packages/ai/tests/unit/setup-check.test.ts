import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { main } from "#cli.js";
import { checkSetup } from "#setup-check.js";
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
    expect(checkSetup(root).issues).toEqual([{ path: "lost.txt", message: "plan misses lost.txt" }]);
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
    expect(checkSetup(fallback).issues).toEqual([{ path: "secret.txt", message: "plan misses secret.txt" }]);
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
