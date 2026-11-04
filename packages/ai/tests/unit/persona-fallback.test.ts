import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";

function personaRows(raw: string, path: string): string[] {
  const lines = raw.split("\n");
  // Only the persona table: rows under the `| Persona |` header, stopping at
  // the first non-table line, so a later table never mixes its rows in.
  // The `|---` separator never matches `| `, so no row is skipped.
  const head = lines.findIndex((line) => /^\|\s*Persona\s*\|/.test(line));
  if (head < 0) throw new Error(`${path} has no persona table`);
  const rows: string[] = [];
  for (const line of lines.slice(head + 1)) {
    if (!line.startsWith("|")) break;
    const cell = line.split("|")[1]?.trim() ?? "";
    if (cell && !/^:?-{3,}:?$/.test(cell)) rows.push(cell);
  }
  return rows;
}

function tableFirstColumn(path: string): string[] {
  return personaRows(readFileSync(join(kitDir(), path), "utf8"), path);
}

describe("persona-review fallback generics", () => {
  it("names the same personas as personas.template.md", () => {
    const fallback = tableFirstColumn("skills/persona-review/SKILL.md");
    const template = tableFirstColumn("personas.template.md");
    expect(fallback.length).toBeGreaterThan(0);
    expect([...fallback].sort()).toEqual([...template].sort());
  });

  it("tracks every template persona in the repo's own copy", () => {
    const template = tableFirstColumn("personas.template.md");
    const root = fileURLToPath(new URL("../../../..", import.meta.url));
    const repo = personaRows(readFileSync(join(root, ".agents/personas.md"), "utf8"), ".agents/personas.md");
    expect(repo.length).toBeGreaterThan(0);
    expect([...repo].sort()).toEqual([...template].sort());
  });
});
