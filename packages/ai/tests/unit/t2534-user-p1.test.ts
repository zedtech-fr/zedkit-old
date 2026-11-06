/**
 * COPY into packages/ai/tests/unit/ then run `pnpm test`.
 * These assertions FAIL on 4d6421dd (user t2534u). Do not weaken them.
 * zk-tok-plan black-box proof: /data/work/.goals/tokenomics-probes/t2534-repro/PROOF.md
 */
import { existsSync, lstatSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { hasMarker } from "#generate.js";
import { kitDir } from "#kit.js";
import { inSync, syncKit, type SyncOptions } from "#sync.js";
import { checkDrift } from "#validate.js";
import { AGENT, put, tempDir } from "./helpers.js";

const POLICY = `---
schema: 1
default_provider: cursor
providers:
  cursor:
    build:
      standard: { model: cur-build-standard }
    check:
      sensitive: { model: cur-check-sensitive }
  claude:
    build:
      standard: { model: cl-build-standard }
    check:
      sensitive: { model: cl-check-sensitive }
  muse:
    build:
      standard: { model: muse-build-standard }
    check:
      sensitive: { model: muse-check-sensitive }
---
`;

const SIX = ["explorer", "verifier", "copywriter", "docs-writer", "improver", "architect"] as const;

function project(): string {
  const root = tempDir();
  put(root, ".agents/tokenomics.md", POLICY);
  put(root, ".agents/agents/verifier.md", AGENT("verifier", "model: inherit\ndisallowedTools: Write, Edit, NotebookEdit\n"));
  put(root, ".agents/agents/plain.md", AGENT("plain", "model: inherit\n"));
  return root;
}

function sync(root: string, extra: Partial<SyncOptions> = {}) {
  const result = syncKit({ dest: root, providers: ["cursor", "claude"], ...extra });
  if (!result.ok) throw result.error;
  return result.value;
}

const mdNames = (dir: string): string[] =>
  existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".md")).sort() : [];

describe("t2534u P1-A dangling destination leaf", () => {
  it("does not write through a dangling sidecar leaf symlink; keeps the custom file", () => {
    const root = project();
    put(root, ".agents/agents/explorer.md", readFileSync(join(kitDir(), "agents/explorer.md"), "utf8"));
    put(
      root,
      ".cursor/agents/explorer.md",
      "---\nname: explorer\ndescription: custom user explorer\nmodel: inherit\n---\n\nCUSTOM BODY UNIQUE\n",
    );
    const outside = tempDir();
    const sentinel = join(outside, "explorer.kit.md");
    symlinkSync(sentinel, join(root, ".cursor/agents/explorer.kit.md"));
    sync(root, { providers: ["cursor"] });
    expect(existsSync(sentinel)).toBe(false);
    expect(readFileSync(join(root, ".cursor/agents/explorer.md"), "utf8")).toContain("CUSTOM BODY UNIQUE");
    expect(lstatSync(join(root, ".cursor/agents/explorer.kit.md")).isSymbolicLink()).toBe(true);
  });
});

describe("t2534u P1-B shared-source prune", () => {
  it("cursor --prune after cursor+muse keeps the six sources; second sync retains exact names and custom body", () => {
    const root = tempDir();
    put(root, ".agents/tokenomics.md", POLICY);
    for (const name of SIX) {
      put(root, `.agents/agents/${name}.md`, readFileSync(join(kitDir(), `agents/${name}.md`), "utf8"));
    }
    put(root, ".agents/agents/mine.md", AGENT("mine", "model: inherit\n") + "CUSTOM MINE BODY\n");
    sync(root, { providers: ["cursor", "muse"] });
    for (const name of SIX) {
      expect(hasMarker(readFileSync(join(root, `.agents/agents/${name}.md`), "utf8")), name).toBe(true);
    }
    expect(readFileSync(join(root, ".agents/agents/mine.md"), "utf8")).toContain("CUSTOM MINE BODY");

    sync(root, { providers: ["cursor"], prune: true });
    const afterPrune = mdNames(join(root, ".agents/agents"));
    expect(afterPrune).toEqual([...SIX.map((n) => `${n}.md`), "mine.md"].sort());
    expect(readFileSync(join(root, ".agents/agents/mine.md"), "utf8")).toContain("CUSTOM MINE BODY");

    sync(root, { providers: ["cursor"] });
    const afterSecond = mdNames(join(root, ".cursor/agents"));
    expect(afterSecond).toEqual([...SIX.map((n) => `${n}.md`), "mine.md"].sort());
    expect(readFileSync(join(root, ".agents/agents/mine.md"), "utf8")).toContain("CUSTOM MINE BODY");

    const check = syncKit({ dest: root, providers: ["cursor"], check: true });
    if (!check.ok) throw check.error;
    expect(inSync(check.value)).toBe(true);
    expect(afterSecond).not.toEqual(["mine.md"]);
  });
});

