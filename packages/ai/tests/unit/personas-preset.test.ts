import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { installKit } from "#install.js";
import { readManifest } from "#kit.js";
import { validateKit } from "#validate.js";
import { tempDir } from "./helpers.js";

function install(dest: string, options: Omit<Parameters<typeof installKit>[0], "dest"> = {}) {
  const result = installKit({ dest, providers: [], ...options });
  if (!result.ok) throw result.error;
  return result.value;
}

function personas(dest: string): string {
  return readFileSync(join(dest, ".agents/personas.md"), "utf8");
}

describe("personas template per preset", () => {
  it("setup installs the v2 schema; starter, core and full keep v1", () => {
    const setup = tempDir();
    install(setup, { preset: "setup" });
    const v2 = personas(setup);
    expect(v2).toContain("# Project personas (v2)");
    expect(v2).toMatch(/\| Goals /);
    expect(v2).toMatch(/Jobs to be done/);
    expect(v2).toMatch(/Frustrations/);
    expect(v2).toMatch(/journeys/);
    expect(v2).toMatch(/Evidence/);
    expect(v2).toMatch(/routes/);
    expect(v2).toContain("replace in phase C");
    expect(v2).toContain("Acme Bookings");
    expect(v2).not.toMatch(/\| Task /);

    for (const preset of ["starter", "core", "full"] as const) {
      const dest = tempDir();
      install(dest, { preset });
      const v1 = personas(dest);
      expect(v1, preset).toContain("| Task ");
      expect(v1, preset).toContain("| Bar ");
      expect(v1, preset).toContain("Lazy end client");
      expect(v1, preset).not.toContain("# Project personas (v2)");
      expect(v1, preset).not.toContain("replace in phase C");
    }
  });

  it("every shipped preset validates after install", () => {
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    for (const preset of Object.keys(manifest.value.presets)) {
      const dest = tempDir();
      install(dest, { preset });
      expect(validateKit(join(dest, ".agents")), preset).toEqual([]);
    }
  });

  it("setup init --adopt a second time is a no-op for personas.md", () => {
    const dest = tempDir();
    install(dest, { preset: "setup", adopt: true });
    const first = personas(dest);
    const again = install(dest, { preset: "setup", adopt: true });
    expect(again.filter((a) => a.kind === "copy" || a.kind === "link" || a.kind === "write")).toEqual([]);
    expect(personas(dest)).toBe(first);
    expect(existsSync(join(dest, ".agents/personas.kit.md"))).toBe(false);
    expect(validateKit(join(dest, ".agents"))).toEqual([]);
  });

  it("adopt keeps a user's personas.md and writes a kit sidecar", () => {
    const dest = tempDir();
    mkdirSync(join(dest, ".agents"), { recursive: true });
    writeFileSync(join(dest, ".agents/personas.md"), "custom personas\n");
    const actions = install(dest, { preset: "setup", adopt: true });
    expect(personas(dest)).toBe("custom personas\n");
    expect(readFileSync(join(dest, ".agents/personas.kit.md"), "utf8")).toContain("# Project personas (v2)");
    expect(actions).toContainEqual(
      expect.objectContaining({ kind: "copy", path: join(".agents", "personas.kit.md") }),
    );
    expect(validateKit(join(dest, ".agents"))).toEqual([]);
  });
});
