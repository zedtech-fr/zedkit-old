import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { main } from "#cli.js";
import { kitDir } from "#kit.js";
import {
  checkCriticalLines,
  checkStakesChange,
  gatesFor,
  parseKind,
  parseNeeds,
  parseStakes,
  readAtRef,
} from "#stakes.js";
import { loadDefaults, STAKES, type Tokenomics } from "#tokenomics.js";
import { put, tempDir } from "./helpers.js";

function defaults(): Tokenomics {
  const loaded = loadDefaults();
  if (!loaded.ok) throw loaded.error;
  return loaded.value;
}

const stakesOf = (text: string): unknown => {
  const parsed = parseStakes(text);
  return parsed.ok ? parsed.value : parsed.error.message;
};

describe("parseStakes", () => {
  it("reads a frontmatter key, a plain line, a bold line and a list item", () => {
    expect(stakesOf("---\nstakes: sensitive\n---\n\nBody\n")).toBe("sensitive");
    expect(stakesOf("# Title\n\nStakes: critical\n")).toBe("critical");
    expect(stakesOf("**Stakes:** sensitive\n")).toBe("sensitive");
    expect(stakesOf("**Stakes**: trivial\n")).toBe("trivial");
    expect(stakesOf("- Stakes: standard\n")).toBe("standard");
    expect(stakesOf("> STAKES: Critical\n")).toBe("critical");
  });

  it("is undefined when absent, and the first header line wins", () => {
    expect(stakesOf("# Plan\n\nNothing here.\n")).toBeUndefined();
    expect(stakesOf("Stakes: sensitive\n\nStakes: trivial\n")).toBe("sensitive");
  });

  it("does not read a `Stakes raised:` line as the stakes", () => {
    expect(stakesOf("Stakes raised: standard -> sensitive: auth\n")).toBeUndefined();
  });

  it("names an unknown value", () => {
    expect(stakesOf("Stakes: urgent\n")).toContain('"urgent" is not one of trivial, standard, sensitive, critical');
  });
});

describe("parseKind and parseNeeds", () => {
  it("reads Kind from a line or frontmatter and rejects an unknown kind", () => {
    const kind = (text: string): unknown => {
      const parsed = parseKind(text);
      return parsed.ok ? parsed.value : parsed.error.message;
    };
    expect(kind("Kind: check\n")).toBe("check");
    expect(kind("---\nkind: design\n---\n")).toBe("design");
    expect(kind("Nothing\n")).toBeUndefined();
    expect(kind("Kind: judge\n")).toContain("is not one of decide, design, build, check");
  });

  it("reads Needs from a line or a frontmatter mapping, one field at a time", () => {
    const needs = (text: string): unknown => {
      const parsed = parseNeeds(text);
      return parsed.ok ? parsed.value : parsed.error.message;
    };
    expect(needs("Needs: reasoning=high, context=large\n")).toEqual({ reasoning: "high", context: "large" });
    expect(needs("Needs: context=small\n")).toEqual({ context: "small" });
    expect(needs("**Needs:** reasoning=low\n")).toEqual({ reasoning: "low" });
    expect(needs("---\nneeds: { reasoning: high }\n---\n")).toEqual({ reasoning: "high" });
    expect(needs("Nothing\n")).toEqual({});
  });

  it("rejects an unknown key and a value outside the domain", () => {
    const message = (text: string): string => {
      const parsed = parseNeeds(text);
      return parsed.ok ? "ok" : parsed.error.message;
    };
    expect(message("Needs: speed=high\n")).toContain("needs.speed: unknown key");
    expect(message("Needs: reasoning=extreme\n")).toContain("needs.reasoning");
    expect(message("Needs: context=huge\n")).toContain("needs.context");
  });
});

describe("checkStakesChange", () => {
  it("accepts any stakes when there is nothing to compare", () => {
    for (const next of STAKES) expect(checkStakesChange(undefined, next)).toEqual([]);
  });

  it("accepts the same stakes and refuses a lower one", () => {
    expect(checkStakesChange("sensitive", "sensitive")).toEqual([]);
    expect(checkStakesChange("sensitive", "standard")).toEqual(["stakes lowered from sensitive to standard: stakes only go up"]);
    expect(checkStakesChange("critical", "trivial")).toHaveLength(1);
  });

  it("refuses a raise without a `Stakes raised:` reason and accepts one with it", () => {
    expect(checkStakesChange("standard", "sensitive")).toEqual([expect.stringContaining('without a "Stakes raised: standard -> sensitive: <reason>" line')]);
    expect(checkStakesChange("standard", "sensitive", "Stakes raised: standard -> sensitive: touches auth\n")).toEqual([]);
    expect(checkStakesChange("standard", "sensitive", "Stakes raised:   \n")).toHaveLength(1);
  });
});

