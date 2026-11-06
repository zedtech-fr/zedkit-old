import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";
import { checkDepth } from "#setup-depth.js";
import { put, tempDir, TOKENOMICS_D4 } from "./helpers.js";

/** A webhook handler: the event and its outbox row are written in ONE transaction; a worker publishes later. */
const INGEST = [
  "export async function ingest(db: Db, event: WebhookEvent) {",
  "  await db.transaction(async (tx) => {",
  "    await tx.insert(events, event);",
  "    await tx.insert(outbox, { eventId: event.id, topic: 'webhook.received' });",
  "  });",
  "}",
  "",
].join("\n");

const DOC = ["# Sync", "", "The event is enqueued after the database commit.", ""].join("\n");

const HEADER = [
  "**Budget:** none found",
  "| Slice | Reader paths | Tier | Rules |",
  "| ----- | ------------ | ---- | ----- |",
  "| 1 | `src` | scout | 2 |",
  "",
  "## Merged rules",
  "",
  "| ID | Lane | Status | Rule | Evidence | Lands in |",
  "| -- | ---- | ------ | ---- | -------- | -------- |",
].join("\n");

const CHECK_HEAD = "\n## Meaning check\n\n| ID | Verdict | Code does | Resolution |\n| -- | ------- | --------- | ---------- |\n";

function repo(): string {
  const root = tempDir();
  put(root, "src/webhooks/ingest.ts", INGEST);
  put(root, "docs/sync.md", DOC);
  put(root, "src/AGENTS.md", "# src\n\nDomain: ../.agents/domain/sync.md\n");
  put(root, "AGENTS.md", "# Root\n\n## Tokenomics\n\nSee `.agents/tokenomics.md`.\n");
  put(root, ".agents/domain/sync.md", "| S-02 | current | Event and outbox row share a transaction | `src/webhooks/ingest.ts:4` |\n");
  put(root, ".agents/tokenomics.md", TOKENOMICS_D4);
  return root;
}

function log(root: string, rule: string, check: string): void {
  const row = `| R1-1 | domain | current | ${rule} | \`src/webhooks/ingest.ts:4\` | \`.agents/domain/sync.md\` |`;
  put(root, ".agents/setup-log/reading.md", `${HEADER}\n${row}\n${CHECK_HEAD}${check}`);
}

const depth = (root: string): string[] => checkDepth(root).map((issue) => issue.message);

describe("meaning check (D1)", () => {
  it("the fixture handler really is the same-transaction case the doc gets wrong", () => {
    expect(INGEST.match(/db\.transaction/g)).toHaveLength(1);
    const body = INGEST.split("});")[0] ?? "";
    expect(body).toContain("tx.insert(events");
    expect(body).toContain("tx.insert(outbox");
    expect(DOC).toContain("after the database commit");
  });

  it("a rule that says 'after commit' needs a row in the Meaning check", () => {
    const root = repo();
    log(root, "The event is enqueued after the database commit.", "");
    expect(depth(root)).toEqual([expect.stringMatching(/R1-1 have no row in the Meaning check/u)]);
  });

  it("a mismatch left without a resolution fails; rewriting it passes", () => {
    const root = repo();
    log(root, "The event is enqueued after the database commit.", "| R1-1 | mismatch | stores the event and the outbox row in one transaction | |\n");
    expect(depth(root)).toEqual([expect.stringMatching(/R1-1 is mismatch with no resolution/u)]);
    log(
      root,
      "The event and its outbox row are written in one transaction.",
      "| R1-1 | mismatch | stores the event and the outbox row in one transaction | rewritten |\n",
    );
    expect(depth(root)).toEqual([]);
  });

  it("a partial verdict needs a resolution too; a doc claim may stay as a conflict", () => {
    const root = repo();
    log(root, "Events are retried three times.", "| R1-1 | partial | retries only on timeouts | |\n");
    expect(depth(root)).toEqual([expect.stringMatching(/R1-1 is partial/u)]);
    log(root, "Events are retried three times.", "| R1-1 | partial | retries only on timeouts | conflict |\n");
    expect(depth(root)).toEqual([]);
  });

  it("a rule with no order, atomicity or timing word is not forced into the check", () => {
    const root = repo();
    log(root, "Webhook events are stored with their id.", "| R9-9 | match | stores the id | |\n");
    expect(depth(root)).toEqual([]);
  });

  it("a log with no Meaning check section fails once", () => {
    const root = repo();
    put(root, ".agents/setup-log/reading.md", `${HEADER}\n| R1-1 | domain | current | Rule. | \`src/webhooks/ingest.ts:4\` | x |\n`);
    expect(depth(root)).toEqual([expect.stringContaining("no `## Meaning check`")]);
  });
});

describe("the setup-ai kit teaches the meaning check", () => {
  const read = (rel: string): string => readFileSync(join(kitDir(), rel), "utf8").replace(/\s+/gu, " ");

  it("phase B1 runs an adversarial pass with a second reader and never samples sequencing rules", () => {
    const skill = read("skills/setup-ai/SKILL.md");
    expect(skill).toContain("Check what each rule says (adversarial pass)");
    expect(skill).toContain("not the reader that wrote the rules");
    expect(skill).toContain("whole enclosing function, transaction or handler");
    for (const word of ["after", "before", "same transaction", "atomic", "retry", "idempotent"]) expect(skill).toContain(`_${word}_`);
    expect(skill).toContain("same** transaction");
  });

  it("ships a checker brief with the verdicts and the transactional example", () => {
    const brief = read("skills/setup-ai/templates/rule-check-brief.template.md");
    for (const verdict of ["`match`", "`partial`", "`mismatch`"]) expect(brief).toContain(verdict);
    expect(brief).toContain("same transaction");
    expect(read("skills/setup-ai/templates/README.md")).toContain("rule-check-brief.template.md");
  });

  it("the reading log template and rubric carry the check", () => {
    expect(read("skills/setup-ai/templates/reading-log.template.md")).toContain("## Meaning check");
    expect(read("skills/setup-ai/templates/setup-rubric.md")).toMatch(/second reader checked that each rule says what the cited code does/u);
  });
});
