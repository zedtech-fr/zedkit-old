import { describe, expect, it } from "vitest";
import { KIT_HEADERS, type AgentHeader } from "#agent-header.js";
import {
  loadAgent,
  loadPolicy,
  resolveRoute,
  type Route,
  type RouteInput,
} from "#route.js";
import {
  EFFORTS,
  KINDS,
  loadDefaults,
  POLICY_PROVIDERS,
  STAKES,
  type Stakes,
  type Tokenomics,
} from "#tokenomics.js";
import { markerLine } from "#generate.js";
import { AGENT, put, tempDir } from "./helpers.js";

/** Defaults with a distinct model per cell, so a lookup names the cell it read. */
function policy(edit?: (p: Tokenomics) => void): Tokenomics {
  const loaded = loadDefaults();
  if (!loaded.ok) throw loaded.error;
  const p = JSON.parse(JSON.stringify(loaded.value)) as Tokenomics;
  for (const provider of POLICY_PROVIDERS) {
    for (const kind of KINDS)
      for (const stakes of STAKES)
        p.providers[provider][kind][stakes].model =
          `${provider}.${kind}.${stakes}`;
    p.providers[provider].context_windows = {
      small: "128k",
      medium: "256k",
      large: "1M",
    };
  }
  p.default_provider = "cursor";
  edit?.(p);
  return p;
}

function route(p: Tokenomics, input: RouteInput): Route {
  const result = resolveRoute(p, input);
  if (!result.ok) throw result.error;
  return result.value;
}

const header = (
  reasoning: "low" | "medium" | "high",
  context: "small" | "medium" | "large",
  extra: Partial<AgentHeader> = {},
): AgentHeader => ({
  role: "test agent",
  default_needs: { reasoning, context },
  ...extra,
});

describe("resolveRoute: cells", () => {
  it("medium needs read the cell of kind x stakes for every provider (16 each)", () => {
    const p = policy();
    for (const provider of POLICY_PROVIDERS) {
      for (const kind of KINDS) {
        for (const stakes of STAKES) {
          const r = route(p, { kind, stakes, provider });
          expect(r.model, `${provider}.${kind}.${stakes}`).toBe(
            `${provider}.${kind}.${stakes}`,
          );
          expect(r.effort).toBe(p.providers[provider][kind][stakes].effort);
          expect(r.column).toBe(stakes);
          expect(r.unrouted).toBe(false);
        }
      }
    }
  });

  it("uses default_provider when none is given, and errors when neither exists", () => {
    expect(
      route(policy(), { kind: "build", stakes: "standard" }).provider,
    ).toBe("cursor");
    const none = resolveRoute(
      policy((p) => delete p.default_provider),
      { kind: "build", stakes: "standard" },
    );
    expect(none.ok).toBe(false);
    expect(none.ok ? "" : none.error.message).toContain("no provider");
  });

  it("a missing provider cell is inherit and unrouted, with a note", () => {
    const p = policy(
      (x) =>
        delete (x.providers.codex as Partial<Tokenomics["providers"]["codex"]>)
          .build,
    );
    const r = route(p, {
      kind: "build",
      stakes: "standard",
      provider: "codex",
    });
    expect(r).toMatchObject({
      model: "inherit",
      unrouted: true,
      effort: "medium",
    });
    expect(r.notes).toContain(
      "no build.standard cell for codex: model inherit",
    );
  });
});

