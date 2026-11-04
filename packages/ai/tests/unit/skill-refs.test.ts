import { describe, expect, it } from "vitest";
import { backtickedRefNames, skillRefNames, wordRefNames, type RefUniverse } from "#skill-refs.js";

const UNIVERSE: RefUniverse = {
  skills: new Set(["tdd", "codebase-design"]),
  agents: new Set(["a11y-auditor", "copywriter"]),
  commands: new Set(["plan"]),
};

describe("skillRefNames", () => {
  it("reads Skill tool quotes, backticks, and a pair", () => {
    const text = [
      'Call the Skill tool with "research".',
      "Call the Skill tool with `tdd`.",
      'Call the Skill tool twice, for "grilling" and "domain-modeling".',
    ].join("\n");
    expect(skillRefNames(text).sort()).toEqual(["domain-modeling", "grilling", "research", "tdd"]);
  });

  it("reads /name commands and ignores paths, host commands, and closing tags", () => {
    const text = [
      "Run `/setup-matt-pocock-skills`.",
      "Also /to-spec and /to-tickets.",
      "Switch level: `/ponytail lite|full|ultra`.",
      "falling back to `/tmp` (or run `/reload-plugins`, open `/plugin`, `/ask`, `/improve`).",
      "see `package.json`/lockfile and `package.json`/build-tool `lint`.",
      "</vertical-slice-rules>",
      "https://github.com/example/repo/blob/main/docs/guide.md",
      "`aria-live`/role",
    ].join("\n");
    expect(skillRefNames(text).sort()).toEqual([
      "ponytail",
      "setup-matt-pocock-skills",
      "to-spec",
      "to-tickets",
    ]);
  });

  it("ignores conditional markers", () => {
    expect(skillRefNames("a<!-- if:skill=tdd -->b<!-- /if -->c")).toEqual([]);
  });
});

describe("backtickedRefNames", () => {
  it("reads bare backticked tokens and skips paths, slashes, and dotted names", () => {
    const text = [
      "Use `tdd`; for edge cases use `adversarial-tests`.",
      "Run `/setup-ai` and `/tmp`.",
      "see `package.json` and `file:line`.",
    ].join("\n");
    expect(backtickedRefNames(text).sort()).toEqual(["adversarial-tests", "tdd"]);
  });

  it("ignores conditional markers", () => {
    expect(backtickedRefNames("a<!-- if:skill=tdd -->b<!-- /if -->c")).toEqual([]);
  });
});

describe("wordRefNames", () => {
  it("reads hyphenated universe names as whole words and skips single-word names", () => {
    const text = "Handoffs: <a11y-auditor / copywriter / console-architecture — or none>. Use tdd; make a plan.";
    expect(wordRefNames(text, UNIVERSE).sort()).toEqual(["a11y-auditor"]);
  });

  it("does not match inside longer hyphenated tokens", () => {
    expect(wordRefNames("xa11y-auditor a11y-auditor-x pre-codebase-design-post", UNIVERSE)).toEqual([]);
  });

  it("ignores conditional markers", () => {
    expect(wordRefNames("a<!-- if:agent=a11y-auditor -->b<!-- /if -->c", UNIVERSE)).toEqual([]);
  });
});
