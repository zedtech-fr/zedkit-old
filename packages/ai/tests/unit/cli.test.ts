import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { main } from "#cli.js";
import { ALL_PROVIDERS } from "#install.js";
import { COMMAND, put, SKILL, tempDir, usageProviders } from "./helpers.js";

function run(...argv: string[]): { code: number; text: string; errors: string } {
  const out: string[] = [];
  const errors: string[] = [];
  const code = main(argv, { out: (line) => out.push(line), err: (line) => errors.push(line) });
  return { code, text: out.join("\n"), errors: errors.join("\n") };
}

describe("cli", () => {
  it("prints usage with no arguments (exit 0) and for unknown commands (exit 2)", () => {
    expect(run().code).toBe(0);
    const unknown = run("nope");
    expect(unknown.code).toBe(2);
    expect(unknown.errors).toContain("zedkit-ai <command>");
    expect(unknown.text).toBe("");
  });

  it("prints usage on stdout for --help and -h (exit 0)", () => {
    for (const flag of ["--help", "-h"]) {
      const result = run(flag);
      expect(result.code, flag).toBe(0);
      expect(result.text, flag).toContain("zedkit-ai <command>");
      expect(result.errors, flag).toBe("");
    }
  });

  it("lists presets, agents and commands", () => {
    const { code, text } = run("list");
    expect(code).toBe(0);
    expect(text).toContain("preset starter:");
    expect(text).toContain("preset core:");
    expect(text).toContain("agents: explorer");
    expect(text).toContain("commands: review");
  });

  it("init installs into the given directory", () => {
    const dest = tempDir();
    const { code, text } = run("init", dest, "--target", "claude");
    expect(code).toBe(0);
    expect(text).toContain("AGENTS.md");
    expect(existsSync(join(dest, ".agents/skills/ground-truth/SKILL.md"))).toBe(true);
    expect(existsSync(join(dest, "CLAUDE.md"))).toBe(true);
    expect(existsSync(join(dest, ".cursor"))).toBe(false);
  });

  it("init wires cursor when asked", () => {
    const dest = tempDir();
    expect(run("init", dest, "--target", "cursor").code).toBe(0);
    expect(existsSync(join(dest, ".cursor/rules/project.mdc"))).toBe(true);
    expect(existsSync(join(dest, ".claude"))).toBe(false);
  });

  it("init --provider selects providers, all wires everything", () => {
    const codex = tempDir();
    expect(run("init", codex, "--provider", "codex").code).toBe(0);
    expect(existsSync(join(codex, "AGENTS.md"))).toBe(true);
    expect(existsSync(join(codex, ".claude"))).toBe(false);
    expect(existsSync(join(codex, ".cursor"))).toBe(false);
    const all = tempDir();
    expect(run("init", all, "--provider", "all").code).toBe(0);
    expect(existsSync(join(all, ".claude/commands/review.md"))).toBe(true);
    expect(existsSync(join(all, ".cursor/commands/review.md"))).toBe(true);
  });

  it("init rejects an unknown provider", () => {
    const result = run("init", tempDir(), "--provider", "pilot");
    expect(result.code).toBe(2);
    expect(result.errors).toContain('unknown provider "pilot"');
  });

  it("init --adopt keeps a colliding cursor command and writes a kit sidecar", () => {
    const dest = tempDir();
    put(dest, ".cursor/commands/review.md", "mine\n");
    const { code, text } = run("init", dest, "--provider", "cursor", "--adopt");
    expect(code).toBe(0);
    expect(text).toContain("kept user file");
    expect(readFileSync(join(dest, ".cursor/commands/review.md"), "utf8")).toBe("mine\n");
    expect(existsSync(join(dest, ".cursor/commands/review.kit.md"))).toBe(true);
  });

  it("init --dry-run writes nothing", () => {
    const dest = tempDir();
    const { code, text } = run("init", dest, "--dry-run");
    expect(code).toBe(0);
    expect(text).toContain("dry run");
    expect(existsSync(join(dest, "AGENTS.md"))).toBe(false);
  });

  it("init rejects an unknown or empty target, an unknown preset, option and extra argument, on stderr", () => {
    const dest = tempDir();
    for (const args of [
      ["--target", "emacs"],
      ["--target", ""],
      ["--target", "claude,"],
      ["--preset", "nope"],
      ["--preset", "constructor"],
      ["--wat"],
    ]) {
      const result = run("init", dest, ...args);
      expect(result.code, args.join(" ")).toBe(2);
      expect(result.errors, args.join(" ")).toContain("error:");
      expect(result.text, args.join(" ")).toBe("");
    }
    expect(run("init", dest, "extra").errors).toContain('unexpected argument "extra"');
    expect(run("init", dest, "extra").errors).toContain("zedkit-ai --help");
    expect(readdirSync(dest)).toEqual([]);
  });

  it("accepts exactly the installer providers plus all", () => {
    const dest = tempDir();
    expect(ALL_PROVIDERS.length).toBeGreaterThan(0);
    for (const provider of ALL_PROVIDERS) {
      const result = run("init", dest, "--provider", provider, "--dry-run");
      expect(result.errors, provider).not.toContain("unknown provider");
    }
    const bad = run("init", dest, "--provider", "emacs", "--dry-run");
    expect(bad.code).toBe(2);
    const listed = /\(([^)]+)\)/u.exec(bad.errors)?.[1]?.split(", ").sort() ?? [];
    expect(listed, "error provider list").toEqual([...ALL_PROVIDERS, "all"].sort());
  });

  it("lists the accepted providers in USAGE", () => {
    const bad = run("init", tempDir(), "--provider", "emacs", "--dry-run");
    const listed = /\(([^)]+)\)/u.exec(bad.errors)?.[1]?.split(", ").sort() ?? [];
    expect(usageProviders().sort(), "USAGE provider list").toEqual(listed);
  });

  it("validate does not print ok when a skill references a missing skill", () => {
    const root = tempDir();
    put(root, "skills/alpha/SKILL.md", `${SKILL("alpha")}\nCall the Skill tool with "missing".\n`);
    const result = run("validate", root);
    expect(result.code).toBe(1);
    expect(result.text).toContain('references skill "missing"');
    expect(result.text).not.toMatch(/^ok$/);
    expect(result.text).toContain("1 problem");
  });

  it("validate exits 0 on a good dir and 1 on a bad one", () => {
    const good = tempDir();
    put(good, "skills/alpha/SKILL.md", SKILL("alpha"));
    expect(run("validate", good)).toEqual({ code: 0, text: "ok", errors: "" });
    const bad = tempDir();
    put(bad, "skills/alpha/SKILL.md", SKILL("wrong"));
    const result = run("validate", bad);
    expect(result.code).toBe(1);
    expect(result.text).toContain("1 problem");
    expect(result.text).not.toContain("1 problems");
    put(bad, "skills/beta/SKILL.md", SKILL("wrong"));
    expect(run("validate", bad).text).toContain("2 problems");
  });

  it("validate accepts a project root and reports provider-copy drift", () => {
    const root = tempDir();
    put(root, ".agents/skills/alpha/SKILL.md", SKILL("alpha"));
    put(root, ".agents/commands/run.md", COMMAND("alpha"));
    put(root, ".cursor/commands/run.md", COMMAND("alpha"));
    expect(run("validate", root)).toEqual({ code: 0, text: "ok", errors: "" });
    put(root, ".cursor/commands/run.md", COMMAND("alpha", "Edited."));
    for (const dir of [root, join(root, ".agents")]) {
      const result = run("validate", dir);
      expect(result.code, dir).toBe(1);
      expect(result.text, dir).toContain("differs from");
      expect(result.text, dir).not.toContain("copy it over");
    }
  });

  it("validate fails on a missing directory and on unexpected arguments", () => {
    const missing = run("validate", "/definitely/not/here");
    expect(missing.code).toBe(2);
    expect(missing.errors).toContain("zedkit-ai init");
    expect(run("validate", "a", "b").code).toBe(2);
    expect(run("validate", "--help").code).toBe(2);
    expect(run("list", "--foo").code).toBe(2);
  });
});
