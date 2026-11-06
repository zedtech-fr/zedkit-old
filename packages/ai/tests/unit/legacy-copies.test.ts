import { lstatSync, mkdirSync, readFileSync, readlinkSync, readdirSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveConditionals } from "#conditional.js";
import { hasMarker } from "#generate.js";
import { agentsForPreset, commandsForPreset, kitDir, kitUniverse, readManifest } from "#kit.js";
import { isKitCopy } from "#legacy.js";
import { syncKit } from "#sync.js";
import { checkDrift } from "#validate.js";
import { AGENT, COMMAND, put, tempDir } from "./helpers.js";

const LEGACY_EXPLORER = readFileSync(join(import.meta.dirname, "../fixtures/legacy/explorer.legacy.md"), "utf8");

function sync(dest: string, providers = ["cursor"]) {
  const result = syncKit({ dest, providers });
  if (!result.ok) throw result.error;
  return result.value;
}

describe("legacy kit copies", () => {
  it("knows the first explorer the kit ever shipped, with or without CRLF line ends", () => {
    expect(isKitCopy("agents", "explorer", LEGACY_EXPLORER, undefined)).toBe(true);
    expect(isKitCopy("agents", "explorer", LEGACY_EXPLORER.replace(/\n/g, "\r\n"), undefined)).toBe(true);
  });

  it("does not take an edited copy or another agent's text for the kit's", () => {
    expect(isKitCopy("agents", "explorer", `${LEGACY_EXPLORER}\nMine.\n`, undefined)).toBe(false);
    expect(isKitCopy("agents", "verifier", LEGACY_EXPLORER, undefined)).toBe(false);
    expect(isKitCopy("agents", "no-such-agent", LEGACY_EXPLORER, undefined)).toBe(false);
  });

  it("lists every agent and command the kit ships today, as each preset installs it (rerun scripts/legacy-hashes.mjs if this fails)", () => {
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    const universe = kitUniverse(kitDir());
    for (const preset of Object.keys(manifest.value.presets)) {
      const skills = manifest.value.presets[preset];
      const avail = {
        skills: new Set(skills === "*" ? universe.skills : skills),
        agents: new Set(agentsForPreset(manifest.value, preset)),
        commands: new Set(commandsForPreset(manifest.value, preset)),
      };
      for (const [kind, names] of [["agents", avail.agents], ["commands", avail.commands]] as const) {
        for (const name of names) {
          const raw = readFileSync(join(kitDir(), kind, `${name}.md`), "utf8");
          expect(isKitCopy(kind, name, resolveConditionals(raw, avail), undefined), `${preset}: ${kind}/${name}`).toBe(true);
        }
      }
    }
  });

  it("sync replaces an old copy of the kit with a generated file and leaves an edited one", () => {
    const dest = tempDir();
    put(dest, ".agents/agents/explorer.md", AGENT("explorer"));
    put(dest, ".agents/agents/verifier.md", AGENT("verifier"));
    put(dest, ".cursor/agents/explorer.md", LEGACY_EXPLORER);
    put(dest, ".cursor/agents/verifier.md", `${AGENT("verifier")}\nMy edit.\n`);
    sync(dest);
    expect(hasMarker(readFileSync(join(dest, ".cursor/agents/explorer.md"), "utf8"))).toBe(true);
    expect(readFileSync(join(dest, ".cursor/agents/verifier.md"), "utf8")).toContain("My edit.");
    expect(hasMarker(readFileSync(join(dest, ".cursor/agents/verifier.kit.md"), "utf8"))).toBe(true);
  });

  it("drift calls an old copy stale and a user file kept, and a sync clears the first", () => {
    const dest = tempDir();
    put(dest, ".agents/agents/explorer.md", AGENT("explorer"));
    put(dest, ".cursor/agents/explorer.md", LEGACY_EXPLORER);
    expect(checkDrift(dest, join(dest, ".agents")).map((i) => i.message)).toEqual([
      "stale copy of the kit, run: npx zedkit-ai sync",
    ]);
    sync(dest);
    expect(checkDrift(dest, join(dest, ".agents"))).toEqual([]);
  });
});

describe("cursor commands", () => {
  function seed(): string {
    const dest = tempDir();
    put(dest, ".agents/agents/explorer.md", AGENT("explorer"));
    put(dest, ".agents/commands/run.md", COMMAND("alpha"));
    put(dest, ".agents/commands/go.md", COMMAND("beta"));
    put(dest, ".cursor/rules/x.mdc", "x\n");
    return dest;
  }

  it("links each command to its source and a second run changes nothing", () => {
    const dest = seed();
    sync(dest);
    expect(readlinkSync(join(dest, ".cursor/commands/run.md"))).toBe("../../.agents/commands/run.md");
    expect(sync(dest).filter((a) => a.kind !== "skip")).toEqual([]);
  });

  it("replaces a copy of the source with the link", () => {
    const dest = seed();
    put(dest, ".cursor/commands/run.md", COMMAND("alpha"));
    sync(dest);
    expect(lstatSync(join(dest, ".cursor/commands/run.md")).isSymbolicLink()).toBe(true);
  });

  it("keeps a file of the user's and links the kit's beside it", () => {
    const dest = seed();
    put(dest, ".cursor/commands/run.md", "mine\n");
    sync(dest);
    expect(readFileSync(join(dest, ".cursor/commands/run.md"), "utf8")).toBe("mine\n");
    expect(readlinkSync(join(dest, ".cursor/commands/run.kit.md"))).toBe("../../.agents/commands/run.md");
    expect(sync(dest).filter((a) => a.kind !== "skip")).toEqual([]);
  });

  it("keeps a link that points elsewhere", () => {
    const dest = seed();
    mkdirSync(join(dest, ".cursor/commands"), { recursive: true });
    symlinkSync("../../elsewhere.md", join(dest, ".cursor/commands/run.md"));
    sync(dest);
    expect(readlinkSync(join(dest, ".cursor/commands/run.md"))).toBe("../../elsewhere.md");
  });

  it("removes the link of a command that no longer exists and nothing else", () => {
    const dest = seed();
    sync(dest);
    writeFileSync(join(dest, ".cursor/commands/mine.md"), "mine\n");
    symlinkSync("../../elsewhere.md", join(dest, ".cursor/commands/theirs.md"));

    unlinkSync(join(dest, ".agents/commands/go.md"));
    const actions = sync(dest);
    expect(actions.filter((a) => a.kind === "prune").map((a) => a.path)).toEqual([".cursor/commands/go.md"]);
    expect(readdirSync(join(dest, ".cursor/commands")).sort()).toEqual(["mine.md", "run.md", "theirs.md"]);
  });
});

describe("a provider layer that is a link", () => {
  it("is never written through: the source stays byte for byte", () => {
    const dest = tempDir();
    put(dest, ".agents/agents/explorer.md", AGENT("explorer"));
    put(dest, ".agents/commands/run.md", COMMAND("alpha"));
    symlinkSync(".agents", join(dest, ".cursor"));
    const actions = sync(dest);
    expect(readFileSync(join(dest, ".agents/agents/explorer.md"), "utf8")).toBe(AGENT("explorer"));
    expect(readFileSync(join(dest, ".agents/commands/run.md"), "utf8")).toBe(COMMAND("alpha"));
    expect(readdirSync(join(dest, ".agents")).sort()).toEqual(["agents", "commands"]);
    expect(actions.filter((a) => a.kind !== "skip")).toEqual([]);
    expect(actions.some((a) => a.path === ".cursor" && a.note?.includes("link left alone"))).toBe(true);
  });
});