describe("resolveRoute: needs shift the column", () => {
  const cases: Array<[Stakes, Stakes]> = [
    ["trivial", "standard"],
    ["standard", "sensitive"],
    ["sensitive", "sensitive"],
    ["critical", "critical"],
  ];
  it("reasoning high or context large moves one column right, capped at sensitive unless critical", () => {
    const p = policy();
    for (const [stakes, column] of cases) {
      for (const needs of [
        { reasoning: "high" as const },
        { context: "large" as const },
      ]) {
        const r = route(p, { kind: "build", stakes, needs });
        expect(r.column, `${stakes} ${JSON.stringify(needs)}`).toBe(column);
        expect(r.model).toBe(`cursor.build.${column}`);
      }
    }
  });

  it("is not cumulative: both high reasoning and large context still move once", () => {
    const r = route(policy(), {
      kind: "build",
      stakes: "trivial",
      needs: { reasoning: "high", context: "large" },
    });
    expect(r.column).toBe("standard");
  });

  it("never changes the task's stakes or its gates", () => {
    const p = policy();
    const r = route(p, {
      kind: "build",
      stakes: "standard",
      needs: { reasoning: "high" },
    });
    expect(r.column).toBe("sensitive");
    expect(r.gates).toEqual(p.gates.standard);
    expect(
      route(p, {
        kind: "build",
        stakes: "critical",
        needs: { reasoning: "high" },
      }).gates,
    ).toEqual(p.gates.critical);
  });

  it("low and medium needs never move the column", () => {
    for (const reasoning of ["low", "medium"] as const) {
      expect(
        route(policy(), {
          kind: "check",
          stakes: "sensitive",
          needs: { reasoning },
        }).column,
      ).toBe("sensitive");
    }
  });
});

describe("resolveRoute: effort", () => {
  it("reasoning low lowers effort one step on trivial and standard, floor low", () => {
    const p = policy();
    expect(
      route(p, {
        kind: "check",
        stakes: "standard",
        needs: { reasoning: "low" },
      }).effort,
    ).toBe("low"); // medium -> low
    expect(
      route(p, {
        kind: "decide",
        stakes: "standard",
        needs: { reasoning: "low" },
      }).effort,
    ).toBe("medium"); // high -> medium
    expect(
      route(p, {
        kind: "decide",
        stakes: "trivial",
        needs: { reasoning: "low" },
      }).effort,
    ).toBe("low"); // medium -> low
    expect(
      route(p, {
        kind: "check",
        stakes: "trivial",
        needs: { reasoning: "low" },
      }).effort,
    ).toBe("low"); // already low
  });

  it("the low rule never applies to sensitive or critical and never moves the column", () => {
    const p = policy();
    const sensitive = route(p, {
      kind: "check",
      stakes: "sensitive",
      needs: { reasoning: "low" },
    });
    expect(sensitive).toMatchObject({ effort: "high", column: "sensitive" });
    expect(
      route(p, {
        kind: "check",
        stakes: "critical",
        needs: { reasoning: "low" },
      }).effort,
    ).toBe("max");
    expect(
      route(p, {
        kind: "check",
        stakes: "standard",
        needs: { reasoning: "low" },
      }).column,
    ).toBe("standard");
  });

  it("medium and high reasoning do not lower effort", () => {
    const p = policy();
    expect(
      route(p, {
        kind: "check",
        stakes: "standard",
        needs: { reasoning: "medium" },
      }).effort,
    ).toBe("medium");
  });
});

describe("resolveRoute: agent floors", () => {
  it("min_stakes raises the column only, from the policy or the header; the policy wins", () => {
    const p = policy((x) => {
      x.agents.verifier = { min_stakes: "critical" };
    });
    const raised = route(p, {
      kind: "check",
      stakes: "trivial",
      agent: {
        name: "verifier",
        header: header("medium", "medium", { min_stakes: "sensitive" }),
      },
    });
    expect(raised).toMatchObject({
      column: "critical",
      model: "cursor.check.critical",
    });
    expect(raised.gates).toEqual(p.gates.trivial);
    const fromHeader = route(policy(), {
      kind: "check",
      stakes: "trivial",
      agent: {
        name: "x",
        header: header("medium", "medium", { min_stakes: "sensitive" }),
      },
    });
    expect(fromHeader.column).toBe("sensitive");
    const noLower = route(policy(), {
      kind: "check",
      stakes: "critical",
      agent: {
        name: "x",
        header: header("medium", "medium", { min_stakes: "standard" }),
      },
    });
    expect(noLower.column).toBe("critical");
  });

  it("min_effort raises effort only, never the column", () => {
    const p = policy((x) => {
      x.agents.explorer = { min_effort: "high" };
    });
    const r = route(p, {
      kind: "check",
      stakes: "trivial",
      agent: { name: "explorer", header: header("low", "small") },
    });
    expect(r).toMatchObject({ effort: "high", column: "trivial" });
    const noLower = route(policy(), {
      kind: "decide",
      stakes: "critical",
      agent: {
        name: "x",
        header: header("medium", "medium", { min_effort: "low" }),
      },
    });
    expect(noLower.effort).toBe("max");
  });
});

