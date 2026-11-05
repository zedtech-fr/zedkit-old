import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_NEEDS, KIT_HEADERS, SIDECAR, hasHeaderKeys, parseAgentHeader, readAgentHeader, readSidecar } from "#agent-header.js";
import { parseFrontmatter } from "#frontmatter.js";
import { kitDir, readManifest } from "#kit.js";
import { main } from "#cli.js";
import { validateKit } from "#validate.js";
import { AGENT, put, tempDir } from "./helpers.js";

const HEADER = { role: "ui designer", default_needs: { reasoning: "medium", context: "medium" } };
const sidecar = (root: string, entries: Record<string, unknown>): void => put(root, SIDECAR, JSON.stringify(entries));
const messages = (root: string): string[] => validateKit(root).map((issue) => issue.message);

function strictRoot(strict: boolean): string {
  const root = tempDir();
  put(root, "tokenomics.md", `---\nschema: 1\nstrict_headers: ${strict}\n---\n`);
  return root;
}

describe("shipped header table", () => {
  it("covers exactly the agents the kit ships", () => {
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    expect(Object.keys(KIT_HEADERS).sort()).toEqual([...manifest.value.agents].sort());
  });

  it("holds 18 valid headers, each a default_kind inside its kinds, no kind key", () => {
    expect(Object.keys(KIT_HEADERS)).toHaveLength(18);
    for (const [name, header] of Object.entries(KIT_HEADERS)) {
      const parsed = parseAgentHeader({ ...header }, true);
      expect(parsed.issues, name).toEqual([]);
      expect(parsed.header, name).toEqual(header);
      expect(header).not.toHaveProperty("kind");
    }
  });

  it("allows build only where the agent writes (no kinds list means all four)", () => {
    const restricted = Object.entries(KIT_HEADERS)
      .filter(([, header]) => header.kinds !== undefined)
      .map(([name]) => name)
      .sort();
    expect(restricted).toEqual(["explorer", "orchestrator", "researcher", "security-reviewer", "skeptic", "verifier"]);
    for (const name of restricted) expect(KIT_HEADERS[name]?.kinds).not.toContain("build");
  });
});

describe("kit agent files", () => {
  const names = Object.keys(KIT_HEADERS);
  it("ship the headers in kit/agents.meta.json, and no header key in any agent file", () => {
    const raw = readSidecar(kitDir());
    if (!raw.ok) throw raw.error;
    expect(Object.keys(raw.value).sort()).toEqual([...names].sort());
    for (const name of names) {
      const front = parseFrontmatter(readFileSync(join(kitDir(), "agents", `${name}.md`), "utf8"));
      if (!front.ok) throw front.error;
      for (const key of ["role", "default_needs", "kinds", "default_kind", "needs", "kind"]) {
        expect(front.value.data, `${name}.${key}`).not.toHaveProperty(key);
      }
    }
  });

  it("the kit validates clean, sidecar included", () => {
    expect(validateKit(kitDir())).toEqual([]);
  });

  it("agents that cannot be built carry the static write deny list", () => {
    for (const name of names) {
      if (KIT_HEADERS[name]?.kinds?.includes("build") !== false) continue;
      const text = readFileSync(join(kitDir(), "agents", `${name}.md`), "utf8");
      expect(text, name).toMatch(/^disallowedTools: Write, Edit, NotebookEdit$/m);
    }
  });
});

