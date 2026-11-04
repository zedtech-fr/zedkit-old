import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";

function commandFiles(): string[] {
  return readdirSync(join(kitDir(), "commands")).filter((f) => f.endsWith(".md"));
}

function bodyOf(file: string): string {
  const raw = readFileSync(join(kitDir(), "commands", file), "utf8");
  const end = raw.indexOf("---", 3);
  expect(end, `${file} frontmatter`).toBeGreaterThanOrEqual(0);
  return raw.slice(end + 3).trim();
}

describe("command shape", () => {
  const defaultBody = (name: string) =>
    `Run the \`${name}\` skill on \`$ARGUMENTS\` (the text after the command, or the current context when empty).`;

  it("routes every command to its same-named skill with the $ARGUMENTS contract", () => {
    const files = commandFiles();
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const name = file.replace(/\.md$/, "");
      if (name === "setup-ai") {
        expect(bodyOf(file), file).toContain("Before anything else, tell the user");
        expect(bodyOf(file), file).toContain("Tell the user first");
        expect(bodyOf(file), file).toContain("before any tool call");
        expect(bodyOf(file), file).toContain(
          "Then run the `setup-ai` skill on `$ARGUMENTS`",
        );
        continue;
      }
      expect(bodyOf(file), file).toBe(defaultBody(name));
    }
  });
});
