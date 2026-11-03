import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";
import { setLensStatus } from "#lenses.js";
import { lensTableRows } from "./helpers.js";

type LensRow = {
  lens: string;
  runner: string;
  status: string;
  trigger: string;
  mandatory: string;
  output: string;
};

function registry(): LensRow[] {
  return lensTableRows().map((cells) => ({
      lens: cells[1] ?? "",
      runner: cells[2] ?? "",
      status: cells[3] ?? "",
      trigger: cells[4] ?? "",
      mandatory: cells[5] ?? "",
      output: cells[6] ?? "",
    }));
}

function runnerExists(runner: string): boolean {
  const names = [...runner.matchAll(/`([\w-]+)`/g)].map((m) => m[1] ?? "");
  return names.some(
    (name) =>
      existsSync(join(kitDir(), "skills", name, "SKILL.md")) ||
      existsSync(join(kitDir(), "agents", `${name}.md`)),
  );
}

describe("lens registry", () => {
  it("requires the minimum lens set", () => {
    const mandatory = registry()
      .filter((row) => row.mandatory === "yes")
      .map((row) => row.lens);
    expect(mandatory).toEqual(
      expect.arrayContaining(["code", "ponytail", "persona", "quality gate"]),
    );
  });

  it("every row names a real trigger and output shape", () => {
    const rows = registry();
    expect(rows.length).toBeGreaterThanOrEqual(14);
    for (const row of rows) {
      expect(row.lens.length, "lens name").toBeGreaterThan(0);
      expect(row.trigger.length, `${row.lens} trigger`).toBeGreaterThan(0);
      expect(row.output.length, `${row.lens} output`).toBeGreaterThan(0);
      expect(["exists", "planned"], `${row.lens} status`).toContain(row.status);
      expect(["yes", "when triggered", "optional"], `${row.lens} mandatory`).toContain(
        row.mandatory,
      );
    }
  });

  it("every existing runner resolves to a skill or agent", () => {
    for (const row of registry().filter((r) => r.status === "exists")) {
      expect(runnerExists(row.runner), `lens ${row.lens}`).toBe(true);
    }
  });

  it("roadmap complete: no planned lens rows remain", () => {
    const planned = registry().filter((r) => r.status === "planned");
    expect(
      planned.map((r) => r.lens),
      "planned lenses",
    ).toEqual([]);
  });

  it("routes the same minimum set in the registry and the review skill", () => {
    const expected = ["code", "persona", "ponytail", "quality gate"];
    const fromRegistry = registry()
      .filter((row) => row.mandatory === "yes")
      .map((row) => row.lens)
      .sort();
    expect(fromRegistry).toEqual(expected);
    const skill = readFileSync(join(kitDir(), "skills/review/SKILL.md"), "utf8");
    const sentence = /Minimum on every review:([\s\S]*?)\. Add each/u.exec(skill)?.[1] ?? "";
    expect(sentence.length, "minimum sentence").toBeGreaterThan(0);
    const fromSkill = [...sentence.matchAll(/`([^`]+)`/gu)]
      .map((m) => m[1] ?? "")
      .sort();
    expect(fromSkill).toEqual(expected);
  });

  it("release lens is wired to the release-manager agent", () => {
    const row = registry().find((r) => r.lens === "release");
    expect(row?.status).toBe("exists");
    expect(row?.runner).toContain("agent `release-manager`");
    expect(row?.trigger).toContain(".changeset");
    expect(
      existsSync(join(kitDir(), "agents", "release-manager.md")),
    ).toBe(true);
  });

  it("marks a lens planned when its runner is not in the installed set", () => {
    const src = [
      "| Lens | Runner (skill or agent) | Status | Trigger | Mandatory? | Output |",
      "|---|---|---|---|---|---|",
      "| code | skill `code-review` | exists | always | yes | findings |",
      "| quality gate | agent `verifier` | exists | always | yes | gates |",
      "",
    ].join("\n");
    const out = setLensStatus(src, new Set(["verifier"]));
    expect(out).toContain("| code | skill `code-review` | planned |");
    expect(out).toContain("| quality gate | agent `verifier` | exists |");
  });
});
