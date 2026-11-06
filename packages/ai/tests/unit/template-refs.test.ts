import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";
import { shippedNames } from "./helpers.js";

// Bare words that are prose, not kit references.
const GENERIC = new Set(["inherit", "model"]);
const BARE = /^[a-z][a-z0-9-]*$/u;

function bareTokens(path: string): string[] {
  const raw = readFileSync(join(kitDir(), path), "utf8");
  const tokens = [...raw.matchAll(/`([^`]+)`/gu)].map((m) => m[1] ?? "");
  return [...new Set(tokens.filter((t) => BARE.test(t) && !GENERIC.has(t)))];
}

describe("template references", () => {
  for (const file of ["AGENTS.template.md", "personas.template.md"]) {
    it(`resolves every bare name in ${file} to a skill, agent or command`, () => {
      const names = shippedNames();
      const tokens = bareTokens(file);
      expect(tokens.length).toBeGreaterThan(0);
      for (const token of tokens) {
        expect([...names], `${file} references ${token}`).toContain(token);
      }
    });
  }

  it("routes multi-step work through orchestrate and names the starter exception", () => {
    const raw = readFileSync(join(kitDir(), "AGENTS.template.md"), "utf8");
    expect(raw).toContain("go through `orchestrate`");
    expect(raw).toContain("sequential stays sequential");
    expect(raw).toContain("starter keeps review plus specialists");
  });
});