describe("parseAgentHeader", () => {
  const ok = { role: "ui designer", default_needs: { reasoning: "medium", context: "medium" } };

  it("accepts a full header with the optional keys", () => {
    const parsed = parseAgentHeader(
      { ...ok, kinds: ["check", "design"], default_kind: "design", min_stakes: "sensitive", min_effort: "high" },
      true,
    );
    expect(parsed.issues).toEqual([]);
    expect(parsed.header).toEqual({
      role: "ui designer",
      default_needs: { reasoning: "medium", context: "medium" },
      kinds: ["check", "design"],
      default_kind: "design",
      min_stakes: "sensitive",
      min_effort: "high",
    });
  });

  it("requires role and default_needs only in strict mode", () => {
    expect(parseAgentHeader({}, false)).toEqual({ issues: [] });
    expect(parseAgentHeader({}, true).issues).toEqual([
      expect.stringContaining("role is required"),
      expect.stringContaining("default_needs is required"),
    ]);
  });

  it("rejects a bare needs key and a kind key with the contract wording", () => {
    const issues = parseAgentHeader({ ...ok, needs: { reasoning: "high" }, kind: "check" }, true).issues;
    expect(issues).toContain("needs are per call; use default_needs");
    expect(issues).toContain("kind is per invocation; use default_kind or kinds");
  });

  it("rejects bad roles: case, digits, model-like ids, length", () => {
    for (const role of ["UI designer", "designer 2", "claude-3.5", "ab", "x".repeat(61), "", 7]) {
      expect(parseAgentHeader({ ...ok, role }, true).issues, String(role)).toEqual([expect.stringContaining("role must be")]);
    }
  });

  it("rejects bad needs: unknown key, bad enum, not a mapping, missing field", () => {
    const bad = (default_needs: unknown) => parseAgentHeader({ ...ok, default_needs }, true).issues;
    expect(bad({ reasoning: "medium", context: "medium", depth: 1 })).toEqual([expect.stringContaining("default_needs.depth: unknown key")]);
    expect(bad({ reasoning: "extreme", context: "medium" })).toEqual([expect.stringContaining("default_needs.reasoning")]);
    expect(bad({ reasoning: "low", context: "huge" })).toEqual([expect.stringContaining("default_needs.context")]);
    expect(bad({ reasoning: "low" })).toEqual([expect.stringContaining("default_needs.context")]);
    expect(bad("medium")).toEqual([expect.stringContaining("must be a mapping")]);
  });

  it("rejects bad kinds and a default_kind outside them", () => {
    expect(parseAgentHeader({ ...ok, kinds: ["review"] }, true).issues).toEqual([expect.stringContaining("kinds must be")]);
    expect(parseAgentHeader({ ...ok, kinds: [] }, true).issues).toEqual([expect.stringContaining("kinds must be")]);
    expect(parseAgentHeader({ ...ok, kinds: "check" }, true).issues).toEqual([expect.stringContaining("kinds must be")]);
    expect(parseAgentHeader({ ...ok, kinds: ["check", "check"] }, true).issues).toEqual(["kinds lists a kind twice"]);
    expect(parseAgentHeader({ ...ok, kinds: ["check"], default_kind: "build" }, true).issues).toEqual([
      'default_kind "build" is not in kinds',
    ]);
    expect(parseAgentHeader({ ...ok, default_kind: "review" }, true).issues).toEqual([expect.stringContaining("default_kind must be")]);
  });

  it("rejects bad floors", () => {
    expect(parseAgentHeader({ ...ok, min_stakes: "urgent" }, true).issues).toEqual([expect.stringContaining("min_stakes")]);
    expect(parseAgentHeader({ ...ok, min_effort: "huge" }, true).issues).toEqual([expect.stringContaining("min_effort")]);
  });
});

describe("readAgentHeader and readSidecar", () => {
  it("uses the sidecar entry", () => {
    const read = readAgentHeader("verifier", { role: "my gate", default_needs: { reasoning: "low", context: "small" } });
    expect(read).toEqual({ header: { role: "my gate", default_needs: { reasoning: "low", context: "small" } }, source: "sidecar" });
  });

  it("falls back to the shipped table for a kit-name agent without an entry, silently", () => {
    const read = readAgentHeader("verifier", undefined);
    expect(read).toEqual({ header: KIT_HEADERS.verifier, source: "table" });
  });

  it("falls back to the table when the entry is invalid", () => {
    expect(readAgentHeader("explorer", { role: "x" }).source).toBe("table");
  });

  it("gives a custom agent without an entry the default: medium, medium, all kinds, with a note", () => {
    const read = readAgentHeader("my-agent", undefined);
    expect(read.source).toBe("default");
    expect(read.header.default_needs).toEqual(DEFAULT_NEEDS);
    expect(read.header.kinds).toBeUndefined();
    expect(read.note).toContain("agents.meta.json");
  });

  it("detects header keys", () => {
    expect(hasHeaderKeys({ name: "x" })).toBe(false);
    expect(hasHeaderKeys({ default_kind: "check" })).toBe(true);
  });

  it("reads no file as no entries, and reports bad JSON, a non-object and a non-object entry", () => {
    const root = tempDir();
    expect(readSidecar(root)).toEqual({ ok: true, value: {} });
    put(root, SIDECAR, "{nope");
    expect(readSidecar(root).ok).toBe(false);
    put(root, SIDECAR, "[]");
    expect(readSidecar(root)).toMatchObject({ ok: false });
    put(root, SIDECAR, '{"a": 1}');
    expect(readSidecar(root)).toMatchObject({ ok: false });
  });
});

