import { readFileSync, utimesSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ALL_PROVIDERS } from "#install.js";
import { kitDir } from "#kit.js";
import {
  checkTokenomics,
  KINDS,
  loadDefaults,
  mergeTokenomics,
  parseTokenomics,
  POLICY_PROVIDERS,
  STAKES,
  type Tokenomics,
} from "#tokenomics.js";
import { put, tempDir } from "./helpers.js";

const doc = (frontmatter: string, body = "Body.\n"): string => `---\nschema: 1\n${frontmatter}---\n\n${body}`;

function defaults(): Tokenomics {
  const loaded = loadDefaults();
  if (!loaded.ok) throw loaded.error;
  return loaded.value;
}

describe("shipped defaults", () => {
  it("parse and pass their own check", () => {
    const text = readFileSync(join(kitDir(), "tokenomics.defaults.md"), "utf8");
    expect(checkTokenomics(text)).toEqual([]);
  });

  it("carry all 16 cells for every provider, all inherit", () => {
    const policy = defaults();
    expect([...POLICY_PROVIDERS].sort()).toEqual([...ALL_PROVIDERS].sort());
    for (const provider of POLICY_PROVIDERS) {
      for (const kind of KINDS) {
        for (const stakes of STAKES) {
          const cell = policy.providers[provider][kind][stakes];
          expect(cell.model, `${provider}.${kind}.${stakes}`).toBe("inherit");
          expect(["low", "medium", "high", "max"]).toContain(cell.effort);
        }
      }
    }
  });

  it("ship the default effort table", () => {
    const cursor = defaults().providers.cursor;
    expect(STAKES.map((s) => cursor.decide[s].effort)).toEqual(["medium", "high", "high", "max"]);
    expect(STAKES.map((s) => cursor.design[s].effort)).toEqual(["medium", "high", "high", "max"]);
    expect(STAKES.map((s) => cursor.build[s].effort)).toEqual(["low", "medium", "high", "max"]);
    expect(STAKES.map((s) => cursor.check[s].effort)).toEqual(["low", "medium", "high", "max"]);
  });

  it("ship the gate floors and a global default for needs", () => {
    const policy = defaults();
    expect(policy.default_needs).toEqual({ reasoning: "medium", context: "medium" });
    expect(policy.strict_headers).toBe(false);
    expect(policy.gates.sensitive.review).toBe("required");
    expect(policy.gates.critical).toEqual({
      review: "required",
      second_review: "independent",
      distinct_model: true,
      human: "required",
    });
  });

  it("name no model in the shipped file", () => {
    const text = readFileSync(join(kitDir(), "tokenomics.defaults.md"), "utf8");
    expect(text).not.toMatch(/claude-|gpt-?\d|gemini|grok|sonnet|opus|haiku/iu);
  });
});

describe("installed stub", () => {
  it("is a valid project file", () => {
    const text = readFileSync(join(kitDir(), "tokenomics.template.md"), "utf8");
    expect(checkTokenomics(text)).toEqual([]);
    expect(parseTokenomics(text)).toMatchObject({ ok: true, value: { schema: 1 } });
  });
});

describe("parseTokenomics", () => {
  it("reads the frontmatter of a policy file", () => {
    const parsed = parseTokenomics(doc("default_provider: claude\n"));
    expect(parsed).toMatchObject({ ok: true, value: { schema: 1, default_provider: "claude" } });
  });

  it("fails without frontmatter or on broken YAML", () => {
    expect(parseTokenomics("# no frontmatter\n").ok).toBe(false);
    expect(checkTokenomics("# no frontmatter\n")).toHaveLength(1);
    expect(checkTokenomics("---\nschema: [1\n---\n")[0]).toContain("invalid YAML");
  });
});

describe("mergeTokenomics", () => {
  it("overrides one cell field and keeps the rest of the defaults", () => {
    const base = defaults();
    const merged = mergeTokenomics(base, { providers: { claude: { build: { standard: { model: "fast-one" } } } } });
    expect(merged.providers.claude.build.standard).toEqual({ model: "fast-one", effort: "medium" });
    expect(merged.providers.claude.build.trivial).toEqual(base.providers.claude.build.trivial);
    expect(merged.providers.cursor).toEqual(base.providers.cursor);
  });

  it("replaces arrays instead of merging them", () => {
    const base = mergeTokenomics(defaults(), { hardcode: { allow_paths: ["a/**", "b/**"] } });
    const merged = mergeTokenomics(base, { hardcode: { allow_paths: ["c/**"] } });
    expect(merged.hardcode.allow_paths).toEqual(["c/**"]);
  });

  it("never mutates its inputs", () => {
    const base = defaults();
    const before = JSON.stringify(base);
    const layer = { providers: { cursor: { check: { critical: { model: "x" } } } } };
    const layerBefore = JSON.stringify(layer);
    mergeTokenomics(base, layer);
    expect(JSON.stringify(base)).toBe(before);
    expect(JSON.stringify(layer)).toBe(layerBefore);
  });

  it("lets a project file with only `providers` keep every default after the merge", () => {
    const text = doc("providers:\n  muse:\n    check:\n      trivial: { model: cheap-one }\n");
    expect(checkTokenomics(text)).toEqual([]);
  });
});

