import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const binDir = join(dirname(fileURLToPath(import.meta.url)), "../../src/bin");
const artifactsBin = join(binDir, "check-no-artifacts.sh");
const secretsBin = join(binDir, "check-no-secrets.sh");

const gitEnv = {
  ...process.env,
  GIT_AUTHOR_NAME: "t",
  GIT_AUTHOR_EMAIL: "t@example.com",
  GIT_COMMITTER_NAME: "t",
  GIT_COMMITTER_EMAIL: "t@example.com",
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_CONFIG_GLOBAL: "/dev/null",
};

function gitRepo(files = {}) {
  const dir = mkdtempSync(join(tmpdir(), "hygiene-"));
  run(dir, "git", ["init", "-q"]);
  run(dir, "git", ["config", "user.name", "t"]);
  run(dir, "git", ["config", "user.email", "t@example.com"]);
  run(dir, "git", ["config", "commit.gpgsign", "false"]);
  run(dir, "git", ["config", "core.excludesFile", "/dev/null"]);
  writeFiles(dir, files);
  run(dir, "git", ["add", "-A"]);
  run(dir, "git", ["commit", "-qm", "init"]);
  return dir;
}

function writeFiles(dir, files) {
  for (const [rel, body] of Object.entries(files)) {
    const path = join(dir, rel);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, body);
  }
}

function run(cwd, cmd, args) {
  const result = spawnSync(cmd, args, { cwd, encoding: "utf8", env: gitEnv });
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed: ${result.stderr || result.stdout}`);
  }
  return result;
}

function runBin(bin, cwd, args = [], extraEnv = {}) {
  return spawnSync("bash", [bin, ...args], {
    cwd,
    encoding: "utf8",
    env: { ...gitEnv, ...extraEnv },
  });
}

describe("zedkit-check-no-artifacts", () => {
  it("passes a clean repo", () => {
    const dir = gitRepo({ "README.md": "ok\n" });
    const result = runBin(artifactsBin, dir);
    expect(result.status, result.stdout + result.stderr).toBe(0);
    expect(result.stdout).toContain("check-no-artifacts: ok");
  });

  it("fails on a tracked dist/ file", () => {
    const dir = gitRepo({ "dist/out.js": "x\n" });
    const result = runBin(artifactsBin, dir);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("dist/out.js");
  });

  it("matches artifact directory names as path segments, not substrings", () => {
    const dir = gitRepo({
      "tsconfig.build.json": "{}\n",
      "coverage.test.ts": "ok\n",
      "scripts/build-first.test.mjs": "ok\n",
    });
    const result = runBin(artifactsBin, dir);
    expect(result.status, result.stdout + result.stderr).toBe(0);
  });

  it("still flags a nested build/ directory", () => {
    const dir = gitRepo({ "packages/app/build/out.js": "x\n" });
    const result = runBin(artifactsBin, dir);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("packages/app/build/out.js");
  });

  it("fails when a tracked file matches .gitignore (--no-index)", () => {
    const dir = gitRepo({ "keep.txt": "x\n" });
    writeFiles(dir, { ".gitignore": "keep.txt\n" });
    run(dir, "git", ["add", ".gitignore"]);
    run(dir, "git", ["commit", "-qm", "ignore"]);
    const result = runBin(artifactsBin, dir);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("tracked files that match .gitignore");
    expect(result.stdout).toContain("keep.txt");
  });

  it("honours --dirs extra artifact names", () => {
    const dir = gitRepo({ "scratch/out.bin": "x\n" });
    const clean = runBin(artifactsBin, dir);
    expect(clean.status, clean.stdout).toBe(0);
    const flagged = runBin(artifactsBin, dir, ["--dirs", "scratch"]);
    expect(flagged.status).toBe(1);
    expect(flagged.stdout).toContain("scratch/out.bin");
  });

  it("allowlists oversized files with --allow", () => {
    const dir = gitRepo({ "big.txt": "a".repeat(300) });
    const blocked = runBin(artifactsBin, dir, ["--max-bytes", "100"]);
    expect(blocked.status).toBe(1);
    expect(blocked.stdout).toContain("big.txt");
    const allowed = runBin(artifactsBin, dir, ["--max-bytes", "100", "--allow", "^big\\.txt$"]);
    expect(allowed.status, allowed.stdout).toBe(0);
  });
});

describe("zedkit-check-no-secrets", () => {
  it("passes a repo with only .env.example", () => {
    const dir = gitRepo({ ".env.example": "A=1\n", "README.md": "ok\n" });
    const result = runBin(secretsBin, dir);
    expect(result.status, result.stdout + result.stderr).toBe(0);
    expect(result.stdout).toContain("check-no-secrets: ok");
  });

  it("fails when .env is tracked", () => {
    const dir = gitRepo({ ".env": "A=1\n" });
    const result = runBin(secretsBin, dir);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain(".env");
  });

  it("fails on a high-signal access-key pattern", () => {
    const dir = gitRepo({ "leak.txt": `${["AKIA", "IOSFODNN7EXAMPLE"].join("")}\n` });
    const result = runBin(secretsBin, dir);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("possible secrets");
  });
});
