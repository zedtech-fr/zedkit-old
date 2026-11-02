import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { missingExampleLines, syncEnv } from "#bin/sync-env.mjs";

const bin = join(dirname(fileURLToPath(import.meta.url)), "../../src/bin/sync-env.mjs");

function sandbox(example, env) {
  const dir = mkdtempSync(join(tmpdir(), "sync-env-"));
  writeFileSync(join(dir, ".env.example"), example);
  if (env !== null) writeFileSync(join(dir, ".env"), env);
  return dir;
}

describe("missingExampleLines", () => {
  it("returns example lines whose keys are absent", () => {
    expect(missingExampleLines("A=1\nB=2\n", "A=9\n")).toEqual(["B=2"]);
  });

  it("ignores commented-out example keys (opt-in stays opt-in)", () => {
    expect(missingExampleLines("A=1\n#OPT=yes\n", "A=1\n")).toEqual([]);
  });

  it("recognizes export-prefixed env lines as present", () => {
    expect(missingExampleLines("PORT=3001\n", "export PORT=3999\n")).toEqual([]);
  });
});

describe("syncEnv", () => {
  it("copies the example when .env is missing", () => {
    const dir = sandbox("A=1\n", null);
    expect(syncEnv(dir)).toEqual({ created: true, added: [] });
    expect(readFileSync(join(dir, ".env"), "utf8")).toBe("A=1\n");
  });

  it("appends missing keys without touching existing values", () => {
    const dir = sandbox("PORT=3001\nNEW_KEY=from-example\n", "PORT=9999\n");
    expect(syncEnv(dir).added).toEqual(["NEW_KEY"]);
    const env = readFileSync(join(dir, ".env"), "utf8");
    expect(env).toMatch(/^PORT=9999$/m);
    expect(env).toMatch(/^NEW_KEY=from-example$/m);
  });

  it("is a no-op when .env is complete", () => {
    const dir = sandbox("A=1\n", "A=1\n");
    const before = readFileSync(join(dir, ".env"), "utf8");
    expect(syncEnv(dir)).toEqual({ created: false, added: [] });
    expect(readFileSync(join(dir, ".env"), "utf8")).toBe(before);
  });

  it("throws when .env.example is missing", () => {
    const dir = mkdtempSync(join(tmpdir(), "sync-env-missing-"));
    expect(() => syncEnv(dir)).toThrow(/missing/);
  });
});

describe("zedkit-sync-env bin", () => {
  it("runs through a symlink argv the way npm bins do", () => {
    const dir = sandbox("A=1\n", null);
    const wrap = mkdtempSync(join(tmpdir(), "sync-env-bin-"));
    const link = join(wrap, "zedkit-sync-env");
    symlinkSync(bin, link);
    const result = spawnSync(process.execPath, [link, dir], { encoding: "utf8" });
    expect(result.status, result.stderr).toBe(0);
    expect(readFileSync(join(dir, ".env"), "utf8")).toBe("A=1\n");
  });
});
