import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";

function src(rel: string): string {
  return readFileSync(fileURLToPath(new URL(`../../../../packages/ai/src/${rel}`, import.meta.url)), "utf8");
}

describe("model guidance", () => {
  it("states omit-or-inherit the same way in template, skill and validator", () => {
    const template = readFileSync(`${kitDir()}/AGENTS.template.md`, "utf8");
    const skill = readFileSync(`${kitDir()}/skills/rules-upkeep/SKILL.md`, "utf8");
    expect(template).toContain("omit it, or `inherit`");
    expect(skill).toContain("omit it, or `inherit`");
    expect(src("validate.ts")).toContain('omitted or "inherit"');
  });

  it("points template and skill at tokenomics.md instead of naming models", () => {
    const template = readFileSync(`${kitDir()}/AGENTS.template.md`, "utf8");
    const skill = readFileSync(`${kitDir()}/skills/rules-upkeep/SKILL.md`, "utf8");
    expect(template).toContain("never name a model in a source file");
    expect(template).toContain(".agents/tokenomics.md");
    expect(skill).toContain("never name one here, see `.agents/tokenomics.md`");
  });
});
