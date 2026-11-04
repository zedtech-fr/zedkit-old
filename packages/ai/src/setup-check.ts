// Original work by the same author.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tryCatch } from "@zedtech/zedkit-core";
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

function gates(root: string): Issue[] {
  const listed = tryCatch(() => readdirSync(join(root, ".agents/setup-log/gates")));
  if (!listed.ok) return [];
  const issues: Issue[] = [];
  for (const name of listed.value.filter((n) => n.endsWith(".log"))) {
    const path = join(root, ".agents/setup-log/gates", name);
    const raw = tryCatch(() => readFileSync(path, "utf8"));
    if (!raw.ok) continue;
    const lines = raw.value.split(/\r?\n/);
    const body = lines.map((l) => l.trim()).filter(Boolean);
    if (!lines[0]?.startsWith("CMD:")) issues.push({ path, message: "first line must start with CMD:" });
    if (!body.some((l) => /^START\b/.test(l))) issues.push({ path, message: "missing START line" });
    if (!body.some((l) => /^END\b/.test(l))) issues.push({ path, message: "missing END line" });
    if (!/^EXIT:\d+$/.test(body.at(-1) ?? "")) issues.push({ path, message: "last line must match EXIT:<code>" });
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
      issues.push({ path: rest, message: `plan misses ${rest}` });
    }
  }
  issues.push(...gates(root));
  return { issues, notes };
}
