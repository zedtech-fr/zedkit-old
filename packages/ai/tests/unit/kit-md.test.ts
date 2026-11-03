import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import prettier from "prettier";
import { kitDir } from "#kit.js";
import { firstPartySkills, markdownFiles } from "./helpers.js";

function firstPartyMarkdown(): string[] {
  const kit = kitDir();
  return [
    join(kit, "AGENTS.template.md"),
    join(kit, "personas.template.md"),
    join(kit, "THIRD_PARTY_NOTICES.md"),
    ...markdownFiles(join(kit, "agents")),
    ...markdownFiles(join(kit, "commands")),
    ...firstPartySkills().flatMap((name) => markdownFiles(join(kit, "skills", name))),
  ].filter(existsSync);
}

describe("kit markdown", () => {
  it("keeps first-party kit markdown prettier-clean", async () => {
    const files = firstPartyMarkdown();
    expect(files.length).toBeGreaterThan(10);
    for (const file of files) {
      const raw = readFileSync(file, "utf8");
      const formatted = await prettier.format(raw, { filepath: file });
      expect(formatted, file).toBe(raw);
    }
  });
});
