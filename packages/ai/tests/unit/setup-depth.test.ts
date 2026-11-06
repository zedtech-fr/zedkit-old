import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { main } from "#cli.js";
import { kitDir } from "#kit.js";
import { checkDepth } from "#setup-depth.js";
import { put, tempDir, TOKENOMICS_D4 } from "./helpers.js";

/** The meaning check a second reader writes: one verdict per sequencing rule, none left open. */
const MEANING = "\n## Meaning check\n\n| ID | Verdict | Code does | Resolution |\n| -- | ------- | --------- | ---------- |\n| R1-1 | match | caps the refund | |\n";
const READING = [
  "**Budget:** none found",
  "| Slice | Reader paths | Tier | Rules |",
  "| ----- | ------------ | ---- | ----- |",
  "| 1 | `src` | scout | 3 |",
  "",
  "R1-1 refunds are capped, `src/refund.ts:31`",
].join("\n") + MEANING;
const ROUTING = "**Provider running this setup:** cursor\n\n| Tier | Jobs |\n| **scout** | read |\n| **lead** | decide |\n";

/** A repo whose setup went deep on every axis. */
function deep(root: string): void {
  put(root, "src/refund.ts", "x\n");
  put(root, "src/AGENTS.md", "# src rules\n\nDomain: ../.agents/domain/billing.md\n");
  put(root, "AGENTS.md", "# Root\n\n## Tokenomics\n\nSee `.agents/tokenomics.md`.\n");
  put(root, ".agents/setup-log/reading.md", READING);
  put(root, ".agents/domain/billing.md", "| B-01 | current | Refunds capped | `src/refund.ts:31` |\n");
  put(root, ".agents/tokenomics.md", TOKENOMICS_D4);
}

/** A v2-style setup: product, plan, setup-log, root AGENTS.md, nothing deeper. */
function v2Style(root: string): void {
  put(root, "src/refund.ts", "x\n");
  put(root, "AGENTS.md", "# Root\n");
  put(root, "PLAN.md", "PLAN.md\n");
  put(root, ".agents/product.md", "# Product\n");
  put(root, ".agents/setup-log.md", "# Log\n");
}

const tags = (root: string): string[] => checkDepth(root).map((i) => i.message.slice(0, 2));

