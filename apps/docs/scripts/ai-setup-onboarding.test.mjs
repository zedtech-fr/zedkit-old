import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { readAiSetupKit } from "../lib/ai-setup-onboarding.mjs";

const KIT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "packages", "ai", "kit");

test("the home tree lists the setup preset, every name backed by a kit file", () => {
  const kit = readAiSetupKit();
  const manifest = JSON.parse(readFileSync(join(KIT, "kit.json"), "utf8"));
  assert.deepEqual(kit.skills, manifest.presets.setup);
  assert.deepEqual(kit.agents, manifest.presetAgents.setup);
  assert.deepEqual(kit.commands, manifest.presetCommands.setup);
  for (const name of kit.skills) assert.ok(existsSync(join(KIT, "skills", name, "SKILL.md")), name);
  for (const name of kit.agents) assert.ok(existsSync(join(KIT, "agents", `${name}.md`)), name);
});

test("the tree carries no skill or subagent counters", () => {
  const { installed } = readAiSetupKit();
  assert.ok(installed.every((row) => !("note" in row) || !/\d/.test(row.note)));
  const rows = installed.map((row) => row.text);
  assert.equal(rows.filter((text) => /^│ {2}│ {2}[├└]─ [\w-]+\/$/.test(text)).length, readAiSetupKit().skills.length);
});

test("the tree draws connectors and marks the Cursor link", () => {
  const { installed } = readAiSetupKit();
  assert.match(installed[0].text, /^├─ AGENTS\.md$/);
  assert.ok(installed.some((row) => row.kind === "link" && row.text.endsWith("skills -> ../.agents/skills")));
  assert.match(installed.at(-1).text, /^ {3}└─ rules\/project\.mdc$/);
});