describe("resolveRoute: shipped agents", () => {
  const agent = (name: string) => ({ name, header: KIT_HEADERS[name] });
  it("verifier, architect and orchestrator at standard land on the sensitive cell", () => {
    const p = policy();
    expect(
      route(p, { kind: "check", stakes: "standard", agent: agent("verifier") })
        .column,
    ).toBe("sensitive");
    expect(
      route(p, {
        kind: "design",
        stakes: "standard",
        agent: agent("architect"),
      }).column,
    ).toBe("sensitive");
    expect(
      route(p, {
        kind: "decide",
        stakes: "standard",
        agent: agent("orchestrator"),
      }).column,
    ).toBe("sensitive");
  });

  it("they stay in their column at sensitive and critical (one shift, not two)", () => {
    const p = policy();
    expect(
      route(p, { kind: "check", stakes: "sensitive", agent: agent("verifier") })
        .column,
    ).toBe("sensitive");
    expect(
      route(p, {
        kind: "design",
        stakes: "critical",
        agent: agent("architect"),
      }).column,
    ).toBe("critical");
    expect(
      route(p, { kind: "check", stakes: "standard", agent: agent("architect") })
        .column,
    ).toBe("sensitive");
  });

  it("explorer (low, small) as check: standard lowers medium to low, trivial stays low", () => {
    const p = policy();
    expect(
      route(p, { kind: "check", stakes: "standard", agent: agent("explorer") }),
    ).toMatchObject({ column: "standard", effort: "low" });
    expect(
      route(p, { kind: "check", stakes: "trivial", agent: agent("explorer") }),
    ).toMatchObject({ column: "trivial", effort: "low" });
  });

  it("docs-writer (medium, medium) as build at standard changes nothing", () => {
    expect(
      route(policy(), {
        kind: "build",
        stakes: "standard",
        agent: agent("docs-writer"),
      }),
    ).toMatchObject({ column: "standard", effort: "medium" });
  });
});

describe("resolveRoute: needs precedence per field", () => {
  it("call beats agent default_needs beats the global default, with the source reported", () => {
    const p = policy((x) => {
      x.default_needs = { reasoning: "medium", context: "small" };
    });
    const r = route(p, {
      kind: "build",
      stakes: "standard",
      needs: { reasoning: "high" },
      agent: { name: "a", header: header("low", "large") },
    });
    expect(r.needs).toEqual({ reasoning: "high", context: "large" });
    expect(r.needsSource).toEqual({ reasoning: "call", context: "agent" });
    const global = route(p, { kind: "build", stakes: "standard" });
    expect(global.needs).toEqual({ reasoning: "medium", context: "small" });
    expect(global.needsSource).toEqual({
      reasoning: "default",
      context: "default",
    });
  });

  it("a call value can lower an agent default", () => {
    const r = route(policy(), {
      kind: "check",
      stakes: "standard",
      needs: { reasoning: "low" },
      agent: { name: "verifier", header: KIT_HEADERS.verifier },
    });
    expect(r.needs.reasoning).toBe("low");
    expect(r.column).toBe("standard");
  });
});

describe("resolveRoute: the two ui-designer calls", () => {
  const ui = { name: "ui-designer", header: KIT_HEADERS["ui-designer"] };
  it("footer link: build, trivial, low, small -> build.trivial, low effort, small window", () => {
    const r = route(policy(), {
      kind: "build",
      stakes: "trivial",
      needs: { reasoning: "low", context: "small" },
      agent: ui,
    });
    expect(r).toMatchObject({
      column: "trivial",
      model: "cursor.build.trivial",
      effort: "low",
      contextWindow: "128k",
    });
  });

  it("pay button loading state: build, critical, high, large -> build.critical, max, large window", () => {
    const r = route(policy(), {
      kind: "build",
      stakes: "critical",
      needs: { reasoning: "high", context: "large" },
      agent: ui,
    });
    expect(r).toMatchObject({
      column: "critical",
      model: "cursor.build.critical",
      effort: "max",
      contextWindow: "1M",
    });
    expect(r.gates).toMatchObject({
      review: "required",
      second_review: "independent",
      human: "required",
    });
  });
});

