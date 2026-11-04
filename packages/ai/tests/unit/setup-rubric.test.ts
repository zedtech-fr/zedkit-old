import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { installKit } from "#install.js";
import { kitDir, readManifest } from "#kit.js";
import { checkDrift, validateKit } from "#validate.js";
import { tempDir } from "./helpers.js";

const SCORE_AND_LEARN_TEMPLATES = [
  "templates/setup-rubric.md",
  "templates/setup-log.template.md",
  "templates/kit-issue.template.md",
];

const AXES = [
  "### 1. Discovery",
  "### 2. Personas",
  "### 3. Domain rules",
  "### 4. Design and identity",
  "### 5. Architecture and conventions",
  "### 6. Commands and gates verified",
  "### 7. Skills and subagents relevance",
  "### 8. Provider parity",
  "### 9. UX friction",
  "### 10. Self-improvement",
];

function install(
  dest: string,
  options: Omit<Parameters<typeof installKit>[0], "dest"> = {},
) {
  const result = installKit({ dest, providers: ["cursor"], ...options });
  if (!result.ok) throw result.error;
  return result.value;
}

function presets(): string[] {
  const manifest = readManifest();
  if (!manifest.ok) throw manifest.error;
  return Object.keys(manifest.value.presets);
}

function presetsWithSetupAi(): string[] {
  const manifest = readManifest();
  if (!manifest.ok) throw manifest.error;
  return Object.entries(manifest.value.presets)
    .filter(
      ([, skills]) =>
        skills === "*" ||
        (Array.isArray(skills) && skills.includes("setup-ai")),
    )
    .map(([name]) => name);
}

const MEASURABLE_AXIS_NUMBERS = [2, 4, 5, 6, 7, 8, 9, 10] as const;

describe("setup rubric and score-and-learn", () => {
  it("ships the rubric and the score-and-learn templates in the kit", () => {
    const kit = join(kitDir(), "skills", "setup-ai");
    for (const rel of SCORE_AND_LEARN_TEMPLATES) {
      const path = join(kit, rel);
      expect(existsSync(path), `missing ${rel}`).toBe(true);
      expect(readFileSync(path, "utf8").length, rel).toBeGreaterThan(40);
    }
  });

  it("installs the rubric beside setup-ai for every preset that ships setup-ai", () => {
    const names = presetsWithSetupAi();
    expect(names).toEqual(
      expect.arrayContaining(["starter", "setup", "core", "full"]),
    );
    for (const preset of names) {
      const root = tempDir();
      install(root, { preset });
      const templates = join(
        root,
        ".agents",
        "skills",
        "setup-ai",
        "templates",
      );
      for (const rel of SCORE_AND_LEARN_TEMPLATES) {
        expect(
          existsSync(join(templates, rel.replace(/^templates\//, ""))),
          `${preset} ${rel}`,
        ).toBe(true);
      }
    }
  });

  it("documents phase E and references only existing templates", () => {
    const raw = readFileSync(
      join(kitDir(), "skills", "setup-ai", "SKILL.md"),
      "utf8",
    );
    expect(raw).toMatch(/Phase E — Score and learn/u);
    expect(raw).toContain("`templates/setup-rubric.md`");
    expect(raw).toContain("`templates/setup-log.template.md`");
    expect(raw).toContain("`templates/kit-issue.template.md`");
    expect(raw).toMatch(/re-audit cadence/iu);
    const refs = [
      ...new Set(
        [...raw.matchAll(/`templates\/[^`<]+`/gu)].map(
          (m) => m[0]?.slice(1, -1) ?? "",
        ),
      ),
    ].filter((p) => p.length > 0);
    expect(refs.length).toBeGreaterThan(3);
    for (const rel of refs) {
      expect(existsSync(join(kitDir(), "skills", "setup-ai", rel)), rel).toBe(
        true,
      );
    }
  });

  it("scores ten axes with hard gates and targets", () => {
    const raw = readFileSync(
      join(kitDir(), "skills", "setup-ai", "templates", "setup-rubric.md"),
      "utf8",
    );
    for (const axis of AXES) expect(raw, axis).toContain(axis);
    expect(raw.match(/^### \d+\. /gmu) ?? [], "axis count").toHaveLength(10);
    expect(raw).toContain("## Hard gates");
    for (const gate of [
      "Zero dangling references",
      "Zero lost user files",
      "Zero manual file copies",
      "Gates ran",
      "No secrets",
      "Public-safe kit",
    ]) {
      expect(raw, gate).toContain(gate);
    }
    expect(raw).toMatch(/every one of the .*10 axes.*>= 2/s);
    expect(raw).toMatch(/mean.*>= 2\.5.*8 measurable axes/s);
    expect(raw).toMatch(/Discovery \(1\).*Domain rules \(3\).*owner-dependent/s);
    expect(raw).toMatch(/mean over axes 2, 4, 5, 6, 7, 8, 9, and 10 only/s);
    expect(raw).toMatch(/mean \(8 axes\)/s);
    expect(raw).toMatch(/simulated owner cap at 2/s);
    for (const n of MEASURABLE_AXIS_NUMBERS) {
      expect(raw, `measurable axis ${n}`).toMatch(
        new RegExp(`\\*\\*${n}\\*\\*`),
      );
    }
  });

  it("validate stays clean for every preset; adopt twice is a no-op (setup preset)", () => {
    for (const preset of presets()) {
      const root = tempDir();
      install(root, { preset });
      expect(validateKit(join(root, ".agents")), preset).toEqual([]);
    }
    const root = tempDir();
    install(root, { preset: "setup", adopt: true });
    const again = install(root, { preset: "setup", adopt: true });
    expect(
      again.filter(
        (a) => a.kind === "copy" || a.kind === "link" || a.kind === "write",
      ),
    ).toEqual([]);
    expect(validateKit(join(root, ".agents"))).toEqual([]);
    expect(checkDrift(root, join(root, ".agents"))).toEqual([]);
  });
});
