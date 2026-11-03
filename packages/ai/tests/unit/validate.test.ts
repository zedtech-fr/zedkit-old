import { symlinkSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkDrift, validateKit } from "#validate.js";
import { kitDir } from "#kit.js";
import { AGENT, COMMAND, put, SKILL, tempDir } from "./helpers.js";

function messages(root: string): string[] {
  return validateKit(root).map((i) => `${i.path}: ${i.message}`);
}

describe("validateKit", () => {
  it("accepts the bundled kit", () => {
    expect(validateKit(kitDir())).toEqual([]);
  });

  it("accepts a minimal valid layout", () => {
    const root = tempDir();
    put(root, "skills/alpha/SKILL.md", SKILL("alpha"));
    put(root, "agents/beta.md", AGENT("beta", "model: inherit\n"));
    expect(validateKit(root)).toEqual([]);
  });

  it("reports a missing directory", () => {
    expect(messages("/definitely/not/here")[0]).toContain("does not exist");
  });

  it("flags a skill whose name differs from its folder", () => {
    const root = tempDir();
    put(root, "skills/alpha/SKILL.md", SKILL("other"));
    expect(messages(root)).toEqual([expect.stringContaining('name must equal "alpha"')]);
  });

  it("accepts a command that names an installed skill", () => {
    const root = tempDir();
    put(root, "skills/alpha/SKILL.md", SKILL("alpha"));
    put(root, "commands/run.md", COMMAND("alpha"));
    expect(validateKit(root)).toEqual([]);
  });

  it("does not flag host slash-commands /ask and /improve as missing skills", () => {
    const root = tempDir();
    put(root, "skills/alpha/SKILL.md", `${SKILL("alpha")}\nThen run /ask or \`/improve\`.\n`);
    expect(validateKit(root)).toEqual([]);
  });

  it("flags a lenses.md row marked exists whose runner is not installed", () => {
    const root = tempDir();
    put(root, "skills/review/SKILL.md", SKILL("review"));
    put(
      root,
      "skills/review/lenses.md",
      ["# Lenses", "", "| Lens | Runner (skill or agent) | Status | Trigger | Mandatory? | Output |", "|---|---|---|---|---|---|", "| code | skill `code-review` | exists | always | yes | findings |", ""].join("\n"),
    );
    expect(messages(root)).toContain(
      'skills/review/lenses.md: lens "code" marks runner "code-review" as exists, but it is not installed',
    );
  });

  it("flags a skill, agent or command that runs a skill which is not installed", () => {
    const root = tempDir();
    put(root, "skills/alpha/SKILL.md", `${SKILL("alpha")}\nCall the Skill tool with "beta".\n`);
    put(root, "skills/gamma/SKILL.md", `${SKILL("gamma")}\nRun \`/delta\`.\n`);
    put(root, "agents/reader.md", `${AGENT("reader")}\nCall the Skill tool with "ghost".\n`);
    put(root, "commands/go.md", `${COMMAND("alpha")}\nThen /missing-skill.\n`);
    const found = messages(root);
    expect(found).toContain('skills/alpha/SKILL.md: references skill "beta", which is not installed');
    expect(found).toContain('skills/gamma/SKILL.md: references skill "delta", which is not installed');
    expect(found).toContain('agents/reader.md: references skill "ghost", which is not installed');
    expect(found).toContain('commands/go.md: references skill "missing-skill", which is not installed');
  });

  it("accepts a skill reference when that skill is installed", () => {
    const root = tempDir();
    put(root, "skills/alpha/SKILL.md", `${SKILL("alpha")}\nCall the Skill tool with "beta". Run \`/beta\`.\n`);
    put(root, "skills/beta/SKILL.md", SKILL("beta"));
    expect(validateKit(root)).toEqual([]);
  });

  it("flags a command that names no installed skill", () => {
    const root = tempDir();
    put(root, "skills/alpha/SKILL.md", SKILL("alpha"));
    put(root, "commands/run.md", COMMAND("ghost"));
    expect(messages(root)).toEqual([expect.stringContaining("names no installed skill")]);
  });

  it("flags a command without a description", () => {
    const root = tempDir();
    put(root, "skills/alpha/SKILL.md", SKILL("alpha"));
    put(root, "commands/run.md", "---\n---\n\nRun the `alpha` skill.\n");
    expect(messages(root)).toEqual([expect.stringContaining("description is required")]);
  });

  it("flags a skill folder without SKILL.md", () => {
    const root = tempDir();
    put(root, "skills/alpha/notes.md", "x");
    expect(messages(root)).toEqual([expect.stringContaining("no SKILL.md")]);
  });

  it("accepts a skill with a folded multi-line description (#484)", () => {
    const root = tempDir();
    put(root, "skills/alpha/SKILL.md", "---\nname: alpha\ndescription: >\n  folded line one\n  folded line two\n---\n");
    expect(validateKit(root)).toEqual([]);
  });

  it("flags missing or broken frontmatter", () => {
    const root = tempDir();
    put(root, "skills/alpha/SKILL.md", "# no frontmatter\n");
    put(root, "skills/beta/SKILL.md", "---\nname: [oops\n---\n");
    const found = messages(root);
    expect(found.some((m) => m.includes("missing frontmatter"))).toBe(true);
    expect(found.some((m) => m.includes("invalid YAML"))).toBe(true);
  });

  it("flags frontmatter that parses but is not a mapping", () => {
    const root = tempDir();
    put(root, "skills/alpha/SKILL.md", "---\n- just\n- a list\n---\n");
    expect(messages(root)).toEqual([expect.stringContaining("must be a YAML mapping")]);
  });

  it("flags names over the length cap even when the shape is right", () => {
    const root = tempDir();
    const long = "a".repeat(65);
    put(root, `skills/${long}/SKILL.md`, SKILL(long));
    expect(messages(root)).toEqual([expect.stringContaining("at most 64 characters")]);
  });

  it("requires a non-empty description and caps its length", () => {
    const root = tempDir();
    put(root, "skills/alpha/SKILL.md", "---\nname: alpha\n---\n");
    put(root, "skills/beta/SKILL.md", `---\nname: beta\ndescription: "${"x".repeat(1025)}"\n---\n`);
    const found = messages(root);
    expect(found.some((m) => m.includes("description is required"))).toBe(true);
    expect(found.some((m) => m.includes("1025 characters"))).toBe(true);
  });

  it("rejects non-lowercase-hyphen names", () => {
    const root = tempDir();
    put(root, "skills/Bad_Name/SKILL.md", SKILL("Bad_Name"));
    expect(messages(root)).toEqual([expect.stringContaining("lowercase-hyphen")]);
  });

  it("flags subagents with a block-scalar description", () => {
    const root = tempDir();
    put(root, "agents/beta.md", "---\nname: beta\ndescription: >\n  folded text\n---\n");
    expect(messages(root)).toEqual([expect.stringContaining("single line")]);
  });

  it("flags subagents that pin a model", () => {
    const root = tempDir();
    put(root, "agents/beta.md", AGENT("beta", "model: some-made-up-id\n"));
    expect(messages(root)).toEqual([expect.stringContaining("model must be omitted")]);
  });

  it("flags subagents that set readonly", () => {
    const root = tempDir();
    put(root, "agents/beta.md", AGENT("beta", "readonly: true\n"));
    expect(messages(root)).toEqual([expect.stringContaining("readonly is not portable")]);
  });

  it("flags a subagent whose name differs from its file", () => {
    const root = tempDir();
    put(root, "agents/beta.md", AGENT("gamma"));
    expect(messages(root)).toEqual([expect.stringContaining('name must equal "beta"')]);
  });

  it("flags CRLF line endings", () => {
    const root = tempDir();
    put(root, "skills/alpha/SKILL.md", SKILL("alpha"));
    put(root, "skills/alpha/extra.md", "line\r\nline\r\n");
    expect(messages(root)).toEqual([expect.stringContaining("CR found")]);
  });

  it("flags manifest entries that point to nothing", () => {
    const root = tempDir();
    put(root, "skills/alpha/SKILL.md", SKILL("alpha"));
    put(
      root,
      "kit.json",
      JSON.stringify({
        presets: { core: ["alpha", "ghost"], full: "*" },
        agents: ["phantom"],
        commands: ["specter"],
      }),
    );
    const found = messages(root);
    expect(found).toContain('kit.json: preset "core" lists missing skill "ghost"');
    expect(found).toContain('kit.json: lists missing agent "phantom"');
    expect(found).toContain('kit.json: lists missing command "specter"');
  });

  it("flags an unreadable manifest", () => {
    const root = tempDir();
    put(root, "kit.json", "{ not json");
    expect(messages(root)).toEqual([expect.stringContaining("cannot read kit.json")]);
  });

  it("accepts a BOM, trailing spaces after fences, and CRLF in the frontmatter", () => {
    const root = tempDir();
    put(root, "skills/alpha/SKILL.md", `\uFEFF--- \r\nname: alpha\r\ndescription: "Does alpha."\r\n---  \r\nbody\r\n`);
    // CRLF is still reported by the line-ending check, but the frontmatter itself parses.
    expect(messages(root)).toEqual([expect.stringContaining("CR found")]);
  });

  it("reports empty frontmatter as a missing description, not as missing frontmatter", () => {
    const root = tempDir();
    put(root, "skills/alpha/SKILL.md", "---\n---\nbody\n");
    expect(messages(root)).toEqual([
      expect.stringContaining('name must equal "alpha"'),
      expect.stringContaining("description is required"),
    ]);
  });

  it("flags a subagent description that continues on a second line", () => {
    const root = tempDir();
    put(root, "agents/beta.md", "---\nname: beta\ndescription: first part\n  second part\n---\n");
    expect(messages(root)).toEqual([expect.stringContaining("single line")]);
  });

  it("accepts a quoted one-line description that contains a colon", () => {
    const root = tempDir();
    put(root, "agents/beta.md", '---\nname: beta\ndescription: "Use when: needed"\n---\n');
    expect(validateKit(root)).toEqual([]);
  });

  it("reports missing and drifted provider copies", () => {
    const root = tempDir();
    put(root, ".agents/skills/alpha/SKILL.md", SKILL("alpha"));
    put(root, ".agents/agents/beta.md", AGENT("beta"));
    put(root, ".agents/commands/run.md", COMMAND("alpha"));
    put(root, ".cursor/commands/run.md", COMMAND("alpha", "Edited."));
    put(root, ".cursor/agents/mine.md", "mine\n");
    const found = checkDrift(root, join(root, ".agents")).map((i) => `${i.path}: ${i.message}`);
    expect(found).toContainEqual(expect.stringContaining("copy missing"));
    expect(found.some((m) => m.includes("copy missing") && m.includes("beta.md"))).toBe(true);
    expect(found).toContainEqual(expect.stringContaining("differs from"));
    expect(found.some((m) => m.includes("differs from") && m.includes("run.md"))).toBe(true);
    expect(found.some((m) => m.includes("copy it over"))).toBe(false);
    expect(found.some((m) => m.includes("mine.md"))).toBe(false);
  });

  it("treats a matching kit sidecar as in-sync even when the user copy differs", () => {
    const root = tempDir();
    put(root, ".agents/agents/beta.md", AGENT("beta"));
    put(root, ".cursor/agents/beta.md", "mine\n");
    put(root, ".cursor/agents/beta.kit.md", AGENT("beta"));
    expect(checkDrift(root, join(root, ".agents"))).toEqual([]);
  });

  it("treats a cursor skill linked under the unprefixed name as reachable for a zk- sidecar", () => {
    const root = tempDir();
    put(root, ".agents/skills/zk-alpha/SKILL.md", SKILL("alpha"));
    put(root, ".cursor/skills/alpha/SKILL.md", SKILL("alpha"));
    expect(checkDrift(root, join(root, ".agents"))).toEqual([]);
  });

  it("flags a kit skill that a real .cursor/skills directory does not expose", () => {
    const root = tempDir();
    put(root, ".agents/skills/alpha/SKILL.md", SKILL("alpha"));
    put(root, ".cursor/skills/team-own/SKILL.md", SKILL("team-own"));
    const found = checkDrift(root, join(root, ".agents")).map((i) => `${i.path}: ${i.message}`);
    expect(found).toContainEqual(expect.stringContaining('kit skill "alpha" is unreachable'));
  });

  it("drift is clean when copies match, and skipped for links and missing folders", () => {
    const root = tempDir();
    put(root, ".agents/skills/alpha/SKILL.md", SKILL("alpha"));
    put(root, ".agents/agents/beta.md", AGENT("beta"));
    put(root, ".agents/commands/run.md", COMMAND("alpha"));
    const agents = join(root, ".agents");
    expect(checkDrift(root, agents)).toEqual([]);
    put(root, ".cursor/commands/run.md", COMMAND("alpha"));
    symlinkSync(join(agents, "agents"), join(root, ".cursor", "agents"));
    expect(checkDrift(root, agents)).toEqual([]);
  });

  it("flags ladder skills that lost the ladder", () => {
    const root = tempDir();
    put(root, "skills/plan/SKILL.md", SKILL("plan"));
    put(root, "skills/implement/SKILL.md", `${SKILL("implement")}\nClimb the ladder.\n`);
    put(root, "AGENTS.template.md", "# Template\n");
    const found = messages(root);
    expect(found).toContainEqual(expect.stringContaining("ponytail ladder"));
    expect(found.some((m) => m.includes("skills/plan/SKILL.md"))).toBe(true);
    expect(found.some((m) => m.includes("AGENTS.template.md"))).toBe(true);
    expect(found.some((m) => m.includes("skills/implement/SKILL.md"))).toBe(false);
  });

  it("ignores the ladder check for layouts without those files", () => {
    const root = tempDir();
    put(root, "skills/alpha/SKILL.md", SKILL("alpha"));
    expect(validateKit(root)).toEqual([]);
  });

  it("reports an unreadable entry instead of throwing", () => {
    const root = tempDir();
    put(root, "skills/alpha/SKILL.md", SKILL("alpha"));
    symlinkSync("/definitely/not/here", join(root, "skills/ghost"));
    const issues = validateKit(root);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain("cannot read");
  });
});
