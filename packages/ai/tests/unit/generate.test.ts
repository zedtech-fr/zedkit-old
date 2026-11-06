import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { generateAgent, generateMuseAgent, hasMarker, isReservedMuseDest, markerLine, markerSource, MARKER_PREFIX, museIdentityName, museNativeName, museSourceName, MUSE_NAME_ALIAS, MUSE_WRITE_TOOLS } from "#generate.js";
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

describe("generateAgent readonly", () => {
  it("writes readonly: true when asked, and leaves it off otherwise", () => {
    const source = "---\nname: explorer\ndescription: d\nmodel: inherit\ndisallowedTools: Write, Edit, NotebookEdit\n---\nBody\n";
    const withFlag = generateAgent({ name: "explorer", source, model: "cursor-grok-4.6-high", readonly: true });
    if (!withFlag.ok) throw withFlag.error;
    expect(withFlag.value.text).toContain("readonly: true\n");
    expect(withFlag.value.text).toContain("model: cursor-grok-4.6-high\n");
    const without = generateAgent({ name: "explorer", source, model: "cursor-grok-4.6-high" });
    if (!without.ok) throw without.error;
    expect(without.value.text).not.toContain("readonly:");
  });
});

describe("generateMuseAgent", () => {
  it("maps Claude write tools, drops unknown keys, and bakes the model", () => {
    const source =
      "---\nname: explorer\ndescription: d\nmodel: inherit\ndisallowedTools: Write, Edit, NotebookEdit\nreadonly: true\nrole: lookup\n---\n\nBody\n";
    const out = generateMuseAgent({ name: "explorer", source, model: "muse-spark-1.3-contributor" });
    if (!out.ok) throw out.error;
    expect(out.value.text).toContain("disallowedTools: write_file, edit_file, bash\n");
    expect(out.value.text).not.toMatch(/\bWrite\b/);
    expect(out.value.text).not.toContain("readonly:");
    expect(out.value.text).not.toContain("role:");
    expect(out.value.text).toContain("model: muse-spark-1.3-contributor\n");
    expect(hasMarker(out.value.text)).toBe(true);
    expect(out.value.text.endsWith("\n\nBody\n")).toBe(true);
  });

  it("omits disallowedTools when the source has none", () => {
    const source = "---\nname: improver\ndescription: d\nmodel: inherit\n---\nBody\n";
    const out = generateMuseAgent({ name: "improver", source, model: "inherit" });
    if (!out.ok) throw out.error;
    expect(out.value.text).not.toContain("disallowedTools");
  });

  it("emits fail-closed bash deny, not the unsafe write_file,edit_file skip", () => {
    expect([...MUSE_WRITE_TOOLS]).toEqual(["write_file", "edit_file", "bash"]);
    const source = "---\nname: explorer\ndescription: d\nmodel: inherit\ndisallowedTools: Write, Edit, NotebookEdit\n---\nBody\n";
    const out = generateMuseAgent({ name: "explorer", source, model: "inherit" });
    if (!out.ok) throw out.error;
    const denied = out.value.text.split("\n").find((line) => line.startsWith("disallowedTools:")) ?? "";
    // Native 1010: write_file,edit_file,bash → NEW project sentinel absent, shell=no-tool.
    // write_file,edit_file alone (P8 zk-w-a) still wrote ./probe-zk-w-a-shell.txt.
    expect(denied).toBe("disallowedTools: write_file, edit_file, bash");
    expect(denied).not.toBe("disallowedTools: write_file, edit_file");
  });

  it("rewrites name to the Muse dest and cites the source in the marker", () => {
    const source = "---\nname: a11y-auditor\ndescription: d\nmodel: inherit\ndisallowedTools: Write, Edit, NotebookEdit\n---\nBody\n";
    const out = generateMuseAgent({
      name: "accessibility-auditor",
      sourceName: "a11y-auditor",
      source,
      model: "muse-spark-1.3-contributor",
    });
    if (!out.ok) throw out.error;
    expect(out.value.text).toContain("name: accessibility-auditor\n");
    expect(out.value.text).not.toContain("name: a11y-auditor\n");
    expect(out.value.text.split("\n")[1]).toContain(".agents/agents/a11y-auditor.md");
  });

  it("does not emit readonly even when the caller passes it", () => {
    const source = "---\nname: explorer\ndescription: d\nmodel: inherit\n---\nBody\n";
    const out = generateMuseAgent({ name: "explorer", source, model: "inherit", readonly: true });
    if (!out.ok) throw out.error;
    expect(out.value.text).not.toContain("readonly");
  });

  it("copies the body byte for byte, including the word Write", () => {
    const source = "---\nname: skeptic\ndescription: d\nmodel: inherit\ndisallowedTools: Write, Edit, NotebookEdit\n---\nWrite the stories.\n";
    const frozen = source;
    const out = generateMuseAgent({ name: "skeptic", source, model: "inherit" });
    if (!out.ok) throw out.error;
    expect(source).toBe(frozen);
    expect(out.value.text.endsWith("Write the stories.\n")).toBe(true);
    const close = out.value.text.indexOf("\n---\n", 3);
    expect(out.value.text.slice(0, close)).toContain("write_file, edit_file, bash");
    expect(out.value.text.slice(0, close)).not.toMatch(/\bWrite\b/);
  });
});

describe("museNativeName", () => {
  it("keeps legal names, maps a11y-auditor, and returns undefined for unmapped illegal names", () => {
    expect(museNativeName("explorer")).toBe("explorer");
    expect(museNativeName("verifier")).toBe("verifier");
    expect(museNativeName("a11y-auditor")).toBe("accessibility-auditor");
    expect(MUSE_NAME_ALIAS["a11y-auditor"]).toBe("accessibility-auditor");
    expect(museNativeName("my_agent")).toBeUndefined();
    expect(museNativeName("A11y")).toBeUndefined();
  });

  it("museSourceName reverses dest aliases and leaves kit names unchanged", () => {
    expect(museSourceName("accessibility-auditor")).toBe("a11y-auditor");
    expect(museSourceName("a11y-auditor")).toBe("a11y-auditor");
    expect(museSourceName("explorer")).toBe("explorer");
    expect(museNativeName(museSourceName("accessibility-auditor"))).toBe("accessibility-auditor");
  });
});

describe("Muse dest provenance", () => {
  const dest = "accessibility-auditor";
  const source = "a11y-auditor";
  const marked = `---\n${markerLine(source)}\nname: ${dest}\n---\nBody\n`;
  const unmarked = "---\nname: accessibility-auditor\ndescription: mine\nmodel: inherit\n---\nMINE\n";

  it("unmarked dest without source is a user source, not a reserved skip", () => {
    const ctx = { sources: new Set<string>(), destText: unmarked };
    expect(hasMarker(unmarked)).toBe(false);
    expect(isReservedMuseDest(dest, ctx)).toBe(false);
    expect(museIdentityName(dest, ctx)).toBe(dest);
  });

  it("unmarked dest with source is a collision: dest stays a user source, not reserved", () => {
    const ctx = { sources: new Set([source]), destText: unmarked };
    expect(isReservedMuseDest(dest, ctx)).toBe(false);
    expect(museIdentityName(dest, ctx)).toBe(dest);
    expect(museIdentityName(source, ctx)).toBe(source);
  });

  it("marked dest citing the source is reserved (alias, not a second source)", () => {
    const ctx = { sources: new Set([source]), destText: marked };
    expect(markerSource(marked)).toBe(source);
    expect(isReservedMuseDest(dest, ctx)).toBe(true);
    expect(museIdentityName(dest, ctx)).toBe(source);
  });
});
