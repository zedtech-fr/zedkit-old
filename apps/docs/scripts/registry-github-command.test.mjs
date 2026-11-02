import assert from "node:assert/strict";
import test from "node:test";

import { dlxRunner, packageAddCommand, packageManagers } from "../lib/package-manager-commands.ts";
import { registryShadcnGithubCommand } from "../lib/registry-shadcn-github-command.ts";
import { registryShadcnAddCommand, registryShadcnNamespaceCommand } from "../lib/registry-shadcn-command.ts";

test("registryShadcnGithubCommand uses GitHub registry shorthand", () => {
  assert.equal(registryShadcnGithubCommand("badge"), "npx shadcn@latest add zedtech-fr/zedkit/badge");
});

test("registryShadcnNamespaceCommand registers docs-hosted @zedkit namespace", () => {
  assert.equal(
    registryShadcnNamespaceCommand("https://zedkit.app"),
    "npx shadcn@latest registry add @zedkit=https://zedkit.app/r/{name}.json",
  );
});

test("install commands follow each package manager, pnpm first", () => {
  assert.deepEqual([...packageManagers], ["pnpm", "npm", "yarn"]);
  assert.deepEqual(
    packageManagers.map((pm) => packageAddCommand(pm, "@zedtech/zedkit-ui")),
    ["pnpm add @zedtech/zedkit-ui", "npm install @zedtech/zedkit-ui", "yarn add @zedtech/zedkit-ui"],
  );
});

test("shadcn CLI commands take the package manager's one-off runner", () => {
  assert.equal(
    registryShadcnGithubCommand("button", dlxRunner("pnpm")),
    "pnpm dlx shadcn@latest add zedtech-fr/zedkit/button",
  );
  assert.equal(
    registryShadcnAddCommand("https://zedkit.app/", "button", dlxRunner("yarn")),
    "yarn dlx shadcn@latest add https://zedkit.app/r/button.json",
  );
  assert.equal(
    registryShadcnAddCommand("https://zedkit.app", "button", dlxRunner("npm")),
    "npx shadcn@latest add https://zedkit.app/r/button.json",
  );
});
