import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";

function skill(): string {
  return readFileSync(join(kitDir(), "skills", "evidence-grounded-analysis", "SKILL.md"), "utf8");
}

describe("evidence-grounded-analysis scope", () => {
  it("triggers on customer and user material, not any audit source", () => {
    const raw = skill();
    const description = /^description:\s*"([^"]+)"/m.exec(raw)?.[1] ?? "";
    expect(description.toLowerCase()).toContain("customer or user material");
    expect(description.toLowerCase()).not.toContain("any audit source");
    expect(description.toLowerCase()).not.toContain("audit reviews");
  });

  it("lets a technical audit answer without the source quota or a forced stop", () => {
    const text = skill().replace(/\s+/g, " ").toLowerCase();
    expect(text).toContain("technical audit");
    expect(text).toContain("skip the source-count quota");
    expect(text).toContain("wait-for-question stop");
    expect(text).toContain("fewer than 3 distinct sources");
  });
});