describe("gatesFor", () => {
  it("returns the gate of the task's stakes", () => {
    const policy = defaults();
    for (const stakes of STAKES) expect(gatesFor(policy, stakes, "cursor").gate).toEqual(policy.gates[stakes]);
    expect(gatesFor(policy, "trivial", "cursor").secondReview).toBeUndefined();
    expect(gatesFor(policy, "sensitive", "cursor").gate.review).toBe("required");
  });

  it("adds the second-review route for critical, with the inherit warning", () => {
    const policy = defaults();
    const critical = gatesFor(policy, "critical", "cursor");
    expect(critical.gate).toMatchObject({ second_review: "independent", distinct_model: true, human: "required" });
    expect(critical.secondReview?.warning).toContain("cannot prove distinct model");
  });

  it("uses the policy's default provider when none is given, and none otherwise", () => {
    const policy = defaults();
    policy.default_provider = "claude";
    expect(gatesFor(policy, "critical").secondReview?.provider).toBe("claude");
    delete policy.default_provider;
    expect(gatesFor(policy, "critical").secondReview).toBeUndefined();
  });
});

describe("checkCriticalLines", () => {
  it("needs both lines with a value", () => {
    expect(checkCriticalLines("Stakes: critical\n")).toHaveLength(2);
    expect(checkCriticalLines("Second review: second session, model X\nHuman validation: <handle, date>\n")).toEqual([
      'critical stakes need a "Human validation:" line with a value',
    ]);
    expect(checkCriticalLines("Second review: TBD\nHuman validation: sam 2026-11-05\n")).toEqual([
      'critical stakes need a "Second review:" line with a value',
    ]);
    expect(checkCriticalLines("**Second review:** separate session\n**Human validation:** sam, 2026-11-05\n")).toEqual([]);
  });
});

function repo(): string {
  const root = tempDir();
  const git = (...args: string[]): void => {
    execFileSync("git", args, {
      cwd: root,
      stdio: "ignore",
      env: { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@example.com", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@example.com" },
    });
  };
  git("init", "-q");
  put(root, "ticket.md", "Stakes: sensitive\n");
  git("add", "ticket.md");
  git("commit", "-q", "-m", "ticket");
  return root;
}

describe("readAtRef", () => {
  it("returns the committed text, undefined for a file new since the ref, and an error for a bad ref", () => {
    const root = repo();
    put(root, "new.md", "Stakes: trivial\n");
    const old = readAtRef(join(root, "ticket.md"), "HEAD");
    expect(old.ok && old.value).toBe("Stakes: sensitive\n");
    const fresh = readAtRef(join(root, "new.md"), "HEAD");
    expect(fresh.ok && fresh.value).toBeUndefined();
    expect(readAtRef(join(root, "ticket.md"), "no-such-ref").ok).toBe(false);
  });
});

function run(...argv: string[]): { code: number; text: string; errors: string } {
  const out: string[] = [];
  const errors: string[] = [];
  const code = main(argv, { out: (l) => out.push(l), err: (l) => errors.push(l) });
  return { code, text: out.join("\n"), errors: errors.join("\n") };
}

