import { describe, expect, it } from "vitest";
import { skillRefNames } from "#skill-refs.js";

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
});