describe("resolveRoute: context window", () => {
  it("maps the effective context size per provider", () => {
    const p = policy((x) => {
      x.providers.claude.context_windows = {
        small: 200000,
        medium: "500k",
        large: "2M",
      };
    });
    expect(
      route(p, {
        kind: "build",
        stakes: "standard",
        provider: "claude",
        needs: { context: "large" },
      }).contextWindow,
    ).toBe("2M");
    expect(
      route(p, {
        kind: "build",
        stakes: "standard",
        provider: "claude",
        needs: { context: "small" },
      }).contextWindow,
    ).toBe(200000);
  });

  it("a missing entry gives undefined and a note", () => {
    const p = policy((x) => {
      x.providers.muse.context_windows = { small: "64k" };
    });
    const r = route(p, { kind: "build", stakes: "standard", provider: "muse" });
    expect(r.contextWindow).toBeUndefined();
    expect(r.notes).toContain("no context_windows.medium for muse");
  });
});

describe("resolveRoute: kind comes from the call", () => {
  const ui = { name: "ui-designer", header: KIT_HEADERS["ui-designer"] };
  it("one agent, four kinds, four different rows", () => {
    const rows = KINDS.map(
      (kind) => route(policy(), { kind, stakes: "standard", agent: ui }).model,
    );
    expect(new Set(rows).size).toBe(4);
    expect(rows).toEqual(KINDS.map((kind) => `cursor.${kind}.standard`));
  });

  it("an omitted kind uses default_kind with a note, else build with a note", () => {
    const hint = route(policy(), { stakes: "standard", agent: ui });
    expect(hint).toMatchObject({
      kind: "design",
      kindSource: "hint",
      model: "cursor.design.standard",
    });
    expect(hint.notes).toContain("kind not given, using design (hint)");
    const none = route(policy(), {
      stakes: "standard",
      agent: { name: "mine", header: header("medium", "medium") },
    });
    expect(none).toMatchObject({ kind: "build", kindSource: "default" });
    expect(none.notes).toContain("kind not given, using build (default)");
    expect(route(policy(), { stakes: "standard" })).toMatchObject({
      kind: "build",
      kindSource: "default",
    });
    expect(
      route(policy(), { kind: "check", stakes: "standard", agent: ui })
        .kindSource,
    ).toBe("call");
  });

  it("a kind outside the agent's kinds is an error, even when it is the default hint", () => {
    const explorer = { name: "explorer", header: KIT_HEADERS.explorer };
    const result = resolveRoute(policy(), {
      kind: "build",
      stakes: "standard",
      agent: explorer,
    });
    expect(result.ok).toBe(false);
    expect(result.ok ? "" : result.error.message).toContain(
      "cannot be invoked as build (allowed: check)",
    );
    expect(
      resolveRoute(policy(), {
        kind: "check",
        stakes: "standard",
        agent: explorer,
      }).ok,
    ).toBe(true);
  });

  it("only check is read-only", () => {
    for (const kind of KINDS)
      expect(route(policy(), { kind, stakes: "standard" }).readOnly, kind).toBe(
        kind === "check",
      );
  });
});

