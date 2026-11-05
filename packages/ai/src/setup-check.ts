// Original work by the same author.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tryCatch } from "@zedtech/zedkit-core";
import { kitPathsMissingFromPrettierIgnore, repoUsesPrettier } from "./install-next-step.js";
import type { Issue } from "./validate.js";

export type SetupCheck = { issues: Issue[]; notes: string[] };

function env(): NodeJS.ProcessEnv {
  const e = { ...process.env };
  delete e.GIT_DIR;
  delete e.GIT_WORK_TREE;
  return e;
}

function planFile(root: string, plan?: string): string | undefined {
  const hits = plan !== undefined ? [plan, join(root, plan)] : [join(root, "PLAN.md"), join(root, ".agents/setup-log/plan.md")];
  return hits.find(existsSync);
}

function covers(plan: string, path: string): boolean {
  if (plan.includes(path)) return true;
  let p = "";
  for (const part of path.split("/").slice(0, -1)) {
    p += `${part}/`;
    if (plan.includes(p)) return true;
  }
  return false;
}

const SETUP_LOCKFILES = ["pnpm-lock.yaml", "package-lock.json", "yarn.lock", "bun.lock"];

// `intro-first: x`, also with list/quote markers and markdown emphasis
// around the label: `- **Intro-first:** x`, `**Intro-first**: x`, `_intro-first_: x`.
const INTRO_FIRST = /^[\s>*_`#-]*intro-first[*_`]*\s*:[*_`]*\s*[^\s*_`]/im;

const planRow = (path: string, reason: string): string => `| ${path} | edit | ${reason} |`;

/** Ready-to-paste plan row for a git path the plan does not cover. */
export function suggestPlanRow(path: string): string {
  if (path === "package.json") return planRow("package.json", "dependency added by setup");
  if (SETUP_LOCKFILES.includes(path)) return planRow(path, "lockfile follows package.json");
  if (path === "AGENTS.md") return planRow("AGENTS.md", "ladder appended by setup");
  if (path === "CLAUDE.md") return planRow("CLAUDE.md", "Claude entry linked by setup");
  if (path === ".prettierignore") return planRow(".prettierignore", "exclusions for generated files");
  const top = path.split("/")[0];
  if (top === ".cursor") return planRow(".cursor/", "Cursor wiring by setup");
  if (top === ".claude") return planRow(".claude/", "Claude wiring by setup");
  return planRow(path, "<reason>");
}

function logShape(path: string, raw: string, issues: Issue[]): void {
  const lines = raw.split(/\r?\n/);
  const body = lines.map((l) => l.trim()).filter(Boolean);
  if (!lines[0]?.startsWith("CMD:")) issues.push({ path, message: "first line must start with CMD:" });
  if (!body.some((l) => /^START\b/.test(l))) issues.push({ path, message: "missing START line" });
  if (!body.some((l) => /^END\b/.test(l))) issues.push({ path, message: "missing END line" });
  if (!/^EXIT:\d+$/.test(body.at(-1) ?? "")) issues.push({ path, message: "last line must match EXIT:<code>" });
}

