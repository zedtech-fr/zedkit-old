import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { installKit } from "#install.js";
import { kitDir } from "#kit.js";
import { checkDrift, validateKit } from "#validate.js";
import { put, tempDir } from "./helpers.js";

const skillDir = join(kitDir(), "skills", "setup-ai");
const readKit = (...rel: string[]): string => readFileSync(join(kitDir(), ...rel), "utf8");
const readSkill = (...rel: string[]): string => readFileSync(join(skillDir, ...rel), "utf8");

const PRIMARY = /unit and integration tests are primary/iu;
const PACT = /Contract or Pact tests when a boundary earns them/u;
const CRITICAL = /explicitly justified critical\s+user path/u;
const OBSERVED = "Observed commands and CI are not the desired recommendation";
const NO_DELETE = "Do not delete or change existing CI unless the owner asked";

const LEGACY_CI = `name: e2e
on: [push]
jobs:
  e2e:
    strategy:
      matrix:
        browser: [chromium, firefox, webkit, mobile]
    steps:
      - run: npx playwright test --project=\${{ matrix.browser }}
`;

describe("setup-ai product output: test recommendations", () => {
  it("canonical skill, templates, rules and prompts carry the layer policy", () => {
    const skill = readSkill("SKILL.md");
    expect(skill).toContain(OBSERVED);
    expect(skill).toMatch(PRIMARY);
    expect(skill).toMatch(PACT);
    expect(skill).toMatch(CRITICAL);
    expect(skill).toContain("Do not add a broad browser or E2E CI battery by default");
    expect(skill).toContain("Do not set an arbitrary E2E count or budget");
    expect(skill).toContain(NO_DELETE);
    expect(skill).not.toMatch(/add (at least )?\d+ e2e/iu);

    const agents = readKit("AGENTS.template.md");
    expect(agents).toMatch(PRIMARY);
    expect(agents).toMatch(PACT);
    expect(agents).toMatch(CRITICAL);
    expect(agents).toContain(OBSERVED);
    expect(agents).toContain(NO_DELETE);
    expect(agents.split("\n").length).toBeLessThanOrEqual(76);

    const nested = readSkill("templates", "nested-agents.template.md");
    expect(nested).toMatch(PRIMARY);
    expect(nested).toMatch(CRITICAL);

    const personas = readSkill("templates", "personas-v2.template.md");
    expect(personas).toMatch(/observed coverage/iu);
    expect(personas).toMatch(/not a recommendation to add E2E/u);

    const addCap = readSkill("templates", "catalog", "add-capability", "SKILL.md.tmpl");
    expect(addCap).toMatch(PRIMARY);
    expect(addCap).toMatch(PACT);
    expect(addCap).toMatch(CRITICAL);

    for (const [name, text] of [
      ["adversarial-tests", readKit("skills", "adversarial-tests", "SKILL.md")],
      ["definition-of-done", readKit("skills", "definition-of-done", "SKILL.md")],
      ["tdd", readKit("skills", "tdd", "SKILL.md")],
      ["test-writer", readKit("agents", "test-writer.md")],
      ["architect", readKit("agents", "architect.md")],
    ] as const) {
      expect(text, name).toMatch(PRIMARY);
      expect(text, name).toMatch(CRITICAL);
    }
  });

  it("generated setup output carries the policy; a legacy E2E battery stays observed, not recommended", () => {
    const dest = tempDir();
    put(
      dest,
      "package.json",
      `${JSON.stringify(
        {
          name: "legacy-overtest",
          private: true,
          scripts: {
            test: "vitest",
            "test:unit": "vitest run",
            "test:e2e": "playwright test",
            "test:e2e:chrome": "playwright test --project=chromium",
            "test:e2e:firefox": "playwright test --project=firefox",
            "test:e2e:webkit": "playwright test --project=webkit",
            "test:e2e:mobile": "playwright test --project=mobile",
          },
        },
        null,
        2,
      )}\n`,
    );
    put(dest, ".github/workflows/e2e.yml", LEGACY_CI);

    const result = installKit({ dest, preset: "setup", providers: ["cursor"] });
    if (!result.ok) throw result.error;

    expect(readFileSync(join(dest, ".github/workflows/e2e.yml"), "utf8")).toBe(LEGACY_CI);
    expect(JSON.parse(readFileSync(join(dest, "package.json"), "utf8")).scripts["test:e2e:chrome"]).toBe(
      "playwright test --project=chromium",
    );

    const agents = readFileSync(join(dest, "AGENTS.md"), "utf8");
    expect(agents).toMatch(PRIMARY);
    expect(agents).toContain(OBSERVED);
    expect(agents).toContain(NO_DELETE);
    expect(agents).not.toMatch(/playwright/iu);
    expect(agents).not.toContain("test:e2e:chrome");

    const installedSkill = readFileSync(join(dest, ".agents/skills/setup-ai/SKILL.md"), "utf8");
    expect(installedSkill).toContain(OBSERVED);
    expect(installedSkill).toMatch(PRIMARY);
    expect(installedSkill).toContain(NO_DELETE);
    expect(installedSkill).toContain("Do not add a broad browser or E2E CI battery by default");

    const adversarial = readFileSync(join(dest, ".agents/skills/adversarial-tests/SKILL.md"), "utf8");
    expect(adversarial).toMatch(PRIMARY);
    expect(adversarial).toMatch(CRITICAL);

    const addCap = readFileSync(
      join(dest, ".agents/skills/setup-ai/templates/catalog/add-capability/SKILL.md.tmpl"),
      "utf8",
    );
    expect(addCap).toMatch(PRIMARY);

    expect(existsSync(join(dest, ".github/workflows/e2e.yml"))).toBe(true);
    expect(validateKit(join(dest, ".agents"))).toEqual([]);
    expect(checkDrift(dest, join(dest, ".agents"))).toEqual([]);
  });
});
