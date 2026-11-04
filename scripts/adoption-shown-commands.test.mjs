import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { FEATURED_EXAMPLE, buildAdoptionPlan, loadRegistry } from "../apps/docs/lib/adoption-plan.mjs";
import {
  commandsFromPlan,
  installCommandKey,
  isWorkspacePackageAdd,
  packagesNamedInAdd,
  shownInstallCommands,
  uncoveredInstallCommands,
  workspacePackageDir,
} from "../apps/docs/lib/adoption-shown-commands.mjs";
import { CASES } from "./adoption-smoke.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(readFileSync(join(ROOT, "docs/catalog/catalog.json"), "utf8"));
const registry = loadRegistry(ROOT);

function findNeed(name) {
  for (const [packageName, entry] of Object.entries(catalog.packages)) {
    const need = entry.needs.find((item) => item.need === name);
    if (need) return { need, packageName };
  }
  throw new Error(`catalog has no need "${name}"`);
}

function plan(name, example) {
  const { need, packageName } = findNeed(name);
  return buildAdoptionPlan({ need, packageName, siteUrl: "https://zedkit.app", ...(example ? { example } : {}) }, { registry });
}

test("installCommandKey treats npx and pnpm dlx shadcn as the same add", () => {
  assert.equal(
    installCommandKey("npx shadcn@latest add https://zedkit.app/r/button.json"),
    installCommandKey("pnpm dlx shadcn@4.22.1 add https://zedkit.app/r/button.json --yes --overwrite"),
  );
  assert.equal(installCommandKey("pnpm add -D @zedtech/zedkit-ai"), "add-dev @zedtech/zedkit-ai");
});

test("getting-started shows the UI, registry, core, server, nest and ai installs", () => {
  const shown = shownInstallCommands(ROOT);
  const keys = shown.map(installCommandKey);
  assert.ok(keys.includes("add @zedtech/zedkit-ui"), shown.join("\n"));
  assert.ok(keys.includes("add @zedtech/zedkit-core"), shown.join("\n"));
  assert.ok(keys.includes("add @zedtech/zedkit-server"), shown.join("\n"));
  assert.ok(keys.includes("add @zedtech/zedkit-nest"), shown.join("\n"));
  assert.ok(keys.includes("add-dev @zedtech/zedkit-ai"), shown.join("\n"));
  assert.ok(keys.some((key) => key.startsWith("shadcn add https://zedkit.app/r/button.json")), shown.join("\n"));
  assert.ok(keys.some((key) => key.startsWith("shadcn registry add")), shown.join("\n"));
  assert.ok(!shown.some((command) => command.includes("zedkit-ai init")), "init is not an install command");
});

test("adoption-smoke executes every shown install command", () => {
  assert.ok(CASES["getting-started-packages"], "smoke must run getting-started package adds");
  const shown = shownInstallCommands(ROOT);
  const home = plan("Trigger actions with buttons", FEATURED_EXAMPLE);
  const drawer = plan("Slide in a drawer panel");
  const executed = [
    ...commandsFromPlan(home, "package"),
    ...commandsFromPlan(home, "cli"),
    ...commandsFromPlan(drawer, "cli"),
  ];
  const uncovered = uncoveredInstallCommands(shown, executed);
  const leftoverAdds = uncovered.filter(isWorkspacePackageAdd);
  const leftoverOther = uncovered.filter((command) => !isWorkspacePackageAdd(command));
  assert.deepEqual(leftoverOther, [], "shadcn/init commands on getting-started must already be a smoke case");
  for (const command of leftoverAdds) {
    for (const name of packagesNamedInAdd(command)) {
      assert.ok(workspacePackageDir(name, ROOT), `${name} has no packages/* folder`);
    }
  }
});
