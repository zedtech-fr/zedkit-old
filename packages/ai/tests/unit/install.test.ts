import { existsSync, lstatSync, mkdirSync, readFileSync, readlinkSync, readdirSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { installKit } from "#install.js";
import { agentsForPreset, commandsForPreset, kitDir, readManifest } from "#kit.js";
import { checkDrift, validateKit } from "#validate.js";
import { COMMAND, firstPartySkills, markdownFiles, put, SKILL, tempDir } from "./helpers.js";

function install(dest: string, options: Parameters<typeof installKit>[0] extends infer O ? Partial<O> : never = {}) {
  const result = installKit({ dest, ...options });
  if (!result.ok) throw result.error;
  return result.value;
}

describe("installKit", () => {
  it("installs the starter preset by default and wires both tools", () => {
    const dest = tempDir();
    install(dest);
    expect(existsSync(join(dest, "AGENTS.md"))).toBe(true);
    expect(existsSync(join(dest, ".agents/skills/ground-truth/SKILL.md"))).toBe(true);
    expect(existsSync(join(dest, ".agents/skills/review/SKILL.md"))).toBe(true);
    expect(existsSync(join(dest, ".agents/skills/setup-ai/SKILL.md"))).toBe(true);
    expect(existsSync(join(dest, ".agents/skills/ponytail"))).toBe(false);
    expect(existsSync(join(dest, ".agents/skills/LICENSE-ponytail-MIT"))).toBe(true);
    expect(existsSync(join(dest, ".agents/THIRD_PARTY_NOTICES.md"))).toBe(true);
    expect(existsSync(join(dest, ".agents/agents/verifier.md"))).toBe(true);
    expect(existsSync(join(dest, ".agents/agents/explorer.md"))).toBe(true);
    expect(existsSync(join(dest, ".agents/agents/architect.md"))).toBe(false);
    expect(existsSync(join(dest, ".agents/commands/plan.md"))).toBe(false);
    expect(existsSync(join(dest, ".agents/commands/review.md"))).toBe(true);
    // Symlinks resolve through to real files.
    expect(readlinkSync(join(dest, ".claude/skills"))).toBe("../.agents/skills");
    expect(existsSync(join(dest, ".claude/skills/ground-truth/SKILL.md"))).toBe(true);
    expect(existsSync(join(dest, ".claude/agents/verifier.md"))).toBe(true);
    expect(existsSync(join(dest, ".cursor/skills/ground-truth/SKILL.md"))).toBe(true);
    expect(existsSync(join(dest, ".cursor/agents/verifier.md"))).toBe(true);
    expect(readlinkSync(join(dest, "CLAUDE.md"))).toBe("AGENTS.md");
    expect(readFileSync(join(dest, ".cursor/rules/project.mdc"), "utf8")).toContain("alwaysApply: true");
  });

  it("starter preset stays small: eight skills, three subagents, two commands", () => {
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    const starter = manifest.value.presets.starter;
    if (!Array.isArray(starter)) throw new Error("starter preset must list skills");
    expect(starter).toHaveLength(8);
    expect(agentsForPreset(manifest.value, "starter")).toHaveLength(3);
    expect(commandsForPreset(manifest.value, "starter")).toHaveLength(2);
  });

  it("starter lenses.md marks uninstalled runners planned and installed ones exists", () => {
    const dest = tempDir();
    install(dest, { providers: [] });
    const text = readFileSync(join(dest, ".agents/skills/review/lenses.md"), "utf8");
    expect(text).toMatch(/\| quality gate\s+\| agent `verifier`\s+\|\s*exists\s*\|/);
    expect(text).toMatch(/\| code\s+\| skill `code-review`[^\n]*\|\s*planned\s*\|/);
    expect(text).toMatch(/\| ponytail\s+\| skill `ponytail-review`[^\n]*\|\s*planned\s*\|/);
    expect(text).toMatch(/\| persona\s+\| skill `persona-review`[^\n]*\|\s*planned\s*\|/);
    expect(validateKit(join(dest, ".agents"))).toEqual([]);
  });

  it("init --adopt a second time is a no-op: no copy/link and validate stays clean", () => {
    const dest = tempDir();
    install(dest, { preset: "starter", providers: ["cursor"], adopt: true });
    const again = install(dest, { preset: "starter", providers: ["cursor"], adopt: true });
    expect(again.filter((a) => a.kind === "copy" || a.kind === "link" || a.kind === "write")).toEqual([]);
    expect(existsSync(join(dest, ".agents/skills/zk-review"))).toBe(false);
    expect(existsSync(join(dest, ".agents/commands/review.kit.md"))).toBe(false);
    expect(existsSync(join(dest, ".agents/personas.kit.md"))).toBe(false);
    expect(validateKit(join(dest, ".agents"))).toEqual([]);
    expect(checkDrift(dest, join(dest, ".agents"))).toEqual([]);
  });

  it("init --adopt on an installed tree sidecars only the user-edited kit file", () => {
    const dest = tempDir();
    install(dest, { preset: "starter", providers: ["cursor"], adopt: true });
    writeFileSync(join(dest, ".agents/commands/review.md"), "edited by user\n");
    const again = install(dest, { preset: "starter", providers: ["cursor"], adopt: true });
    expect(again.filter((a) => a.kind !== "skip")).toEqual([
      expect.objectContaining({ kind: "copy", path: join(".agents", "commands", "review.kit.md") }),
    ]);
    expect(readFileSync(join(dest, ".agents/commands/review.md"), "utf8")).toBe("edited by user\n");
    expect(existsSync(join(dest, ".cursor/commands/review.kit.md"))).toBe(false);
    expect(existsSync(join(dest, ".agents/skills/zk-review"))).toBe(false);
  });

  it("adopt keeps a v2-customized personas.md with no sidecar", () => {
    const dest = tempDir();
    install(dest, { preset: "setup", providers: ["cursor"], adopt: true });
    const personas = join(dest, ".agents", "personas.md");
    writeFileSync(personas, readFileSync(personas, "utf8").replaceAll("Acme Bookings", "Real Corp"));
    const again = install(dest, { preset: "setup", providers: ["cursor"], adopt: true });
    expect(existsSync(join(dest, ".agents", "personas.kit.md"))).toBe(false);
    expect(again).toContainEqual({ kind: "skip", path: join(".agents", "personas.md"), note: "kept (already customized)" });
  });

  it("adopt still sidecars a hand-written personas.md without v2 headers", () => {
    const dest = tempDir();
    install(dest, { preset: "setup", providers: ["cursor"], adopt: true });
    writeFileSync(join(dest, ".agents", "personas.md"), "# Our audiences\n\nKept as prose by the team.\n");
    const again = install(dest, { preset: "setup", providers: ["cursor"], adopt: true });
    expect(existsSync(join(dest, ".agents", "personas.kit.md"))).toBe(true);
    expect(again).toContainEqual(
      expect.objectContaining({ kind: "copy", path: join(".agents", "personas.kit.md") }),
    );
  });

  it("adopt keeps v2-customized personas.md a no-op on second and third runs", () => {
    const dest = tempDir();
    install(dest, { preset: "setup", providers: ["cursor"], adopt: true });
    const personas = join(dest, ".agents", "personas.md");
    writeFileSync(personas, readFileSync(personas, "utf8").replaceAll("Acme Bookings", "Real Corp"));
    const second = install(dest, { preset: "setup", providers: ["cursor"], adopt: true });
    expect(second.filter((a) => a.kind !== "skip")).toEqual([]);
    expect(existsSync(join(dest, ".agents", "personas.kit.md"))).toBe(false);
    const third = install(dest, { preset: "setup", providers: ["cursor"], adopt: true });
    expect(third.filter((a) => a.kind !== "skip")).toEqual([]);
    expect(existsSync(join(dest, ".agents", "personas.kit.md"))).toBe(false);
  });

  it("adopt keeps v2 personas content under a v1 preset with no sidecar", () => {
    const dest = tempDir();
    install(dest, { preset: "starter", providers: ["cursor"], adopt: true });
    const personas = join(dest, ".agents", "personas.md");
    writeFileSync(personas, `# Project personas (v2)\n\n| Persona | Goals |\n| --- | --- |\n| Owner | Ship |\n`);
    const again = install(dest, { preset: "starter", providers: ["cursor"], adopt: true });
    expect(existsSync(join(dest, ".agents", "personas.kit.md"))).toBe(false);
    expect(again).toContainEqual({ kind: "skip", path: join(".agents", "personas.md"), note: "kept (already customized)" });
  });

  it("installs the tokenomics stub once, and a re-run is a no-op", () => {
    const dest = tempDir();
    const first = install(dest, { providers: [] });
    expect(first).toContainEqual(expect.objectContaining({ kind: "copy", path: join(".agents", "tokenomics.md") }));
    const stub = readFileSync(join(dest, ".agents", "tokenomics.md"), "utf8");
    expect(stub).toBe(readFileSync(join(kitDir(), "tokenomics.template.md"), "utf8"));
    const again = install(dest, { providers: [] });
    expect(again.filter((a) => a.kind !== "skip")).toEqual([]);
    expect(validateKit(join(dest, ".agents"))).toEqual([]);
  });

  it("leaves an edited tokenomics.md alone, with or without adopt, and writes no sidecar", () => {
    for (const adopt of [false, true]) {
      const dest = tempDir();
      install(dest, { providers: [], adopt });
      const file = join(dest, ".agents", "tokenomics.md");
      const edited = `${readFileSync(file, "utf8")}\nOur own note.\n`;
      writeFileSync(file, edited);
      const again = install(dest, { providers: [], adopt });
      expect(again.filter((a) => a.kind !== "skip")).toEqual([]);
      expect(readFileSync(file, "utf8")).toBe(edited);
      expect(existsSync(join(dest, ".agents", "tokenomics.kit.md"))).toBe(false);
    }
  });

  it("validate reports an invalid project tokenomics.md", () => {
    const dest = tempDir();
    install(dest, { providers: [] });
    writeFileSync(join(dest, ".agents", "tokenomics.md"), "---\nschema: 1\ntiers: {}\n---\n");
    expect(validateKit(join(dest, ".agents"))).toEqual([
      { path: "tokenomics.md", message: expect.stringContaining("tiers: unknown key") },
    ]);
  });

  it("adopt still sidecars a lightly edited v1 personas file", () => {
    const dest = tempDir();
    install(dest, { preset: "starter", providers: ["cursor"], adopt: true });
    const personas = join(dest, ".agents", "personas.md");
    writeFileSync(personas, readFileSync(personas, "utf8").replace("Stressed user", "Stressed shopper"));
    install(dest, { preset: "starter", providers: ["cursor"], adopt: true });
    expect(existsSync(join(dest, ".agents", "personas.kit.md"))).toBe(true);
  });

  it("adopt sidecars edited non-template files but not v2 personas", () => {
    const dest = tempDir();
    install(dest, { preset: "setup", providers: ["cursor"], adopt: true });
    const personas = join(dest, ".agents", "personas.md");
    writeFileSync(personas, readFileSync(personas, "utf8").replaceAll("Acme Bookings", "Real Corp"));
    writeFileSync(join(dest, ".agents/commands/review.md"), "edited by user\n");
    const again = install(dest, { preset: "setup", providers: ["cursor"], adopt: true });
    expect(existsSync(join(dest, ".agents", "personas.kit.md"))).toBe(false);
    expect(again.filter((a) => a.kind !== "skip")).toEqual([
      expect.objectContaining({ kind: "copy", path: join(".agents", "commands", "review.kit.md") }),
    ]);
  });

  it("adopts colliding cursor files: user copy kept, kit sidecar written, validate green", () => {
    const dest = tempDir();
    put(dest, ".cursor/skills/team-own/SKILL.md", "team\n");
    put(dest, ".cursor/agents/explorer.md", "custom explorer\n");
    put(dest, ".cursor/commands/review.md", "custom review\n");
    const actions = install(dest, { providers: ["cursor"], adopt: true });
    expect(readFileSync(join(dest, ".cursor/skills/team-own/SKILL.md"), "utf8")).toBe("team\n");
    expect(readFileSync(join(dest, ".cursor/agents/explorer.md"), "utf8")).toBe("custom explorer\n");
    expect(readFileSync(join(dest, ".cursor/commands/review.md"), "utf8")).toBe("custom review\n");
    expect(existsSync(join(dest, ".cursor/agents/explorer.kit.md"))).toBe(true);
    expect(existsSync(join(dest, ".cursor/commands/review.kit.md"))).toBe(true);
    expect(lstatSync(join(dest, ".cursor/skills/ground-truth")).isSymbolicLink()).toBe(true);
    expect(readlinkSync(join(dest, ".cursor/skills/ground-truth"))).toContain(".agents/skills/ground-truth");
    expect(actions.some((a) => a.note?.includes("kept user file"))).toBe(true);
    expect(validateKit(join(dest, ".agents"))).toEqual([]);
    expect(checkDrift(dest, join(dest, ".agents"))).toEqual([]);
  });

  it("links kit skills into a pre-existing real .cursor/skills directory", () => {
    const dest = tempDir();
    put(dest, ".cursor/skills/team-own/SKILL.md", "team\n");
    install(dest, { providers: ["cursor"] });
    expect(lstatSync(join(dest, ".cursor/skills")).isSymbolicLink()).toBe(false);
    expect(readFileSync(join(dest, ".cursor/skills/team-own/SKILL.md"), "utf8")).toBe("team\n");
    expect(lstatSync(join(dest, ".cursor/skills/setup-ai")).isSymbolicLink()).toBe(true);
    expect(checkDrift(dest, join(dest, ".agents")).filter((i) => i.message.includes("unreachable"))).toEqual([]);
  });

  it("core preset validates clean: every command resolves to an installed skill", () => {
    const dest = tempDir();
    install(dest, { preset: "core" });
    const issues = validateKit(join(dest, ".agents"));
    expect(issues).toEqual([]);
  });

  it("installs every preset with no dangling skill reference", () => {
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    for (const preset of Object.keys(manifest.value.presets)) {
      const dest = tempDir();
      const result = installKit({ dest, preset, providers: [] });
      expect(result.ok, preset).toBe(true);
      if (!result.ok) continue;
      expect(validateKit(join(dest, ".agents")), preset).toEqual([]);
    }
  });

  it("fails before writing when a preset skill references a skill the preset does not install", () => {
    const kit = tempDir();
    put(kit, "kit.json", JSON.stringify({ presets: { tiny: ["alpha"], full: "*" }, agents: [], commands: [] }));
    put(kit, "skills/alpha/SKILL.md", `${SKILL("alpha")}\nCall the Skill tool with "beta".\n`);
    put(kit, "skills/beta/SKILL.md", SKILL("beta"));
    put(kit, "AGENTS.template.md", "t");
    put(kit, "THIRD_PARTY_NOTICES.md", "n");
    const dest = tempDir();
    const result = installKit({ dest, kit, preset: "tiny", providers: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('preset "tiny"');
      expect(result.error.message).toContain('references skill "beta"');
      expect(result.error.message).toContain("skills/alpha/SKILL.md");
    }
    expect(readdirSync(dest)).toEqual([]);
    const full = installKit({ dest: tempDir(), kit, preset: "full", providers: [] });
    expect(full.ok).toBe(true);
  });

  it("installs personas.md from the template, keeps an existing one", () => {
    const fresh = tempDir();
    install(fresh);
    const installed = readFileSync(join(fresh, ".agents/personas.md"), "utf8");
    expect(installed).toContain("Lazy end client");
    expect(installed).toContain("Integrating developer");
    expect(installed).toContain("Maintainer / operator");
    expect(installed).toContain("continue where you left off");
    expect(installed).toContain("flaky network");
    expect(installed).toContain("Stressed user");
    const kept = tempDir();
    mkdirSync(join(kept, ".agents"), { recursive: true });
    writeFileSync(join(kept, ".agents/personas.md"), "custom personas");
    const actions = install(kept);
    expect(readFileSync(join(kept, ".agents/personas.md"), "utf8")).toBe("custom personas");
    expect(actions).toContainEqual(
      expect.objectContaining({ kind: "skip", path: join(".agents", "personas.md") }),
    );
  });

  it("copies only the preset's skills, and the full preset copies all", () => {
    const starter = tempDir();
    install(starter);
    expect(existsSync(join(starter, ".agents/skills/triage"))).toBe(false);
    const core = tempDir();
    install(core, { preset: "core" });
    expect(existsSync(join(core, ".agents/skills/triage"))).toBe(false);
    const full = tempDir();
    install(full, { preset: "full" });
    expect(existsSync(join(full, ".agents/skills/triage/SKILL.md"))).toBe(true);
  });

  it("produces output that passes validation", () => {
    const dest = tempDir();
    install(dest, { preset: "full" });
    expect(validateKit(join(dest, ".agents"))).toEqual([]);
  });

  it("never overwrites: local edits survive, and a ladder-less AGENTS.md gets the section appended", () => {
    const dest = tempDir();
    install(dest);
    writeFileSync(join(dest, "AGENTS.md"), "mine\n");
    writeFileSync(join(dest, ".agents/skills/ground-truth/SKILL.md"), "edited\n");
    const again = install(dest);
    expect(again.find((a) => a.path === "AGENTS.md")).toEqual({
      kind: "append",
      path: "AGENTS.md",
      note: "ladder section",
    });
    const agents = readFileSync(join(dest, "AGENTS.md"), "utf8");
    expect(agents.startsWith("mine\n")).toBe(true);
    expect(agents).toContain("## Before writing any code");
    expect(again.filter((a) => a.path !== "AGENTS.md").every((a) => a.kind === "skip")).toBe(true);
    expect(readFileSync(join(dest, ".agents/skills/ground-truth/SKILL.md"), "utf8")).toBe("edited\n");
    // Third run: the ladder is there now, so everything skips.
    expect(install(dest).every((a) => a.kind === "skip")).toBe(true);
  });

  it("upgrades: a re-run adds new kit files and never touches edited ones", () => {
    const v1 = tempDir();
    put(v1, "kit.json", JSON.stringify({ presets: { core: ["alpha"] }, agents: [] }));
    put(v1, "skills/alpha/SKILL.md", "v1\n");
    put(v1, "AGENTS.template.md", "t");
    put(v1, "THIRD_PARTY_NOTICES.md", "n");
    const dest = tempDir();
    install(dest, { kit: v1, preset: "core" });
    writeFileSync(join(dest, ".agents/skills/alpha/SKILL.md"), "edited\n");
    const v2 = tempDir();
    put(v2, "kit.json", JSON.stringify({ presets: { core: ["alpha", "beta"] }, agents: [] }));
    put(v2, "skills/alpha/SKILL.md", "v2\n");
    put(v2, "skills/beta/SKILL.md", "new\n");
    put(v2, "AGENTS.template.md", "t");
    put(v2, "THIRD_PARTY_NOTICES.md", "n");
    const again = install(dest, { kit: v2, preset: "core" });
    expect(readFileSync(join(dest, ".agents/skills/alpha/SKILL.md"), "utf8")).toBe("edited\n");
    expect(readFileSync(join(dest, ".agents/skills/beta/SKILL.md"), "utf8")).toBe("new\n");
    expect(again.find((a) => a.path === join(".agents", "skills", "beta"))?.kind).toBe("copy");
  });

  it("dry run reports the ladder append without writing it", () => {
    const dest = tempDir();
    put(dest, "AGENTS.md", "mine\n");
    const planned = install(dest, { dryRun: true });
    expect(planned.find((a) => a.path === "AGENTS.md")?.kind).toBe("append");
    expect(readFileSync(join(dest, "AGENTS.md"), "utf8")).toBe("mine\n");
    const done = install(dest);
    expect(done).toEqual(planned);
    expect(readFileSync(join(dest, "AGENTS.md"), "utf8")).toContain("## Before writing any code");
  });

  it("skips AGENTS.md when the ladder is already there", () => {
    const dest = tempDir();
    put(dest, "AGENTS.md", "# Mine\n\nClimb the ladder.\n");
    const actions = install(dest);
    expect(actions.find((a) => a.path === "AGENTS.md")?.kind).toBe("skip");
    expect(readFileSync(join(dest, "AGENTS.md"), "utf8")).toBe("# Mine\n\nClimb the ladder.\n");
  });

  it("skips the append when the kit template has no ladder section", () => {
    const kit = tempDir();
    put(kit, "kit.json", JSON.stringify({ presets: { core: ["alpha"] }, agents: [] }));
    put(kit, "skills/alpha/SKILL.md", "x");
    put(kit, "AGENTS.template.md", "t");
    put(kit, "THIRD_PARTY_NOTICES.md", "n");
    const dest = tempDir();
    put(dest, "AGENTS.md", "mine\n");
    const actions = install(dest, { kit, preset: "core" });
    expect(actions.find((a) => a.path === "AGENTS.md")?.kind).toBe("skip");
    expect(readFileSync(join(dest, "AGENTS.md"), "utf8")).toBe("mine\n");
  });

  it("links kit skills into a pre-existing real .claude/skills directory", () => {
    const dest = tempDir();
    put(dest, ".claude/skills/own/SKILL.md", "own\n");
    install(dest);
    expect(lstatSync(join(dest, ".claude/skills")).isSymbolicLink()).toBe(false);
    expect(readFileSync(join(dest, ".claude/skills/own/SKILL.md"), "utf8")).toBe("own\n");
    expect(lstatSync(join(dest, ".claude/skills/setup-ai")).isSymbolicLink()).toBe(true);
  });

  it("re-setup links a repo-added skill into real cursor and claude skills dirs", () => {
    const dest = tempDir();
    put(dest, ".cursor/skills/team-own/SKILL.md", "team\n");
    put(dest, ".claude/skills/team-own/SKILL.md", "team\n");
    install(dest, { providers: ["cursor", "claude"], adopt: true });
    put(dest, ".agents/skills/add-invoice/SKILL.md", SKILL("add-invoice"));
    const again = install(dest, { providers: ["cursor", "claude"], adopt: true });
    expect(lstatSync(join(dest, ".cursor/skills/add-invoice")).isSymbolicLink()).toBe(true);
    expect(readlinkSync(join(dest, ".cursor/skills/add-invoice"))).toContain(".agents/skills/add-invoice");
    expect(lstatSync(join(dest, ".claude/skills/add-invoice")).isSymbolicLink()).toBe(true);
    expect(readFileSync(join(dest, ".cursor/skills/team-own/SKILL.md"), "utf8")).toBe("team\n");
    expect(readFileSync(join(dest, ".claude/skills/team-own/SKILL.md"), "utf8")).toBe("team\n");
    expect(validateKit(join(dest, ".agents"))).toEqual([]);
    expect(checkDrift(dest, join(dest, ".agents")).filter((i) => i.message.includes("unreachable"))).toEqual([]);
    const third = install(dest, { providers: ["cursor", "claude"], adopt: true });
    expect(third.filter((a) => a.kind === "copy" || a.kind === "link" || a.kind === "write")).toEqual([]);
    expect(again.some((a) => a.path.includes("add-invoice") && a.kind === "link")).toBe(true);
  });

  it("whole-dir skill symlink still covers a repo-added skill without per-skill links", () => {
    const dest = tempDir();
    install(dest, { providers: ["cursor", "claude"], adopt: true });
    expect(readlinkSync(join(dest, ".cursor/skills"))).toBe("../.agents/skills");
    expect(readlinkSync(join(dest, ".claude/skills"))).toBe("../.agents/skills");
    put(dest, ".agents/skills/add-invoice/SKILL.md", SKILL("add-invoice"));
    const again = install(dest, { providers: ["cursor", "claude"], adopt: true });
    expect(lstatSync(join(dest, ".cursor/skills")).isSymbolicLink()).toBe(true);
    expect(existsSync(join(dest, ".cursor/skills/add-invoice/SKILL.md"))).toBe(true);
    expect(existsSync(join(dest, ".claude/skills/add-invoice/SKILL.md"))).toBe(true);
    expect(again.some((a) => a.path.includes("add-invoice"))).toBe(false);
    expect(validateKit(join(dest, ".agents"))).toEqual([]);
  });

  it("writes nothing on a dry run", () => {
    const dest = tempDir();
    const actions = install(dest, { dryRun: true });
    expect(actions.length).toBeGreaterThan(0);
    expect(readdirSync(dest)).toEqual([]);
  });

  it("wires only the requested providers (--target still works as an alias)", () => {
    const dest = tempDir();
    install(dest, { targets: ["claude"] });
    expect(existsSync(join(dest, ".claude"))).toBe(true);
    expect(existsSync(join(dest, ".cursor"))).toBe(false);
    const cursorOnly = tempDir();
    install(cursorOnly, { providers: ["cursor"] });
    expect(existsSync(join(cursorOnly, ".cursor"))).toBe(true);
    expect(existsSync(join(cursorOnly, ".claude"))).toBe(false);
  });

  it("links commands for claude but copies them as real files for cursor", () => {
    const dest = tempDir();
    install(dest, { preset: "core" });
    expect(readFileSync(join(dest, ".agents/commands/review.md"), "utf8")).toContain("`review`");
    expect(readlinkSync(join(dest, ".claude/commands"))).toBe("../.agents/commands");
    expect(existsSync(join(dest, ".claude/commands/plan.md"))).toBe(true);
    expect(lstatSync(join(dest, ".cursor/commands")).isSymbolicLink()).toBe(false);
    expect(readFileSync(join(dest, ".cursor/commands/plan.md"), "utf8")).toContain("`plan`");
    expect(lstatSync(join(dest, ".cursor/agents")).isSymbolicLink()).toBe(false);
    expect(readFileSync(join(dest, ".cursor/agents/verifier.md"), "utf8")).toContain("verifier");
  });

  it("second install keeps a custom Cursor command link", () => {
    const dest = tempDir();
    install(dest, { preset: "setup", providers: ["cursor"] });
    put(dest, ".agents/commands/custom.md", COMMAND("plan", "Custom."));
    const target = "../../.agents/commands/custom.md";
    symlinkSync(target, join(dest, ".cursor/commands/custom.md"));
    install(dest, { preset: "setup", providers: ["cursor"] });
    expect(readlinkSync(join(dest, ".cursor/commands/custom.md"))).toBe(target);
    expect(readFileSync(join(dest, ".agents/commands/custom.md"), "utf8")).toContain("Custom.");
    const drift = checkDrift(dest, join(dest, ".agents")).map((i) => `${i.path}: ${i.message}`);
    expect(drift.some((m) => m.includes("custom.md") && /missing|removed/i.test(m))).toBe(false);
  });

  it("never overwrites the cursor copies: edits survive a second run", () => {
    const dest = tempDir();
    install(dest, { providers: ["cursor"] });
    writeFileSync(join(dest, ".cursor/commands/review.md"), "mine\n");
    const again = install(dest, { providers: ["cursor"] });
    expect(again.every((a) => a.kind === "skip")).toBe(true);
    expect(readFileSync(join(dest, ".cursor/commands/review.md"), "utf8")).toBe("mine\n");
  });

  it("adds no extra provider folder for codex and muse", () => {
    const dest = tempDir();
    const actions = install(dest, { providers: ["codex", "muse"] });
    expect(existsSync(join(dest, "AGENTS.md"))).toBe(true);
    expect(existsSync(join(dest, ".agents/skills/ground-truth/SKILL.md"))).toBe(true);
    for (const dir of [".claude", ".cursor", ".codex", ".muse"]) {
      expect(existsSync(join(dest, dir)), dir).toBe(false);
    }
    expect(actions.some((a) => a.path !== "AGENTS.md" && a.path !== ".gitignore" && !a.path.startsWith(".agents/"))).toBe(false);
  });

  it("installs no commands when the manifest lists none", () => {
    const kit = tempDir();
    put(kit, "kit.json", JSON.stringify({ presets: { core: ["alpha"] }, agents: [] }));
    put(kit, "skills/alpha/SKILL.md", "x");
    put(kit, "AGENTS.template.md", "t");
    put(kit, "THIRD_PARTY_NOTICES.md", "n");
    const dest = tempDir();
    install(dest, { kit, preset: "core" });
    expect(existsSync(join(dest, ".agents/commands"))).toBe(false);
  });

  it("returns an error for an unknown preset and writes no skills", () => {
    const dest = tempDir();
    const result = installKit({ dest, preset: "nope" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain('unknown preset "nope"');
    expect(existsSync(join(dest, ".agents/skills"))).toBe(false);
  });

  it("returns an error when the kit manifest lists a missing command or a bad commands value", () => {
    const missing = tempDir();
    put(missing, "kit.json", JSON.stringify({ presets: { core: ["alpha"] }, agents: [], commands: ["ghost"] }));
    put(missing, "skills/alpha/SKILL.md", "x");
    const result = installKit({ dest: tempDir(), kit: missing, preset: "core" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain('kit has no command "ghost"');
    const bad = tempDir();
    put(bad, "kit.json", JSON.stringify({ presets: { core: [] }, agents: [], commands: "nope" }));
    const badResult = installKit({ dest: tempDir(), kit: bad, preset: "core" });
    expect(badResult.ok).toBe(false);
    if (!badResult.ok) expect(badResult.error.message).toContain("must be a string list");
  });

  it("setup ignores a dirty v1 personas template when v2 is installed", () => {
    const kit = tempDir();
    put(kit, "kit.json", JSON.stringify({ presets: { setup: ["alpha"] }, agents: [] }));
    put(kit, "skills/alpha/SKILL.md", "x");
    put(kit, "skills/setup-ai/templates/personas-v2.template.md", "clean\n");
    put(kit, "personas.template.md", 'Call the Skill tool with "ghost".\n');
    put(kit, "AGENTS.template.md", "t");
    put(kit, "THIRD_PARTY_NOTICES.md", "n");
    const result = installKit({ dest: tempDir(), kit, preset: "setup", providers: [] });
    expect(result.ok).toBe(true);
  });

  it("setup fails before writing when the installed v2 personas names a missing skill", () => {
    const kit = tempDir();
    put(kit, "kit.json", JSON.stringify({ presets: { setup: ["alpha"] }, agents: [] }));
    put(kit, "skills/alpha/SKILL.md", "x");
    put(kit, "skills/setup-ai/templates/personas-v2.template.md", 'Call the Skill tool with "ghost".\n');
    put(kit, "personas.template.md", "clean\n");
    put(kit, "AGENTS.template.md", "t");
    put(kit, "THIRD_PARTY_NOTICES.md", "n");
    const dest = tempDir();
    const result = installKit({ dest, kit, preset: "setup", providers: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain('preset "setup" has dangling references');
    expect(existsSync(join(dest, ".agents"))).toBe(false);
  });

  it("returns an error when the kit manifest lists a missing skill", () => {
    const kit = tempDir();
    put(kit, "kit.json", JSON.stringify({ presets: { core: ["ghost"] }, agents: [] }));
    put(kit, "skills/alpha/SKILL.md", "x");
    const result = installKit({ dest: tempDir(), kit, preset: "core" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain('no skill "ghost"');
  });

  it("fails before writing anything when a later skill is missing from the kit", () => {
    const kit = tempDir();
    put(kit, "kit.json", JSON.stringify({ presets: { core: ["alpha", "ghost"] }, agents: [] }));
    put(kit, "skills/alpha/SKILL.md", "x");
    put(kit, "AGENTS.template.md", "t");
    put(kit, "THIRD_PARTY_NOTICES.md", "n");
    const dest = tempDir();
    expect(installKit({ dest, kit, preset: "core" }).ok).toBe(false);
    expect(readdirSync(dest)).toEqual([]);
  });

  it("rejects a preset value that is neither a list nor a star", () => {
    const kit = tempDir();
    put(kit, "kit.json", JSON.stringify({ presets: { core: 42 }, agents: [] }));
    const result = readManifest(kit);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain('preset "core" must be a string list or "*"');
  });

  it("rejects prototype keys as presets", () => {
    for (const preset of ["constructor", "__proto__", "toString"]) {
      const result = installKit({ dest: tempDir(), preset });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.message).toContain("unknown preset");
    }
  });

  it("skips (instead of crashing) when a parent path is a file, in dry run and for real", () => {
    for (const dryRun of [true, false]) {
      const dest = tempDir();
      writeFileSync(join(dest, ".cursor"), "i am a file\n");
      const actions = install(dest, { dryRun });
      const rule = actions.find((a) => a.path === ".cursor/rules/project.mdc");
      expect(rule?.kind, `dryRun=${dryRun}`).toBe("skip");
      expect(rule?.note).toContain("not a directory");
      expect(readFileSync(join(dest, ".cursor"), "utf8")).toBe("i am a file\n");
    }
  });

  it("skips when a dangling symlink is in the way", () => {
    const dest = tempDir();
    mkdirSync(join(dest, ".agents"));
    symlinkSync("/definitely/not/here", join(dest, ".agents/skills"));
    const actions = install(dest);
    expect(actions.find((a) => a.path === ".agents/skills/ground-truth")?.kind).toBe("skip");
    expect(readlinkSync(join(dest, ".agents/skills"))).toBe("/definitely/not/here");
  });

  it("does not create a dangling CLAUDE.md when AGENTS.md is a directory", () => {
    const dest = tempDir();
    mkdirSync(join(dest, "AGENTS.md"));
    const actions = install(dest);
    expect(actions.find((a) => a.path === "CLAUDE.md")?.kind).toBe("skip");
    expect(existsSync(join(dest, "CLAUDE.md"))).toBe(false);
  });

  it("skips project.mdc when another always-on rule exists, in dry run and for real", () => {
    for (const dryRun of [true, false]) {
      const dest = tempDir();
      put(dest, ".cursor/rules/own.mdc", "---\ndescription: mine\nalwaysApply: true\n---\n\nMine.\n");
      const actions = install(dest, { dryRun });
      const rule = actions.find((a) => a.path === join(".cursor", "rules", "project.mdc"));
      expect(rule?.kind, `dryRun=${dryRun}`).toBe("skip");
      expect(rule?.note).toContain("own.mdc");
      expect(existsSync(join(dest, ".cursor/rules/project.mdc"))).toBe(false);
      // The rest of the install still happens.
      expect(existsSync(join(dest, ".cursor/skills")) || dryRun).toBe(true);
    }
  });

  it("skips project.mdc when AGENTS.md already exists and an always-on rule references it", () => {
    const dest = tempDir();
    put(dest, "AGENTS.md", "mine\n");
    put(dest, ".cursor/rules/own.mdc", "---\nalwaysApply: true\n---\n\nRead /AGENTS.md.\n");
    const actions = install(dest);
    expect(actions.find((a) => a.path === join(".cursor", "rules", "project.mdc"))?.kind).toBe("skip");
    expect(existsSync(join(dest, ".cursor/rules/project.mdc"))).toBe(false);
  });

  it("still writes project.mdc when the other rules are not always on", () => {
    const dest = tempDir();
    put(dest, ".cursor/rules/manual.mdc", "---\nalwaysApply: false\n---\n\nManual.\n");
    put(dest, ".cursor/rules/plain.mdc", "no frontmatter\n");
    install(dest);
    expect(readFileSync(join(dest, ".cursor/rules/project.mdc"), "utf8")).toContain("alwaysApply: true");
  });

  it("links CLAUDE.md to an AGENTS.md the project already had", () => {
    const dest = tempDir();
    writeFileSync(join(dest, "AGENTS.md"), "mine\n\nClimb the ladder.\n");
    install(dest);
    expect(readFileSync(join(dest, "CLAUDE.md"), "utf8")).toBe("mine\n\nClimb the ladder.\n");
  });

  it("dry run reports the same actions as the real run", () => {
    const planned = install(tempDir(), { dryRun: true });
    const done = install(tempDir());
    expect(planned).toEqual(done);
  });

  it("keeps a Role and style section at the top of the agent template, under the line budget", () => {
    const lines = readFileSync(join(kitRoot(), "AGENTS.template.md"), "utf8").split("\n");
    expect(lines.length).toBeLessThanOrEqual(76);
    const role = lines.findIndex((l) => l === "## Role and style");
    const nonNegotiables = lines.findIndex((l) => l === "## Non-negotiables");
    expect(role).toBeGreaterThanOrEqual(0);
    expect(role).toBeLessThan(nonNegotiables);
    const section = lines.slice(role, nonNegotiables).join("\n").toLowerCase();
    for (const word of ["role", "tone", "language", "concise", "evidence", "consequences", "proven"]) {
      expect(section).toContain(word);
    }
  });

  it("setup-ai fills Role and style from evidence and asks one question when unknown", () => {
    const text = readFileSync(join(kitRoot(), "skills", "setup-ai", "SKILL.md"), "utf8");
    expect(text).toContain("Role and style");
    expect(text).toContain("exactly one question");
    for (const source of ["README", "commit"]) {
      expect(text).toContain(source);
    }
  });

  it("setup-ai tells the agent what to say when /setup-ai starts", () => {
    const text = readFileSync(join(kitRoot(), "skills", "setup-ai", "SKILL.md"), "utf8");
    expect(text).toContain("## Tell the user first");
    for (const phrase of ["Modes:", "Phases:", "What they get:", "15–45 minutes", "/setup-ai"]) {
      expect(text).toContain(phrase);
    }
  });

  it("keeps one thin command file per manifest command, each running its skill", () => {
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    const listed = manifest.value.commands ?? [];
    expect(listed.length).toBeGreaterThan(0);
    const onDisk = readdirSync(join(kitRoot(), "commands")).filter((f) => f.endsWith(".md"));
    expect(onDisk.sort()).toEqual(listed.map((name) => `${name}.md`).sort());
    for (const name of listed) {
      const text = readFileSync(join(kitRoot(), "commands", `${name}.md`), "utf8");
      const lines = text.trimEnd().split("\n").length;
      const maxLines = name === "setup-ai" ? 12 : 6;
      expect(lines, `${name} is ${lines} lines`).toBeGreaterThanOrEqual(3);
      expect(lines, `${name} is ${lines} lines`).toBeLessThanOrEqual(maxLines);
      expect(text).toContain(`\`${name}\``);
      expect(text).toContain("$ARGUMENTS");
      if (name === "setup-ai") {
        expect(text).toContain("Before anything else, tell the user");
        expect(text).toContain("before any tool call");
      }
    }
  });

  it("setup-ai is provider-aware: shared source first, one ask when providers are unknown", () => {
    const text = readFileSync(join(kitRoot(), "skills", "setup-ai", "SKILL.md"), "utf8");
    expect(text.toLowerCase()).toContain("shared source");
    expect(text).toContain("which of cursor, claude, codex, muse");
    expect(text).toContain("setup-ai cursor");
  });

  it("setup-ai audits the ladder gap in existing setups and workspace roots", () => {
    const text = readFileSync(join(kitRoot(), "skills", "setup-ai", "SKILL.md"), "utf8");
    expect(text).toContain("Missing ladder");
    expect(text).toContain("add the missing ladder section");
    expect(text).toContain("the 7-question ladder (same section as the kit template)");
  });

  it("setup-ai covers multi-repo workspace roots and leaves children alone", () => {
    const text = readFileSync(join(kitRoot(), "skills", "setup-ai", "SKILL.md"), "utf8");
    expect(text).toContain("## Workspace mode");
    for (const phrase of [
      "one repo at a time",
      "nested `AGENTS.md` wins",
      "visibility rules",
      "how to sync",
      "Map cross-repo dependencies",
      "Never write inside a child repo\n  without asking",
    ]) {
      expect(text).toContain(phrase);
    }
  });

  it("keeps orchestrator skills short: they reference siblings, never copy them", () => {
    for (const name of ["review", "plan", "challenge"]) {
      const file = join(kitRoot(), "skills", name, "SKILL.md");
      const lines = readFileSync(file, "utf8").split("\n").length;
      expect(lines, `${name} is ${lines} lines`).toBeLessThan(60);
    }
  });

  it("keeps the first-party content closed over the core preset: it only names skills and agents that core installs", () => {
    const dest = tempDir();
    install(dest, { preset: "core" });
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    const installed = new Set(readdirSync(join(dest, ".agents/skills")).concat(manifest.value.agents));
    const everything = new Set(readdirSync(join(kitRoot(), "skills")).concat(manifest.value.agents));
    // Vendored skills are upstream's text; the rest is ours and must hold together.
    const ours = firstPartySkills().map((name) => join(dest, ".agents/skills", name, "SKILL.md"));
    const files = [join(dest, "AGENTS.md"), ...markdownFiles(join(dest, ".agents/agents")), ...ours.filter(existsSync)];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      for (const name of everything) {
        const referenced = new RegExp("(`|\"|/)" + name + "(`|\"|\\b)").test(text);
        if (referenced) expect(installed.has(name), `${file} references ${name}`).toBe(true);
      }
    }
  });

  it("core preset stays capped: every skill name loads into context up front", () => {
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    const core = manifest.value.presets.core;
    if (!Array.isArray(core)) throw new Error("core preset must list skills");
    // Hard cap (#443): adding a core skill must bump this number explicitly.
    // 26 since #440 (`orchestrate`: core's own setup-ai routes follow-ups to /orchestrate).
    // 27 for `compose-ui` (persona chain brief before composing UI).
    expect(core.length).toBeLessThanOrEqual(27);
  });

  it("core-installed skills only name skills and agents that core installs", () => {
    const dest = tempDir();
    install(dest, { preset: "core" });
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    const installed = new Set(readdirSync(join(dest, ".agents/skills")).concat(manifest.value.agents));
    const everything = new Set(readdirSync(join(kitRoot(), "skills")).concat(manifest.value.agents));
    const skills = readdirSync(join(dest, ".agents/skills"))
      .map((name) => join(dest, ".agents/skills", name, "SKILL.md"))
      .filter(existsSync);
    // Backticked names only: the kit convention for runnable skill/agent
    // names. Quoted or /slash mentions in vendored prose are not calls.
    for (const file of skills) {
      const text = readFileSync(file, "utf8");
      for (const name of everything) {
        const referenced = new RegExp("`" + name + "`").test(text);
        if (referenced) expect(installed.has(name), `${file} references ${name}`).toBe(true);
      }
    }
  });

  it("creates .gitignore with the .scratch/ line on a fresh tree", () => {
    const dest = tempDir();
    const actions = install(dest, { preset: "starter", providers: [] });
    expect(readFileSync(join(dest, ".gitignore"), "utf8")).toBe("# Local working plans and tickets (zedkit-ai)\n.scratch/\n");
    expect(actions).toContainEqual({ kind: "write", path: ".gitignore", note: "ignores .scratch/" });
  });

  it("appends .scratch/ to an existing .gitignore without touching owner lines", () => {
    for (const before of ["node_modules/\n", "node_modules/"]) {
      const dest = tempDir();
      put(dest, ".gitignore", before);
      const actions = install(dest, { preset: "starter", providers: [] });
      expect(readFileSync(join(dest, ".gitignore"), "utf8")).toBe("node_modules/\n.scratch/\n");
      expect(actions).toContainEqual({ kind: "append", path: ".gitignore", note: "ignores .scratch/" });
    }
  });

  it("repeated adoption keeps the ignore a skip and the bytes identical", () => {
    const dest = tempDir();
    put(dest, ".gitignore", "dist/\n");
    install(dest, { preset: "setup", providers: ["cursor"], adopt: true });
    const once = readFileSync(join(dest, ".gitignore"), "utf8");
    expect(once).toBe("dist/\n.scratch/\n");
    const again = install(dest, { preset: "setup", providers: ["cursor"], adopt: true });
    expect(readFileSync(join(dest, ".gitignore"), "utf8")).toBe(once);
    expect(again).toContainEqual({ kind: "skip", path: ".gitignore", note: "already ignores .scratch/" });
    expect(again.filter((a) => a.path === ".gitignore" && a.kind !== "skip")).toEqual([]);
  });

  it("never writes through a linked .gitignore", () => {
    const dest = tempDir();
    put(dest, "shared/ignore", "dist/\n");
    symlinkSync(join(dest, "shared/ignore"), join(dest, ".gitignore"));
    const actions = install(dest, { preset: "starter", providers: [] });
    expect(readFileSync(join(dest, "shared/ignore"), "utf8")).toBe("dist/\n");
    expect(lstatSync(join(dest, ".gitignore")).isSymbolicLink()).toBe(true);
    expect(actions).toContainEqual(
      expect.objectContaining({ kind: "skip", path: ".gitignore" }),
    );
  });

  it("dry run reports the ignore without writing it", () => {
    const dest = tempDir();
    const actions = install(dest, { preset: "starter", providers: [], dryRun: true });
    expect(existsSync(join(dest, ".gitignore"))).toBe(false);
    expect(actions).toContainEqual({ kind: "write", path: ".gitignore", note: "ignores .scratch/" });
  });
});

function kitRoot(): string {
  return fileURLToPath(new URL("../../kit/", import.meta.url));
}
