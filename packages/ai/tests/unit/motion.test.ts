import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";

function kitText(path: string): string {
  return readFileSync(join(kitDir(), path), "utf8").replace(/\s+/g, " ").toLowerCase();
}

describe("gentle motion", () => {
  it("requires purposeful motion with reduced-motion in ui-designer", () => {
    const text = kitText("agents/ui-designer.md");
    expect(text).toContain("explains a transition or preserves context");
    expect(text).toContain("prefers-reduced-motion");
    expect(text).toContain("never displacement");
    expect(text).toContain("hides what changed");
    expect(text).not.toContain("entry and exit animated by default");
  });

  it("states the motion rule with its refusal example in the ui lens", () => {
    const text = kitText("skills/review/lenses.md");
    expect(text).toContain("explains a transition or preserves context");
    expect(text).toContain("hides what changed");
    expect(text).not.toContain("gentle motion by default");
  });

  it("tells both personas that motion, where used, shows what changed", () => {
    const text = kitText("personas.template.md");
    expect(text).toContain("motion, where used, shows what changed");
    expect(text).toContain("stressed user");
  });

  it("gates UI merges on the ui-designer motion verdict", () => {
    const text = kitText("agents/verifier.md");
    expect(text).toContain("no ui-designer pass, no ready");
    expect(text).toContain("explains a transition or preserves context");
    expect(text).toContain("never displacement");
  });
});
