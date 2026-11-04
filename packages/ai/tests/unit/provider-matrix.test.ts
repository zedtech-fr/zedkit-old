import { existsSync, lstatSync, readdirSync, readFileSync, readlinkSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ALL_PROVIDERS, installKit } from "#install.js";
import { agentsForPreset, commandsForPreset, kitDir, readManifest } from "#kit.js";
import { checkDrift, checkKitDocs, validateKit } from "#validate.js";
import { put, tempDir } from "./helpers.js";

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

function install(dest: string, preset: string, providers: readonly string[] | undefined, adopt = false) {
  const result = installKit({ dest, preset, adopt, ...(providers === undefined ? {} : { providers }) });
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

/** Install, validate, rerun, drift, docs: the parity contract every cell must keep. */
function parityCell(dest: string, preset: string, providers: readonly string[] | undefined, adopt = false): void {
  install(dest, preset, providers, adopt);
  expect(validateKit(join(dest, ".agents")), "validate").toEqual([]);
  expect(checkKitDocs(dest, join(dest, ".agents")), "docs").toEqual([]);
  const again = install(dest, preset, providers, adopt);
  expect(again.filter((action) => action.kind !== "skip"), "rerun").toEqual([]);
  expect(checkDrift(dest, join(dest, ".agents")), "drift").toEqual([]);
}

const MINE_SKILL = "# mine team skill\n";
const MINE_AGENT = "# my explorer\n";
const MINE_COMMAND = "# my review\n";

/** A team-owned provider layer: real dirs with user files colliding with kit names. */
function seedRealProviderDirs(dest: string, provider: "cursor" | "claude"): void {
  const layer = provider === "cursor" ? ".cursor" : ".claude";
  put(dest, `${layer}/skills/mine/SKILL.md`, MINE_SKILL);
  put(dest, `${layer}/agents/explorer.md`, MINE_AGENT);
  put(dest, `${layer}/commands/review.md`, MINE_COMMAND);
}

/** Real-dir layer: kit content linked/copied in, user files byte-identical, no dead zk-* entries. */
function expectRealDirLayer(dest: string, provider: "cursor" | "claude"): void {
  const layer = join(dest, provider === "cursor" ? ".cursor" : ".claude");
  expect(existsSync(join(layer, "skills", firstSkill(dest), "SKILL.md")), "kit skill link resolves").toBe(true);
  expect(lstatSync(join(layer, "skills", firstSkill(dest))).isSymbolicLink(), "kit skill is a link").toBe(true);
  expect(readFileSync(join(layer, "skills", "mine", "SKILL.md"), "utf8"), "user skill kept").toBe(MINE_SKILL);
  expect(readFileSync(join(layer, "agents", "explorer.md"), "utf8"), "user agent kept").toBe(MINE_AGENT);
  expect(readFileSync(join(layer, "commands", "review.md"), "utf8"), "user command kept").toBe(MINE_COMMAND);
  expect(existsSync(join(layer, "agents", "explorer.kit.md")), "agent sidecar").toBe(true);
  expect(existsSync(join(layer, "commands", "review.kit.md")), "command sidecar").toBe(true);
  const copy = readFileSync(join(layer, "agents", "verifier.md"), "utf8");
  expect(copy, "kit copy matches source").toBe(readFileSync(join(dest, ".agents", "agents", "verifier.md"), "utf8"));
  const dead = readdirSync(layer).filter((name) => name.startsWith("zk-"));
  expect(dead, "no dead zk-* layer entries").toEqual([]);
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
    for (const provider of ["cursor", "claude"] as const) {
      it(`${preset} x ${provider} with pre-existing real provider dirs: adopt keeps user files, validate and drift clean`, () => {
        const dest = tempDir();
        seedRealProviderDirs(dest, provider);
        parityCell(dest, preset, [provider], true);
        expectRealDirLayer(dest, provider);
      });
    }
  }

  it("adopt into pre-existing real .claude dirs wires links and copies, never dead zk-* entries", () => {
    const dest = tempDir();
    seedRealProviderDirs(dest, "claude");
    parityCell(dest, "setup", ["claude", "cursor"], true);
    expectRealDirLayer(dest, "claude");
    expect(lstatSync(join(dest, "CLAUDE.md")).isSymbolicLink()).toBe(true);
  });

  it("starter x adopt twice: conditional text resolves once, rerun is a no-op", () => {
    const dest = tempDir();
    parityCell(dest, "starter", ["cursor"], true);
  });

  it("starter x adopt over an existing AGENTS.md appends the resolved ladder", () => {
    const dest = tempDir();
    put(dest, "AGENTS.md", "# Mine\n");
    parityCell(dest, "starter", ["cursor"], true);
    const text = readFileSync(join(dest, "AGENTS.md"), "utf8");
    expect(text).toContain("# Mine");
    expect(text).toContain("## Before writing any code");
    expect(text).not.toContain("ponytail-review");
    expect(text).not.toContain("<!-- if:");
  });
});