describe("resolveRoute: gates and second review", () => {
  it("attaches the gates of the task stakes", () => {
    const p = policy();
    for (const stakes of STAKES)
      expect(route(p, { kind: "build", stakes }).gates).toEqual(
        p.gates[stakes],
      );
  });

  it("only critical gets a second review, routed as check at the critical column", () => {
    const p = policy();
    expect(
      route(p, { kind: "build", stakes: "sensitive" }).secondReview,
    ).toBeUndefined();
    const r = route(p, { kind: "build", stakes: "critical" });
    expect(r.secondReview).toMatchObject({
      provider: "cursor",
      model: "cursor.check.critical",
      effort: "max",
    });
  });

  it("uses second_review_provider when pinned and warns only when the models match", () => {
    const p = policy((x) => {
      x.gates.critical.second_review_provider = "claude";
    });
    const r = route(p, { kind: "build", stakes: "critical" });
    expect(r.secondReview).toMatchObject({
      provider: "claude",
      model: "claude.check.critical",
    });
    expect(r.secondReview?.warning).toBeUndefined();
  });

  it("warns when both reviews resolve to the same model id", () => {
    const p = policy((x) => {
      x.providers.cursor.check.critical.model = "shared-one";
      x.providers.cursor.check.sensitive.model = "shared-one";
      x.providers.cursor.check.standard.model = "shared-one";
      x.providers.cursor.check.trivial.model = "shared-one";
    });
    const r = route(p, { kind: "check", stakes: "critical" });
    expect(r.secondReview?.warning).toContain("same model");
  });

  it("warns that distinctness cannot be proven when both inherit", () => {
    const loaded = loadDefaults();
    if (!loaded.ok) throw loaded.error;
    const r = route(loaded.value, {
      kind: "check",
      stakes: "critical",
      provider: "claude",
    });
    expect(r.secondReview?.warning).toContain("cannot prove distinct model");
  });
});

