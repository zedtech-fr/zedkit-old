import { appendFileSync, existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveConditionals, withoutMarkers, type Availability } from "#conditional.js";
import { installKit } from "#install.js";
import { agentsForPreset, commandsForPreset, kitDir, readManifest } from "#kit.js";
import { lensClosureIssues, setLensStatus } from "#lenses.js";
import { validateKit } from "#validate.js";
import { skillDirs, tempDir } from "./helpers.js";

function install(dest: string, preset: string): void {
  const result = installKit({ dest, preset, providers: [] });
  if (!result.ok) throw result.error;
}

function dirs(path: string): string[] {
  if (!existsSync(path)) return [];
  return readdirSync(path, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function mdNames(path: string): string[] {
  if (!existsSync(path)) return [];
  return readdirSync(path)
    .filter((name) => name.endsWith(".md"))
    .map((name) => name.replace(/\.md$/, ""))
    .sort();
}

describe("preset closure", () => {
  it("ships a setup preset that adds the discovery skills and agents", () => {
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    const setup = manifest.value.presets.setup;
    if (!Array.isArray(setup)) throw new Error("setup preset must list skills");
    expect(setup).toEqual([
      "setup-ai",
      "ground-truth",
      "review",
      "definition-of-done",
      "orchestrate",
      "domain-modeling",
      "persona-review",
      "compose-ui",
      "code-review",
      "ponytail-review",
      "retro",
      "rules-upkeep",
      "writing-for-agents",
      "parallel-work",
      "tdd",
      "adversarial-tests",
      "plan",
      "implement",
      "challenge",
      "to-spec",
      "to-tickets",
      "wayfinder",
      "codebase-design",
      "research",
    ]);
    expect(agentsForPreset(manifest.value, "setup")).toEqual([
      "explorer",
      "verifier",
      "orchestrator",
      "product-director",
      "ui-designer",
      "copywriter",
      "skeptic",
      "researcher",
    ]);
    expect(commandsForPreset(manifest.value, "setup")).toEqual(["setup-ai", "review", "plan", "implement", "orchestrate"]);
  });

  it("every preset with the orchestrate skill ships the plan and implement playbooks, except documented-lean starter", () => {
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    for (const [preset, skills] of Object.entries(manifest.value.presets)) {
      const list = skills === "*" ? [...skillDirs()] : skills;
      if (!list.includes("orchestrate")) continue;
      if (preset === "starter") continue;
      expect(list, `${preset} ships plan`).toContain("plan");
      expect(list, `${preset} ships implement`).toContain("implement");
    }
    const starter = manifest.value.presets.starter;
    expect(starter === "*" ? [] : starter).not.toContain("plan");
  });

  it("every shipped preset installs closed: validate green, no dangling refs, lenses.md matches the installed set", () => {
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    const presets = Object.keys(manifest.value.presets);
    expect(presets).toEqual(expect.arrayContaining(["starter", "setup", "core", "full"]));
    expect(presets.length).toBeGreaterThanOrEqual(4);
    for (const preset of presets) {
      const dest = tempDir();
      const result = installKit({ dest, preset, providers: [] });
      expect(result.ok, preset).toBe(true);
      if (!result.ok) continue;
      const agentsRoot = join(dest, ".agents");
      expect(validateKit(agentsRoot), preset).toEqual([]);
      const skills = dirs(join(agentsRoot, "skills"));
      const agents = mdNames(join(agentsRoot, "agents"));
      const installed = new Set([...skills, ...agents]);
      const lensesPath = join(agentsRoot, "skills", "review", "lenses.md");
      if (!existsSync(lensesPath)) continue;
      const text = readFileSync(lensesPath, "utf8");
      expect(lensClosureIssues("skills/review/lenses.md", text, installed), preset).toEqual([]);
      expect(setLensStatus(text, installed), `${preset} lenses.md`).toBe(text);
    }
  });

  it("every kit conditional marker resolves cleanly and lives in a known file", () => {
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    const full: Availability = {
      skills: new Set(skillDirs()),
      agents: new Set(manifest.value.agents),
      commands: new Set(manifest.value.commands ?? []),
    };
    const kit = kitDir();
    const candidates = [
      ...skillDirs().map((name) => join("skills", name, "SKILL.md")),
      ...manifest.value.agents.map((name) => join("agents", `${name}.md`)),
      ...(manifest.value.commands ?? []).map((name) => join("commands", `${name}.md`)),
      "AGENTS.template.md",
      "personas.template.md",
      join("skills", "review", "lenses.md"),
    ];
    const marked: string[] = [];
    for (const rel of candidates) {
      const raw = readFileSync(join(kit, rel), "utf8");
      if (!raw.includes("<!-- if:")) continue;
      marked.push(rel);
      const resolved = resolveConditionals(raw, full, full);
      expect(resolved, `${rel} keeps markers`).not.toContain("<!-- if:");
      expect(resolved, `${rel} keeps closers`).not.toContain("/if -->");
    }
    expect(marked.sort()).toEqual(
      [
        "AGENTS.template.md",
        "personas.template.md",
        join("agents", "copywriter.md"),
        join("agents", "orchestrator.md"),
        join("agents", "ui-designer.md"),
        join("agents", "verifier.md"),
        join("skills", "compose-ui", "SKILL.md"),
        join("skills", "definition-of-done", "SKILL.md"),
        join("skills", "implement", "SKILL.md"),
        join("skills", "review", "SKILL.md"),
        join("skills", "review", "lenses.md"),
        join("skills", "setup-ai", "SKILL.md"),
        join("skills", "tdd", "SKILL.md"),
      ].sort(),
    );
  });

  it("full preset installs conditional text with markers stripped and nothing dropped", () => {
    const dest = tempDir();
    install(dest, "full");
    const agents = join(dest, ".agents");
    const orch = readFileSync(join(agents, "agents", "orchestrator.md"), "utf8");
    expect(orch).not.toContain("<!-- if:");
    for (const runner of [
      "`architect`",
      "`skeptic`",
      "`improver`",
      "`security-reviewer`",
      "`ui-designer`",
      "`copywriter`",
      "`a11y-auditor`",
      "`seo-auditor`",
      "`dependency-auditor`",
      "`researcher`",
      "`test-writer`",
      "`docs-writer`",
      "`plan`",
      "`challenge`",
      "`implement`",
      "`audit`",
      "`research`",
    ]) {
      expect(orch, `full keeps ${runner}`).toContain(runner);
    }
    const setupAi = readFileSync(join(agents, "skills", "setup-ai", "SKILL.md"), "utf8");
    expect(setupAi).not.toContain("<!-- if:");
    for (const kept of [
      "Invoke **`product-director`**",
      "Invoke **`domain-modeling`**",
      "Use **`ui-designer`** and **`copywriter`**",
      "Follow `rules-upkeep` for format.",
    ]) {
      expect(setupAi, kept).toContain(kept);
    }
  });

  it("full preset output preserves every source line minus markers", () => {
    const dest = tempDir();
    install(dest, "full");
    const agents = join(dest, ".agents");
    const pairs: Array<[string, string]> = [
      [join(kitDir(), "agents", "orchestrator.md"), join(agents, "agents", "orchestrator.md")],
      [join(kitDir(), "agents", "ui-designer.md"), join(agents, "agents", "ui-designer.md")],
      [join(kitDir(), "skills", "setup-ai", "SKILL.md"), join(agents, "skills", "setup-ai", "SKILL.md")],
      [join(kitDir(), "skills", "review", "SKILL.md"), join(agents, "skills", "review", "SKILL.md")],
      [join(kitDir(), "skills", "tdd", "SKILL.md"), join(agents, "skills", "tdd", "SKILL.md")],
      [
        join(kitDir(), "skills", "definition-of-done", "SKILL.md"),
        join(agents, "skills", "definition-of-done", "SKILL.md"),
      ],
    ];
    for (const [kitFile, installedFile] of pairs) {
      const expected = withoutMarkers(readFileSync(kitFile, "utf8"))
        .split("\n")
        .filter((line) => line.trim() !== "");
      const actual = readFileSync(installedFile, "utf8")
        .split("\n")
        .filter((line) => line.trim() !== "");
      expect(actual, kitFile).toEqual(expected);
    }
  });

  it("starter install names only installed things in setup-ai, orchestrator, and definition-of-done", () => {
    const dest = tempDir();
    install(dest, "starter");
    const agents = join(dest, ".agents");
    const orch = readFileSync(join(agents, "agents", "orchestrator.md"), "utf8");
    expect(orch).not.toContain("<!-- if:");
    for (const missing of [
      "architect",
      "skeptic",
      "improver",
      "security-reviewer",
      "ui-designer",
      "copywriter",
      "a11y-auditor",
      "seo-auditor",
      "dependency-auditor",
      "researcher",
      "test-writer",
      "docs-writer",
      "plan",
      "challenge",
      "implement",
      "audit",
      "research",
    ]) {
      expect(orch, `starter drops ${missing}`).not.toContain(`\`${missing}\``);
    }
    for (const kept of ["`explorer`", "`verifier`", "`review`", "`parallel-work`"]) {
      expect(orch, `starter keeps ${kept}`).toContain(kept);
    }
    const setupAi = readFileSync(join(agents, "skills", "setup-ai", "SKILL.md"), "utf8");
    for (const missing of [
      "product-director",
      "domain-modeling",
      "ui-designer",
      "copywriter",
      "rules-upkeep",
      "ponytail",
      "plan",
      "implement",
    ]) {
      expect(setupAi, `starter drops ${missing}`).not.toContain(`\`${missing}\``);
    }
    for (const kept of ["`explorer`", "`ground-truth`", "`parallel-work`", "`review`"]) {
      expect(setupAi, `starter keeps ${kept}`).toContain(kept);
    }
    const done = readFileSync(join(agents, "skills", "definition-of-done", "SKILL.md"), "utf8");
    expect(done, "starter drops ui-designer").not.toContain("`ui-designer`");
    for (const kept of ["`tdd`", "`adversarial-tests`", "`parallel-work`", "`verifier`"]) {
      expect(done, `starter keeps ${kept}`).toContain(kept);
    }
  });

  it("setup lenses mark installed runners exists and the rest planned", () => {
    const dest = tempDir();
    install(dest, "setup");
    const text = readFileSync(join(dest, ".agents/skills/review/lenses.md"), "utf8");
    expect(text).toMatch(/\| code\s+\| skill `code-review`[^\n]*\|\s*exists\s*\|/);
    expect(text).toMatch(/\| ponytail\s+\| skill `ponytail-review`[^\n]*\|\s*exists\s*\|/);
    expect(text).toMatch(/\| persona\s+\| skill `persona-review`[^\n]*\|\s*exists\s*\|/);
    expect(text).toMatch(/\| quality gate\s+\| agent `verifier`\s+\|\s*exists\s*\|/);
    expect(text).toMatch(/\| ui\s+\| agent `ui-designer`\s+\|\s*exists\s*\|/);
    expect(text).toMatch(/\| copy\s+\| agent `copywriter`\s+\|\s*exists\s*\|/);
    expect(text).toMatch(/\| security\s+\| agent `security-reviewer`\s+\|\s*planned\s*\|/);
    expect(existsSync(join(dest, ".agents/skills/writing-for-agents/SKILL.md"))).toBe(true);
    expect(existsSync(join(dest, ".agents/agents/product-director.md"))).toBe(true);
    expect(existsSync(join(dest, ".agents/skills/triage"))).toBe(false);
    expect(existsSync(join(dest, ".agents/agents/architect.md"))).toBe(false);
    expect(validateKit(join(dest, ".agents"))).toEqual([]);
  });

  it("flags a /name in the kit universe that the preset does not install", () => {
    const dest = tempDir();
    install(dest, "starter");
    appendFileSync(join(dest, ".agents/skills/review/SKILL.md"), "\nRun `/plan` before merging.\n");
    const found = validateKit(join(dest, ".agents")).map((issue) => `${issue.path}: ${issue.message}`);
    expect(found).toContain('skills/review/SKILL.md: references command "plan", which this preset does not install');
  });

  it("flags /audit on setup where the command is not installed", () => {
    const dest = tempDir();
    install(dest, "setup");
    appendFileSync(join(dest, ".agents/skills/review/SKILL.md"), "\nPoint audits at `/audit`.\n");
    const found = validateKit(join(dest, ".agents")).map((issue) => `${issue.path}: ${issue.message}`);
    expect(found).toContain(
      'skills/review/SKILL.md: references command "audit", which this preset does not install',
    );
  });

  it("flags the unbackticked handoffs line for setup and starter, except single-word names", () => {
    const line = "Handoffs: <a11y-auditor / copywriter / console-architecture — or none>";
    const rows: Array<[string, string]> = [
      ["setup", "agents/ui-designer.md"],
      ["starter", "skills/review/SKILL.md"],
    ];
    for (const [preset, file] of rows) {
      const dest = tempDir();
      install(dest, preset);
      appendFileSync(join(dest, ".agents", ...file.split("/")), `\n${line}\n`);
      const found = validateKit(join(dest, ".agents")).map((issue) => `${issue.path}: ${issue.message}`);
      expect(found).toContain(`${file}: references agent "a11y-auditor", which this preset does not install`);
      expect(found).toContain(`${file}: references agent "console-architecture", which this preset does not install`);
      expect(found.some((entry) => entry.includes('"copywriter"'))).toBe(false);
    }
  });
});
