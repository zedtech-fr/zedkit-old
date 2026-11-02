#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { checkRegistryThemeDrift } from "./theme-tokens.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const outDir = join(root, "apps/docs/public/r");
const registryPath = join(root, "registry.json");

const errors = [];

const registry = JSON.parse(readFileSync(registryPath, "utf8"));
const itemsByName = new Map((registry.items ?? []).map((item) => [item.name, item]));
const localUiImport = /from\s+["']@\/components\/ui\/([^"']+)["']/g;

for (const item of registry.items ?? []) {
  const fileBases = new Set(
    (item.files ?? []).map((file) =>
      String(file.path)
        .replace(/^registry\/ui\//, "")
        .replace(/\.(tsx|ts)$/, ""),
    ),
  );
  const depNames = new Set(
    (item.registryDependencies ?? []).map((dep) => String(dep).replace(/^@zedkit\//, "")),
  );
  for (const dep of item.registryDependencies ?? []) {
    if (dep === "utils") continue;
    if (typeof dep === "string" && !dep.startsWith("@zedkit/") && itemsByName.has(dep)) {
      errors.push(`${item.name}: registryDependencies "${dep}" should be "@zedkit/${dep}"`);
    }
  }
  for (const file of item.files ?? []) {
    const rel = file.path;
    if (typeof rel !== "string" || rel.length === 0) continue;
    const abs = join(root, rel);
    if (!existsSync(abs)) {
      errors.push(`missing GitHub registry source ${rel} (run pnpm registry:build)`);
      continue;
    }
    const source = readFileSync(abs, "utf8");
    for (const match of source.matchAll(localUiImport)) {
      const mod = match[1];
      if (fileBases.has(mod) || depNames.has(mod)) continue;
      errors.push(
        `${item.name}: ${rel} imports @/components/ui/${mod} which is not in this item's files or registryDependencies`,
      );
    }
  }
}

for (const name of ["theme", "badge", "button", "dialog", "drawer", "confirm-dialog", "registry"]) {
  const path = join(outDir, `${name}.json`);
  if (!existsSync(path)) {
    errors.push(`missing ${path} (run pnpm registry:build)`);
    continue;
  }
  const raw = readFileSync(path, "utf8");
  if (name !== "registry" && raw.includes('from "./utils.js"')) {
    errors.push(`${name}.json still contains relative ./utils.js imports`);
  }
  if (name === "drawer" && !raw.includes("@/components/ui/ui-provider")) {
    errors.push("drawer.json missing rewritten ui-provider import");
  }
}

const validate = spawnSync(
  "pnpm",
  ["exec", "shadcn", "registry", "validate", "registry.json"],
  { cwd: root, encoding: "utf8" },
);
if (validate.status !== 0) {
  errors.push(
    `shadcn registry validate failed: ${validate.stderr || validate.stdout || `exit ${validate.status}`}`,
  );
}

errors.push(...checkRegistryThemeDrift(root));

if (errors.length) {
  for (const msg of errors) {
    console.error(msg);
  }
  process.exit(1);
}

console.log("registry: ok (theme, badge, button, dialog, drawer, confirm-dialog, validate, theme tokens)");