describe("loadPolicy and loadAgent", () => {
  it("returns the shipped defaults without a project file, and merges one over them", () => {
    const dir = tempDir();
    const defaults = loadPolicy(dir);
    expect(defaults).toMatchObject({ ok: true });
    put(
      dir,
      "tokenomics.md",
      "---\nschema: 1\ndefault_provider: claude\nproviders:\n  claude:\n    build:\n      standard: { model: my-build-model }\n---\n",
    );
    const merged = loadPolicy(dir);
    if (!merged.ok) throw merged.error;
    expect(merged.value.default_provider).toBe("claude");
    expect(merged.value.providers.claude.build.standard).toEqual({
      model: "my-build-model",
      effort: "medium",
    });
    expect(merged.value.providers.claude.check.critical.effort).toBe("max");
  });

  it("an invalid project file is an error naming every problem", () => {
    const dir = tempDir();
    put(dir, "tokenomics.md", "---\nschema: 1\ntiers: {}\n---\n");
    const result = loadPolicy(dir);
    expect(result.ok).toBe(false);
    expect(result.ok ? "" : result.error.message).toContain(
      "tokenomics.md: tiers: unknown key",
    );
  });

  it("maps a provenanced Muse dest to the kit source CHECK header", () => {
    const dir = tempDir();
    put(dir, "agents/a11y-auditor.md", AGENT("a11y-auditor"));
    put(
      dir,
      "agents/accessibility-auditor.md",
      `---\n${markerLine("a11y-auditor")}\nname: accessibility-auditor\ndescription: d\nmodel: inherit\n---\nBody\n`,
    );
    const dest = loadAgent(dir, "accessibility-auditor");
    const source = loadAgent(dir, "a11y-auditor");
    expect(source).toMatchObject({
      ok: true,
      value: { name: "a11y-auditor", header: KIT_HEADERS["a11y-auditor"] },
    });
    expect(dest).toMatchObject({
      ok: true,
      value: { name: "accessibility-auditor", header: KIT_HEADERS["a11y-auditor"] },
    });
    expect(dest.ok && dest.value.header.default_kind).toBe("check");
    const routed = route(policy(), { stakes: "standard", agent: dest.ok ? dest.value : { name: "x", header: KIT_HEADERS["a11y-auditor"] } });
    expect(routed).toMatchObject({ kind: "check", kindSource: "hint" });
    expect(routed.notes).toContain("kind not given, using check (hint)");
  });

  it("an unmarked dest without a11y-auditor is a user agent, not CHECK", () => {
    const dir = tempDir();
    put(dir, "agents/accessibility-auditor.md", AGENT("accessibility-auditor") + "MINE\n");
    const dest = loadAgent(dir, "accessibility-auditor");
    expect(dest.ok && dest.value.header.default_kind).toBeUndefined();
    expect(dest.ok && dest.value.note).toContain("using the default");
    const routed = route(policy(), { stakes: "standard", agent: dest.ok ? dest.value : { name: "x", header: { role: "custom agent", default_needs: { reasoning: "medium", context: "medium" } } } });
    expect(routed).toMatchObject({ kind: "build", kindSource: "default" });
  });

  it("collision: unmarked dest keeps its own identity while a11y-auditor stays CHECK", () => {
    const dir = tempDir();
    put(dir, "agents/a11y-auditor.md", AGENT("a11y-auditor"));
    put(dir, "agents/accessibility-auditor.md", AGENT("accessibility-auditor") + "MINE\n");
    const dest = loadAgent(dir, "accessibility-auditor");
    const source = loadAgent(dir, "a11y-auditor");
    expect(source.ok && source.value.header.default_kind).toBe("check");
    expect(dest.ok && dest.value.header.default_kind).toBeUndefined();
    expect(dest.ok && dest.value.note).toContain("using the default");
  });

  it("native dest name with unmarked source and no dest file still selects CHECK", () => {
    const dir = tempDir();
    put(dir, "agents/a11y-auditor.md", AGENT("a11y-auditor"));
    const dest = loadAgent(dir, "accessibility-auditor");
    expect(dest).toMatchObject({
      ok: true,
      value: { name: "accessibility-auditor", header: KIT_HEADERS["a11y-auditor"] },
    });
  });

  it("native dest name without source or dest is unknown, not a kit-table steal", () => {
    const dir = tempDir();
    expect(loadAgent(dir, "accessibility-auditor").ok).toBe(false);
  });

  it("reads the header from agents.meta.json, falls back to the table silently, rejects unknown names", () => {
    const dir = tempDir();
    put(dir, "agents/mine.md", AGENT("mine"));
    put(dir, "agents/verifier.md", AGENT("verifier"));
    put(
      dir,
      "agents.meta.json",
      JSON.stringify({
        mine: { role: "my agent", default_needs: { reasoning: "high", context: "small" } },
        ghost: { role: "ghost agent", default_needs: { reasoning: "low", context: "small" } },
      }),
    );
    expect(loadAgent(dir, "mine")).toMatchObject({
      ok: true,
      value: { name: "mine", header: { default_needs: { reasoning: "high", context: "small" } } },
    });
    const verifier = loadAgent(dir, "verifier");
    expect(verifier).toMatchObject({ ok: true, value: { header: KIT_HEADERS.verifier } });
    expect(verifier.ok && verifier.value.note).toBeUndefined();
    expect(loadAgent(dir, "architect")).toMatchObject({ ok: true, value: { header: KIT_HEADERS.architect } });
    expect(loadAgent(dir, "ghost").ok).toBe(true);
    expect(loadAgent(dir, "nobody").ok).toBe(false);
    expect(loadAgent(dir, "../etc").ok).toBe(false);
  });

  it("a project entry overrides the shipped table for a kit agent", () => {
    const dir = tempDir();
    put(
      dir,
      "agents.meta.json",
      JSON.stringify({ verifier: { role: "my gate", default_needs: { reasoning: "low", context: "small" } } }),
    );
    expect(loadAgent(dir, "verifier")).toMatchObject({ ok: true, value: { header: { role: "my gate" } } });
  });

  it("an unreadable agents.meta.json is an error, not a silent fallback", () => {
    const dir = tempDir();
    put(dir, "agents.meta.json", "{nope");
    const agent = loadAgent(dir, "verifier");
    expect(agent.ok).toBe(false);
    expect(agent.ok ? "" : agent.error.message).toContain("not valid JSON");
  });

  it("a headerless custom agent routes with the default header and a note", () => {
    const dir = tempDir();
    put(dir, "agents/plain.md", AGENT("plain"));
    const agent = loadAgent(dir, "plain");
    expect(agent.ok && agent.value.header.default_needs).toEqual({
      reasoning: "medium",
      context: "medium",
    });
    expect(agent.ok && agent.value.note).toContain("using the default");
  });
});

describe("effort order", () => {
  it("is low < medium < high < max", () => {
    expect([...EFFORTS]).toEqual(["low", "medium", "high", "max"]);
  });
});
