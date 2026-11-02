import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const pkgDir = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const repoRoot = join(pkgDir, "..", "..");
const manifest = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));

function exportTargets() {
  const out = [manifest.main, manifest.types, ...(manifest.files ?? [])];
  for (const value of Object.values(manifest.exports ?? {})) {
    if (typeof value === "string") out.push(value);
    else if (value && typeof value === "object") out.push(...Object.values(value));
  }
  if (manifest.bin && typeof manifest.bin === "object") {
    out.push(...Object.values(manifest.bin));
  }
  return [...new Set(out.filter((t) => typeof t === "string"))];
}

describe("config-only dogfood (verdict a)", () => {
  it("maps every manifest target to committed source, never dist/", () => {
    expect(manifest.zedkit?.noBuild).toBe(true);
    expect(manifest.scripts?.build).toBeUndefined();
    const targets = exportTargets();
    expect(targets.length).toBeGreaterThan(0);
    for (const target of targets) {
      expect(target, "dist-mapped target").not.toContain("dist/");
      expect(existsSync(join(pkgDir, target)), `missing ${target}`).toBe(true);
    }
  });

  it("is consumed by name from the repo root config, with the preset file gone", () => {
    const rootConfig = readFileSync(join(repoRoot, "eslint.config.mjs"), "utf8");
    expect(rootConfig).toContain('from "@zedtech/zedkit-quality"');
    expect(rootConfig).toContain("uiPreset({");
    expect(rootConfig).toContain('preset: "feature-folders"');
    expect(rootConfig).not.toContain("eslint/ui-preset");
    expect(existsSync(join(repoRoot, "eslint", "ui-preset.mjs"))).toBe(false);
  });
});