describe("validate: agent header contract (agents.meta.json)", () => {
  it("accepts agents with no sidecar when not strict", () => {
    const root = strictRoot(false);
    put(root, "agents/verifier.md", AGENT("verifier"));
    put(root, "agents/mine.md", AGENT("mine"));
    expect(messages(root)).toEqual([]);
  });

  it("requires an entry for every agent, kit or custom, when strict_headers is true", () => {
    const root = strictRoot(true);
    put(root, "agents/verifier.md", AGENT("verifier"));
    put(root, "agents/mine.md", AGENT("mine"));
    sidecar(root, { mine: HEADER });
    expect(messages(root)).toEqual(["verifier: no header (strict_headers is on)"]);
  });

  it("accepts a valid entry and rejects a bad one, naming the agent", () => {
    const root = tempDir();
    put(root, "agents/good.md", AGENT("good"));
    put(root, "agents/bad.md", AGENT("bad"));
    sidecar(root, { good: HEADER, bad: { role: "Bad Role", default_needs: { reasoning: "low", context: "tiny" } } });
    expect(validateKit(root)).toEqual([
      { path: SIDECAR, message: expect.stringMatching(/^bad: role must be/) },
      { path: SIDECAR, message: expect.stringMatching(/^bad: default_needs.context/) },
    ]);
  });

  it("requires a full entry: a partial one is an error, not a silent fallback", () => {
    const root = tempDir();
    put(root, "agents/a.md", AGENT("a"));
    sidecar(root, { a: { role: "just a role" } });
    expect(messages(root)).toEqual(["a: default_needs is required (reasoning and context)"]);
  });

  it("rejects needs and kind in an entry", () => {
    const root = tempDir();
    put(root, "agents/a.md", AGENT("a"));
    sidecar(root, { a: { ...HEADER, needs: { reasoning: "high" }, kind: "check" } });
    expect(messages(root)).toEqual(["a: needs are per call; use default_needs", "a: kind is per invocation; use default_kind or kinds"]);
  });

  it("rejects an entry for an agent that is not here, but allows one for a kit agent", () => {
    const root = tempDir();
    put(root, "agents/a.md", AGENT("a"));
    sidecar(root, { a: HEADER, ghost: HEADER, verifier: HEADER });
    expect(messages(root)).toEqual(["ghost: no agents/ghost.md in this directory"]);
  });

  it("reports an unreadable sidecar once", () => {
    const root = tempDir();
    put(root, SIDECAR, "{nope");
    expect(validateKit(root)).toEqual([{ path: SIDECAR, message: expect.stringContaining("not valid JSON") }]);
  });

  it("rejects header keys, needs and kind in the agent file itself, for tool compatibility", () => {
    const root = tempDir();
    put(root, "agents/a.md", AGENT("a", "role: ui designer\nkind: check\n"));
    expect(messages(root)).toEqual([expect.stringMatching(/^role, kind must not be in the agent file .* put the header in agents\.meta\.json$/)]);
  });

  it("requires the static write deny list when build is not an allowed kind", () => {
    const root = tempDir();
    put(root, "agents/a.md", AGENT("a"));
    put(root, "agents/b.md", AGENT("b", "disallowedTools: Write, Edit, NotebookEdit\n"));
    put(root, "agents/c.md", AGENT("c", "disallowedTools: [Write, Edit, NotebookEdit]\n"));
    put(root, "agents/d.md", AGENT("d", "disallowedTools: Write\n"));
    put(root, "agents/e.md", AGENT("e"));
    sidecar(root, {
      a: { ...HEADER, kinds: ["check"] },
      b: { ...HEADER, kinds: ["check", "design"] },
      c: { ...HEADER, kinds: ["check"] },
      d: { ...HEADER, kinds: ["check"] },
      e: { ...HEADER, kinds: ["check", "build"] },
    });
    expect(validateKit(root)).toEqual([
      { path: "agents/a.md", message: expect.stringContaining("kinds has no build") },
      { path: "agents/d.md", message: expect.stringContaining("kinds has no build") },
    ]);
  });

  it("still rejects a pinned model next to a sidecar entry", () => {
    const root = tempDir();
    put(root, "agents/a.md", AGENT("a", "model: some-id\n"));
    sidecar(root, { a: HEADER });
    expect(messages(root)).toEqual([expect.stringContaining("model must be omitted")]);
  });

  it("prints nothing extra on validate for a kit agent without an entry", () => {
    const root = tempDir();
    put(root, ".agents/agents/verifier.md", AGENT("verifier"));
    const out: string[] = [];
    const code = main(["validate", root], { out: (line) => out.push(line), err: (line) => out.push(line) });
    expect(code).toBe(0);
    expect(out).toEqual(["ok"]);
  });
});
