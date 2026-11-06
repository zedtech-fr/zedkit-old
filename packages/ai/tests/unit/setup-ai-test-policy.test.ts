import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { installKit } from "#install.js";
import { kitDir } from "#kit.js";
import { applyTestPolicyToAgentsMd } from "#test-policy.js";
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
const OBSERVED_HEADING = "### Observed commands";
const RECOMMEND_HEADING = "### Test recommendation";

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

function section(md: string, heading: string, next: string): string {
  const start = md.indexOf(heading);
  const end = next === "" ? md.length : md.indexOf(next, start + heading.length);
  return start < 0 || end < 0 ? "" : md.slice(start, end);
}

function installSetup(dest: string): void {
  const result = installKit({ dest, preset: "setup", providers: ["cursor"] });
  if (!result.ok) throw result.error;
}

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
    expect(skill).toMatch(/Playwright/u);
    expect(skill).not.toMatch(/add (at least )?\d+ e2e/iu);

    const agents = readKit("AGENTS.template.md");
    expect(agents).toContain(OBSERVED_HEADING);
    expect(agents).toContain(RECOMMEND_HEADING);
    expect(agents).toMatch(PRIMARY);
    expect(agents).toMatch(PACT);
    expect(agents).toMatch(CRITICAL);
    expect(agents).toContain(NO_DELETE);
    expect(agents.split("\n").length).toBeLessThanOrEqual(76);

    const nested = readSkill("templates", "nested-agents.template.md");
    expect(nested).toMatch(PRIMARY);
    expect(nested).toMatch(/label it observed/u);

    const personas = readSkill("templates", "personas-v2.template.md");
    expect(personas).toContain("tests/booking/checkout.test.ts");
    expect(personas).toMatch(/observed, not recommended/u);
    expect(personas).toMatch(/not a recommendation to add E2E/u);

    const addCap = readSkill("templates", "catalog", "add-capability", "SKILL.md.tmpl");
    expect(addCap).toMatch(PRIMARY);

    expect(readKit("skills", "tdd", "tests.md")).toMatch(/do not start with a browser spec/u);
    expect(readKit("skills", "adversarial-tests", "SKILL.md")).toMatch(/Contract \/ Pact/u);

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
    expect(readKit("agents", "test-writer.md")).toMatch(/do not add e2e files/u);
  });

  it("fills Observed vs Test recommendation from scripts without inventing an E2E count", () => {
    const template = readKit("AGENTS.template.md");
    const filled = applyTestPolicyToAgentsMd(template, {
      test: "vitest",
      "test:unit": "vitest run",
      "test:e2e": "playwright test",
      "test:e2e:chrome": "playwright test --project=chromium",
    });
    const observed = section(filled, OBSERVED_HEADING, RECOMMEND_HEADING);
    const recommended = section(filled, RECOMMEND_HEADING, "## Map");
    expect(observed).toContain("pnpm test:e2e");
    expect(observed).toContain("observed; not the desired recommendation");
    expect(recommended).toContain("pnpm test:unit");
    expect(recommended).not.toMatch(/playwright/iu);
    expect(recommended).not.toContain("test:e2e");
    expect(filled).not.toMatch(/run \d+ e2e/iu);
  });

  it("generated setup output lists a legacy E2E battery as observed, not recommended", () => {
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
            "test:integration": "vitest run tests/integration",
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
    installSetup(dest);

    expect(readFileSync(join(dest, ".github/workflows/e2e.yml"), "utf8")).toBe(LEGACY_CI);
    expect(JSON.parse(readFileSync(join(dest, "package.json"), "utf8")).scripts["test:e2e:chrome"]).toBe(
      "playwright test --project=chromium",
    );

    const agents = readFileSync(join(dest, "AGENTS.md"), "utf8");
    const observed = section(agents, OBSERVED_HEADING, RECOMMEND_HEADING);
    const recommended = section(agents, RECOMMEND_HEADING, "## Map");
    expect(observed).toContain("pnpm test:e2e:chrome");
    expect(observed).toMatch(/playwright|test:e2e/iu);
    expect(recommended).toMatch(PRIMARY);
    expect(recommended).toContain("pnpm test:unit");
    expect(recommended).toContain("pnpm test:integration");
    expect(recommended).not.toMatch(/playwright/iu);
    expect(recommended).not.toContain("test:e2e");
    expect(agents).not.toMatch(/run \d+ e2e/iu);

    expect(existsSync(join(dest, ".github/workflows/e2e.yml"))).toBe(true);
    expect(validateKit(join(dest, ".agents"))).toEqual([]);
    expect(checkDrift(dest, join(dest, ".agents"))).toEqual([]);
  });

  it("does not invent Playwright when the fixture only has unit and integration scripts", () => {
    const dest = tempDir();
    put(
      dest,
      "package.json",
      `${JSON.stringify(
        {
          name: "unit-only",
          private: true,
          scripts: { test: "vitest", "test:unit": "vitest run", "test:integration": "vitest run -c vitest.int.ts" },
        },
        null,
        2,
      )}\n`,
    );
    installSetup(dest);
    const agents = readFileSync(join(dest, "AGENTS.md"), "utf8");
    expect(agents).not.toMatch(/playwright|cypress|test:e2e/iu);
    expect(section(agents, RECOMMEND_HEADING, "## Map")).toContain("pnpm test:unit");
    expect(section(agents, OBSERVED_HEADING, RECOMMEND_HEADING)).toContain("pnpm test:integration");
  });
});
