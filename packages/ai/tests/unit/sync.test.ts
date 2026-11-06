import { existsSync, lstatSync, mkdirSync, readFileSync, readlinkSync, rmSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { main } from "#cli.js";
import { hasMarker } from "#generate.js";
import { kitDir } from "#kit.js";
import { installKit, type Action } from "#install.js";
import { inSync, syncKit, type SyncOptions } from "#sync.js";
import { AGENT, put, tempDir } from "./helpers.js";

const POLICY = `---
schema: 1
default_provider: cursor
providers:
  cursor:
    build:
      standard: { model: cur-build-standard }
    check:
      sensitive: { model: cur-check-sensitive }
  claude:
    build:
      standard: { model: cl-build-standard }
    check:
      sensitive: { model: cl-check-sensitive }
---
`;

/** A project with one kit agent (verifier: default kind check, high reasoning) and one of its own. */
function project(): string {
  const root = tempDir();
  put(root, ".agents/tokenomics.md", POLICY);
  put(root, ".agents/agents/verifier.md", AGENT("verifier", "model: inherit\ndisallowedTools: Write, Edit, NotebookEdit\n"));
  put(root, ".agents/agents/plain.md", AGENT("plain", "model: inherit\n"));
  return root;
}

function sync(root: string, extra: Partial<SyncOptions> = {}): Action[] {
  const result = syncKit({ dest: root, providers: ["cursor", "claude"], ...extra });
  if (!result.ok) throw result.error;
  return result.value;
}

const changes = (actions: Action[]): string[] =>
  actions.filter((a) => a.kind !== "skip").map((a) => `${a.kind} ${a.path}`);

const read = (root: string, rel: string): string => readFileSync(join(root, rel), "utf8");

describe("syncKit: generate", () => {
  it("writes one marked file per agent and provider, with the model of that provider's route", () => {
    const root = project();
    const actions = sync(root);
    expect(changes(actions)).toEqual([
      "generate .cursor/agents/plain.md",
      "generate .cursor/agents/verifier.md",
      "generate .claude/agents/plain.md",
      "generate .claude/agents/verifier.md",
    ]);
    // verifier: default kind check and high reasoning shift standard to the sensitive column; plain: build, standard.
    expect(read(root, ".cursor/agents/verifier.md")).toContain("model: cur-check-sensitive\n");
    expect(read(root, ".claude/agents/verifier.md")).toContain("model: cl-check-sensitive\n");
    expect(read(root, ".cursor/agents/plain.md")).toContain("model: cur-build-standard\n");
    expect(read(root, ".claude/agents/plain.md")).toContain("model: cl-build-standard\n");
    expect(read(root, ".cursor/agents/verifier.md")).toContain("readonly: true\n");
    expect(read(root, ".cursor/agents/plain.md")).not.toContain("readonly:");
    expect(read(root, ".claude/agents/verifier.md")).not.toContain("readonly:");
    for (const rel of [".cursor/agents/verifier.md", ".claude/agents/plain.md"]) {
      expect(hasMarker(read(root, rel)), rel).toBe(true);
      expect(read(root, rel).split("\n")[0]).toBe("---");
    }
    expect(read(root, ".cursor/agents/verifier.md")).toContain("disallowedTools: Write, Edit, NotebookEdit");
  });

  it("never touches the source agents", () => {
    const root = project();
    const before = read(root, ".agents/agents/verifier.md");
    sync(root);
    expect(read(root, ".agents/agents/verifier.md")).toBe(before);
  });

  it("is idempotent: the second run reports only skip lines", () => {
    const root = project();
    sync(root);
    const again = sync(root);
    expect(changes(again)).toEqual([]);
    expect(inSync(again)).toBe(true);
    expect(again.filter((a) => a.note === "up to date")).toHaveLength(4);
  });

  it("says what it ignores, once per provider, and that Cursor shadows .claude/agents", () => {
    const notes = sync(project()).map((a) => a.note ?? "");
    expect(notes).toContain("effort ignored for cursor (no per-agent field)");
    expect(notes).toContain("effort ignored for claude (no per-agent key verified)");
    expect(notes.some((n) => n.startsWith("cursor reads .cursor/agents before .claude/agents"))).toBe(true);
  });

  it("regenerates a marked file when the policy changes, and --check reports it without writing", () => {
    const root = project();
    sync(root);
    put(root, ".agents/tokenomics.md", POLICY.replace("cur-build-standard", "cur-build-other"));
    const check = sync(root, { check: true });
    expect(changes(check)).toEqual(["generate .cursor/agents/plain.md"]);
    expect(inSync(check)).toBe(false);
    expect(read(root, ".cursor/agents/plain.md")).toContain("cur-build-standard");
    const real = sync(root);
    expect(real.find((a) => a.kind === "generate")?.note).toBe("regenerated");
    expect(read(root, ".cursor/agents/plain.md")).toContain("model: cur-build-other\n");
    expect(changes(sync(root))).toEqual([]);
  });

  it("writes nothing with --dry-run or --check", () => {
    for (const mode of [{ dryRun: true }, { check: true }]) {
      const root = project();
      expect(changes(sync(root, mode))).toHaveLength(4);
      expect(existsSync(join(root, ".cursor"))).toBe(false);
      expect(existsSync(join(root, ".claude"))).toBe(false);
    }
  });

  it("generates nothing for codex, and keeps unmarked custom Muse sources", () => {
    const root = project();
    const before = read(root, ".agents/agents/verifier.md");
    const actions = sync(root, { providers: ["codex", "muse"] });
    expect(actions.find((a) => a.path === ".agents/agents")?.note).toContain("codex reads .agents directly");
    expect(changes(actions).filter((line) => line.startsWith("generate "))).toEqual([]);
    expect(existsSync(join(root, ".cursor"))).toBe(false);
    expect(read(root, ".agents/agents/verifier.md")).toBe(before);
    expect(hasMarker(before)).toBe(false);
  });

  it("keeps a model the source pins and says so", () => {
    const root = project();
    put(root, ".agents/agents/plain.md", AGENT("plain", "model: my-pin\n"));
    const actions = sync(root, { providers: ["cursor"] });
    expect(read(root, ".cursor/agents/plain.md")).toContain("model: my-pin\n");
    expect(actions.find((a) => a.path === ".cursor/agents/plain.md")?.note).toContain("model pinned in source (my-pin)");
  });

  it("writes `inherit` when the policy has no cell for the provider", () => {
    const root = project();
    put(root, ".agents/tokenomics.md", "---\nschema: 1\ndefault_provider: cursor\n---\n");
    sync(root, { providers: ["cursor"] });
    expect(read(root, ".cursor/agents/plain.md")).toContain("model: inherit\n");
  });

  it("skips an agent whose name the router refuses and syncs the rest", () => {
    const root = project();
    put(root, ".agents/agents/my_agent.md", AGENT("my_agent"));
    const actions = sync(root, { providers: ["cursor"] });
    expect(actions.find((a) => a.path === ".cursor/agents/my_agent.md")?.note).toContain("not synced: invalid agent name");
    expect(existsSync(join(root, ".cursor/agents/plain.md"))).toBe(true);
    expect(existsSync(join(root, ".cursor/agents/my_agent.md"))).toBe(false);
  });
});

describe("syncKit: never overwrite user work", () => {
  it("replaces an unmarked file that is a plain copy of the source", () => {
    const root = project();
    put(root, ".cursor/agents/plain.md", read(root, ".agents/agents/plain.md"));
    const actions = sync(root, { providers: ["cursor"] });
    expect(actions.find((a) => a.path === ".cursor/agents/plain.md")).toMatchObject({ kind: "generate", note: "replaces a copy of the kit" });
    expect(hasMarker(read(root, ".cursor/agents/plain.md"))).toBe(true);
  });

  it("replaces a per-file link to the source without touching the source", () => {
    const root = project();
    mkdirSync(join(root, ".cursor/agents"), { recursive: true });
    symlinkSync("../../.agents/agents/plain.md", join(root, ".cursor/agents/plain.md"));
    const before = read(root, ".agents/agents/plain.md");
    sync(root, { providers: ["cursor"] });
    expect(lstatSync(join(root, ".cursor/agents/plain.md")).isSymbolicLink()).toBe(false);
    expect(hasMarker(read(root, ".cursor/agents/plain.md"))).toBe(true);
    expect(read(root, ".agents/agents/plain.md")).toBe(before);
  });

  it("keeps an edited file and writes the generated version beside it, once", () => {
    const root = project();
    const mine = "---\nname: plain\ndescription: mine\n---\n\nMy own agent.\n";
    put(root, ".cursor/agents/plain.md", mine);
    const first = sync(root, { providers: ["cursor"] });
    expect(read(root, ".cursor/agents/plain.md")).toBe(mine);
    expect(first.find((a) => a.path === ".cursor/agents/plain.md")?.note).toContain("user file kept");
    expect(hasMarker(read(root, ".cursor/agents/plain.kit.md"))).toBe(true);
    const second = sync(root, { providers: ["cursor"] });
    expect(changes(second)).toEqual([]);
    expect(read(root, ".cursor/agents/plain.md")).toBe(mine);
  });

  it("does not overwrite an unmarked custom sidecar beside a kept user file", () => {
    const root = project();
    const mine = "---\nname: plain\ndescription: mine\n---\n\nMy own agent.\n";
    const sidecar = "---\nname: plain\ndescription: custom kit offer\n---\n\nI edited the sidecar.\n";
    put(root, ".cursor/agents/plain.md", mine);
    put(root, ".cursor/agents/plain.kit.md", sidecar);
    sync(root, { providers: ["cursor"] });
    expect(read(root, ".cursor/agents/plain.md")).toBe(mine);
    expect(read(root, ".cursor/agents/plain.kit.md")).toBe(sidecar);
  });

  it("keeps a symlink that points anywhere else", () => {
    const root = project();
    put(root, "elsewhere/plain.md", "---\nname: plain\n---\nOther.\n");
    mkdirSync(join(root, ".cursor/agents"), { recursive: true });
    symlinkSync("../../elsewhere/plain.md", join(root, ".cursor/agents/plain.md"));
    sync(root, { providers: ["cursor"] });
    expect(readlinkSync(join(root, ".cursor/agents/plain.md"))).toBe("../../elsewhere/plain.md");
    expect(existsSync(join(root, ".cursor/agents/plain.kit.md"))).toBe(true);
  });

  it("turns the kit's own .claude/agents link into a real directory and leaves the sources in place", () => {
    const root = project();
    mkdirSync(join(root, ".claude"), { recursive: true });
    symlinkSync("../.agents/agents", join(root, ".claude/agents"));
    const actions = sync(root, { providers: ["claude"] });
    expect(actions[0]).toMatchObject({ kind: "convert", path: ".claude/agents" });
    expect(lstatSync(join(root, ".claude/agents")).isSymbolicLink()).toBe(false);
    expect(existsSync(join(root, ".agents/agents/verifier.md"))).toBe(true);
    expect(hasMarker(read(root, ".claude/agents/verifier.md"))).toBe(true);
    expect(hasMarker(read(root, ".agents/agents/verifier.md"))).toBe(false);
    expect(changes(sync(root, { providers: ["claude"] }))).toEqual([]);
  });

  it("plans the conversion in a dry run without touching the link", () => {
    const root = project();
    mkdirSync(join(root, ".claude"), { recursive: true });
    symlinkSync("../.agents/agents", join(root, ".claude/agents"));
    const actions = sync(root, { providers: ["claude"], dryRun: true });
    expect(changes(actions)[0]).toBe("convert .claude/agents");
    expect(lstatSync(join(root, ".claude/agents")).isSymbolicLink()).toBe(true);
  });

  it("leaves a directory link to anywhere else alone and writes nothing through it", () => {
    const root = project();
    mkdirSync(join(root, "store/agents"), { recursive: true });
    mkdirSync(join(root, ".claude"), { recursive: true });
    symlinkSync("../store/agents", join(root, ".claude/agents"));
    const actions = sync(root, { providers: ["claude"] });
    expect(changes(actions)).toEqual([]);
    expect(actions[0]?.note).toContain("directory link to ../store/agents left alone");
    expect(existsSync(join(root, "store/agents/verifier.md"))).toBe(false);
  });

  it("does not touch a path that is a file where a directory should be", () => {
    const root = project();
    put(root, ".cursor/agents", "not a directory");
    const actions = sync(root, { providers: ["cursor"] });
    expect(actions[0]?.note).toBe("not a directory");
    expect(read(root, ".cursor/agents")).toBe("not a directory");
  });

  it("does not write through a parent .cursor symlink into another tree", () => {
    const root = project();
    const outside = tempDir();
    put(outside, "agents/sentinel.md", "KEEP\n");
    symlinkSync(outside, join(root, ".cursor"));
    const actions = sync(root, { providers: ["cursor"] });
    expect(read(outside, "agents/sentinel.md")).toBe("KEEP\n");
    expect(existsSync(join(outside, "agents/plain.md"))).toBe(false);
    expect(existsSync(join(outside, "agents/verifier.md"))).toBe(false);
    expect(changes(actions)).toEqual([]);
  });
});

describe("syncKit: prune", () => {
  function withOrphans(): string {
    const root = project();
    sync(root);
    put(root, ".agents/agents/gone.md", AGENT("gone"));
    sync(root);
    // the source goes away; the generated files stay behind
    rmSync(join(root, ".agents/agents/gone.md"));
    return root;
  }

  it("removes a marked file whose source is gone, and only a marked one", () => {
    const root = withOrphans();
    put(root, ".cursor/agents/mine.md", "---\nname: mine\n---\nNot generated.\n");
    const actions = sync(root);
    expect(changes(actions).sort()).toEqual(["prune .claude/agents/gone.md", "prune .cursor/agents/gone.md"]);
    expect(existsSync(join(root, ".cursor/agents/gone.md"))).toBe(false);
    expect(existsSync(join(root, ".cursor/agents/mine.md"))).toBe(true);
  });

  it("keeps orphans with noPrune and reports nothing", () => {
    const root = withOrphans();
    expect(changes(sync(root, { noPrune: true }))).toEqual([]);
    expect(existsSync(join(root, ".cursor/agents/gone.md"))).toBe(true);
  });

  it("does not prune a provider that is not selected unless --prune names the providers", () => {
    const root = project();
    sync(root);
    expect(changes(sync(root, { providers: ["cursor"] }))).toEqual([]);
    expect(existsSync(join(root, ".claude/agents/verifier.md"))).toBe(true);
    const pruned = sync(root, { providers: ["cursor"], prune: true });
    expect(changes(pruned).sort()).toEqual(["prune .claude/agents/plain.md", "prune .claude/agents/verifier.md"]);
    expect(existsSync(join(root, ".claude/agents/verifier.md"))).toBe(false);
    expect(existsSync(join(root, ".cursor/agents/verifier.md"))).toBe(true);
  });

  it("does not prune through a parent .claude symlink into another tree", () => {
    const root = project();
    const outside = tempDir();
    put(
      outside,
      "agents/plain.md",
      "---\n# generated by zedkit-ai sync from .agents/agents/plain.md and .agents/tokenomics.md; do not edit, run: npx zedkit-ai sync\nname: plain\n---\n\nMarked.\n",
    );
    symlinkSync(outside, join(root, ".claude"));
    sync(root, { providers: ["cursor"], prune: true });
    expect(read(outside, "agents/plain.md")).toContain("Marked.");
  });

  it("refuses --prune without an explicit provider list", () => {
    const result = syncKit({ dest: project(), prune: true });
    expect(result.ok ? "ok" : result.error.message).toContain("--prune needs an explicit --provider");
  });
});

describe("syncKit: inputs", () => {
  it("infers the providers from non-empty layers, and refuses when there are none", () => {
    const root = project();
    const none = syncKit({ dest: root });
    expect(none.ok ? "ok" : none.error.message).toContain("no provider layers found");
    mkdirSync(join(root, ".cursor"), { recursive: true });
    expect(syncKit({ dest: root }).ok).toBe(false); // an empty layer is not a layer
    put(root, ".cursor/rules/project.mdc", "x");
    const inferred = syncKit({ dest: root });
    if (!inferred.ok) throw inferred.error;
    const actions = inferred.value;
    expect(changes(actions)).toEqual(["generate .cursor/agents/plain.md", "generate .cursor/agents/verifier.md"]);
    expect(existsSync(join(root, ".claude"))).toBe(false);
  });

  it("errors on a project with no .agents/agents, an unknown provider and an invalid policy", () => {
    const empty = tempDir();
    const noAgents = syncKit({ dest: empty, providers: ["cursor"] });
    expect(noAgents.ok ? "ok" : noAgents.error.message).toContain("no .agents/agents");
    const unknown = syncKit({ dest: project(), providers: ["vim"] });
    expect(unknown.ok ? "ok" : unknown.error.message).toContain('unknown provider "vim"');
    const root = project();
    put(root, ".agents/tokenomics.md", "---\nschema: 1\ntiers: {}\n---\n");
    const bad = syncKit({ dest: root, providers: ["cursor"] });
    expect(bad.ok ? "ok" : bad.error.message).toContain("tokenomics.md: tiers: unknown key");
    expect(existsSync(join(root, ".cursor"))).toBe(false);
  });

  it("stops on a source it cannot generate from and names the agent", () => {
    const root = project();
    put(root, ".agents/agents/broken.md", "no frontmatter here\n");
    const result = syncKit({ dest: root, providers: ["cursor"] });
    expect(result.ok ? "ok" : result.error.message).toContain("broken: missing frontmatter");
  });

  it("ignores *.kit.md sidecars in .agents/agents", () => {
    const root = project();
    put(root, ".agents/agents/plain.kit.md", AGENT("plain"));
    expect(changes(sync(root, { providers: ["cursor"] }))).toEqual([
      "generate .cursor/agents/plain.md",
      "generate .cursor/agents/verifier.md",
    ]);
  });
});

describe("syncKit with the shipped kit", () => {
  it("generates every shipped agent for cursor and claude, keeping the body and dropping nothing but the headers", () => {
    const root = tempDir();
    const installed = installKit({ dest: root, preset: "full", providers: ["codex"] });
    if (!installed.ok) throw installed.error;
    const actions = sync(root);
    const generated = actions.filter((a) => a.kind === "generate");
    expect(generated.length).toBeGreaterThan(30);
    for (const action of generated) {
      const name = action.path.split("/").pop() ?? "";
      const source = read(root, join(".agents/agents", name));
      const out = read(root, action.path);
      expect(out.endsWith(source.slice(source.indexOf("\n---\n", 4) + 5)), action.path).toBe(true);
      expect(out, action.path).not.toMatch(/^(role|default_needs|kinds|default_kind|min_stakes|min_effort):/mu);
      expect(out, action.path).toMatch(/^name: /mu);
    }
    expect(changes(sync(root))).toEqual([]);
  });
});

describe("zedkit-ai sync", () => {
  function run(...argv: string[]): { code: number; text: string; errors: string } {
    const out: string[] = [];
    const errors: string[] = [];
    const code = main(argv, { out: (l) => out.push(l), err: (l) => errors.push(l) });
    return { code, text: out.join("\n"), errors: errors.join("\n") };
  }

  it("prints each action, and --quiet only the changes", () => {
    const root = project();
    const first = run("sync", root, "--provider", "cursor");
    expect(first.code).toBe(0);
    expect(first.text).toContain("generate .cursor/agents/verifier.md");
    expect(first.text).toContain("skip     .cursor/agents  (effort ignored for cursor (no per-agent field))");
    const quiet = run("sync", root, "--provider", "cursor", "--quiet");
    expect(quiet.text).toBe("");
  });

  it("--check exits 1 and names the stale file, then 0 after a sync", () => {
    const root = project();
    const stale = run("sync", root, "--provider", "cursor,claude", "--check");
    expect(stale.code).toBe(1);
    expect(stale.text).toContain(".cursor/agents/verifier.md: out of date, run: npx zedkit-ai sync");
    expect(existsSync(join(root, ".cursor"))).toBe(false);
    expect(run("sync", root, "--provider", "all").code).toBe(0);
    const fresh = run("sync", root, "--provider", "cursor,claude", "--check");
    expect(fresh).toMatchObject({ code: 0, text: "ok" });
  });

  it("--dry-run prints the plan and writes nothing", () => {
    const root = project();
    const dry = run("sync", root, "--provider", "cursor", "--dry-run");
    expect(dry.code).toBe(0);
    expect(dry.text).toContain("dry run: nothing written");
    expect(existsSync(join(root, ".cursor"))).toBe(false);
  });

  it("exits 2 on nothing to infer, a bad provider, --prune alone, a missing directory and a stray argument", () => {
    const root = project();
    expect(run("sync", root).errors).toContain("no provider layers found");
    expect(run("sync", root).code).toBe(2);
    expect(run("sync", root, "--provider", "vim").code).toBe(2);
    expect(run("sync", root, "--prune").code).toBe(2);
    expect(run("sync", join(root, "nope"), "--provider", "cursor").code).toBe(2);
    expect(run("sync", root, "extra", "--provider", "cursor").code).toBe(2);
  });
});

describe("syncKit: muse native files", () => {
  it("keeps an unmarked edited source and does not write a .kit.md sidecar", () => {
    const root = project();
    const custom = AGENT("plain", "model: inherit\n") + "USER\n";
    put(root, ".agents/agents/plain.md", custom);
    sync(root, { providers: ["muse"] });
    expect(read(root, ".agents/agents/plain.md")).toBe(custom);
    expect(existsSync(join(root, ".agents/agents/plain.kit.md"))).toBe(false);
  });

  it("replaces a kit-equal unmarked copy, and Cursor still generates from the kit", () => {
    const root = project();
    const kitExplorer = readFileSync(join(kitDir(), "agents/explorer.md"), "utf8");
    put(root, ".agents/agents/explorer.md", kitExplorer);
    sync(root, { providers: ["muse"] });
    const muse = read(root, ".agents/agents/explorer.md");
    expect(hasMarker(muse)).toBe(true);
    expect(muse).toContain("disallowedTools: write_file, edit_file");
    expect(muse).not.toContain("Write");
    sync(root, { providers: ["cursor"] });
    const cursor = read(root, ".cursor/agents/explorer.md");
    expect(cursor).toContain("disallowedTools: Write, Edit, NotebookEdit");
    expect(cursor).toContain("readonly: true");
    expect(cursor).not.toContain("write_file");
  });

  it("converts the repo-relative kit symlink without writing into that kit", () => {
    const root = tempDir();
    put(root, ".agents/tokenomics.md", POLICY);
    mkdirSync(join(root, ".agents"), { recursive: true });
    const kitAgents = join(root, "packages/ai/kit/agents");
    mkdirSync(kitAgents, { recursive: true });
    put(kitAgents, "explorer.md", AGENT("explorer", "model: inherit\ndisallowedTools: Write, Edit, NotebookEdit\n"));
    symlinkSync("../packages/ai/kit/agents", join(root, ".agents/agents"));
    const before = readFileSync(join(kitAgents, "explorer.md"), "utf8");
    const actions = sync(root, { providers: ["muse"] });
    expect(actions.some((a) => a.kind === "convert" && a.path === ".agents/agents")).toBe(true);
    expect(lstatSync(join(root, ".agents/agents")).isSymbolicLink()).toBe(false);
    expect(readFileSync(join(kitAgents, "explorer.md"), "utf8")).toBe(before);
    expect(hasMarker(read(root, ".agents/agents/explorer.md"))).toBe(true);
  });

  it("converts a kit-dir symlink without writing into the kit", () => {
    const root = tempDir();
    put(root, ".agents/tokenomics.md", POLICY);
    mkdirSync(join(root, ".agents"), { recursive: true });
    const kitAgents = join(kitDir(), "agents");
    symlinkSync(kitAgents, join(root, ".agents/agents"));
    const before = readFileSync(join(kitAgents, "explorer.md"), "utf8");
    const actions = sync(root, { providers: ["muse"] });
    expect(actions.some((a) => a.kind === "convert" && a.path === ".agents/agents")).toBe(true);
    expect(lstatSync(join(root, ".agents/agents")).isSymbolicLink()).toBe(false);
    expect(readFileSync(join(kitAgents, "explorer.md"), "utf8")).toBe(before);
    expect(hasMarker(read(root, ".agents/agents/explorer.md"))).toBe(true);
    expect(hasMarker(read(root, ".agents/agents/accessibility-auditor.md"))).toBe(true);
    expect(read(root, ".agents/agents/accessibility-auditor.md")).toContain("name: accessibility-auditor\n");
    expect(existsSync(join(root, ".agents/agents/a11y-auditor.md"))).toBe(true);
    expect(hasMarker(read(root, ".agents/agents/a11y-auditor.md"))).toBe(false);
    expect(existsSync(join(kitAgents, "a11y-auditor.md"))).toBe(true);
    expect(readFileSync(join(kitAgents, "a11y-auditor.md"), "utf8")).toContain("name: a11y-auditor\n");
    expect(changes(sync(root, { providers: ["muse"] }))).toEqual([]);
  });

  it("skips Muse writes when a leftover symlink sits in .agents/agents", () => {
    const root = project();
    mkdirSync(join(root, ".agents/agents"), { recursive: true });
    symlinkSync("plain.md", join(root, ".agents/agents/loop.md"));
    const before = read(root, ".agents/agents/plain.md");
    const actions = sync(root, { providers: ["muse"] });
    expect(actions.some((a) => (a.note ?? "").includes("would empty the Muse catalog"))).toBe(true);
    expect(read(root, ".agents/agents/plain.md")).toBe(before);
  });

  it("maps a11y-auditor to accessibility-auditor and keeps the unmarked source", () => {
    const root = project();
    const kit = readFileSync(join(kitDir(), "agents/a11y-auditor.md"), "utf8");
    put(root, ".agents/agents/a11y-auditor.md", kit);
    sync(root, { providers: ["muse"] });
    expect(read(root, ".agents/agents/a11y-auditor.md")).toBe(kit);
    const muse = read(root, ".agents/agents/accessibility-auditor.md");
    expect(hasMarker(muse)).toBe(true);
    expect(muse).toContain("name: accessibility-auditor\n");
    expect(muse.split("\n")[1]).toContain("a11y-auditor.md");
    expect(muse).toContain("disallowedTools: write_file, edit_file");
    expect(existsSync(join(root, ".agents/agents/a11y-auditor.kit.md"))).toBe(false);
    sync(root, { providers: ["cursor"] });
    const cursor = read(root, ".cursor/agents/a11y-auditor.md");
    expect(cursor).toContain("name: a11y-auditor\n");
    expect(cursor).toContain("readonly: true");
    expect(existsSync(join(root, ".cursor/agents/accessibility-auditor.md"))).toBe(false);
  });

  it("does not overwrite an unmarked custom accessibility-auditor dest", () => {
    const root = project();
    const kit = readFileSync(join(kitDir(), "agents/a11y-auditor.md"), "utf8");
    put(root, ".agents/agents/a11y-auditor.md", kit);
    const custom = AGENT("accessibility-auditor", "model: inherit\n") + "MINE\n";
    put(root, ".agents/agents/accessibility-auditor.md", custom);
    sync(root, { providers: ["muse"] });
    expect(read(root, ".agents/agents/accessibility-auditor.md")).toBe(custom);
    expect(read(root, ".agents/agents/a11y-auditor.md")).toBe(kit);
  });
});
