import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { installKit } from "#install.js";
import { kitDir, readManifest } from "#kit.js";
import { validateKit } from "#validate.js";
import { tempDir } from "./helpers.js";

function read(rel: string): string {
  return readFileSync(join(kitDir(), rel), "utf8");
}

describe("compose-ui skill", () => {
  it("has valid frontmatter matching the folder name and a trigger", () => {
    const raw = read("skills/compose-ui/SKILL.md");
    expect(/^name:\s*compose-ui\s*$/m.test(raw)).toBe(true);
    const description = /^description:\s*"([^"]+)"/m.exec(raw)?.[1] ?? "";
    expect(description).toMatch(/Use when/);
    expect(description.toLowerCase()).toContain("persona chain");
    expect(description).not.toContain("\n");
  });

  it("requires the brief in chain order before any UI edit", () => {
    const text = read("skills/compose-ui/SKILL.md").replace(/\s+/g, " ").toLowerCase();
    const order = ["métier", "client personas", "customers", "customer personas", "ui decisions"].map((word) =>
      text.indexOf(word),
    );
    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(text).toContain("before any ui edit");
    expect(text).toContain("because");
  });

  it("encodes the art-direction rules", () => {
    const text = read("skills/compose-ui/SKILL.md").replace(/\s+/g, " ").toLowerCase();
    for (const rule of [
      "composition per use case",
      "one focal point per band",
      "glass is selective",
      "page, specimen stage, overlay",
      "type roles, not heading levels",
      "16px minimum belongs to form controls",
      "adaptive interview",
    ]) {
      expect(text, rule).toContain(rule);
    }
  });

  it("ships in setup and core, not starter, and ui-designer points at it", () => {
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    const { presets } = manifest.value;
    expect(presets.setup).toContain("compose-ui");
    expect(presets.core).toContain("compose-ui");
    expect(presets.starter).not.toContain("compose-ui");
    expect(read("agents/ui-designer.md")).toContain("/compose-ui");
  });

  it("installs closed and valid in every preset that carries it", () => {
    for (const preset of ["setup", "core", "full"]) {
      const dest = tempDir();
      const result = installKit({ dest, preset, providers: [] });
      expect(result.ok, preset).toBe(true);
      expect(validateKit(join(dest, ".agents")), preset).toEqual([]);
      expect(readFileSync(join(dest, ".agents", "skills", "compose-ui", "SKILL.md"), "utf8")).toContain("compose-ui");
    }
  });
});
