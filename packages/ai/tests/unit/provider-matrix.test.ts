import { existsSync, lstatSync, readdirSync, readFileSync, readlinkSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ALL_PROVIDERS, installKit } from "#install.js";
import { agentsForPreset, commandsForPreset, kitDir, readManifest } from "#kit.js";
import { checkDrift, validateKit } from "#validate.js";
import { tempDir } from "./helpers.js";

const MATRIX = ["cursor", "claude", "codex", "muse"] as const;
type MatrixProvider = (typeof MATRIX)[number];

function presetNames(): string[] {
  const manifest = readManifest();
  if (!manifest.ok) throw manifest.error;
  return Object.keys(manifest.value.presets);
}

function presetContent(preset: string): { agents: string[]; commands: string[] } {
  const manifest = readManifest();
  if (!manifest.ok) throw manifest.error;
  return { agents: agentsForPreset(manifest.value, preset), commands: commandsForPreset(manifest.value, preset) };
}

function install(dest: string, preset: string, providers: readonly string[] | undefined) {
  const result = installKit({ dest, preset, ...(providers === undefined ? {} : { providers }) });
  if (!result.ok) throw result.error;
  return result.value;
}

function firstSkill(dest: string): string {
  const names = readdirSync(join(dest, ".agents", "skills"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  const first = names[0];
  if (first === undefined) throw new Error("no skills installed");
  return first;
}

/** Install, validate, rerun, drift: the parity contract every cell must keep. */
function parityCell(dest: string, preset: string, providers: readonly string[] | undefined): void {
  install(dest, preset, providers);
  expect(validateKit(join(dest, ".agents")), "validate").toEqual([]);
  const again = install(dest, preset, providers);
  expect(again.filter((action) => action.kind !== "skip"), "rerun").toEqual([]);
  expect(checkDrift(dest, join(dest, ".agents")), "drift").toEqual([]);
}

function expectCursorLayer(dest: string, preset: string): void {
  const { agents, commands } = presetContent(preset);
  for (const name of agents) {
    const copy = readFileSync(join(dest, ".cursor", "agents", `${name}.md`), "utf8");
    expect(copy, `.cursor/agents/${name}.md`).toBe(
      readFileSync(join(dest, ".agents", "agents", `${name}.md`), "utf8"),
    );
  }
  for (const name of commands) {
    const copy = readFileSync(join(dest, ".cursor", "commands", `${name}.md`), "utf8");
    expect(copy, `.cursor/commands/${name}.md`).toBe(
      readFileSync(join(dest, ".agents", "commands", `${name}.md`), "utf8"),
    );
  }
  expect(existsSync(join(dest, ".cursor", "skills", firstSkill(dest), "SKILL.md"))).toBe(true);
  expect(readFileSync(join(dest, ".cursor", "rules", "project.mdc"), "utf8")).toContain("alwaysApply: true");
}

function expectClaudeLayer(dest: string): void {
  for (const kind of ["skills", "agents", "commands"]) {
    const entry = join(dest, ".claude", kind);
    expect(lstatSync(entry).isSymbolicLink(), `.claude/${kind}`).toBe(true);
    expect(existsSync(entry), `.claude/${kind} resolves`).toBe(true);
  }
  expect(readlinkSync(join(dest, "CLAUDE.md"))).toBe("AGENTS.md");
  expect(readFileSync(join(dest, "CLAUDE.md"), "utf8")).toBe(readFileSync(join(dest, "AGENTS.md"), "utf8"));
}

// codex and muse ship no layer: they read the shared source directly.
function expectSharedSource(dest: string): void {
  expect(lstatSync(join(dest, "AGENTS.md")).isFile()).toBe(true);
  expect(lstatSync(join(dest, ".agents", "skills")).isDirectory()).toBe(true);
}

const LAYER: Record<MatrixProvider, (dest: string, preset: string) => void> = {
  cursor: expectCursorLayer,
  claude: (dest) => expectClaudeLayer(dest),
  codex: (dest) => expectSharedSource(dest),
  muse: (dest) => expectSharedSource(dest),
};

describe("provider matrix", () => {
  it("covers every installer provider", () => {
    expect([...ALL_PROVIDERS]).toEqual(expect.arrayContaining([...MATRIX]));
  });

  it("setup-ai offers every matrix provider with a one-line value", () => {
    const raw = readFileSync(join(kitDir(), "skills", "setup-ai", "SKILL.md"), "utf8");
    const section = raw.slice(raw.indexOf("## Providers"), raw.indexOf("## Phase A"));
    expect(section.length).toBeGreaterThan(0);
    for (const provider of MATRIX) {
      const line = section.split("\n").find((l) => l.includes(`\`${provider}\``) && l.includes("|"));
      expect(line, `${provider} value row`).toBeDefined();
    }
    expect(raw).toContain("one-line value from Providers above");
  });

  for (const preset of presetNames()) {
    for (const provider of MATRIX) {
      it(`${preset} x ${provider}: install, validate, rerun no-op, drift clean, layer works`, () => {
        const dest = tempDir();
        parityCell(dest, preset, [provider]);
        LAYER[provider](dest, preset);
      });
    }
    it(`${preset} x all: install, validate, rerun no-op, drift clean, layers work`, () => {
      const dest = tempDir();
      parityCell(dest, preset, undefined);
      expectCursorLayer(dest, preset);
      expectClaudeLayer(dest);
      expectSharedSource(dest);
    });
  }
});
