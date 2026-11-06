import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/** Error fragments the validate-errors doc quotes, and the source file owning each. */
const QUOTED: Array<{ fragment: string; src: string }> = [
  { fragment: "differs from", src: "validate.ts" },
  { fragment: "user copy kept", src: "validate.ts" },
  { fragment: "copy missing", src: "validate.ts" },
  { fragment: "or re-run init", src: "validate.ts" },
  { fragment: "names no installed skill", src: "validate.ts" },
  { fragment: "duplicate skill name", src: "validate.ts" },
  { fragment: "lists missing", src: "validate.ts" },
  { fragment: "no such directory", src: "cli.ts" },
];

const DOC = "apps/docs/prose/ai/check-that-skills-subagents-commands-and-provider-copies-are-valid.mdx";

function repoFile(rel: string): string {
  return readFileSync(fileURLToPath(new URL(`../../../../${rel}`, import.meta.url)), "utf8");
}

describe("validate-errors doc", () => {
  it("quotes error strings that still exist in source, and source still matches the doc", () => {
    const doc = repoFile(DOC);
    for (const { fragment, src } of QUOTED) {
      const text = repoFile(`packages/ai/src/${src}`);
      expect(text, `${src} drifted from doc`).toContain(fragment);
      expect(doc, `doc drifted from ${src}`).toContain(fragment);
    }
  });

  it("never uses the retired problem(s) summary form", () => {
    for (const rel of [DOC, "packages/ai/src/cli.ts", "packages/ai/src/validate.ts"]) {
      expect(repoFile(rel), rel).not.toContain("problem(s)");
    }
  });
});
