import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveConditionals, withoutMarkers, type Availability } from "#conditional.js";
import { installKit } from "#install.js";
import { put, tempDir } from "./helpers.js";

const AVAIL: Availability = {
  skills: new Set(["tdd"]),
  agents: new Set(["verifier"]),
  commands: new Set(["review"]),
};

const UNIVERSE: Availability = {
  skills: new Set(["tdd", "plan"]),
  agents: new Set(["verifier", "architect"]),
  commands: new Set(["review"]),
};

describe("resolveConditionals", () => {
  it("keeps available blocks with markers stripped", () => {
    const text = "a\n<!-- if:skill=tdd -->\nUse `tdd`.\n<!-- /if -->\nb\n";
    expect(resolveConditionals(text, AVAIL)).toBe("a\nUse `tdd`.\nb\n");
  });

  it("drops unavailable blocks entirely", () => {
    const text = "a\n<!-- if:skill=plan -->\nUse `plan`.\n<!-- /if -->\nb\n";
    expect(resolveConditionals(text, AVAIL)).toBe("a\nb\n");
  });

  it("resolves inline markers without leaving double spaces", () => {
    const text = "format.<!-- if:skill=tdd --> See `tdd`.<!-- /if --> Next.\n";
    expect(resolveConditionals(text, AVAIL)).toBe("format. See `tdd`. Next.\n");
    expect(resolveConditionals("format.<!-- if:skill=plan --> See `plan`.<!-- /if --> Next.\n", AVAIL)).toBe(
      "format. Next.\n",
    );
  });

  it("evaluates nested blocks inside out", () => {
    const text = "<!-- if:skill=tdd -->a<!-- if:skill=plan -->b<!-- /if -->c<!-- /if -->";
    expect(resolveConditionals(text, AVAIL)).toBe("ac");
    expect(resolveConditionals(text, { skills: new Set(), agents: new Set(), commands: new Set() })).toBe("");
  });

  it("tests agents and commands by their own kind", () => {
    expect(resolveConditionals("<!-- if:agent=verifier -->v<!-- /if -->", AVAIL)).toBe("v");
    expect(resolveConditionals("<!-- if:agent=architect -->a<!-- /if -->", AVAIL)).toBe("");
    expect(resolveConditionals("<!-- if:command=review -->r<!-- /if -->", AVAIL)).toBe("r");
  });

  it("rejoins table rows across a dropped block", () => {
    const text = "| A |\n| - |\n| one |\n\n<!-- if:skill=plan -->\n| two |\n<!-- /if -->\n\n| three |\n";
    expect(resolveConditionals(text, AVAIL)).toBe("| A |\n| - |\n| one |\n| three |\n");
  });

  it("leaves plain text without markers untouched", () => {
    const text = "no markers here\n<!-- a plain comment -->\n";
    expect(resolveConditionals(text, AVAIL)).toBe(text);
  });

  it("throws on unbalanced markers", () => {
    expect(() => resolveConditionals("<!-- if:skill=tdd -->oops\n", AVAIL)).toThrow("unbalanced conditional");
    expect(() => resolveConditionals("oops\n<!-- /if -->\n", AVAIL)).toThrow("unbalanced conditional");
  });

  it("throws on malformed conditions", () => {
    expect(() => resolveConditionals("<!-- if:tool=tdd -->x<!-- /if -->", AVAIL)).toThrow("bad conditional");
    expect(() => resolveConditionals("<!-- if:skill= -->x<!-- /if -->", AVAIL)).toThrow("bad conditional");
  });

  it("throws on unknown names when the universe is given", () => {
    expect(() => resolveConditionals("<!-- if:skill=nope -->x<!-- /if -->", AVAIL, UNIVERSE)).toThrow(
      'unknown conditional target: skill "nope"',
    );
  });

  it("treats unknown names as unavailable without a universe", () => {
    expect(resolveConditionals("<!-- if:skill=nope -->x<!-- /if -->", AVAIL)).toBe("");
  });

  it("withoutMarkers strips markers but keeps content", () => {
    expect(withoutMarkers("a<!-- if:skill=tdd -->b<!-- /if -->c")).toBe("abc");
    expect(withoutMarkers("<!-- /if -->")).toBe("");
  });
});

describe("conditional install failures", () => {
  function foreignKit(skillBody: string): string {
    const kit = tempDir();
    put(kit, "kit.json", JSON.stringify({ presets: { starter: ["alpha"] }, agents: [], commands: [] }));
    put(kit, "skills/alpha/SKILL.md", `---\nname: alpha\ndescription: "Does alpha. Use when needed."\n---\n\n${skillBody}\n`);
    put(kit, "AGENTS.template.md", "# T\n\n## Before writing any code\n\nladder\n");
    return kit;
  }

  it("fails before writing when a kit file has unbalanced markers", () => {
    const dest = tempDir();
    const kit = foreignKit("text\n<!-- if:skill=alpha -->\nunclosed\n");
    const result = installKit({ dest, kit, preset: "starter", providers: [] });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toContain("unbalanced conditional");
    expect(existsSync(join(dest, ".agents"))).toBe(false);
  });

  it("fails before writing when a conditional names a skill the kit does not ship", () => {
    const dest = tempDir();
    const kit = foreignKit("<!-- if:skill=ghost -->x<!-- /if -->\n");
    const result = installKit({ dest, kit, preset: "starter", providers: [] });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toContain('unknown conditional target: skill "ghost"');
    expect(existsSync(join(dest, ".agents"))).toBe(false);
  });

  it("fails before writing when a template names an uninstalled kit skill", () => {
    const dest = tempDir();
    const kit = tempDir();
    put(kit, "kit.json", JSON.stringify({ presets: { starter: ["alpha"] }, agents: [], commands: [] }));
    put(kit, "skills/alpha/SKILL.md", `---\nname: alpha\ndescription: "Does alpha. Use when needed."\n---\n`);
    put(kit, "skills/beta/SKILL.md", `---\nname: beta\ndescription: "Does beta. Use when needed."\n---\n`);
    put(kit, "AGENTS.template.md", "# T\n\nSee the `beta` skill.\n");
    const result = installKit({ dest, kit, preset: "starter", providers: [] });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toContain('AGENTS.md: references skill "beta"');
    expect(existsSync(join(dest, ".agents"))).toBe(false);
  });
});
