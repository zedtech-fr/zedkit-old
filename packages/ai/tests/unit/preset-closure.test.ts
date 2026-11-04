import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { installKit } from "#install.js";
import { agentsForPreset, commandsForPreset, readManifest } from "#kit.js";
import { lensClosureIssues, setLensStatus } from "#lenses.js";
import { validateKit } from "#validate.js";
import { tempDir } from "./helpers.js";

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
      "code-review",
      "ponytail-review",
      "retro",
      "rules-upkeep",
      "writing-for-agents",
    ]);
    expect(agentsForPreset(manifest.value, "setup")).toEqual([
      "explorer",
      "verifier",
      "orchestrator",
      "product-director",
      "ui-designer",
      "copywriter",
    ]);
    expect(commandsForPreset(manifest.value, "setup")).toEqual(["setup-ai", "review"]);
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
});
