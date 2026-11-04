import { spawnSync } from "node:child_process";
import process from "node:process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

const CLI = join(ROOT, "packages", "ai", "dist", "bin.js");
const HOME_INIT_SNIPPET = join(ROOT, "apps", "docs", "home-quickstart", "snippets", "ai-init.sh");
const HOME_INIT_COMMAND = "npx @zedtech/zedkit-ai init";

function capture(argv, cwd = ROOT) {
  const result = spawnSync(process.execPath, [CLI, ...argv], {
    cwd,
    encoding: "utf8",
    env: process.env,
  });
  return {
    code: result.status ?? 1,
    out: result.stdout ?? "",
    err: result.stderr ?? "",
  };
}

/** Same flow as the set-up-your-coding-agents tutorial (empty scratch repo). */
export function runEmptyRepoTutorial(dir) {
  const init = capture(["init", dir, "--provider", "cursor", "--preset", "full"]);
  if (init.code !== 0) {
    throw new Error(`init failed: ${init.err || init.out}`);
  }
  if (!existsSync(join(dir, ".agents/skills/ground-truth/SKILL.md"))) {
    throw new Error("init did not copy kit skills into .agents/");
  }
  if (!existsSync(join(dir, ".cursor/rules/project.mdc"))) {
    throw new Error("init did not wire Cursor rules");
  }
  const validate = capture(["validate", dir]);
  if (validate.code !== 0 || validate.out.trim() !== "ok") {
    throw new Error(`validate failed: code=${validate.code} out=${validate.out} err=${validate.err}`);
  }
  return { initLines: init.out, validateOut: validate.out.trim() };
}

/** Cursor easy path (/docs/ai/setup): setup + validate in a scratch repo cwd. */
export function runCursorSetupTutorial(dir) {
  const setup = capture(["setup", ".", "--provider", "cursor"], dir);
  if (setup.code !== 0) {
    throw new Error(`setup failed: ${setup.err || setup.out}`);
  }
  if (!setup.out.includes("/setup-ai")) {
    throw new Error("setup should print the /setup-ai next step");
  }
  for (const rel of [".agents/skills/setup-ai/SKILL.md", ".cursor/commands/setup-ai.md", ".cursor/rules/project.mdc"]) {
    if (!existsSync(join(dir, rel))) throw new Error(`setup missing ${rel}`);
  }
  for (const rel of [".agents/skills/domain-modeling/SKILL.md", ".agents/agents/product-director.md"]) {
    if (!existsSync(join(dir, rel))) throw new Error(`setup should install setup preset (missing ${rel})`);
  }
  const validate = capture(["validate", "."], dir);
  if (validate.code !== 0 || validate.out.trim() !== "ok") {
    throw new Error(`validate after setup failed: ${validate.out} ${validate.err}`);
  }
  const again = capture(["setup", ".", "--provider", "cursor"], dir);
  if (again.code !== 0) throw new Error(`setup re-run failed: ${again.err || again.out}`);
  const writes = again.out.split("\n").filter((line) => /^(copy|link|write)\s/u.test(line));
  if (writes.length > 0) {
    throw new Error(`setup re-run should not copy/link/write again: ${writes.join("; ")}`);
  }
  const validateAgain = capture(["validate", "."], dir);
  if (validateAgain.code !== 0 || validateAgain.out.trim() !== "ok") {
    throw new Error(`validate after setup re-run failed: ${validateAgain.out}`);
  }
}

/** setup --adopt with team-owned .cursor paths before install. */
export function runCursorSetupAdoptTutorial(dir) {
  mkdirSync(join(dir, ".cursor/skills/team-own"), { recursive: true });
  mkdirSync(join(dir, ".cursor/agents"), { recursive: true });
  mkdirSync(join(dir, ".cursor/commands"), { recursive: true });
  writeFileSync(join(dir, ".cursor/skills/team-own/SKILL.md"), "team\n", "utf8");
  writeFileSync(join(dir, ".cursor/agents/explorer.md"), "custom explorer\n", "utf8");
  writeFileSync(join(dir, ".cursor/commands/review.md"), "custom review\n", "utf8");
  runCursorSetupTutorial(dir);
  if (readFileSync(join(dir, ".cursor/skills/team-own/SKILL.md"), "utf8") !== "team\n") {
    throw new Error("setup should keep the user's .cursor/skills file");
  }
  if (readFileSync(join(dir, ".cursor/agents/explorer.md"), "utf8") !== "custom explorer\n") {
    throw new Error("setup should keep the user's .cursor/agents file");
  }
  if (readFileSync(join(dir, ".cursor/commands/review.md"), "utf8") !== "custom review\n") {
    throw new Error("setup should keep the user's .cursor/commands file");
  }
}

/** Repo that already has AGENTS.md without the ladder section (tutorial scenario). */
export function runExistingAgentsTutorial(dir) {
  writeFileSync(join(dir, "AGENTS.md"), "# Team rules\n\nUse our internal style guide.\n", "utf8");
  const init = capture(["init", dir, "--provider", "cursor", "--preset", "full"]);
  if (init.code !== 0) throw new Error(`init on existing AGENTS.md failed: ${init.err}`);
  const body = readFileSync(join(dir, "AGENTS.md"), "utf8");
  if (!body.toLowerCase().includes("ladder")) {
    throw new Error("init should append the ladder section to an existing AGENTS.md");
  }
  const validate = capture(["validate", dir]);
  if (validate.code !== 0 || validate.out.trim() !== "ok") {
    throw new Error(`validate after append failed: ${validate.out}`);
  }
}

/** Home page command (snippet) run via workspace CLI in an empty folder — no git, no package.json. */
export function runHomeSnippetInit(dir) {
  const snippet = readFileSync(HOME_INIT_SNIPPET, "utf8").trim();
  if (snippet !== HOME_INIT_COMMAND) {
    throw new Error(`home-quickstart/snippets/ai-init.sh must be exactly: ${HOME_INIT_COMMAND}`);
  }
  const init = capture(["init", dir]);
  if (init.code !== 0) {
    throw new Error(`home init failed: ${init.err || init.out}`);
  }
  const required = [
    "AGENTS.md",
    ".agents/skills/setup-ai/SKILL.md",
    ".cursor/commands/setup-ai.md",
    ".claude/commands/setup-ai.md",
    ".cursor/rules/project.mdc",
  ];
  for (const rel of required) {
    if (!existsSync(join(dir, rel))) {
      throw new Error(`home init missing ${rel}`);
    }
  }
  const again = capture(["init", dir]);
  if (again.code !== 0) {
    throw new Error(`home init re-run failed: ${again.err || again.out}`);
  }
  const combined = `${again.out}\n${again.err}`;
  if (!/skip/i.test(combined)) {
    throw new Error("home init re-run should skip existing files");
  }
  const validate = capture(["validate", dir]);
  if (validate.code !== 0 || validate.out.trim() !== "ok") {
    throw new Error(`home init validate failed: ${validate.out} ${validate.err}`);
  }
}

export function withScratchDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "zedkit-ai-tutorial-"));
  fn(dir);
  rmSync(dir, { recursive: true, force: true });
}
