import { existsSync, mkdirSync, readFileSync, readdirSync, symlinkSync, unlinkSync } from "node:fs";
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
    expect(text).toContain("/setup-ai");
    expect(existsSync(join(dest, ".agents/skills/ground-truth/SKILL.md"))).toBe(true);
    expect(existsSync(join(dest, "CLAUDE.md"))).toBe(true);
    expect(existsSync(join(dest, ".cursor"))).toBe(false);
  });

  it("setup installs with setup preset and prints the /setup-ai next step", () => {
    const dest = tempDir();
    const { code, text } = run("setup", dest, "--provider", "cursor");
    expect(code).toBe(0);
    expect(text).toContain("/setup-ai");
    expect(text).toContain("validate");
    expect(text).toContain("product.md");
    expect(existsSync(join(dest, ".cursor/commands/setup-ai.md"))).toBe(true);
    expect(existsSync(join(dest, ".agents/skills/domain-modeling/SKILL.md"))).toBe(true);
  });

  it("setup exits 0 with phase C checklist when package.json is malformed", () => {
    const dest = tempDir();
    put(dest, "package.json", "{ broken\n");
    const { code, text } = run("setup", dest, "--provider", "cursor");
    expect(code).toBe(0);
    expect(text).toContain("product.md");
    expect(text).not.toContain("prettier: add to .prettierignore");
    expect(run("validate", dest).code).toBe(0);
  });

  it("init prints prettier ignore lines when the host uses Prettier", () => {
    const dest = tempDir();
    put(dest, "package.json", JSON.stringify({ devDependencies: { prettier: "3.9.0" } }));
    put(dest, ".prettierrc.json", "{}\n");
    const { code, text } = run("init", dest, "--provider", "cursor", "--preset", "starter");
    expect(code).toBe(0);
    expect(text).toContain("prettier: add to .prettierignore:");
    expect(text).toContain(".agents/");
    expect(text).toContain(".cursor/skills/");
  });

  it("scan prints the prettier hint early when kit paths are missing from .prettierignore", () => {
    const dest = tempDir();
    put(dest, "package.json", JSON.stringify({ devDependencies: { prettier: "3.9.0" } }));
    const { code, text } = run("scan", dest);
    expect(code).toBe(0);
    expect(text).toContain("prettier: add to .prettierignore:");
    expect(text).toContain(".agents/");
    const plain = tempDir();
    expect(run("scan", plain).text).not.toContain("prettier:");
  });

  it("setup on an empty dir uses the setup preset, validate ok, second run no-op", () => {
    const dest = tempDir();
    expect(run("setup", dest, "--provider", "cursor").code).toBe(0);
    expect(existsSync(join(dest, ".agents/skills/domain-modeling/SKILL.md"))).toBe(true);
    expect(existsSync(join(dest, ".agents/agents/product-director.md"))).toBe(true);
    expect(run("validate", dest)).toEqual({ code: 0, text: "ok", errors: "" });
    const again = run("setup", dest, "--provider", "cursor");
    expect(again.code).toBe(0);
    const writes = again.text.split("\n").filter((line) => /^(copy|link|write)\s/u.test(line));
    expect(writes).toEqual([]);
  });

  it("setup re-run does not send the user back to /setup-ai once product.md exists", () => {
    const dest = tempDir();
    const first = run("setup", dest, "--provider", "cursor");
    expect(first.text).toContain("next: run /setup-ai");
    put(dest, ".agents/product.md", "# Product\n");
    const again = run("setup", dest, "--provider", "cursor");
    expect(again.code).toBe(0);
    expect(again.text).toContain("next: validate, then phase E score");
    const hints = again.text.split("\n").filter((line) => /^(next|note):/u.test(line));
    expect(hints.some((line) => line.includes("/setup-ai"))).toBe(false);
  });

  it("setup --preset starter installs starter skills only", () => {
    const dest = tempDir();
    expect(run("setup", dest, "--provider", "cursor", "--preset", "starter").code).toBe(0);
    expect(existsSync(join(dest, ".agents/skills/domain-modeling/SKILL.md"))).toBe(false);
    expect(existsSync(join(dest, ".agents/skills/ground-truth/SKILL.md"))).toBe(true);
  });

  it("setup keeps pre-existing .cursor skills, agents, and commands", () => {
    const dest = tempDir();
    put(dest, ".cursor/skills/team-own/SKILL.md", "team\n");
    put(dest, ".cursor/agents/explorer.md", "custom explorer\n");
    put(dest, ".cursor/commands/review.md", "custom review\n");
    expect(run("setup", dest, "--provider", "cursor").code).toBe(0);
    expect(readFileSync(join(dest, ".cursor/skills/team-own/SKILL.md"), "utf8")).toBe("team\n");
    expect(readFileSync(join(dest, ".cursor/agents/explorer.md"), "utf8")).toBe("custom explorer\n");
    expect(readFileSync(join(dest, ".cursor/commands/review.md"), "utf8")).toBe("custom review\n");
    expect(run("validate", dest)).toEqual({ code: 0, text: "ok", errors: "" });
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
    const both = run("validate", bad).text;
    expect(both).toContain("3 problems");
    expect(both).toContain('duplicate skill name "wrong"');
  });

  it("validate accepts a project root and reports provider-copy drift", () => {
    const root = tempDir();
    put(root, ".agents/skills/alpha/SKILL.md", SKILL("alpha"));
    put(root, ".agents/commands/run.md", COMMAND("alpha"));
    mkdirSync(join(root, ".cursor/commands"), { recursive: true });
    symlinkSync("../../.agents/commands/run.md", join(root, ".cursor/commands/run.md"));
    expect(run("validate", root)).toEqual({ code: 0, text: "ok", errors: "" });
    unlinkSync(join(root, ".cursor/commands/run.md"));
    put(root, ".cursor/commands/run.md", COMMAND("alpha", "Edited."));
    for (const dir of [root, join(root, ".agents")]) {
      const result = run("validate", dir);
      expect(result.code, dir).toBe(1);
      expect(result.text, dir).toContain("user file kept");
      expect(result.text, dir).toContain("npx zedkit-ai sync");
    }
  });

  it("validate fails on a model name outside tokenomics.md and passes once it is marked", () => {
    const root = tempDir();
    put(root, ".agents/skills/alpha/SKILL.md", SKILL("alpha"));
    put(root, "AGENTS.md", "# Rules\n\nUse gpt-5 for reviews.\n");
    for (const dir of [root, join(root, ".agents")]) {
      const result = run("validate", dir);
      expect(result.code, dir).toBe(1);
      expect(result.text, dir).toContain('AGENTS.md:3: model name "gpt-5" outside tokenomics.md');
      expect(result.text, dir).toContain("1 problem");
    }
    put(root, "AGENTS.md", "# Rules\n\nUse gpt-5 for reviews. <!-- zk:model-ok -->\n");
    expect(run("validate", root)).toEqual({ code: 0, text: "ok", errors: "" });
  });

  it("validate fails on a missing directory and on unexpected arguments", () => {
    const missing = run("validate", "/definitely/not/here");
    expect(missing.code).toBe(2);
    expect(missing.errors).toContain("zedkit-ai init");
    expect(run("validate", "a", "b").code).toBe(2);
    expect(run("validate", "--help").code).toBe(2);
    expect(run("list", "--foo").code).toBe(2);
  });

  describe("route", () => {
    function project(tokenomics = ""): string {
      const dir = tempDir();
      put(
        dir,
        ".agents/agents/verifier.md",
        `---\nname: verifier\ndescription: "Verifies. Use when needed."\n---\n\nBody.\n`,
      );
      if (tokenomics !== "") put(dir, ".agents/tokenomics.md", tokenomics);
      return dir;
    }

    it("prints the cell, needs with sources, gates and read-only for a check call", () => {
      const { code, text } = run(
        "route",
        "verifier",
        "--kind",
        "check",
        "--stakes",
        "standard",
        "--provider",
        "cursor",
        "--dir",
        project(),
      );
      expect(code).toBe(0);
      expect(text).toContain("agent: verifier");
      expect(text).toContain("kind: check (call)");
      expect(text).toContain("stakes: standard, column sensitive");
      expect(text).toContain(
        "needs: reasoning=high (agent), context=medium (agent)",
      );
      expect(text).toContain("model: inherit");
      expect(text).toContain("effort: high");
      expect(text).toContain("context window: 256k");
      expect(text).toContain("gates: review=recommended");
      expect(text).toContain("read-only: yes");
      expect(text).not.toContain("note:");
    });

    it("--json prints the route, and --reasoning/--context override the agent default for this call", () => {
      const { code, text } = run(
        "route",
        "verifier",
        "--kind",
        "check",
        "--stakes",
        "standard",
        "--provider",
        "claude",
        "--reasoning",
        "low",
        "--context",
        "large",
        "--json",
        "--dir",
        project(),
      );
      expect(code).toBe(0);
      const route = JSON.parse(text) as {
        column: string;
        effort: string;
        contextWindow: string;
        needsSource: Record<string, string>;
        provider: string;
      };
      expect(route).toMatchObject({
        provider: "claude",
        column: "sensitive",
        effort: "medium",
        contextWindow: "1M",
      });
      expect(route.needsSource).toEqual({ reasoning: "call", context: "call" });
    });

    it("reads the project's tokenomics.md and its default_provider", () => {
      const dir = project(
        "---\nschema: 1\ndefault_provider: claude\nproviders:\n  claude:\n    check:\n      sensitive: { model: my-check-model }\n---\n",
      );
      const { code, text } = run(
        "route",
        "verifier",
        "--kind",
        "check",
        "--stakes",
        "sensitive",
        "--dir",
        dir,
      );
      expect(code).toBe(0);
      expect(text).toContain("provider: claude");
      expect(text).toContain("model: my-check-model");
    });

    it("an omitted kind uses the hint and says so; critical prints the second review route", () => {
      const { text } = run(
        "route",
        "verifier",
        "--stakes",
        "critical",
        "--provider",
        "cursor",
        "--dir",
        project(),
      );
      expect(text).toContain("kind: check (hint)");
      expect(text).toContain("note: kind not given, using check (hint)");
      expect(text).toContain("second review: cursor model inherit effort max");
      expect(text).toContain("warning: cannot prove distinct model");
    });

    it("exits 2 on a missing or bad flag, no provider, an unknown agent, a kind the agent forbids and an invalid file", () => {
      const dir = project();
      const base = ["--dir", dir];
      expect(run("route", ...base).errors).toContain("needs an agent name");
      expect(run("route", "verifier", ...base).errors).toContain(
        "needs --stakes",
      );
      expect(
        run("route", "verifier", "--stakes", "urgent", ...base).errors,
      ).toContain("--stakes must be one of");
      expect(
        run(
          "route",
          "verifier",
          "--stakes",
          "standard",
          "--kind",
          "review",
          ...base,
        ).errors,
      ).toContain("--kind must be one of");
      expect(
        run(
          "route",
          "verifier",
          "--stakes",
          "standard",
          "--provider",
          "gemini",
          ...base,
        ).errors,
      ).toContain("--provider must be one of");
      expect(
        run(
          "route",
          "verifier",
          "--stakes",
          "standard",
          "--reasoning",
          "max",
          ...base,
        ).errors,
      ).toContain("--reasoning must be one of");
      expect(
        run("route", "verifier", "--stakes", "standard", ...base).errors,
      ).toContain("no provider");
      expect(
        run(
          "route",
          "nobody",
          "--stakes",
          "standard",
          "--provider",
          "cursor",
          ...base,
        ).errors,
      ).toContain('unknown agent "nobody"');
      expect(
        run(
          "route",
          "verifier",
          "--stakes",
          "standard",
          "--kind",
          "build",
          "--provider",
          "cursor",
          ...base,
        ).errors,
      ).toContain("cannot be invoked as build");
      const bad = project("---\nschema: 1\ntiers: {}\n---\n");
      const invalid = run(
        "route",
        "verifier",
        "--stakes",
        "standard",
        "--provider",
        "cursor",
        "--dir",
        bad,
      );
      expect(invalid.code).toBe(2);
      expect(invalid.errors).toContain("tokenomics.md: tiers: unknown key");
      expect(run("route", "a", "b", "--stakes", "standard").code).toBe(2);
    });
  });
});
