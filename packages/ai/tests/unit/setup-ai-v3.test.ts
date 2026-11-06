import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { installKit } from "#install.js";
import { kitDir } from "#kit.js";
import { validateKit } from "#validate.js";
import { tempDir, usageText } from "./helpers.js";

const skillDir = join(kitDir(), "skills", "setup-ai");
const read = (...rel: string[]): string => readFileSync(join(skillDir, ...rel), "utf8");

const NEW_TEMPLATES = [
  "templates/reader-brief.template.md",
  "templates/reading-log.template.md",
  "templates/nested-agents.template.md",
];

describe("setup-ai v3: read the code first", () => {
  it("ships the reader brief, reading log, nested AGENTS and routing templates, and indexes them", () => {
    const index = read("templates", "README.md");
    for (const rel of NEW_TEMPLATES) {
      expect(existsSync(join(skillDir, rel)), rel).toBe(true);
      expect(index, rel).toContain(rel);
    }
  });

  it("phase B reads the code with parallel read-only readers before any interview", () => {
    const raw = read("SKILL.md");
    const b = raw.slice(raw.indexOf("## Phase B"), raw.indexOf("## Phase C"));
    expect(b.indexOf("B1. Read the code")).toBeGreaterThan(-1);
    expect(b.indexOf("B1. Read the code")).toBeLessThan(b.indexOf("B3. One batched interview"));
    expect(b).toMatch(/read-only/u);
    expect(b).toContain("npx zedkit-ai scan");
    expect(b).toContain("templates/reader-brief.template.md");
    expect(b).toContain("templates/reading-log.template.md");
    expect(b).toMatch(/1–5.*6–10.*11–20/su);
    for (const lane of ["domain", "business", "identity", "architecture", "convention", "enforcement"]) {
      expect(b, lane).toContain(`**${lane}**`);
    }
    expect(b).toMatch(/spawn one reader per slice/iu);
    expect(b).toMatch(/cannot spawn subagents, read the slices yourself/iu);
    expect(b).toMatch(/open at least three cited lines per reader/iu);
  });

  it("asks the owner only what the code could not answer, still within eight questions", () => {
    const raw = read("SKILL.md");
    expect(raw).toMatch(/Ask only what the code could not answer/u);
    expect(raw).toMatch(/Cite the gap id with each question/u);
    expect(raw).toMatch(/found in code — confirm\?/u);
    expect(raw).toMatch(/at most eight questions/iu);
    expect(raw).toMatch(/Never invent owner choices/u);
    expect(raw).toMatch(/harness auto-skip is not an owner answer/u);
    expect(raw).toMatch(/return the exact question text and options to the parent/u);
    expect(raw).toMatch(/Read before asking/u);
  });

  it("keeps the intro-is-not-a-turn-boundary contract and the three stop points", () => {
    const raw = read("SKILL.md");
    expect(raw).toMatch(/intro is not a turn boundary/iu);
    expect(raw).toMatch(/continue in the same turn without waiting/iu);
    expect(raw).toMatch(/\*\*only\*\* stop points in the whole run are: \(1\) the \*\*phase B batched interview\*\*, \(2\) \*\*plan approval before writes\*\*, and \(3\) the \*\*final report\*\*/u);
    expect(raw).toMatch(/Phases A and B1–B2 run in the same turn with no stop/u);
    expect(raw).not.toMatch(/as your \*\*next\*\* assistant message/iu);
    expect(raw).toMatch(/^> \*\*Phases:\*\*.*read the code/mu);
  });

  it("the reader brief is read-only, evidence-first and returns a fixed shape", () => {
    const raw = read("templates", "reader-brief.template.md");
    expect(raw).toMatch(/no writes/iu);
    expect(raw).toMatch(/Every rule cites `path:line`/u);
    expect(raw).toMatch(/Conflicts/u);
    expect(raw).toMatch(/Gaps \(owner only\)/u);
    expect(raw).toMatch(/Folder notes/u);
    expect(raw).toMatch(/documented, not enforced/u);
  });
});

