import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";
import { checkSetup } from "#setup-check.js";
import { put, tempDir } from "./helpers.js";

const GATE = (cmd: string, exit: number): string =>
  `CMD: ${cmd}\nSTART: 2026-11-05T10:00:00Z\noutput\nEND: 2026-11-05T10:01:00Z\nEXIT:${exit}\n`;
const PKG = JSON.stringify({
  scripts: { check: "turbo run lint test", test: "vitest" },
});

/** Issues about proofs only (plan coverage is out of scope here). */
function proofs(root: string): string[] {
  return checkSetup(root, {})
    .issues.filter((i) => !/plan/i.test(i.message))
    .map((i) => i.message);
}

function repo(files: Record<string, string>): string {
  const root = tempDir();
  put(root, "package.json", PKG);
  for (const [path, body] of Object.entries(files)) put(root, path, body);
  return root;
}

describe("the full gate has a proof", () => {
  it("a repo with a check script and no gate log or excuse is flagged", () => {
    expect(proofs(repo({ ".agents/setup-log.md": "# log\n" }))).toEqual([
      expect.stringContaining("`check` script"),
    ]);
  });

  it("a logged `pnpm check` run passes, whatever its exit code (a failure is a finding, not hidden)", () => {
    for (const exit of [0, 1]) {
      const root = repo({
        ".agents/setup-log.md": "| `gates/main.log` | pnpm check |\n",
        ".agents/setup-log/gates/main.log": GATE("pnpm check", exit),
      });
      expect(proofs(root)).toEqual([]);
    }
  });

  it("a log of another command does not stand in for the full gate", () => {
    const root = repo({
      ".agents/setup-log.md": "| `gates/t.log` | pnpm test |\n",
      ".agents/setup-log/gates/t.log": GATE("pnpm test", 0),
    });
    expect(proofs(root)).toEqual([expect.stringContaining("`check` script")]);
  });

  it("a Gate outcomes row that says why the gate did not run is accepted", () => {
    const root = repo({
      ".agents/setup-log.md":
        "| - | `pnpm check` | - | - | not run: needs a database | `pnpm test` |\n",
    });
    expect(proofs(root)).toEqual([]);
  });

  it("a repo without a check script is not asked for one", () => {
    const root = tempDir();
    put(root, "package.json", JSON.stringify({ scripts: { test: "vitest" } }));
    expect(proofs(root)).toEqual([]);
  });
});

describe("the validate --setup run is persisted", () => {
  const log = (extra: string): Record<string, string> => ({
    ".agents/setup-log.md": `- **Plan gaps:** none, see ${extra}\n| \`gates/main.log\` | pnpm check |\n`,
    ".agents/setup-log/gates/main.log": GATE("pnpm check", 0),
  });

  it("a clean, referenced validate.log passes", () => {
    const root = repo({
      ...log("`.agents/setup-log/validate.log`"),
      ".agents/setup-log/validate.log": GATE(
        "npx zedkit-ai validate --setup",
        0,
      ),
    });
    expect(proofs(root)).toEqual([]);
  });

  it("a validate.log from a failing run is stale", () => {
    const root = repo({
      ...log("`.agents/setup-log/validate.log`"),
      ".agents/setup-log/validate.log": GATE(
        "npx zedkit-ai validate --setup",
        1,
      ),
    });
    expect(proofs(root)).toEqual([expect.stringContaining("failing run")]);
  });

  it("a validate.log the setup-log does not name is flagged; a malformed one fails the shape check", () => {
    const unnamed = repo({
      ...log("nothing"),
      ".agents/setup-log/validate.log": GATE(
        "npx zedkit-ai validate --setup",
        0,
      ),
    });
    expect(proofs(unnamed)).toEqual([
      expect.stringContaining("does not reference validate.log"),
    ]);
    const bad = repo({
      ...log("`validate.log`"),
      ".agents/setup-log/validate.log": "all good\n",
    });
    expect(proofs(bad)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("CMD:"),
        expect.stringContaining("EXIT:"),
      ]),
    );
  });
});

describe("the setup-ai kit teaches the proofs", () => {
  const skill = readFileSync(
    join(kitDir(), "skills/setup-ai/SKILL.md"),
    "utf8",
  ).replace(/\s+/gu, " ");

  it("names validate.log and the full-gate rule", () => {
    expect(skill).toContain(".agents/setup-log/validate.log");
    expect(skill).toContain("`check` script");
  });
});