describe("checkDepth", () => {
  it("passes a setup that read the code, wrote rules, nested files and routing", () => {
    const root = tempDir();
    deep(root);
    expect(checkDepth(root)).toEqual([]);
  });

  it("fails a v2-style setup on all four depth axes", () => {
    const root = tempDir();
    v2Style(root);
    expect(tags(root)).toEqual(["D1", "D2", "D3", "D4"]);
  });

  it("D1: needs a reading log with reader rows and file:line evidence", () => {
    const root = tempDir();
    deep(root);
    put(root, ".agents/setup-log/reading.md", `**Budget:** none found\n| Slice |\n| 1 | src |\n${MEANING}`);
    expect(checkDepth(root).map((i) => i.message)).toEqual([
      expect.stringContaining("no file:line evidence"),
    ]);
    put(root, ".agents/setup-log/reading.md", `**Budget:** none found\nno table, \`src/refund.ts:3\`\n${MEANING}`);
    expect(checkDepth(root).map((i) => i.message)).toEqual([expect.stringContaining("0 reader row(s)")]);
  });

  it("D1: a medium repo needs six reader rows, a small one needs one", () => {
    const root = tempDir();
    deep(root);
    for (const dir of ["a", "b", "c", "d", "e", "f", "g"]) for (let i = 0; i < 50; i += 1) put(root, `${dir}/f${i}.ts`, "x\n");
    const messages = checkDepth(root).map((i) => i.message);
    expect(messages).toEqual([expect.stringMatching(/1 reader row\(s\), a medium repo needs at least 6/u)]);
    const rows = [1, 2, 3, 4, 5, 6].map((n) => `| ${n} | x | scout | 1 |`).join("\n");
    put(root, ".agents/setup-log/reading.md", `**Budget:** none found\n${rows}\n\`a/f1.ts:2\`\n${MEANING}`);
    expect(checkDepth(root)).toEqual([]);
  });

  it("D1: the log must state the run budget", () => {
    const root = tempDir();
    deep(root);
    put(root, ".agents/setup-log/reading.md", `| Slice |\n| 1 | \`src\` | scout | 3 |\n\n\`src/refund.ts:31\`\n${MEANING}`);
    expect(checkDepth(root).map((i) => i.message)).toEqual([expect.stringContaining("no **Budget:** line")]);
    put(
      root,
      ".agents/setup-log/reading.md",
      "**Budget:** stop after 5 files\n**Budget exceptions:** owner-approved: reader 1 read 8 files (budget 5), approved by interview Q2\n| 1 | `src` | scout | 3 |\n\n`src/refund.ts:31`\n" + MEANING,
    );
    expect(checkDepth(root)).toEqual([]);
  });

  it("D2: domain files need evidence; owner answers count", () => {
    const root = tempDir();
    deep(root);
    put(root, ".agents/domain/billing.md", "Refunds are capped.\n");
    expect(checkDepth(root).map((i) => i.message)).toEqual([expect.stringContaining("no file:line or `source: owner`")]);
    put(root, ".agents/domain/billing.md", "Refunds are capped. source: owner\n");
    expect(checkDepth(root)).toEqual([]);
  });

  it("D2: a current (documented, not enforced) domain rule must be cited in the Unenforced inventory", () => {
    const root = tempDir();
    deep(root);
    put(root, ".agents/domain/billing.md", "| B-01 | current (documented, not enforced) | No web token reuse | `src/auth/token.ts:12` |\n");
    expect(checkDepth(root).map((i) => i.message)).toEqual([expect.stringContaining("B-01")]);
    put(root, "AGENTS.md", "# Root\n\n## Tokenomics\n\nSee `.agents/tokenomics.md`.\n\n## Unenforced rules\n\n| B-01 | add token-reuse lint | `src/auth/token.ts:12` |\n");
    expect(checkDepth(root)).toEqual([]);
  });

  it("D2: an unenforced domain rule below the first line of the file is still inventoried", () => {
    const root = tempDir();
    deep(root);
    put(root, ".agents/domain/billing.md", "# Billing\n\n| ID | Status | Rule | Source |\n| B-01 | current | Refunds capped | `src/refund.ts:31` |\n| B-02 | current (documented, not enforced) | One refund per order | `src/refund.ts:40` |\n");
    expect(checkDepth(root).map((i) => i.message)).toEqual([expect.stringContaining("B-02")]);
  });

  it("D2: a current (documented, not enforced) identity rule in design.md must be cited in the inventory", () => {
    const root = tempDir();
    deep(root);
    put(root, "src/Button.tsx", "x\n");
    put(root, ".agents/design.md", "## Identity rules\n\n| I-04 | current (documented, not enforced) | Buttons use verbs | `src/Button.tsx:3` |\n");
    expect(checkDepth(root).map((i) => i.message)).toEqual([expect.stringContaining("I-04")]);
    put(root, ".agents/setup-log.md", "## Unenforced rules\n\n| I-04 | add a copy lint | `src/Button.tsx:3` |\n");
    expect(checkDepth(root)).toEqual([]);
  });

  it("D2: a nested AGENTS.md with documented, not enforced rules must be named in the inventory", () => {
    const root = tempDir();
    deep(root);
    put(root, "src/AGENTS.md", "# src rules\n\nDomain: ../.agents/domain/billing.md\n\n1. **No I/O in the domain layer.** documented, not enforced (`src/refund.ts:31`)\n");
    expect(checkDepth(root).map((i) => i.message)).toEqual([expect.stringContaining("src/AGENTS.md")]);
    expect(tags(root)).toEqual(["D2"]);
    put(root, ".agents/setup-log.md", "## Unenforced rules\n\n| src/AGENTS.md rule 1 | add an import-boundary lint | `src/refund.ts:31` |\n");
    expect(checkDepth(root)).toEqual([]);
    put(root, "src/AGENTS.md", "# src rules\n\nDomain: ../.agents/domain/billing.md\n\n1. **Caps.** enforced by `eslint.config.js` (`src/refund.ts:31`)\n");
    put(root, ".agents/setup-log.md", "");
    expect(checkDepth(root)).toEqual([]);
  });

  it("D2: sidecars and templates do not count as domain rules", () => {
    const root = tempDir();
    deep(root);
    put(root, ".agents/domain/billing.md", "x `src/refund.ts:1`\n");
    put(root, ".agents/domain/billing.kit.md", "template\n");
    expect(checkDepth(root)).toEqual([]);
    const bare = tempDir();
    deep(bare);
    put(bare, ".agents/domain/billing.md", "");
    put(bare, ".agents/domain/x.template.md", "`src/a.ts:1`\n");
    expect(tags(bare)).toEqual(["D2"]);
  });

  it("D3: a nested AGENTS.md that links the setup's rules satisfies it; so does a stated decision", () => {
    const linked = tempDir();
    deep(linked);
    expect(checkDepth(linked)).toEqual([]);
    const waived = tempDir();
    deep(waived);
    rmSync(join(waived, "src/AGENTS.md"));
    put(waived, ".agents/setup-log.md", "- nested-agents: none — one small folder\n");
    expect(checkDepth(waived)).toEqual([]);
    const kept = tempDir();
    deep(kept);
    put(kept, "src/AGENTS.md", "# thin file the owner wrote\n");
    put(kept, ".agents/setup-log.md", "- nested-agents: kept — owner files are current\n");
    expect(checkDepth(kept)).toEqual([]);
  });

  it("D3: no nested file, or existing nested files that ignore the setup, fail (the root file alone does not count)", () => {
    const none = tempDir();
    deep(none);
    rmSync(join(none, "src/AGENTS.md"));
    expect(checkDepth(none).map((i) => i.message)).toEqual([expect.stringContaining("no nested AGENTS.md (add one")]);
    const stale = tempDir();
    deep(stale);
    put(stale, "src/AGENTS.md", "# 8 lines the owner wrote, no pointer\n");
    expect(checkDepth(stale).map((i) => i.message)).toEqual([expect.stringContaining("links the setup's rules")]);
    const kit = tempDir();
    deep(kit);
    rmSync(join(kit, "src/AGENTS.md"));
    put(kit, "node_modules/pkg/AGENTS.md", "see .agents/domain\n");
    put(kit, ".agents/skills/s/AGENTS.md", "see .agents/domain\n");
    expect(tags(kit)).toEqual(["D3"]);
  });

  it("D3: the rule map must name every provider-scoped rule file the repo already owns", () => {
    const root = tempDir();
    deep(root);
    put(root, ".cursor/rules/12-hexagonal.mdc", "---\nglobs:\n  - packages/**\n---\n");
    put(root, "services/pay/.cursor/rules/00-team.mdc", "x\n");
    put(root, ".claude/rules/style.md", "x\n");
    put(root, ".cursor/rules/project.mdc", "kit-written\n");
    const msg = checkDepth(root).map((i) => i.message);
    expect(msg).toEqual([expect.stringMatching(/Rule map misses 3 provider rule file\(s\): .*(12-hexagonal|00-team|style)/u)]);
    put(
      root,
      ".agents/setup-log/reading.md",
      `${READING}\n.cursor/rules/12-hexagonal.mdc kept as owner\nservices/pay/.cursor/rules/00-team.mdc mirrored\n.claude/rules/style.md not a rule\n`,
    );
    expect(checkDepth(root)).toEqual([]);
  });

  it("D3: a bare name is not enough when two folders share a rule file name", () => {
    const root = tempDir();
    deep(root);
    put(root, "a/.cursor/rules/00-team.mdc", "x\n");
    put(root, "b/.cursor/rules/00-team.mdc", "x\n");
    put(root, ".agents/setup-log/reading.md", `${READING}\na/.cursor/rules/00-team.mdc\n`);
    expect(checkDepth(root).map((i) => i.message)).toEqual([expect.stringContaining("misses 1 provider rule file(s): b/.cursor/rules/00-team.mdc")]);
  });

  it("D3: provider rule files are only checked once a reading log exists (D1 owns the missing log)", () => {
    const root = tempDir();
    v2Style(root);
    put(root, ".cursor/rules/02-budget.mdc", "x\n");
    expect(checkDepth(root).filter((i) => i.message.includes("Rule map"))).toEqual([]);
  });

  it("D2: a repo with UI files needs an Identity rules section with evidence", () => {
    const root = tempDir();
    deep(root);
    put(root, "src/App.tsx", "x\n");
    expect(checkDepth(root).map((i) => i.message)).toEqual([expect.stringContaining("no `## Identity rules` section")]);
    put(root, ".agents/design.md", "# Design\n\n## Voice\n\nShort. `src/App.tsx:1`\n");
    expect(tags(root)).toEqual(["D2"]);
    put(root, ".agents/design.md", "# Design\n\n## Identity rules\n\n| I-01 | current | Prices show currency |\n\n## Tokens\n\n`src/App.tsx:1`\n");
    expect(checkDepth(root).map((i) => i.message)).toEqual([expect.stringContaining("no file:line or `source: owner` evidence in the Identity")]);
    put(root, ".agents/design.md", "# Design\n\n## Identity rules\n\n| I-01 | current | Prices show currency | `src/App.tsx:1` |\n");
    expect(checkDepth(root)).toEqual([]);
    put(root, ".agents/design.md", "# Design\n\n## Identity rules\n\nTone is calm. source: owner\n");
    expect(checkDepth(root)).toEqual([]);
  });

  it("D2: a repo without UI files needs no design.md", () => {
    const root = tempDir();
    deep(root);
    expect(checkDepth(root)).toEqual([]);
  });

  it("D4: filled tokenomics cells must be pointed at from AGENTS.md", () => {
    const root = tempDir();
    deep(root);
    put(root, "AGENTS.md", "# Root\n");
    expect(checkDepth(root).map((i) => i.message)).toEqual([expect.stringContaining("root AGENTS.md does not point at .agents/tokenomics.md")]);
  });

  it("D4: inherit-only tokenomics is not enough", () => {
    const root = tempDir();
    deep(root);
    put(root, ".agents/tokenomics.md", "---\nschema: 1\nproviders:\n  cursor:\n    build:\n      standard: { model: inherit, effort: medium }\n---\n");
    expect(checkDepth(root).map((i) => i.message)).toEqual([expect.stringContaining("real model (not inherit)")]);
  });

  it("D4: a valid leftover model-routing.md still passes, with a deprecation warning", () => {
    const root = tempDir();
    deep(root);
    put(root, ".agents/tokenomics.md", "---\nschema: 1\n---\n");
    put(root, ".agents/model-routing.md", ROUTING);
    put(root, "AGENTS.md", "# Root\n\nSee `.agents/model-routing.md`.\n");
    expect(checkDepth(root).map((i) => i.message)).toEqual([expect.stringContaining("deprecated")]);
  });

  it("D4: legacy routing must name the provider, both tiers, and be pointed at from AGENTS.md", () => {
    const root = tempDir();
    v2Style(root);
    put(root, "src/AGENTS.md", "# src rules\n\nDomain: ../.agents/domain/billing.md\n");
    put(root, ".agents/setup-log/reading.md", READING);
    put(root, ".agents/domain/billing.md", "| B-01 | current | Refunds capped | `src/refund.ts:31` |\n");
    put(root, "AGENTS.md", "# Root\n\nSee `.agents/model-routing.md`.\n");
    put(root, ".agents/model-routing.md", "Provider: unknown\n| scout | lead |\n");
    expect(checkDepth(root).map((i) => i.message)).toEqual([expect.stringContaining("name the provider")]);
    put(root, ".agents/model-routing.md", "Provider: claude\nonly scout here\n");
    expect(checkDepth(root).map((i) => i.message)).toEqual([expect.stringContaining("scout (cheap reading) and lead")]);
    put(root, ".agents/model-routing.md", ROUTING);
    put(root, "AGENTS.md", "# Root\n");
    expect(checkDepth(root).map((i) => i.message)).toEqual([expect.stringContaining("root AGENTS.md does not point")]);
  });
});

