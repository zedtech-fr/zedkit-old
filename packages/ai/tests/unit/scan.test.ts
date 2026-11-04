import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { main } from "#cli.js";
import { listRepoFiles, minReaders, readerCount, scanRepo } from "#scan.js";
import { put, tempDir } from "./helpers.js";

function run(...argv: string[]): { code: number; text: string; errors: string } {
  const out: string[] = [];
  const errors: string[] = [];
  const code = main(argv, { out: (line) => out.push(line), err: (line) => errors.push(line) });
  return { code, text: out.join("\n"), errors: errors.join("\n") };
}

function fill(root: string, dir: string, count: number): void {
  for (let i = 0; i < count; i += 1) put(root, `${dir}/f${i}.ts`, "x\n");
}

describe("readerCount", () => {
  it("scales readers 1-5 small, 6-10 medium, 11-20 large", () => {
    expect(readerCount(0)).toEqual({ size: "small", readers: 1 });
    expect(readerCount(59)).toEqual({ size: "small", readers: 1 });
    expect(readerCount(61)).toEqual({ size: "small", readers: 2 });
    expect(readerCount(299)).toEqual({ size: "small", readers: 5 });
    expect(readerCount(300)).toEqual({ size: "medium", readers: 6 });
    expect(readerCount(2000)).toEqual({ size: "medium", readers: 10 });
    expect(readerCount(2001)).toEqual({ size: "large", readers: 11 });
    expect(readerCount(1_000_000)).toEqual({ size: "large", readers: 20 });
  });

  it("never asks for fewer readers than the size class floor", () => {
    expect(minReaders("small", 3)).toBe(1);
    expect(minReaders("medium", 20)).toBe(6);
    expect(minReaders("large", 20)).toBe(11);
    expect(minReaders("large", 4)).toBe(4);
    expect(minReaders("medium", 0)).toBe(1);
  });
});

describe("scanRepo", () => {
  it("returns one reader and no slices for an empty repo", () => {
    expect(scanRepo(tempDir())).toEqual({ files: 0, size: "small", readers: 1, slices: [] });
  });

  it("skips dependencies, build output, kit folders, binaries and lockfiles", () => {
    const root = tempDir();
    put(root, "src/a.ts", "x\n");
    put(root, "node_modules/dep/index.js", "x\n");
    put(root, "dist/a.js", "x\n");
    put(root, ".agents/skills/s/SKILL.md", "x\n");
    put(root, ".cursor/rules/r.mdc", "x\n");
    put(root, "logo.png", "x\n");
    put(root, "pnpm-lock.yaml", "x\n");
    expect(listRepoFiles(root)).toEqual(["src/a.ts"]);
  });

  it("keeps provider folders only when asked, to find existing provider rules", () => {
    const root = tempDir();
    put(root, "src/a.ts", "x\n");
    put(root, ".cursor/rules/r.mdc", "x\n");
    put(root, ".claude/rules/c.md", "x\n");
    put(root, "node_modules/p/.cursor/rules/x.mdc", "x\n");
    expect(listRepoFiles(root, true).sort()).toEqual([".claude/rules/c.md", ".cursor/rules/r.mdc", "src/a.ts"]);
    expect(listRepoFiles(root)).toEqual(["src/a.ts"]);
  });

  it("honours .gitignore and sees untracked files inside a git repo", () => {
    const root = tempDir();
    execFileSync("git", ["init"], { cwd: root, stdio: "ignore" });
    put(root, ".gitignore", "secret/\n");
    put(root, "secret/key.ts", "x\n");
    put(root, "src/new.ts", "x\n");
    expect(listRepoFiles(root).sort()).toEqual([".gitignore", "src/new.ts"]);
  });

  it("slices a medium repo into 6-10 slices that cover every file once", () => {
    const root = tempDir();
    for (const dir of ["apps/web", "apps/admin", "packages/core", "packages/ui", "packages/db", "services/api", "services/jobs"]) fill(root, dir, 50);
    const scan = scanRepo(root);
    expect(scan.size).toBe("medium");
    expect(scan.files).toBe(350);
    expect(scan.readers).toBeGreaterThanOrEqual(6);
    expect(scan.readers).toBeLessThanOrEqual(10);
    expect(scan.slices).toHaveLength(scan.readers);
    expect(scan.slices.reduce((n, s) => n + s.files, 0)).toBe(350);
  });

  it("caps readers by the slices that exist (a flat repo cannot be cut)", () => {
    const root = tempDir();
    fill(root, ".", 400);
    const scan = scanRepo(root);
    expect(scan.size).toBe("medium");
    expect(scan.readers).toBe(1);
    expect(scan.slices).toEqual([{ paths: ["."], files: 400 }]);
  });

  it("folds the smallest folders together when a small repo has more folders than readers", () => {
    const root = tempDir();
    for (const dir of ["a", "b", "c", "d", "e", "f", "g", "h"]) fill(root, dir, 2);
    const scan = scanRepo(root);
    expect(scan.readers).toBe(1);
    expect(scan.slices).toHaveLength(1);
    expect(scan.slices[0]?.files).toBe(16);
  });
});

describe("zedkit-ai scan", () => {
  it("prints size, readers and one slice line per reader", () => {
    const root = tempDir();
    fill(root, "apps/web", 80);
    fill(root, "packages/core", 20);
    const { code, text } = run("scan", root);
    expect(code).toBe(0);
    expect(text).toContain("size: small (100 files)");
    expect(text).toContain("readers: 2");
    expect(text).toContain("slice 1: 80 files: apps");
    expect(text).toContain("slice 2: 20 files: packages");
  });

  it("fails on a missing dir and on an extra argument", () => {
    expect(run("scan", "/no/such/dir/zedkit").code).toBe(2);
    expect(run("scan", ".", "extra").code).toBe(2);
  });
});
