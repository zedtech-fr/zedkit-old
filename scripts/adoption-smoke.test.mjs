import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { commandsFromPlan, shownInstallCommands } from "../apps/docs/lib/adoption-shown-commands.mjs";
import { CASES, isSiteRegistryToken, localizeCommand, packedTarball, pinVersion, runLocalized } from "./adoption-smoke.mjs";

const MARKER = "pwned-adoption-smoke";
const HOSTILE = `reg with spaces'" ; touch ${MARKER}; echo $(touch ${MARKER}-cmd)`;

function workspaceMarker() {
  return join(process.cwd(), MARKER);
}

function assertNoInjection(parent) {
  assert.equal(existsSync(join(parent, MARKER)), false, "metacharacters must not run in cwd");
  assert.equal(existsSync(join(parent, `${MARKER}-cmd`)), false, "command substitution must not run in cwd");
  assert.equal(existsSync(workspaceMarker()), false, "metacharacters must not run in the process cwd");
  assert.equal(existsSync(join(process.cwd(), `${MARKER}-cmd`)), false, "command substitution must not run in the process cwd");
}

function scratch() {
  return mkdtempSync(join(tmpdir(), "zk-adoption-cmd-"));
}

test("pinVersion accepts a version or dist-tag and rejects shell metacharacters", () => {
  assert.equal(pinVersion("4.22.1", "SHADCN_VERSION"), "4.22.1");
  assert.equal(pinVersion("latest", "SHADCN_VERSION"), "latest");
  assert.equal(pinVersion("16.4.3-canary.0", "CREATE_NEXT_APP_VERSION"), "16.4.3-canary.0");
  for (const raw of ["4.22.1; rm -rf /", "$(touch x)", "4.22.1 rc", `4.22.1"$(id)"`, "1.0.0+build", ""]) {
    assert.throws(() => pinVersion(raw, "SHADCN_VERSION"), /version or dist-tag/);
  }
});

test("localizeCommand tokenizes every current shown command and rejects shell lists", () => {
  const root = join(import.meta.dirname, "..");
  const commands = new Set(shownInstallCommands(root));
  for (const spec of Object.values(CASES)) {
    if (spec.plan && spec.mode) {
      for (const command of commandsFromPlan(spec.plan(), spec.mode)) commands.add(command);
    }
  }
  assert.ok(commands.size > 0);
  for (const command of commands) {
    const tokens = localizeCommand(command);
    const original = command.trim().split(/\s+/);
    assert.equal(tokens[0], original[0], command);
    assert.equal(tokens.length >= original.length, true, command);
    for (let i = 0; i < original.length; i += 1) {
      if (original[i].startsWith("shadcn@latest")) continue;
      if (isSiteRegistryToken(original[i])) continue;
      assert.equal(tokens[i], original[i], `${command} token ${i}`);
    }
  }
  assert.throws(() => localizeCommand("pnpm add @zedtech/zedkit-ui && rm -rf /"), /shell syntax/);
  assert.throws(() => localizeCommand("pnpm add foo | tee"), /shell syntax/);
  assert.throws(() => localizeCommand("pnpm add 'foo bar'"), /shell syntax/);
});

test("localizeCommand keeps a registry path with spaces, quotes and metacharacters as one argv element", () => {
  const registryDir = join("/tmp/zk-adoption-cmd", HOSTILE);
  assert.deepEqual(
    localizeCommand("pnpm dlx shadcn@latest add https://zedkit.app/r/button.json", {
      registryDir,
      shadcnVersion: "4.22.1",
    }),
    ["pnpm", "dlx", "shadcn@4.22.1", "add", `${registryDir}/button.json`, "--yes", "--overwrite"],
  );
  assert.deepEqual(
    localizeCommand("npx shadcn@latest registry add @zedkit=https://zedkit.app/r/{name}.json", {
      registryDir,
      shadcnVersion: "4.22.1",
    }),
    ["npx", "shadcn@4.22.1", "registry", "add", `@zedkit=${registryDir}/{name}.json`],
  );
  assert.deepEqual(localizeCommand("pnpm add @zedtech/zedkit-ui"), ["pnpm", "add", "@zedtech/zedkit-ui"]);
  const lookalike = "https://evil.com/#https://zedkit.app/r/button.json";
  assert.equal(isSiteRegistryToken(lookalike), false);
  assert.deepEqual(
    localizeCommand(`pnpm dlx shadcn@latest add ${lookalike}`, {
      registryDir,
      shadcnVersion: "4.22.1",
    }),
    ["pnpm", "dlx", "shadcn@4.22.1", "add", lookalike, "--yes", "--overwrite"],
  );
});

test("packedTarball reads a tarball from a directory whose name is a shell command", (t) => {
  const parent = scratch();
  t.after(() => {
    rmSync(parent, { recursive: true, force: true });
    rmSync(workspaceMarker(), { force: true });
    rmSync(join(process.cwd(), `${MARKER}-cmd`), { force: true });
  });
  const dest = join(parent, HOSTILE);
  mkdirSync(dest, { recursive: true });
  const tgz = join(dest, "zedkit-ui-0.0.0.tgz");
  writeFileSync(tgz, "tarball");
  assert.equal(packedTarball(dest), tgz);
  assertNoInjection(parent);
});

test("runLocalized does not execute metacharacters in the registry directory", async (t) => {
  const parent = scratch();
  t.after(() => {
    rmSync(parent, { recursive: true, force: true });
    rmSync(workspaceMarker(), { force: true });
    rmSync(join(process.cwd(), `${MARKER}-cmd`), { force: true });
  });
  const registryDir = join(parent, HOSTILE);
  mkdirSync(registryDir, { recursive: true });
  writeFileSync(join(registryDir, "button.json"), "{}");
  const bin = join(parent, "bin");
  mkdirSync(bin);
  const argvOut = join(parent, "argv.json");
  writeFileSync(
    join(bin, "pnpm"),
    `#!${process.execPath}
const { writeFileSync } = require("node:fs");
writeFileSync(process.env.ARGV_OUT, JSON.stringify(process.argv.slice(2)));
`,
  );
  chmodSync(join(bin, "pnpm"), 0o755);

  await runLocalized(
    "pnpm dlx shadcn@latest add https://zedkit.app/r/button.json",
    parent,
    { PATH: `${bin}:${process.env.PATH ?? ""}`, ARGV_OUT: argvOut },
    { registryDir, shadcnVersion: "4.22.1" },
  );

  assertNoInjection(parent);
  assert.deepEqual(JSON.parse(readFileSync(argvOut, "utf8")), [
    "dlx",
    "shadcn@4.22.1",
    "add",
    `${registryDir}/button.json`,
    "--yes",
    "--overwrite",
  ]);
});
