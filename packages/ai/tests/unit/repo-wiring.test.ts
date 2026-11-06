import { lstatSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { hasMarker, MUSE_NAME_ALIAS } from "#generate.js";
import { kitDir } from "#kit.js";
import { validateKit } from "#validate.js";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const real = (rel: string): string => realpathSync(join(root, rel));
const mdNames = (dir: string): string[] =>
  readdirSync(dir)
    .filter((file) => file.endsWith(".md") && !file.endsWith(".kit.md"))
    .map((file) => file.slice(0, -3))
    .sort();

// Skills stay kit symlinks. Agents are generated files (Muse needs a real
// directory; Cursor/Claude get a marked copy from tokenomics).
describe("this repo's own provider wiring", () => {
  for (const provider of [".agents", ".claude", ".cursor"]) {
    it(`${provider}/skills resolves to the kit`, () => {
      expect(real(`${provider}/skills`)).toBe(realpathSync(join(kitDir(), "skills")));
    });
  }

  it("lists every kit skill through each provider path", () => {
    const kit = readdirSync(join(kitDir(), "skills")).sort();
    for (const provider of [".agents", ".claude", ".cursor"]) {
      expect(readdirSync(join(root, provider, "skills")).sort(), `${provider}/skills`).toEqual(kit);
    }
  });

  it("generated agent dirs are real directories with a sync marker", () => {
    for (const rel of [".agents/agents", ".claude/agents", ".cursor/agents"]) {
      const dir = join(root, rel);
      expect(lstatSync(dir).isSymbolicLink(), rel).toBe(false);
      expect(lstatSync(dir).isDirectory(), rel).toBe(true);
      const marked = readdirSync(dir).filter(
        (file) => file.endsWith(".md") && hasMarker(readFileSync(join(dir, file), "utf8")),
      );
      expect(marked.length, rel).toBeGreaterThan(0);
    }
  });

  it("generated agents cover every kit subagent", () => {
    const kit = mdNames(join(kitDir(), "agents"));
    expect(mdNames(join(root, ".cursor/agents"))).toEqual(kit);
    expect(mdNames(join(root, ".claude/agents"))).toEqual(kit);
    const muse = mdNames(join(root, ".agents/agents"));
    for (const name of kit) {
      expect(muse, name).toContain(MUSE_NAME_ALIAS[name] ?? name);
    }
  });

  it("points CLAUDE.md at the root AGENTS.md", () => {
    expect(real("CLAUDE.md")).toBe(real("AGENTS.md"));
  });

  it("validates the repo's .agents folder", () => {
    expect(validateKit(join(root, ".agents"))).toEqual([]);
  });
});
