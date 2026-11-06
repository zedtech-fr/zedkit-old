// Original work by the same author.
// Regenerates kit/legacy-hashes.json: a short hash of every version of every
// shipped agent and command, as an older `init` would have copied it (the
// kit text with its conditional blocks resolved for each preset). `sync` and
// `validate` treat an unmarked file with one of these hashes as a copy of the
// kit, not as user work. Needs the full git history and a built `dist/`.
//   node scripts/legacy-hashes.mjs
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { tryCatch } from "@zedtech/zedkit-core";
import { resolveConditionals } from "../dist/conditional.js";
import { agentsForPreset, commandsForPreset, kitUniverse, readManifest } from "../dist/kit.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const kit = join(root, "kit");
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

const manifest = readManifest(kit);
if (!manifest.ok) throw manifest.error;
const universe = kitUniverse(kit);
const presets = Object.entries(manifest.value.presets).map(([name, skills]) => ({
  skills: new Set(skills === "*" ? universe.skills : skills),
  agents: new Set(agentsForPreset(manifest.value, name)),
  commands: new Set(commandsForPreset(manifest.value, name)),
}));

const short = (text) => createHash("sha256").update(text.replace(/\r\n/g, "\n")).digest("hex").slice(0, 16);

function versions(kind, name) {
  const log = git("log", "--follow", "--name-only", "--format=%x00%H", "--", `kit/${kind}/${name}.md`);
  const out = [];
  for (const chunk of log.split("\0").slice(1)) {
    const [hash, , path] = chunk.split("\n");
    const shown = tryCatch(() => git("show", `${hash}:${path}`));
    if (shown.ok) out.push(shown.value);
  }
  return out;
}

function hashesOf(kind, name) {
  const found = new Set();
  for (const raw of versions(kind, name)) {
    found.add(short(raw));
    for (const avail of presets) {
      const resolved = tryCatch(() => resolveConditionals(raw, avail));
      if (resolved.ok) found.add(short(resolved.value));
    }
  }
  return [...found].sort();
}

const result = { schema: 1, agents: {}, commands: {} };
for (const kind of ["agents", "commands"]) {
  for (const file of readdirSync(join(kit, kind)).filter((f) => f.endsWith(".md")).sort()) {
    const name = file.slice(0, -3);
    result[kind][name] = hashesOf(kind, name);
  }
}
const hashesPath = join(kit, "legacy-hashes.json");
writeFileSync(hashesPath, `${JSON.stringify(result, null, 1)}\n`);
// kit:md is `prettier --check kit`; JSON.stringify indent 1 is not that format.
execFileSync(process.execPath, [fileURLToPath(import.meta.resolve("prettier/bin/prettier.cjs")), "--write", hashesPath], {
  cwd: root,
});
process.stdout.write(`legacy-hashes.json: ${Object.values(result.agents).flat().length + Object.values(result.commands).flat().length} hashes\n`);
