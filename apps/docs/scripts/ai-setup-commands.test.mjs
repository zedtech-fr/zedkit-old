import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..", "..");

function read(rel) {
  return readFileSync(join(ROOT, rel), "utf8");
}

// Commands and flags come from the CLI source, not from memory: OPTIONS /
// VALIDATE_OPTIONS keys plus `command === "<name>"` matches and --help.
function cliSurface() {
  const src = read("packages/ai/src/cli.ts");
  const commands = new Set([...src.matchAll(/command === "([a-z]+)"/g)].map((m) => m[1]));
  const flags = new Set(["--help"]);
  for (const block of ["OPTIONS", "VALIDATE_OPTIONS"]) {
    const body = src.match(new RegExp(`const ${block} = \\{([\\s\\S]*?)\\} as const`));
    assert.ok(body, `cli.ts: ${block} block found`);
    for (const m of body[1].matchAll(/^\s*"?([a-z][a-z-]*)"?: \{ type: "(?:string|boolean)" \},?$/gm)) {
      flags.add(`--${m[1]}`);
    }
  }
  assert.ok(commands.size > 0 && flags.size > 1, "cli.ts: surface parsed");
  return { commands, flags };
}

// Only flags on lines that actually invoke the CLI count (prose may name
// other tools' flags, e.g. prettier --check).
function cliInvocations(text) {
  const commands = [];
  const flags = [];
  for (const line of text.split("\n")) {
    if (!/(?:@zedtech\/)?zedkit-ai\s+[a-z]/.test(line)) continue;
    const cmd = line.match(/(?:@zedtech\/)?zedkit-ai\s+([a-z][a-z-]*)/);
    if (cmd) commands.push(cmd[1]);
    for (const m of line.matchAll(/--[a-z][a-z-]*/g)) flags.push(m[0]);
  }
  return { commands, flags };
}

function presetValues(text) {
  const out = [];
  for (const m of text.matchAll(/--preset\s+([a-z][a-z|]*)/g)) out.push(...m[1].split("|"));
  return out;
}

const SOURCES = [
  "packages/ai/kit/cursor-mini-prompt.txt",
  "packages/ai/kit/cursor-onboarding.md",
  "apps/docs/prose/guides/ai/setup.mdx",
];

test("ai setup docs name real CLI commands and flags", () => {
  const { commands, flags } = cliSurface();
  for (const rel of SOURCES) {
    const { commands: usedCommands, flags: usedFlags } = cliInvocations(read(rel));
    for (const cmd of usedCommands) {
      assert.ok(commands.has(cmd), `${rel}: unknown command ${cmd}`);
    }
    for (const flag of usedFlags) {
      assert.ok(flags.has(flag), `${rel}: unknown flag ${flag}`);
    }
  }
});

test("ai setup docs name real preset values", () => {
  const kit = JSON.parse(read("packages/ai/kit/kit.json"));
  const presets = new Set(Object.keys(kit.presets));
  for (const rel of SOURCES) {
    for (const value of presetValues(read(rel))) {
      assert.ok(presets.has(value), `${rel}: unknown preset ${value}`);
    }
    // Every preset enum mirrors usage.txt's full list; a subset here is drift.
    for (const m of read(rel).matchAll(/--preset\s+([a-z][a-z|]*)/g)) {
      const named = new Set(m[1].split("|"));
      const missing = [...presets].filter((p) => !named.has(p));
      assert.deepEqual(missing, [], `${rel}: preset enum missing: ${missing.join(", ")}`);
    }
  }
});

test("generated agent page and mini prompt match the kit sources", () => {
  const mini = read("packages/ai/kit/cursor-mini-prompt.txt").trimEnd();
  const agentMd = read("packages/ai/kit/cursor-onboarding.md").trimEnd();
  assert.equal(read("apps/docs/public/ai/setup.md"), `${agentMd}\n`);
  const generated = read("apps/docs/lib/ai-setup-onboarding.generated.ts");
  assert.ok(
    generated.includes(`export const AI_SETUP_MINI_PROMPT = ${JSON.stringify(mini)};`),
    "generated mini prompt matches kit source (copy button copies this)",
  );
});