describe("t2534u default Muse drift", () => {
  it("implicit sync --check and validate detect stripped Muse explorer disallowedTools", () => {
    const root = project();
    put(root, ".agents/agents/explorer.md", readFileSync(join(kitDir(), "agents/explorer.md"), "utf8"));
    sync(root, { providers: ["cursor", "muse"] });
    const musePath = join(root, ".agents/agents/explorer.md");
    const generated = readFileSync(musePath, "utf8");
    expect(hasMarker(generated)).toBe(true);
    expect(generated).toMatch(/^disallowedTools:/m);
    writeFileSync(musePath, generated.replace(/^disallowedTools:.*\n/m, ""));

    const implied = syncKit({ dest: root, check: true });
    if (!implied.ok) throw implied.error;
    expect(inSync(implied.value)).toBe(false);
    expect(implied.value.some((a) => a.path === ".agents/agents/explorer.md" && a.kind !== "skip")).toBe(true);

    const explicit = syncKit({ dest: root, providers: ["cursor", "muse"], check: true });
    if (!explicit.ok) throw explicit.error;
    expect(inSync(explicit.value)).toBe(false);

    // `zedkit-ai validate .` reports generated Muse drift via checkDrift;
    // validateKit skips marked Muse dialect (not portable source).
    const issues = checkDrift(root, join(root, ".agents"));
    expect(issues.some((i) => i.path.includes("explorer"))).toBe(true);
  });

  it("implicit --check and the implied repair command detect and fix a mutated Muse model", () => {
    const root = project();
    put(root, ".agents/agents/explorer.md", readFileSync(join(kitDir(), "agents/explorer.md"), "utf8"));
    sync(root, { providers: ["cursor", "muse"] });
    const musePath = join(root, ".agents/agents/explorer.md");
    const generated = readFileSync(musePath, "utf8");
    expect(hasMarker(generated)).toBe(true);
    writeFileSync(musePath, generated.replace(/^model: .*$/m, "model: mutated-policy-model"));

    const implied = syncKit({ dest: root, check: true });
    if (!implied.ok) throw implied.error;
    expect(inSync(implied.value)).toBe(false);

    const repaired = syncKit({ dest: root });
    if (!repaired.ok) throw repaired.error;
    expect(readFileSync(musePath, "utf8")).not.toContain("mutated-policy-model");
  });

  it("implicit --check and bare sync repair a generated Muse file that dropped only bash", () => {
    const root = project();
    put(root, ".agents/agents/explorer.md", readFileSync(join(kitDir(), "agents/explorer.md"), "utf8"));
    sync(root, { providers: ["cursor", "muse"] });
    const musePath = join(root, ".agents/agents/explorer.md");
    const generated = readFileSync(musePath, "utf8");
    expect(hasMarker(generated)).toBe(true);
    expect(generated).toMatch(/^disallowedTools: write_file, edit_file, bash$/m);
    writeFileSync(musePath, generated.replace(/, bash$/m, ""));
    const stripped = readFileSync(musePath, "utf8");
    expect(stripped).toMatch(/^disallowedTools: write_file, edit_file$/m);
    expect(hasMarker(stripped)).toBe(true);

    const implied = syncKit({ dest: root, check: true });
    if (!implied.ok) throw implied.error;
    expect(inSync(implied.value)).toBe(false);
    expect(implied.value.some((a) => a.path === ".agents/agents/explorer.md" && a.kind !== "skip")).toBe(true);

    const issues = checkDrift(root, join(root, ".agents"));
    expect(issues.some((i) => i.path.includes("explorer"))).toBe(true);

    const repaired = syncKit({ dest: root });
    if (!repaired.ok) throw repaired.error;
    expect(readFileSync(musePath, "utf8")).toMatch(/^disallowedTools: write_file, edit_file, bash$/m);
  });
});
