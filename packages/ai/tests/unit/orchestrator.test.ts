import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseFrontmatter } from "#frontmatter.js";
import { installKit } from "#install.js";
import { MUSE_NAME_ALIAS } from "#generate.js";
import { readManifest } from "#kit.js";
import { validateKit } from "#validate.js";
import { tempDir } from "./helpers.js";

function kitRoot(): string {
  return fileURLToPath(new URL("../../kit/", import.meta.url));
}

function repoRoot(): string {
  return fileURLToPath(new URL("../../../../", import.meta.url));
}

function install(dest: string, options: Parameters<typeof installKit>[0] extends infer O ? Partial<O> : never = {}) {
  const result = installKit({ dest, ...options });
  if (!result.ok) throw result.error;
  return result.value;
}

function routingNamesFromOrchestrator(): string[] {
  const text = readFileSync(join(kitRoot(), "agents", "orchestrator.md"), "utf8");
  const start = text.indexOf("## Routing");
  expect(start).toBeGreaterThan(-1);
  const section = text.slice(start);
  const names = new Set<string>();
  for (const m of section.matchAll(/`([a-z][a-z0-9-]*)`/g)) {
    if (m[1]) names.add(m[1]);
  }
  return [...names].sort();
}

describe("orchestrator agent", () => {
  it("is listed in the embedded manifest", () => {
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    expect(manifest.value.agents).toContain("orchestrator");
    expect(manifest.value.commands).toContain("orchestrate");
    expect(manifest.value.commands).toContain("research");
    const core = manifest.value.presets.core;
    expect(core).toContain("orchestrate");
  });

  // One install+validate is 4–8 s on CI (see vitest.config.ts). Six of those
  // in a single `it` exceed the 20 s testTimeout and abort before the
  // validateKit assertion prints. Keep the timeout; split the matrix.
  it.each([
    ["starter", "cursor", false],
    ["starter", "claude", false],
    ["core", "cursor", true],
    ["core", "claude", true],
    ["full", "cursor", true],
    ["full", "claude", true],
  ] as const)("installs orchestrator files for %s + %s", (preset, provider, hasOrchestrate) => {
    const dest = tempDir();
    install(dest, { preset, providers: [provider] });
    expect(existsSync(join(dest, ".agents/agents/orchestrator.md"))).toBe(true);
    expect(existsSync(join(dest, ".agents/commands/orchestrate.md"))).toBe(hasOrchestrate);
    expect(existsSync(join(dest, `.${provider}/agents/orchestrator.md`))).toBe(true);
    expect(validateKit(join(dest, ".agents"))).toEqual([]);
  });

  it("ships frontmatter guards on the orchestrator agent", () => {
    const text = readFileSync(join(kitRoot(), "agents", "orchestrator.md"), "utf8");
    const parsed = parseFrontmatter(text);
    if (!parsed.ok) throw parsed.error;
    const fm = parsed.value.data as Record<string, string>;
    expect(fm.name).toBe("orchestrator");
    expect(fm.description).toMatch(/^Coordinates a task/);
    expect(fm.description).not.toContain("\n");
    expect(fm.model === undefined || fm.model === "inherit").toBe(true);
    expect(fm.disallowedTools).toContain("Write");
    expect(fm.disallowedTools).toContain("Edit");
  });

  it("routing table names only reference kit agents and skills", () => {
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    const skills = new Set(readdirSync(join(kitRoot(), "skills")));
    const agents = new Set([...manifest.value.agents, ...Object.values(MUSE_NAME_ALIAS)]);
    for (const name of routingNamesFromOrchestrator()) {
      expect(skills.has(name) || agents.has(name), `unknown routing target: ${name}`).toBe(true);
    }
    expect(routingNamesFromOrchestrator().length).toBeGreaterThan(5);
  });

  it("keeps docs/agent prose in sync with kit.json agents", () => {
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    const agents = manifest.value.agents;
    const catalog = readFileSync(join(repoRoot(), "docs/agents-catalog.md"), "utf8");
    for (const name of agents) {
      expect(catalog, `agents-catalog missing ${name}`).toContain(`| \`${name}\` |`);
    }
    const prose = readFileSync(
      join(
        repoRoot(),
        "apps/docs/prose/ai/set-up-ai-agent-instructions-skills-subagents-and-commands-in-a-repo.mdx",
      ),
      "utf8",
    );
    const countMatch = /Subagents installed from `kit\.json` \((\d+)\)/.exec(prose);
    expect(countMatch).not.toBeNull();
    expect(Number(countMatch![1])).toBe(agents.length);
    for (const name of agents) {
      // The table cell is either inline code or the docs <AgentName> component.
      expect(prose, `prose agents table missing ${name}`).toMatch(
        new RegExp(`\\| (?:\`${name}\`|<AgentName name="${name}" />) \\|`),
      );
    }
    // No stale rows: every table cell names a shipped agent.
    const shipped = new Set(agents);
    for (const line of prose.split("\n")) {
      if (!line.startsWith("| ")) continue;
      const cell = line.split("|")[1]?.trim() ?? "";
      const code = /^`([a-z0-9-]+)`$/.exec(cell)?.[1];
      const component = /^<AgentName name="([a-z0-9-]+)" \/>$/.exec(cell)?.[1];
      const row = code ?? component;
      if (!row) continue;
      expect(shipped.has(row), `stale prose row: ${row}`).toBe(true);
    }
  });
});
