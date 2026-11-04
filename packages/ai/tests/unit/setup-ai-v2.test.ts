import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { installKit } from "#install.js";
import { readManifest } from "#kit.js";
import { checkDrift, validateKit } from "#validate.js";
import { kitDir } from "#kit.js";
import { tempDir } from "./helpers.js";

const KIT_TEMPLATE_PATHS = [
  "skills/setup-ai/templates/README.md",
  "skills/setup-ai/templates/product.template.md",
  "skills/setup-ai/templates/domain/booking.template.md",
  "skills/setup-ai/templates/personas-v2.template.md",
  "skills/setup-ai/templates/design.template.md",
  "skills/setup-ai/templates/glossary.template.md",
  "skills/setup-ai/templates/catalog/add-capability/SKILL.md.tmpl",
  "skills/setup-ai/templates/catalog/add-migration/SKILL.md.tmpl",
  "skills/setup-ai/templates/catalog/domain-change/SKILL.md.tmpl",
];

function install(dest: string, options: Omit<Parameters<typeof installKit>[0], "dest"> = {}) {
  const result = installKit({ dest, providers: ["cursor"], ...options });
  if (!result.ok) throw result.error;
  return result.value;
}

describe("setup-ai v2 kit", () => {
  it("ships artifact and catalog templates under setup-ai/templates in the kit", () => {
    const kit = kitDir();
    for (const rel of KIT_TEMPLATE_PATHS) {
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
    expect(raw).toContain("templates/README.md");
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

  it("installs templates beside setup-ai for every preset that ships setup-ai; validate stays clean", () => {
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    for (const preset of ["starter", "setup", "core", "full"] as const) {
      const root = tempDir();
      install(root, { preset });
      const agents = join(root, ".agents");
      expect(validateKit(agents), preset).toEqual([]);
      const templates = join(agents, "skills", "setup-ai", "templates");
      expect(existsSync(templates), preset).toBe(true);
      expect(existsSync(join(templates, "README.md")), preset).toBe(true);
      expect(existsSync(join(templates, "catalog", "domain-change", "SKILL.md.tmpl")), preset).toBe(
        true,
      );
    }
  });

  it("init --adopt twice is a no-op and validate stays clean (setup preset)", () => {
    const root = tempDir();
    install(root, { preset: "setup", adopt: true });
    const again = install(root, { preset: "setup", adopt: true });
    expect(again.filter((a) => a.kind === "copy" || a.kind === "link" || a.kind === "write")).toEqual([]);
    expect(validateKit(join(root, ".agents"))).toEqual([]);
    expect(checkDrift(root, join(root, ".agents"))).toEqual([]);
  });

  it("every templates/ path referenced in setup-ai SKILL.md exists in the kit tree", () => {
    const raw = readFileSync(join(kitDir(), "skills", "setup-ai", "SKILL.md"), "utf8");
    const refs = templateRefs(raw);
    expect(refs.length).toBeGreaterThan(3);
    for (const rel of refs) {
      expect(existsSync(join(kitDir(), "skills", "setup-ai", rel)), rel).toBe(true);
    }
  });

  it("every templates/ path referenced in setup-ai SKILL.md exists after install", () => {
    const root = tempDir();
    install(root, { preset: "setup" });
    const raw = readFileSync(join(root, ".agents", "skills", "setup-ai", "SKILL.md"), "utf8");
    for (const rel of templateRefs(raw)) {
      expect(existsSync(join(root, ".agents", "skills", "setup-ai", rel)), rel).toBe(true);
    }
  });
});

function templateRefs(markdown: string): string[] {
  return [
    ...new Set(
      [...markdown.matchAll(/`templates\/[^`<]+`/gu)]
        .map((m) => m[0]?.slice(1, -1) ?? "")
        .filter((p) => p.length > 0),
    ),
  ];
}
