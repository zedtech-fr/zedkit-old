import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";

// A "Skill tool" instruction only runs where that tool exists. Every one
// carries the shared fallback within a few lines: open the skill file and
// follow it here. Explicit-only skills still need an explicit user call.
const TRIGGER = /the Skill tool (with|for)/u;
const FALLBACK = "Without a Skill tool";

function skillFiles(): Array<[string, string[]]> {
  const dir = join(kitDir(), "skills");
  return readdirSync(dir)
    .filter((name) => !name.startsWith("LICENSE-"))
    .map((name) => {
      const file = join(dir, name, "SKILL.md");
      return [`skills/${name}/SKILL.md`, readFileSync(file, "utf8").split("\n")] as [string, string[]];
    });
}

describe("skill content conventions", () => {
  it("every Skill-tool call carries the shared SKILL.md fallback within five lines", () => {
    let triggers = 0;
    for (const [path, lines] of skillFiles()) {
      lines.forEach((line, index) => {
        if (!TRIGGER.test(line)) return;
        triggers += 1;
        const window = lines.slice(index, index + 6).join("\n");
        expect(window, `${path}:${index + 1} lacks the fallback`).toContain(FALLBACK);
        expect(window, `${path}:${index + 1} fallback names no tool`).toContain("SKILL.md");
        expect(window, `${path}:${index + 1} fallback keeps explicit-only explicit`).toMatch(/explicit/iu);
      });
    }
    expect(triggers).toBeGreaterThan(0);
  });

  it("the orchestrate fallback returns briefs first and marks inline work", () => {
    const raw = readFileSync(join(kitDir(), "skills", "orchestrate", "SKILL.md"), "utf8");
    expect(raw).toContain("return ready-to-run briefs (`dispatch plan`)");
    expect(raw).toContain("`Mode: inline fallback (<observed cause>)`");
    expect(raw).not.toContain("eight steps");
  });

  it("the orchestrator records dispatch failures and closing usage", () => {
    const raw = readFileSync(join(kitDir(), "agents", "orchestrator.md"), "utf8");
    expect(raw).toContain("On a dispatch failure, record the attempted");
    expect(raw).toContain("## Dispatch failures");
    expect(raw).toContain("actual spawns, retries, and elapsed time");
  });

  it("implement ends on unit plus integration, never the e2e battery by default", () => {
    const raw = readFileSync(join(kitDir(), "skills", "implement", "SKILL.md"), "utf8");
    expect(raw).toContain("the unit plus integration suites once at the end");
    expect(raw).toContain("never the end-to-end battery unless a critical path justifies it");
    expect(raw).not.toContain("full test suite");
  });

  it("unconfigured plans default to git-ignored .scratch, never docs", () => {
    const plan = readFileSync(join(kitDir(), "skills", "plan", "SKILL.md"), "utf8");
    expect(plan).toContain(".scratch/<feature-slug>/spec.md");
    expect(plan).toContain("never `docs/`");
    const spec = readFileSync(join(kitDir(), "skills", "to-spec", "SKILL.md"), "utf8");
    expect(spec).toContain("With nobody to ask, use local files under `.scratch/<feature-slug>/`");
    const tickets = readFileSync(join(kitDir(), "skills", "to-tickets", "SKILL.md"), "utf8");
    expect(tickets).toContain("With none configured and nobody to ask, use local files:");
  });

  it("the verifier records revision and output, one gate, pending stays pending", () => {
    const raw = readFileSync(join(kitDir(), "agents", "verifier.md"), "utf8");
    expect(raw).toContain("Record the revision each gate ran on");
    expect(raw).toContain("failures with their output, never summarized away");
    expect(raw).toContain("Both review passes are one gate, not two independent reviews");
    expect(raw).toContain("stays pending — never READY");
    expect(raw).toContain("Gates: <command — revision — exit code — output excerpt>");
  });
});
