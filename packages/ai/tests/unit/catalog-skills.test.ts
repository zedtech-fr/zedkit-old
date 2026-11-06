import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";
import { validateKit } from "#validate.js";
import { put, tempDir } from "./helpers.js";

const catalog = join(kitDir(), "skills", "setup-ai", "templates", "catalog");
const names = readdirSync(catalog).sort();

describe("catalog skills are ready to install", () => {
  it("ships the three known skills", () => {
    expect(names).toEqual(["add-capability", "add-migration", "domain-change"]);
  });

  it.each(names)("%s has frontmatter, a trigger, and no placeholder text", (name) => {
    const raw = readFileSync(join(catalog, name, "SKILL.md.tmpl"), "utf8");
    expect(raw.startsWith("---\n")).toBe(true);
    expect(new RegExp(`^name:\\s*${name}\\s*$`, "m").test(raw)).toBe(true);
    expect(/^description:\s*"[^"\n]*Use when[^"\n]*"$/m.test(raw)).toBe(true);
    expect(raw).not.toMatch(/^Template\b/mu);
    expect(raw).not.toMatch(/placeholder|<[a-z][a-z-]*>|booking/iu);
    expect(raw).not.toMatch(/<!--/u);
  });

  it.each(names)("%s installs with one cp and validates against a phase C tree", (name) => {
    const root = tempDir();
    put(root, ".agents/product.md", "# Product\n");
    put(root, ".agents/domain/area.md", "# Area\n");
    const dir = join(root, ".agents", "skills", name);
    mkdirSync(dir, { recursive: true });
    copyFileSync(join(catalog, name, "SKILL.md.tmpl"), join(dir, "SKILL.md"));
    expect(validateKit(join(root, ".agents"))).toEqual([]);
    const links = [...readFileSync(join(dir, "SKILL.md"), "utf8").matchAll(/\]\(([^)#\s]+)\)/gu)].map((m) => m[1] ?? "");
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) expect(existsSync(join(dir, link)), link).toBe(true);
  });
});
