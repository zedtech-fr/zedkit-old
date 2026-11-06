import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { readManifest } from "#kit.js";
import { lensTableRows, shippedNames, usageCommands, usageFlags, usageProviders } from "./helpers.js";

const PROSE = [
  "apps/docs/prose/ai/set-up-ai-agent-instructions-skills-subagents-and-commands-in-a-repo.mdx",
  "apps/docs/prose/ai/check-that-skills-subagents-commands-and-provider-copies-are-valid.mdx",
  "apps/docs/prose/guides/set-up-your-coding-agents.mdx",
  "apps/docs/prose/guides/getting-started.mdx",
];
// --help works but lives outside the USAGE text (see cli.test.ts).
const HELP = new Set(["--help"]);
// Bare prose words, not references.
const GENERIC = new Set(["ok", "name", "description", "skill", "html", "inherit"]);

function lensNames(): Set<string> {
  return new Set(lensTableRows().map((cells) => cells[1] ?? ""));
}

function repoRoot(): string {
  return fileURLToPath(new URL("../../../..", import.meta.url));
}

describe("prose references", () => {
  it("resolves every bare name in AI prose to a kit concept", () => {
    const known = new Set([
      ...shippedNames(true),
      ...lensNames(),
      ...usageCommands(),
      ...usageProviders(),
    ]);
    let checked = 0;
    for (const rel of PROSE) {
      const text = readFileSync(join(repoRoot(), rel), "utf8");
      const tokens = new Set(
        [...text.matchAll(/`([a-z][a-z0-9-]*)`/gu)]
          .map((m) => m[1] ?? "")
          .filter((t) => !GENERIC.has(t)),
      );
      for (const token of tokens) {
        checked += 1;
        expect([...known], `${rel} references ${token}`).toContain(token);
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it("resolves every CLI flag and value in AI prose to USAGE", () => {
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    const flags = new Set([...usageFlags(), ...HELP]);
    const presets = new Set(Object.keys(manifest.value.presets));
    const providers = new Set(usageProviders());
    let checked = 0;
    for (const rel of PROSE) {
      const text = readFileSync(join(repoRoot(), rel), "utf8");
      for (const m of text.matchAll(/--[a-z][a-z0-9-]*/gu)) {
        checked += 1;
        expect([...flags], `${rel} uses ${m[0]}`).toContain(m[0]);
      }
      const spans = [...text.matchAll(/`([^`]*)`/gu)].map((m) => m[1] ?? "");
      for (const span of spans) {
        for (const m of span.matchAll(/--preset ([a-z][a-z0-9-]*)/gu)) {
          checked += 1;
          expect([...presets], `${rel} presets ${m[1]}`).toContain(m[1] ?? "");
        }
        for (const m of span.matchAll(/--provider ([a-z][a-z0-9-,]*)/gu)) {
          for (const name of (m[1] ?? "").split(",")) {
            checked += 1;
            expect([...providers], `${rel} provides ${name}`).toContain(name);
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
  });
});