describe("validate --setup depth", () => {
  function run(...argv: string[]): { code: number; text: string } {
    const out: string[] = [];
    const code = main(argv, { out: (line) => out.push(line), err: () => undefined });
    return { code, text: out.join("\n") };
  }

  it("reports the depth issues of a v2-style setup and leaves plain validate alone", () => {
    const root = tempDir();
    v2Style(root);
    expect(run("validate", root).code).toBe(0);
    const setup = run("validate", root, "--setup");
    expect(setup.code).toBe(1);
    for (const tag of ["D1 code reading", "D2 domain rules", "D3 nested rules", "D4 tokenomics"]) {
      expect(setup.text).toContain(tag);
    }
  });

  it("is clean for a deep setup whose plan covers every path", () => {
    const root = tempDir();
    deep(root);
    put(root, "PLAN.md", "PLAN.md\nintro-first: printed before any tool call (fresh)\n");
    expect(run("validate", root, "--setup")).toEqual({ code: 0, text: "not a git repository; skipped change coverage\nok" });
  });
});

describe("setup-ai prose for the unenforced inventory", () => {
  it("reconciles nested AGENTS, design identity rules and domain purity, and says validate checks it", () => {
    const skill = readFileSync(join(kitDir(), "skills", "setup-ai", "SKILL.md"), "utf8");
    expect(skill).toContain("every nested `AGENTS.md`");
    expect(skill).toContain("`design.md` Identity rules");
    expect(skill).toContain("`I-04`");
    expect(skill).toMatch(/\*\*Domain purity\*\*/u);
    expect(skill).toMatch(/named there by path \(`validate --setup` checks both\)/u);
  });
});
