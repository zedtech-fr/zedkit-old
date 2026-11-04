import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";

function skill(): string {
  return readFileSync(join(kitDir(), "skills", "use-signature", "SKILL.md"), "utf8");
}

describe("use-signature scope", () => {
  it("triggers on type, motion, composition and identity UI, not any UI", () => {
    const raw = skill();
    const description = /^description:\s*"([^"]+)"/m.exec(raw)?.[1] ?? "";
    expect(description.toLowerCase()).toContain("type, motion, composition");
    expect(description.toLowerCase()).toContain("identity ui");
    expect(description.toLowerCase()).toContain("skip kit primitives");
    expect(description.toLowerCase()).not.toContain("any ui");
  });

  it("keeps this-repo paths out of the shipped skill", () => {
    const text = skill().replace(/\s+/g, " ");
    expect(text).not.toContain("docs/design/signature.md");
    expect(text).not.toContain("identity-state-matrix");
    expect(text).not.toContain("apps/docs");
  });

  it("branches skip, primitive-own-look, and follow", () => {
    const text = skill().replace(/\s+/g, " ").toLowerCase();
    expect(text).toContain("no signature spec and no identity surface");
    expect(text).toContain("primitive owns its look");
    expect(text).toContain("do not copy the tables");
    expect(text).toContain("named type roles");
    expect(text).toContain("quota copy names a real retry time");
  });

  it("tells setup-ai to point nested AGENTS.md at signature and state matrix", () => {
    const text = readFileSync(join(kitDir(), "skills", "setup-ai", "SKILL.md"), "utf8")
      .replace(/\s+/g, " ")
      .toLowerCase();
    expect(text).toContain("missing signature pointer");
    expect(text).toContain("state-matrix");
    expect(text).toContain("do not copy the spec");
    expect(text).not.toContain("`use-signature`");
  });

  it("points this repo's docs AGENTS.md at the signature spec and state matrix", () => {
    const root = fileURLToPath(new URL("../../../../", import.meta.url));
    const text = readFileSync(join(root, "apps/docs/AGENTS.md"), "utf8");
    expect(text).toContain("docs/design/signature.md");
    expect(text).toContain("tests/identity-state-matrix.spec.ts");
    expect(text).toContain("use-signature");
  });
});
