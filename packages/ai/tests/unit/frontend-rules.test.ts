import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";

function kitText(path: string): string {
  return readFileSync(join(kitDir(), path), "utf8").replace(/\s+/g, " ").toLowerCase();
}

describe("frontend rules", () => {
  it("keeps the five demo and doc rules in the ui lens", () => {
    const text = kitText("skills/review/lenses.md");
    expect(text).toContain("one demo = one file");
    expect(text).toContain("one shared frame");
    expect(text).toContain("doc pages stay thin");
    expect(text).toContain("zero raw structural html");
    expect(text).toContain("bans bulk imports");
  });

  it("routes ui and frontend-quality through composition and examined screenshots", () => {
    const text = kitText("skills/review/lenses.md");
    expect(text).toContain("kit/composition/hierarchy/state findings");
    expect(text).toContain("examined screenshots");
    expect(text).toContain("design critique");
  });

  it("requires a design critique and examined screenshots in ui-designer", () => {
    const text = kitText("agents/ui-designer.md");
    expect(text).toContain("**design critique.**");
    expect(text).toContain("what has visual authority");
    expect(text).toContain("generated-but-unread");
    expect(text).toContain("do not copy a weak pattern");
    expect(text).toContain("one surface role");
    expect(text).toContain("min-h-svh");
    expect(text).toContain("overlay is a sibling");
    expect(text).toContain(".rdp-day");
    expect(text).toContain("overflow-clip");
  });

  it("treats visual gates as necessary not sufficient", () => {
    const dod = kitText("skills/definition-of-done/SKILL.md");
    expect(dod).toContain("necessary, not sufficient");
    expect(dod).toContain("rendered-page critique");
    expect(dod).toContain("self-assigned score");
    const verifier = kitText("agents/verifier.md");
    expect(verifier).toContain("necessary, not sufficient");
    expect(verifier).toContain("self-assigned score is not ready");
  });
});
