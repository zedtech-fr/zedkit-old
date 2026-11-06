import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { generateAgent, hasMarker, markerLine, MARKER_PREFIX } from "#generate.js";
import { parseFrontmatter } from "#frontmatter.js";

const fixture = (name: string): string =>
  readFileSync(fileURLToPath(new URL(`../fixtures/generated/${name}`, import.meta.url)), "utf8");

function made(source: string, model = "route-model-1", name = "golden"): { text: string; notes: string[] } {
  const out = generateAgent({ name, source, model });
  if (!out.ok) throw out.error;
  return out.value;
}

const errorOf = (source: string, model = "inherit"): string => {
  const out = generateAgent({ name: "x", source, model });
  return out.ok ? "ok" : out.error.message;
};

describe("generateAgent", () => {
  it("matches the golden fixture byte for byte: headers dropped, model set, marker on line 2, body untouched", () => {
    expect(made(fixture("golden.source.md")).text).toBe(fixture("golden.expected.md"));
  });

  it("is stable: the same input gives the same bytes, and regenerating a generated file adds no second marker", () => {
    const first = made(fixture("golden.source.md")).text;
    expect(made(fixture("golden.source.md")).text).toBe(first);
    expect(made(first).text).toBe(first);
    expect(first.split("\n").filter((line) => line.startsWith(MARKER_PREFIX))).toHaveLength(1);
  });

  it("leaves the frontmatter alone apart from the marker when the route is inherit", () => {
    const source = "---\nname: a\ndescription: d\nmodel: inherit\n---\n\nBody\n";
    expect(made(source, "inherit", "a").text).toBe(`---\n${markerLine("a")}\nname: a\ndescription: d\nmodel: inherit\n---\n\nBody\n`);
  });

  it("adds no model key for an inherit route when the source has none, and appends one otherwise", () => {
    const source = "---\nname: a\ndescription: d\n---\nBody\n";
    expect(made(source, "inherit", "a").text).not.toContain("model:");
    expect(made(source, "m-1", "a").text).toBe(`---\n${markerLine("a")}\nname: a\ndescription: d\nmodel: m-1\n---\nBody\n`);
  });

  it("replaces an empty model value and drops every header key, including the floors", () => {
    const source = "---\nname: a\nmodel:\nmin_stakes: sensitive\nmin_effort: high\nrole: r\n---\nBody\n";
    expect(made(source, "m-1", "a").text).toBe(`---\n${markerLine("a")}\nname: a\nmodel: m-1\n---\nBody\n`);
  });

  it("keeps a model the source pins, says so, and never rewrites a quoted value", () => {
    const pinned = made("---\nname: a\nmodel: my-pin\n---\nBody\n", "route-model-1", "a");
    expect(pinned.text).toContain("model: my-pin");
    expect(pinned.text).not.toContain("route-model-1");
    expect(pinned.notes).toEqual(["model pinned in source (my-pin): route not applied"]);
    const quoted = made('---\nname: a\nmodel: "x y"\n---\nBody\n', "route-model-1", "a");
    expect(quoted.text).toContain('model: "x y"');
    expect(quoted.notes).toHaveLength(1);
  });

  it("copies the body verbatim, including a fence line, and writes LF for a CRLF source", () => {
    const source = "---\r\nname: a\r\n---\r\nTop\r\n---\r\nAfter the rule\r\n";
    const out = made(source, "inherit", "a").text;
    expect(out).toBe(`---\n${markerLine("a")}\nname: a\n---\nTop\n---\nAfter the rule\n`);
    expect(out).not.toContain("\r");
  });

  it("handles an empty frontmatter and a leading byte order mark", () => {
    expect(made("---\n---\nBody\n", "m-1", "a").text).toBe(`---\n${markerLine("a")}\nmodel: m-1\n---\nBody\n`);
    expect(made("\uFEFF---\nname: a\n---\nBody\n", "inherit", "a").text.startsWith("---\n")).toBe(true);
  });

  it("produces frontmatter that still parses, with the marker as a YAML comment", () => {
    const out = made(fixture("golden.source.md")).text;
    const parsed = parseFrontmatter(out);
    if (!parsed.ok) throw parsed.error;
    expect(Object.keys(parsed.value.data)).toEqual(["name", "description", "model", "disallowedTools"]);
    expect(parsed.value.data.model).toBe("route-model-1");
    expect(parsed.value.data.description).toBe('Golden: it says "hi", then: stops. Use when testing.');
  });

  it("refuses a source without frontmatter or with an unclosed block", () => {
    expect(errorOf("Body only\n")).toContain("missing frontmatter");
    expect(errorOf("---\nname: a\nBody\n")).toContain("not closed");
  });

  it("refuses a model that cannot be written as a plain value (a quoted id falls back to the session model)", () => {
    const source = "---\nname: a\n---\nBody\n";
    for (const model of ['"m-1"', "a b", "m:1", "m[effort=low]", "", "-m"]) {
      expect(errorOf(source, model), model).toContain("cannot be written as a plain value");
    }
    expect(errorOf(source, "claude-model.5_1-x")).toBe("ok");
  });
});

describe("hasMarker", () => {
  it("is true only when line 2 of a file that starts with --- is the marker", () => {
    expect(hasMarker(`---\n${markerLine("a")}\nname: a\n---\n`)).toBe(true);
    expect(hasMarker(`${markerLine("a")}\n---\n`)).toBe(false);
    expect(hasMarker("---\nname: a\n---\n")).toBe(false);
    expect(hasMarker(`---\nname: a\n${markerLine("a")}\n---\n`)).toBe(false);
    expect(hasMarker("")).toBe(false);
  });
});
