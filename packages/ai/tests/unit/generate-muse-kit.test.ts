import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { generateMuseAgent, hasMarker, markerLine, museNativeName } from "#generate.js";
import { kitDir } from "#kit.js";

function kitAgent(name: string): string {
  return readFileSync(join(kitDir(), "agents", `${name}.md`), "utf8");
}

function bodyOf(text: string): string {
  const close = text.split("\n").findIndex((line, i) => i > 0 && line.trimEnd() === "---");
  return text.split("\n").slice(close).join("\n");
}

function museOf(sourceName: string, source: string, model = "muse-spark-1.3-contributor"): string {
  const dest = museNativeName(sourceName);
  if (dest === undefined) throw new Error(`unmapped illegal Muse name: ${sourceName}`);
  const out = generateMuseAgent({ name: dest, sourceName, source, model });
  if (!out.ok) throw out.error;
  return out.value.text;
}

describe("generateMuseAgent from kit sources", () => {
  it("maps every kit agent to a legal Muse dest name (no silent omit)", () => {
    const names = readdirSync(join(kitDir(), "agents"))
      .filter((file) => file.endsWith(".md"))
      .map((file) => file.slice(0, -3))
      .sort();
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(museNativeName(name), name).toBeDefined();
    }
  });

  it("keeps explorer (build/lookup) and verifier (check) bodies, maps tools, drops headers", () => {
    for (const name of ["explorer", "verifier"] as const) {
      const source = kitAgent(name);
      const text = museOf(name, source);
      expect(hasMarker(text), name).toBe(true);
      expect(text.split("\n")[1], name).toBe(markerLine(name));
      expect(text, name).toContain(`name: ${name}\n`);
      expect(text, name).toContain("disallowedTools: write_file, edit_file, bash\n");
      expect(text, name).not.toContain("readonly:");
      expect(bodyOf(text), name).toBe(bodyOf(source));
      const front = text.slice(0, text.indexOf("\n---\n", 3));
      expect(front, name).not.toMatch(/\bWrite\b|\bEdit\b|NotebookEdit/);
    }
  });

  it("emits accessibility-auditor from a11y-auditor source and leaves that source string unchanged", () => {
    const source = kitAgent("a11y-auditor");
    const frozen = source;
    expect(museNativeName("a11y-auditor")).toBe("accessibility-auditor");
    const text = museOf("a11y-auditor", source);
    expect(source).toBe(frozen);
    expect(hasMarker(text)).toBe(true);
    expect(text.split("\n")[1]).toBe(markerLine("a11y-auditor"));
    expect(text).toContain("name: accessibility-auditor\n");
    expect(text).not.toContain("name: a11y-auditor\n");
    expect(text).toContain("disallowedTools: write_file, edit_file, bash\n");
    expect(text).not.toContain("readonly:");
    expect(bodyOf(text)).toBe(bodyOf(source));
  });
});