describe("checkTokenomics", () => {
  it("accepts a project file that sets models and one stronger gate", () => {
    const text = doc(
      [
        "default_provider: cursor",
        "gates:",
        "  standard: { review: required }",
        "  critical: { second_review_provider: claude }",
        "agents:",
        "  verifier: { min_stakes: sensitive, min_effort: high }",
        "providers:",
        "  cursor:",
        "    build:",
        "      critical: { model: strong-one, effort: max }",
        "    context_windows: { large: 2M }",
        "",
      ].join("\n"),
    );
    expect(checkTokenomics(text)).toEqual([]);
  });

  it("rejects a missing or wrong schema", () => {
    expect(checkTokenomics("---\ndefault_provider: cursor\n---\n")).toContainEqual(expect.stringContaining("schema: must be 1"));
    expect(checkTokenomics("---\nschema: 2\n---\n")).toContainEqual(expect.stringContaining("schema: must be 1"));
  });

  it("rejects unknown keys at every level", () => {
    const text = doc(
      [
        "tiers: {}",
        "providers:",
        "  cursor:",
        "    scout:",
        "      standard: { model: inherit }",
        "    build:",
        "      urgent: { model: inherit }",
        "      standard: { modle: inherit }",
        "gates:",
        "  standard: { reviews: required }",
        "hardcode: { strict: true }",
        "",
      ].join("\n"),
    );
    const issues = checkTokenomics(text);
    for (const key of ["tiers", "providers.cursor.scout", "providers.cursor.build.urgent", "providers.cursor.build.standard.modle", "gates.standard.reviews", "hardcode.strict"]) {
      expect(issues, key).toContainEqual(expect.stringContaining(`${key}: unknown key`));
    }
  });

  it("rejects top_k, top_p and a cell-level context (schema 1 has none)", () => {
    const text = doc(
      "providers:\n  cursor:\n    build:\n      standard: { model: inherit, top_k: 5, top_p: 0.9, context: large }\n",
    );
    const issues = checkTokenomics(text);
    for (const key of ["top_k", "top_p", "context"]) {
      expect(issues, key).toContainEqual(expect.stringContaining(`standard.${key}: unknown key`));
    }
  });

  it("rejects bad enums and bad provider ids", () => {
    const text = doc(
      [
        "default_provider: gemini",
        "default_needs: { reasoning: extreme, context: medium }",
        "strict_headers: yes please",
        "providers:",
        "  cursor:",
        "    build:",
        "      standard: { model: inherit, effort: turbo }",
        "agents:",
        "  verifier: { min_stakes: urgent, min_effort: huge }",
        "gates:",
        "  standard: { review: sometimes }",
        "  critical: { second_review_provider: gemini }",
        "",
      ].join("\n"),
    );
    const issues = checkTokenomics(text);
    for (const key of [
      "default_provider",
      "default_needs.reasoning",
      "strict_headers",
      "providers.cursor.build.standard.effort",
      "agents.verifier.min_stakes",
      "agents.verifier.min_effort",
      "gates.standard.review",
      "gates.critical.second_review_provider",
    ]) {
      expect(issues, key).toContainEqual(expect.stringContaining(`${key}:`));
    }
  });

  it("accepts every known provider id as second_review_provider, and only on critical", () => {
    for (const provider of POLICY_PROVIDERS) {
      expect(checkTokenomics(doc(`gates:\n  critical: { second_review_provider: ${provider} }\n`))).toEqual([]);
    }
    expect(checkTokenomics(doc("gates:\n  standard: { second_review_provider: claude }\n"))).toContainEqual(
      expect.stringContaining("only gates.critical"),
    );
  });

  it("rejects a cell that is not a mapping (a project cannot remove a cell)", () => {
    const issues = checkTokenomics(doc("providers:\n  cursor:\n    build:\n      standard:\n"));
    expect(issues).toContainEqual(expect.stringContaining("providers.cursor.build.standard: must be a mapping"));
  });

  it("reports a missing cell after the merge when the defaults lack it", () => {
    const base = defaults();
    const broken = JSON.parse(JSON.stringify(base)) as Tokenomics;
    delete (broken.providers.codex.check as Partial<Tokenomics["providers"]["codex"]["check"]>).critical;
    const issues = checkTokenomics(doc(""), broken);
    expect(issues).toEqual(["providers.codex.check.critical: missing cell (model and effort are required)"]);
  });

  it("reports a missing provider block after the merge", () => {
    const broken = JSON.parse(JSON.stringify(defaults())) as Partial<Tokenomics>;
    delete (broken.providers as Partial<Tokenomics["providers"]> | undefined)?.muse;
    expect(checkTokenomics(doc(""), broken as Tokenomics)).toEqual(["providers.muse: missing provider block"]);
  });

  it("rejects a model name anywhere in the frontmatter except providers", () => {
    const outside = checkTokenomics(doc("default_provider: claude-opus-9\n"));
    expect(outside).toContainEqual(expect.stringContaining('model name "claude-opus-9" outside providers'));
    const comment = checkTokenomics(doc("agents:\n  verifier: { min_effort: gpt-5 }\n"));
    expect(comment).toContainEqual(expect.stringContaining('model name "gpt-5" outside providers'));
  });

  it("allows model names in hardcode.* (scan configuration, not routing)", () => {
    expect(checkTokenomics(doc("hardcode:\n  allow_paths: [docs/claude-opus-9/**]\n  extra_patterns: ['gpt-\\d+']\n"))).toEqual([]);
  });

  it("allows model names under providers and in the prose body", () => {
    const text = doc("providers:\n  claude:\n    build:\n      standard: { model: claude-sonnet-9, effort: medium }\n", "We picked claude-opus-9 and gpt-5 for sensitive work.\n");
    expect(checkTokenomics(text)).toEqual([]);
  });

  it("rejects a model value with spaces and a model name in context_windows", () => {
    const text = doc(
      [
        "providers:",
        "  cursor:",
        "    build:",
        "      standard: { model: 'two words' }",
        "    context_windows: { small: claude-opus-9, medium: 0, large: 1M }",
        "",
      ].join("\n"),
    );
    const issues = checkTokenomics(text);
    expect(issues).toContainEqual(expect.stringContaining("providers.cursor.build.standard.model:"));
    expect(issues).toContainEqual(expect.stringContaining("providers.cursor.context_windows.small:"));
    expect(issues).toContainEqual(expect.stringContaining("providers.cursor.context_windows.medium:"));
    expect(issues.some((m) => m.includes("context_windows.large"))).toBe(false);
  });

  it("accepts token counts as k, M, decimals and integers", () => {
    const text = doc("providers:\n  cursor:\n    context_windows: { small: 128k, medium: 0.5M, large: 1000000 }\n");
    expect(checkTokenomics(text)).toEqual([]);
  });

  it("rejects an invalid extra_patterns regular expression", () => {
    const issues = checkTokenomics(doc("hardcode:\n  extra_patterns: ['(unclosed']\n"));
    expect(issues).toContainEqual(expect.stringContaining("not a valid regular expression"));
  });

  it("refuses to weaken any gate floor", () => {
    const cases: Array<[string, string]> = [
      ["gates:\n  sensitive: { review: optional }\n", "gates.sensitive.review"],
      ["gates:\n  critical: { review: recommended }\n", "gates.critical.review"],
      ["gates:\n  critical: { second_review: none }\n", "gates.critical.second_review"],
      ["gates:\n  critical: { distinct_model: false }\n", "gates.critical.distinct_model"],
      ["gates:\n  critical: { human: none }\n", "gates.critical.human"],
    ];
    for (const [frontmatter, key] of cases) {
      expect(checkTokenomics(doc(frontmatter)), key).toEqual([expect.stringContaining(`${key}: floor is`)]);
    }
  });

  it("flags a critical gate that loses its human line after the merge", () => {
    const base = defaults();
    const weak = JSON.parse(JSON.stringify(base)) as Tokenomics;
    delete weak.gates.critical.human;
    expect(checkTokenomics(doc(""), weak)).toEqual(['gates.critical.human: floor is "required"']);
  });

  it("lets a project strengthen gates", () => {
    expect(checkTokenomics(doc("gates:\n  trivial: { review: required }\n  standard: { review: required, human: required }\n"))).toEqual([]);
  });
});

describe("loadDefaults cache", () => {
  it("parses the shipped file once per file version and hands out the same policy", () => {
    const a = loadDefaults();
    const b = loadDefaults();
    if (!a.ok || !b.ok) throw new Error("defaults must load");
    expect(a.value).toBe(b.value);
  });

  it("re-reads a changed file and reports a missing one", () => {
    const kit = tempDir();
    expect(loadDefaults(kit).ok).toBe(false);
    put(kit, "tokenomics.defaults.md", "---\nschema: 1\nstrict_headers: false\n---\n");
    const first = loadDefaults(kit);
    expect(first).toMatchObject({ ok: true, value: { strict_headers: false } });
    put(kit, "tokenomics.defaults.md", "---\nschema: 1\nstrict_headers: true\n---\n");
    utimesSync(join(kit, "tokenomics.defaults.md"), new Date(), new Date(Date.now() + 5000));
    expect(loadDefaults(kit)).toMatchObject({ ok: true, value: { strict_headers: true } });
  });
});
