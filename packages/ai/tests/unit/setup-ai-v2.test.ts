import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";

const ARTIFACT_TEMPLATES = [
  "artifacts/product.template.md",
  "artifacts/domain/booking.template.md",
  "artifacts/personas-v2.template.md",
  "artifacts/design.template.md",
  "artifacts/glossary.template.md",
  "artifacts/README.md",
  "artifacts/skills/add-capability/SKILL.md",
  "artifacts/skills/add-migration/SKILL.md",
  "artifacts/skills/domain-change/SKILL.md",
];

describe("setup-ai v2 kit", () => {
  it("ships artifact and catalog skill templates under kit/artifacts", () => {
    const kit = kitDir();
    for (const rel of ARTIFACT_TEMPLATES) {
      const path = join(kit, rel);
      expect(existsSync(path), `missing ${rel}`).toBe(true);
      expect(readFileSync(path, "utf8").length, rel).toBeGreaterThan(40);
    }
  });

  it("documents phased audit, discovery, build, and catalog skills", () => {
    const raw = readFileSync(join(kitDir(), "skills", "setup-ai", "SKILL.md"), "utf8");
    expect(raw).toMatch(/Phase A — Audit/u);
    expect(raw).toMatch(/Phase B — Discovery/u);
    expect(raw).toMatch(/Phase C — Build/u);
    expect(raw).toMatch(/Phase D — Catalog/u);
    expect(raw.toLowerCase()).toContain("artifacts/readme.md");
  });

  it("limits the batched interview to at most eight questions", () => {
    const raw = readFileSync(join(kitDir(), "skills", "setup-ai", "SKILL.md"), "utf8");
    expect(raw).toMatch(/at most eight questions/iu);
    expect(raw).toMatch(/8\. Explicit \*\*non-goals\*\*/u);
    const block = raw.slice(raw.indexOf("Suggested set"), raw.indexOf("3. Record answers"));
    const questions = [...block.matchAll(/^\s{3}\d+\.\s/gm)];
    expect(questions.length).toBe(8);
  });

  it("documents tagging owner answers with source: owner", () => {
    const raw = readFileSync(join(kitDir(), "skills", "setup-ai", "SKILL.md"), "utf8");
    expect(raw).toContain("source: owner");
    expect(raw).toMatch(/\*\*`source: owner`\*\*/u);
  });
});