describe("zedkit-ai stakes", () => {
  it("prints stakes, kind, needs and gates, and defaults to standard with a note", () => {
    const root = tempDir();
    put(root, "plan.md", "Stakes: sensitive\nKind: design\nNeeds: reasoning=high\n");
    put(root, "bare.md", "# nothing\n");
    const full = run("stakes", join(root, "plan.md"), "--dir", root);
    expect(full.code).toBe(0);
    expect(full.text).toContain("stakes: sensitive");
    expect(full.text).toContain("kind: design");
    expect(full.text).toContain("needs: reasoning=high");
    expect(full.text).toContain("gates: review=required");
    const bare = run("stakes", join(root, "bare.md"), "--dir", root);
    expect(bare.text).toContain("stakes: standard");
    expect(bare.text).toContain("note: stakes not set: standard (default)");
  });

  it("fails a critical file with no second-review or human-validation line, and passes with both", () => {
    const root = tempDir();
    put(root, "pr.md", "Stakes: critical\n");
    const bad = run("stakes", join(root, "pr.md"), "--dir", root);
    expect(bad.code).toBe(1);
    expect(bad.text).toContain('"Second review:" line');
    expect(bad.text).toContain('"Human validation:" line');
    put(root, "ok.md", "Stakes: critical\nSecond review: second session, model named here\nHuman validation: sam 2026-11-05\n");
    expect(run("stakes", join(root, "ok.md"), "--dir", root).code).toBe(0);
  });

  it("compares with a git ref: lowering fails, raising needs its reason", () => {
    const root = repo();
    put(root, "ticket.md", "Stakes: standard\n");
    const lowered = run("stakes", join(root, "ticket.md"), "--base", "HEAD", "--dir", root);
    expect(lowered.code).toBe(1);
    expect(lowered.text).toContain("stakes lowered from sensitive to standard");
    put(root, "ticket.md", "Stakes: critical\nSecond review: s\nHuman validation: sam 2026-11-05\n");
    expect(run("stakes", join(root, "ticket.md"), "--base", "HEAD", "--dir", root).code).toBe(1);
    put(root, "ticket.md", "Stakes: critical\nStakes raised: sensitive -> critical: money\nSecond review: s\nHuman validation: sam 2026-11-05\n");
    expect(run("stakes", join(root, "ticket.md"), "--base", "HEAD", "--dir", root).code).toBe(0);
  });

  it("exits 2 on a missing file, a bad ref, a bad value and a bad provider", () => {
    const root = repo();
    expect(run("stakes").code).toBe(2);
    expect(run("stakes", join(root, "nope.md")).code).toBe(2);
    expect(run("stakes", join(root, "ticket.md"), "--base", "no-such-ref", "--dir", root).code).toBe(2);
    put(root, "bad.md", "Stakes: urgent\n");
    expect(run("stakes", join(root, "bad.md"), "--dir", root).errors).toContain('"urgent" is not one of');
    expect(run("stakes", join(root, "ticket.md"), "--provider", "nope", "--dir", root).code).toBe(2);
  });

  it("prints JSON", () => {
    const root = tempDir();
    put(root, "plan.md", "Stakes: sensitive\n");
    const json = JSON.parse(run("stakes", join(root, "plan.md"), "--dir", root, "--json").text) as { stakes: string; gates: { review: string }; issues: string[] };
    expect(json.stakes).toBe("sensitive");
    expect(json.gates.review).toBe("required");
    expect(json.issues).toEqual([]);
  });
});

describe("workflow skills", () => {
  const skill = (name: string): string => readFileSync(join(kitDir(), "skills", name, "SKILL.md"), "utf8");

  it("set or carry the stakes, route every spawn with its kind, and name the gate", () => {
    for (const name of ["plan", "implement", "review", "orchestrate", "parallel-work", "definition-of-done"]) {
      expect(skill(name), name).toContain("Stakes");
    }
    for (const name of ["implement", "review", "orchestrate", "parallel-work"]) {
      expect(skill(name), name).toContain("zedkit-ai route");
      expect(skill(name), name).toContain("--kind");
    }
    expect(skill("implement")).toContain("--reasoning");
    expect(skill("plan")).toContain("Needs:");
  });

  it("tell a check spawn it is read-only and detect a write", () => {
    expect(skill("review")).toContain("git status --porcelain");
    expect(skill("review")).toContain("read-only");
    expect(skill("parallel-work")).toContain("read-only");
  });

  it("leave the vendored triage, to-tickets, to-spec and pr skills untouched", () => {
    for (const name of ["triage", "to-tickets", "to-spec", "pr"]) {
      expect(skill(name), name).not.toContain("zedkit-ai route");
    }
  });

  it("make sensitive stakes run the full lens set", () => {
    const lenses = readFileSync(join(kitDir(), "skills", "review", "lenses.md"), "utf8");
    expect(lenses).toContain("sensitive");
    expect(lenses).toContain("full lens set");
  });
});
