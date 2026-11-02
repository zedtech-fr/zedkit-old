import { readdirSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { kitDir } from "#kit.js";
import { validateKit } from "#validate.js";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const real = (rel: string): string => realpathSync(join(root, rel));

// This repo dogfoods its own kit: every provider path must resolve to the
// kit, or an agent silently loses its skills and subagents.
describe("this repo's own provider wiring", () => {
  for (const dir of ["skills", "agents"]) {
    for (const provider of [".agents", ".claude", ".cursor"]) {
      it(`${provider}/${dir} resolves to the kit`, () => {
        expect(real(`${provider}/${dir}`)).toBe(realpathSync(join(kitDir(), dir)));
      });
    }
  }

  it("lists every kit skill and subagent through each provider path", () => {
    for (const dir of ["skills", "agents"]) {
      const kit = readdirSync(join(kitDir(), dir)).sort();
      for (const provider of [".agents", ".claude", ".cursor"]) {
        expect(readdirSync(join(root, provider, dir)).sort(), `${provider}/${dir}`).toEqual(kit);
      }
    }
  });

  it("points CLAUDE.md at the root AGENTS.md", () => {
    expect(real("CLAUDE.md")).toBe(real("AGENTS.md"));
  });

  it("validates the repo's .agents folder", () => {
    expect(validateKit(join(root, ".agents"))).toEqual([]);
  });
});