function gates(root: string): Issue[] {
  const listed = tryCatch(() => readdirSync(join(root, ".agents/setup-log/gates")));
  const issues: Issue[] = [];
  const log = tryCatch(() => readFileSync(join(root, ".agents/setup-log.md"), "utf8"));
  const inventory = log.ok ? log.value : "";
  const cmds: string[] = [];
  for (const name of (listed.ok ? listed.value : []).filter((n) => n.endsWith(".log"))) {
    const path = join(root, ".agents/setup-log/gates", name);
    const raw = tryCatch(() => readFileSync(path, "utf8"));
    if (!raw.ok) continue;
    logShape(path, raw.value, issues);
    cmds.push(raw.value.split(/\r?\n/)[0] ?? "");
    if (!inventory.includes(name)) {
      issues.push({ path, message: `gate inventory misses ${name} (one setup-log row per persisted gate log, killed logs included)` });
    }
  }
  // The full gate: a repo with a `check` script has a log of it, or a setup-log row saying why it did not run.
  const pkg = tryCatch(() => JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as { scripts?: Record<string, string> });
  if (pkg.ok && pkg.value.scripts?.check !== undefined) {
    const logged = cmds.some((c) => /\b(pnpm|npm|yarn|bun)\b.*\bcheck\b/.test(c));
    const excused = inventory.split("\n").some((l) => l.startsWith("|") && /\bcheck\b/.test(l) && /unverified|not run|did not run|skipped|killed|oom/i.test(l));
    if (!logged && !excused) {
      issues.push({ path: join(root, "package.json"), message: "the repo has a `check` script: persist its run as .agents/setup-log/gates/<name>.log (CMD/EXIT) or add a Gate outcomes row saying why it did not run" });
    }
  }
  // The final `validate --setup` run, when persisted, is clean and named in the setup-log.
  const run = tryCatch(() => readFileSync(join(root, ".agents/setup-log/validate.log"), "utf8"));
  if (run.ok) {
    const path = join(root, ".agents/setup-log/validate.log");
    logShape(path, run.value, issues);
    if (!/^EXIT:0\s*$/m.test(run.value.trimEnd().split("\n").at(-1) ?? "")) issues.push({ path, message: "validate.log is from a failing run: fix the issues and re-run validate --setup before scoring" });
    if (!inventory.includes("validate.log")) issues.push({ path, message: "setup-log does not reference validate.log (name it in the setup-log entry)" });
  }
  return issues;
}

/** Opt-in: PLAN covers git changes; setup-log gate logs are well-formed. */
export function checkSetup(root: string, options: { plan?: string } = {}): SetupCheck {
  const issues: Issue[] = [];
  const notes: string[] = [];
  const plan = planFile(root, options.plan);
  if (!plan) issues.push({ path: root, message: "no plan file (pass --plan)" });
  const git = tryCatch(() =>
    execFileSync("git", ["status", "--porcelain", "-uall"], {
      cwd: root,
      encoding: "utf8",
      env: env(),
      stdio: ["ignore", "pipe", "pipe"],
    }),
  );
  if (!git.ok) {
    const text = `${git.error.message}\n${String((git.error as { stderr?: unknown }).stderr ?? "")}`;
    if (text.includes("not a git repository")) notes.push("not a git repository; skipped change coverage");
    else issues.push({ path: root, message: `git status failed: ${git.error.message}` });
  } else if (plan) {
    const text = readFileSync(plan, "utf8");
    for (const line of git.value.split("\n")) {
      if (line === "") continue;
      let rest = line.length >= 3 && line[2] === " " ? line.slice(3) : line.slice(2).trimStart();
      const i = rest.lastIndexOf(" -> ");
      if (i >= 0) rest = rest.slice(i + 4);
      if (rest.startsWith('"') && rest.endsWith('"')) rest = rest.slice(1, -1);
      if (rest === "" || rest.split("/").includes("node_modules") || covers(text, rest)) continue;
      issues.push({ path: rest, message: `plan misses ${rest}; add plan row: ${suggestPlanRow(rest)}` });
    }
  }
  if (plan && repoUsesPrettier(root) && kitPathsMissingFromPrettierIgnore(root, undefined).length > 0) {
    const text = tryCatch(() => readFileSync(plan, "utf8"));
    if (text.ok && !covers(text.value, ".prettierignore")) {
      issues.push({ path: ".prettierignore", message: `plan misses .prettierignore; add plan row: ${suggestPlanRow(".prettierignore")}` });
    }
  }
  if (plan) {
    const text = tryCatch(() => readFileSync(plan, "utf8"));
    if (text.ok && !INTRO_FIRST.test(text.value)) {
      issues.push({ path: plan, message: "plan misses the intro-first line; append `intro-first: printed before any tool call` to the appendix" });
    }
  }
  issues.push(...gates(root));
  return { issues, notes };
}