describe("setup-ai v3: domain, identity and nested rules", () => {
  it("lands every merged rule in a home: domain, identity, nested or root", () => {
    const raw = read("SKILL.md");
    expect(raw).toMatch(/Rules come from the reading log/u);
    expect(raw).toMatch(/Identity rules/u);
    expect(raw).toMatch(/### Nested AGENTS\.md/u);
    expect(raw).toContain("templates/nested-agents.template.md");
    expect(raw).toMatch(/nested-agents: none — <reason>/u);
    expect(read("templates", "design.template.md")).toMatch(/## Identity rules/u);
  });

  it("improve mode extends existing nested files in place instead of leaving stubs alone", () => {
    const raw = read("SKILL.md");
    expect(raw).toMatch(/nested files the repo already has are audited in A3, then \*\*extended in place\*\*/u);
    expect(raw).toMatch(/Thin stubs/u);
    expect(raw).toMatch(/Missing nested rules.*never point at `\.agents\/domain`/u);
    expect(read("templates", "nested-agents.template.md")).toMatch(/Extend it in place/u);
    expect(read("templates", "setup-rubric.md")).toMatch(/existing nested stubs left untouched and unlinked/u);
  });

  it("maps what the repo already owns instead of copying it: provider rules, policy docs, run budgets", () => {
    const raw = read("SKILL.md");
    expect(raw).toMatch(/Provider-scoped rules and run budgets/u);
    expect(raw).toMatch(/Respect the repo's own budgets/u);
    expect(raw).toMatch(/stop after 5 files read with no write/u);
    expect(raw).toMatch(/Map what already exists/u);
    expect(raw).toMatch(/one law, one owner/u);
    const log = read("templates", "reading-log.template.md");
    expect(log).toMatch(/## Rule map/u);
    expect(log).toMatch(/## Policy docs/u);
    expect(read("templates", "reader-brief.template.md")).toMatch(/Documented law for this slice/u);
    expect(read("templates", "reader-brief.template.md")).toMatch(/UX and interaction laws/u);
    expect(readFileSync(join(kitDir(), "tokenomics.template.md"), "utf8")).toMatch(/kind x stakes|kind × stakes|kind of work/u);
  });

  it("refreshes the Rule map after phase C, in the skill, the log template and the checklist", () => {
    const raw = read("SKILL.md");
    const section = raw.slice(raw.indexOf("### Rule map refresh"), raw.indexOf("### Tokenomics"));
    expect(section).toMatch(/written in phase B/u);
    expect(section).toMatch(/`test -e`/u);
    expect(section).toContain("rule-map: refreshed after phase C");
    expect(raw.indexOf("### Nested AGENTS.md")).toBeLessThan(raw.indexOf("### Rule map refresh"));
    expect(raw).toMatch(/- \[ \] Rule map refreshed after phase C/u);
    expect(read("templates", "reading-log.template.md")).toContain("rule-map: refreshed after phase C");
  });

  it("the nested template keeps to what differs, links instead of copying, and cites evidence", () => {
    const raw = read("templates", "nested-agents.template.md");
    expect(raw).toMatch(/Only what differs from the root/u);
    expect(raw).toMatch(/about 60 lines/u);
    expect(raw).toMatch(/link, do not copy/u);
    expect(raw).toMatch(/file:line/u);
  });
});

describe("setup-ai v3: tokenomics", () => {
  it("routes the run itself by kind x stakes and provider", () => {
    const raw = read("SKILL.md");
    const m = raw.slice(raw.indexOf("## Tokenomics (whole run)"), raw.indexOf("## Phase A"));
    expect(m.length).toBeGreaterThan(400);
    for (const word of ["kind", "stakes", "cursor", "claude", "codex", "muse"]) expect(m, word).toContain(word);
    expect(m).toMatch(/Pass the model on every spawn/u);
    expect(m).toMatch(/Never pin an id you did not see listed/u);
    expect(m).toMatch(/This tool's listing is not another provider's catalog/u);
    expect(m).toMatch(/A Cursor Task list is not Muse availability/u);
    expect(m).toMatch(/parent session's listed id/u);
    expect(m).toMatch(/--provider <running>/u);
    expect(m).toMatch(/CLI `--model` flag pins only the parent/u);
    expect(m).toMatch(/cheapest-fast is not a substitute/u);
    expect(m).toMatch(/\.agents\/tokenomics\.md/u);
    expect(m).toMatch(/zedkit-ai sync/u);
    expect(raw).toMatch(/explorer.*check/su);
  });

  it("names no model id: cells only, the model comes from the tool's own list", () => {
    const stub = readFileSync(join(kitDir(), "tokenomics.template.md"), "utf8");
    for (const [name, text] of [["SKILL.md", read("SKILL.md")], ["tokenomics.template.md", stub], ["reader-brief", read("templates", "reader-brief.template.md")]]) {
      expect(text, name).not.toMatch(/\b(gpt-?\d|claude-\w+-\d|opus|sonnet|haiku|gemini-\d|o\d-mini)\b/iu);
    }
  });

  it("the skill and the stub cover cells, providers, sync, and inherit", () => {
    const raw = read("SKILL.md");
    const stub = readFileSync(join(kitDir(), "tokenomics.template.md"), "utf8");
    expect(stub).toMatch(/model: inherit/u);
    for (const p of ["`cursor`", "`claude`", "`codex`", "`muse`"]) expect(raw, p).toContain(p);
    expect(raw).toMatch(/no routing available/u);
    expect(raw).toMatch(/zedkit-ai sync/u);
    expect(raw).toMatch(/build\.standard/u);
    expect(raw).toMatch(/decide\.sensitive/u);
  });

  it("the generated AGENTS.md points at tokenomics.md", () => {
    const template = readFileSync(join(kitDir(), "AGENTS.template.md"), "utf8");
    expect(template).toMatch(/route by kind/u);
    expect(template).toContain(".agents/tokenomics.md");
    const dest = tempDir();
    const result = installKit({ dest, preset: "setup", providers: ["cursor"] });
    if (!result.ok) throw result.error;
    expect(readFileSync(join(dest, "AGENTS.md"), "utf8")).toContain(".agents/tokenomics.md");
    expect(validateKit(join(dest, ".agents"))).toEqual([]);
  });
});

describe("setup-ai v3: scored", () => {
  it("the rubric adds depth axes D1-D4 that each must reach 2, outside the 8-axis mean", () => {
    const raw = read("templates", "setup-rubric.md");
    for (const axis of ["### D1. Code reading", "### D2. Domain and identity rules", "### D3. Nested rules", "### D4. Tokenomics"]) {
      expect(raw, axis).toContain(axis);
    }
    expect(raw).toMatch(/Every depth axis must score >= 2; a 0 on any of them fails the run/u);
    expect(raw).toMatch(/Depth axes \| D1 <n>, D2 <n>, D3 <n>, D4 <n>/u);
    const depth = raw.slice(raw.indexOf("## Depth axes"), raw.indexOf("## Hard gates"));
    expect(depth.match(/^- [0-3]: /gmu)).toHaveLength(16);
    expect(depth).toMatch(/1-5 small, 6-10 medium, 11-20 large/u);
    expect(raw).toMatch(/zero fan-out.*no fan-out: lead read inline/u);
  });

  it("a v2-style description scores 0-1 on every depth axis", () => {
    const depth = read("templates", "setup-rubric.md");
    expect(depth).toMatch(/D1\. Code reading[\s\S]*- 0: No reading phase/u);
    expect(depth).toMatch(/D3\. Nested rules[\s\S]*- 0: Only a root `AGENTS\.md`/u);
    expect(depth).toMatch(/D4\. Tokenomics[\s\S]*- 0: Nothing; every spawn inherits the session model/u);
  });

  it("phase E and the setup-log template carry the depth fields", () => {
    const raw = read("SKILL.md");
    expect(raw).toMatch(/four \*\*depth axes D1–D4\*\*/u);
    const log = read("templates", "setup-log.template.md");
    for (const field of ["**Reading:**", "**Routing:**", "**Nested:**"]) expect(log, field).toContain(field);
  });

  it("phase E writes the setup-log entry atomically and validates the finished file", () => {
    const raw = read("SKILL.md");
    expect(raw).toMatch(/write the entry in \*\*one atomic write\*\*/u);
    expect(raw).toMatch(/run `validate --setup` only against the finished file/u);
    expect(read("templates", "setup-log.template.md")).toMatch(/one atomic write after all gates finished/u);
  });

  it("the CLI documents scan and the depth checks", () => {
    const usage = usageText();
    expect(usage).toMatch(/^ {2}scan \[dir\]/mu);
    expect(usage).toMatch(/reading log, domain\s+rules, nested AGENTS\.md and tokenomics/u);
  });
});
