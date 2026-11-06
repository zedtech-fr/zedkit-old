#!/usr/bin/env node
// CI scope: reads changed paths on stdin, prints `key=value` lines for
// $GITHUB_OUTPUT. Full CI runs only for pushes and PRs targeting main;
// every other PR (lockfile, root config and workflow changes included)
// takes the affected-only path.
//
//   git diff --name-only --no-renames "$base"...HEAD |
//     node scripts/ci-affected.mjs --event pull_request --base-ref dev
//
// Outputs: full, workflow_only, workflows, docs, registry, ui, filter.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

// A change here can break any build, so docs and registry jobs run.
const ROOT_CONFIG = new Set([
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "turbo.json",
  "tsconfig.base.json",
  "eslint.config.mjs",
]);

const DOCS_PREFIXES = [
  "apps/docs/",
  "docs/",
  "registry/",
  "scripts/registry/",
  "scripts/catalog",
  "scripts/check-registry-ui-drift",
  "scripts/quickstart",
  "scripts/adoption",
];
/** Maintainer prose verified not to feed docs generate/runtime. Unknown docs/ paths still select browser jobs. */
const MAINTAINER_DOCS = new Set([
  "docs/publishing.md",
  "docs/ci-branch-protection.md",
  "docs/golden-rule.md",
  "docs/agents-catalog.md",
]);
const REGISTRY_PREFIXES = [
  "apps/docs/",
  "registry/",
  "scripts/registry/",
  "scripts/quickstart",
  "scripts/adoption",
];

/** Workspace packages: dir -> { name, deps }. */
export function readWorkspace(root = ".") {
  const out = new Map();
  for (const parent of ["packages", "apps"]) {
    const base = join(root, parent);
    if (!existsSync(base)) continue;
    for (const entry of readdirSync(base, { withFileTypes: true })) {
      const file = join(base, entry.name, "package.json");
      if (!entry.isDirectory() || !existsSync(file)) continue;
      const json = JSON.parse(readFileSync(file, "utf8"));
      const deps = Object.keys({
        ...json.dependencies,
        ...json.devDependencies,
        ...json.peerDependencies,
      });
      out.set(`${parent}/${entry.name}/`, { name: json.name, deps });
    }
  }
  return out;
}

/** Directory prefixes of `rootName` and every workspace package it depends on. */
export function closure(workspace, rootName) {
  const byName = new Map([...workspace].map(([dir, p]) => [p.name, { dir, ...p }]));
  const seen = new Set();
  const visit = (name) => {
    const pkg = byName.get(name);
    if (!pkg || seen.has(name)) return;
    seen.add(name);
    pkg.deps.forEach(visit);
  };
  visit(rootName);
  return [...seen].map((name) => byName.get(name).dir);
}

const isPackageDoc = (f) => /^packages\/[^/]+\/[^/]+\.md$/.test(f) || /^packages\/[^/]+\/catalog\.json$/.test(f);
const hit = (f, prefixes) => prefixes.some((p) => f.startsWith(p));

export function scope({ event, baseRef, files, workspace }) {
  const full = event !== "pull_request" || baseRef === "main";
  const workflowOnly =
    files.length > 0 && files.every((f) => f.startsWith(".github/workflows/") || /^\.github\/[^/]+\.md$/.test(f));
  const workflows = files.some((f) => f.startsWith(".github/workflows/"));
  const docsDirs = closure(workspace, "@zedtech/zedkit-docs");
  const uiDirs = closure(workspace, "@zedtech/zedkit-ui");
  const relevant = (dirs, prefixes, docsFlag = false) =>
    full ||
    files.some((f) => {
      if (docsFlag && MAINTAINER_DOCS.has(f)) return false;
      return ROOT_CONFIG.has(f) || hit(f, dirs) || hit(f, prefixes) || (docsFlag && isPackageDoc(f));
    });
  return {
    full,
    workflow_only: workflowOnly,
    workflows,
    docs: relevant(docsDirs, DOCS_PREFIXES, true),
    registry: relevant([...uiDirs, "apps/docs/"], REGISTRY_PREFIXES),
    // The ui gallery smoke only needs ui and what it is built from.
    ui: relevant(uiDirs, []),
    // API reports / pack / the remaining package builds. tsconfig.base
    // changes .d.ts emit; a docs-only diff does not.
    packages:
      full || files.some((f) => f.startsWith("packages/") || f === "tsconfig.base.json"),
    // Empty on the full path: turbo runs everything.
    filter: full ? "" : `--filter=...[origin/${baseRef}]`,
  };
}

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : "";
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = readFileSync(0, "utf8").split("\n").filter(Boolean);
  const result = scope({
    event: arg("event"),
    baseRef: arg("base-ref"),
    files,
    workspace: readWorkspace(),
  });
  for (const [key, value] of Object.entries(result)) console.log(`${key}=${value}`);
}
