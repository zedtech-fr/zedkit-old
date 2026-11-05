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
    put(root, "PLAN.md", "PLAN.md\nAGENTS.md\nintro-first: printed before any tool call (fresh)\n");
    put(root, "AGENTS.md", "x\n");
    expect(checkSetup(root)).toEqual({ issues: [], notes: [] });
  });

  it("issues plan misses for an uncovered path", () => {
    const root = tempDir();
    gitInit(root);
    put(root, "PLAN.md", "PLAN.md\nAGENTS.md\nintro-first: printed before any tool call (fresh)\n");
    put(root, "AGENTS.md", "x\n");
    put(root, "lost.txt", "x\n");
    expect(checkSetup(root).issues).toEqual([
      { path: "lost.txt", message: "plan misses lost.txt; add plan row: | lost.txt | edit | <reason> |" },
    ]);
  });

  it("treats a parent dir with a trailing slash as coverage", () => {
    const root = tempDir();
    gitInit(root);
    put(root, "PLAN.md", "PLAN.md\n.agents/\nintro-first: printed before any tool call (fresh)\n");
    put(root, ".agents/skills/x/SKILL.md", SKILL("x"));
    expect(checkSetup(root).issues).toEqual([]);
  });

  it("notes a non-git dir without failing", () => {
    const root = tempDir();
    put(root, "PLAN.md", "PLAN.md\nintro-first: printed before any tool call (fresh)\n");
    const result = checkSetup(root);
    expect(result.issues).toEqual([]);
    expect(result.notes).toEqual(["not a git repository; skipped change coverage"]);
  });

  it("issues when a gate log tail is not EXIT:<code>", () => {
    const root = tempDir();
    put(root, "PLAN.md", "PLAN.md\nintro-first: printed before any tool call (fresh)\n");
    put(root, ".agents/setup-log/gates/run.log", "CMD: pnpm test\nSTART\nEND\noops\n");
    const messages = checkSetup(root).issues.map((i) => i.message);
    expect(messages).toContain("last line must match EXIT:<code>");
  });

  it("accepts a well-formed gate log", () => {
    const root = tempDir();
    gitInit(root);
    put(root, "PLAN.md", "PLAN.md\n.agents/\nintro-first: printed before any tool call (fresh)\n");
    put(root, ".agents/setup-log/gates/run.log", GOOD_LOG);
    put(root, ".agents/setup-log.md", "| gates/run.log | pnpm test | 0 |\n");
    expect(checkSetup(root)).toEqual({ issues: [], notes: [] });
  });

  it("issues when a persisted gate log has no setup-log inventory row", () => {
    const root = tempDir();
    gitInit(root);
    put(root, "PLAN.md", "PLAN.md\n.agents/\nintro-first: printed before any tool call (fresh)\n");
    put(root, ".agents/setup-log/gates/run.log", GOOD_LOG);
    put(root, ".agents/setup-log/gates/killed.log", "CMD: pnpm test\nSTART\nEND\nCAUSE: killed by signal\nEXIT:143\n");
    const messages = checkSetup(root).issues.map((i) => i.message).sort();
    expect(messages).toEqual(["gate inventory misses killed.log (one setup-log row per persisted gate log, killed logs included)", "gate inventory misses run.log (one setup-log row per persisted gate log, killed logs included)"]);
    put(root, ".agents/setup-log.md", "| gates/run.log | pnpm lint | 0 |\n| gates/killed.log | pnpm test | 143 |\n");
    expect(checkSetup(root)).toEqual({ issues: [], notes: [] });
  });

  it("issues when no plan file exists", () => {
    const root = tempDir();
    expect(checkSetup(root).issues.map((i) => i.message)).toContain("no plan file (pass --plan)");
  });

  it("reads --plan and the setup-log plan fallback", () => {
    const root = tempDir();
    gitInit(root);
    put(root, "custom.md", "custom.md\nlost.txt\nintro-first: printed before any tool call (fresh)\n");
    put(root, "lost.txt", "x\n");
    expect(checkSetup(root, { plan: join(root, "custom.md") }).issues).toEqual([]);
    const fallback = tempDir();
    gitInit(fallback);
    put(fallback, ".agents/setup-log/plan.md", ".agents/\nintro-first: printed before any tool call (fresh)\n");
    put(fallback, "secret.txt", "x\n");
    expect(checkSetup(fallback).issues).toEqual([
      { path: "secret.txt", message: "plan misses secret.txt; add plan row: | secret.txt | edit | <reason> |" },
    ]);
  });

  it("suggests the exact plan row for an uncovered setup output", () => {
    const root = tempDir();
    gitInit(root);
    put(root, "PLAN.md", "PLAN.md\nintro-first: printed before any tool call (fresh)\n");
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
    put(root, "PLAN.md", "PLAN.md\nintro-first: printed before any tool call (fresh)\n");
    put(root, "notes.md", "x\n");
    expect(checkSetup(root).issues).toEqual([
      { path: "notes.md", message: "plan misses notes.md; add plan row: | notes.md | edit | <reason> |" },
    ]);
  });

  it("requires the .prettierignore plan row when the prettier hint fires", () => {
    const root = tempDir();
    gitInit(root);
    put(root, "package.json", JSON.stringify({ devDependencies: { prettier: "3.9.0" } }));
    put(root, "PLAN.md", "PLAN.md\npackage.json\nintro-first: printed before any tool call (fresh)\n");
    expect(checkSetup(root).issues).toEqual([
      { path: ".prettierignore", message: "plan misses .prettierignore; add plan row: | .prettierignore | edit | exclusions for generated files |" },
    ]);
    put(root, "PLAN.md", "PLAN.md\npackage.json\n.prettierignore\nintro-first: printed before any tool call (fresh)\n");
    expect(checkSetup(root).issues).toEqual([]);
  });

  it("issues when the plan lacks the intro-first line", () => {
    const root = tempDir();
    gitInit(root);
    put(root, "PLAN.md", "PLAN.md\n");
    expect(checkSetup(root).issues).toEqual([
      { path: join(root, "PLAN.md"), message: "plan misses the intro-first line; append `intro-first: printed before any tool call` to the appendix" },
    ]);
    put(root, "PLAN.md", "PLAN.md\nintro-first: resumed at phase B\n");
    expect(checkSetup(root).issues).toEqual([]);
  });

  it.each([
    "- **Intro-first:** printed before any tool call (fresh)",
    "**Intro-first**: printed before any tool call (fresh)",
    "* _intro-first_: resumed at phase C",
    "> `intro-first`: printed before any tool call (improve)",
    "## Intro-first: printed before any tool call (fresh)",
  ])("accepts markdown emphasis on the intro-first line: %s", (line) => {
    const root = tempDir();
    gitInit(root);
    put(root, "PLAN.md", `PLAN.md\n${line}\n`);
    expect(checkSetup(root).issues).toEqual([]);
  });

  it.each(["Intro-first", "**Intro-first:**", "intro-first is printed first", "see intro-first: later"])(
    "still flags a plan with no real intro-first value: %s",
    (line) => {
      const root = tempDir();
      gitInit(root);
      put(root, "PLAN.md", `PLAN.md\n${line}\n`);
      expect(checkSetup(root).issues.map((i) => i.message)).toEqual([
        "plan misses the intro-first line; append `intro-first: printed before any tool call` to the appendix",
      ]);
    },
  );
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
    put(root, "PLAN.md", "PLAN.md\n.agents/\nintro-first: printed before any tool call (fresh)\n");
    put(root, "lost.txt", "x\n");
    expect(run("validate", root)).toEqual({ code: 0, text: "ok", errors: "" });
    const setup = run("validate", root, "--setup");
    expect(setup.code).toBe(1);
    expect(setup.text).toContain("plan misses lost.txt");
  });
});
