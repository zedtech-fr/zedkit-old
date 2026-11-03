/**
 * The adoption plan: what a person does, in order, to start using one need.
 *
 * One pure builder feeds the home page, every component page and the clean-project check, so what is shown is
 * what is tested. Nothing is guessed from prose: JavaScript exports, CSS imports, CSS directives and config
 * files come typed from the catalog (`need.adoption`), and the copy-source path comes from the registry graph
 * (`registry.json` plus the files it lists), the same data the shadcn CLI reads.
 *
 * Layout assumed by every path and stated in the steps: a Next.js App Router project with a `src/` folder.
 * The plan holds ids and data only; the words come from components/i18n/adoption-copy.ts.
 *
 * @typedef {"pnpm" | "npm" | "yarn"} PackageManager
 * @typedef {{ kind: "command", commands: Record<PackageManager, string> }} CommandBlock
 * @typedef {{ kind: "file", path: string, lang: "tsx" | "ts" | "css" | "json", code: string, action: "create" | "replace" | "append" | "merge", role?: "main" | "companion" }} FileBlock
 * @typedef {{ kind: "snippet", title?: string, lang: "tsx" | "ts", code: string }} SnippetBlock
 * @typedef {CommandBlock | FileBlock | SnippetBlock} Block
 * @typedef {{ id: string, params?: { brick?: string, files?: number, packages?: string[] }, blocks: Block[] }} Step
 * @typedef {{ id: "package" | "cli" | "manual", group: "package" | "copy", gives: "package-ui" | "package-lib" | "cli" | "manual", requires: ("stack" | "runtime" | "shadcn")[], steps: Step[] }} Mode
 * @typedef {{ need: string, packageName: string, modes: Mode[] }} AdoptionPlan
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { PACKAGE_MANAGERS, addCommand, dlxRunnerFor } from "./package-managers.mjs";

/** The one-line example the home page renders: the Button, labelled Save. */
export const FEATURED_EXAMPLE = { title: "Save button", code: 'import { Button } from "@zedtech/zedkit-ui";\n<Button>Save</Button>' };

export const CSS_PATH = "src/app/globals.css";
export const PAGE_PATH = "src/app/page.tsx";
const UI_DIR = "src/components/ui";
const UI_PACKAGE = "@zedtech/zedkit-ui";
/** Registry items the shadcn CLI provides itself; `init` creates them. */
const SHADCN_BUILTIN = new Set(["utils"]);
const NAMESPACE = "@zedkit/";

/** @param {(pm: PackageManager) => string} text */
function perManager(text) {
  return /** @type {Record<PackageManager, string>} */ (Object.fromEntries(PACKAGE_MANAGERS.map((pm) => [pm, text(pm)])));
}

/** @param {(pm: PackageManager) => string} text @returns {CommandBlock} */
function command(text) {
  return { kind: "command", commands: perManager(text) };
}

// ---------------------------------------------------------------------------------------------------------
// Registry graph

const registryCache = new Map();

/**
 * Reads `registry.json` and the source of every file it lists.
 * @param {string} root repository root
 */
export function loadRegistry(root) {
  const cached = registryCache.get(root);
  if (cached) return cached;
  const raw = JSON.parse(readFileSync(join(root, "registry.json"), "utf8"));
  const items = raw.items.map((/** @type {any} */ item) => ({
    ...item,
    files: (item.files ?? []).map((/** @type {{ path: string }} */ file) => {
      const fileName = file.path.split("/").at(-1);
      return {
        path: file.path,
        fileName,
        name: fileName.replace(/\.(tsx?|css)$/, ""),
        content: readFileSync(join(root, file.path), "utf8"),
      };
    }),
  }));
  const loaded = { items, byName: new Map(items.map((/** @type {any} */ item) => [item.name, item])) };
  registryCache.set(root, loaded);
  return loaded;
}

/**
 * Everything adding bricks brings: their files and their siblings' files (own files first, the first brick
 * leading), the npm packages, the CSS, and whether a sibling lives in the `@zedkit/` namespace the CLI must
 * be told about.
 * @param {ReturnType<typeof loadRegistry>} registry
 * @param {string | string[]} names
 */
export function registryClosure(registry, names) {
  const seen = new Set();
  const files = [];
  const dependencies = [];
  const css = [];
  let namespaced = false;
  /** @param {string} itemName */
  const visit = (itemName) => {
    if (seen.has(itemName)) return;
    seen.add(itemName);
    const item = registry.byName.get(itemName);
    if (!item) {
      if (!SHADCN_BUILTIN.has(itemName)) throw new Error(`registry: "${itemName}" is neither a brick nor built into shadcn`);
      return;
    }
    for (const file of item.files) if (!files.some((known) => known.path === file.path)) files.push({ ...file, brick: item.name });
    for (const dep of item.dependencies ?? []) if (!dependencies.includes(dep)) dependencies.push(dep);
    if (item.cssVars || item.css) css.push({ cssVars: item.cssVars, css: item.css });
    for (const dep of item.registryDependencies ?? []) {
      if (dep.startsWith(NAMESPACE)) namespaced = true;
      visit(dep.startsWith(NAMESPACE) ? dep.slice(NAMESPACE.length) : dep);
    }
  };
  for (const name of typeof names === "string" ? [names] : names) visit(name);
  return { files, dependencies, css, namespaced };
}

/** Plain CSS from a registry item's `cssVars` and `css`, in the order a stylesheet reads: variables, theme, rules. */
export function renderCss({ cssVars = {}, css = {} }) {
  /** @param {Record<string, any>} rules @param {string} pad */
  const block = (rules, pad) =>
    Object.entries(rules)
      .map(([key, value]) =>
        typeof value === "string"
          ? `${pad}${key}: ${value};`
          : `${pad}${key} {\n${block(value, `${pad}  `)}\n${pad}}`,
      )
      .join("\n");
  /** @param {string} selector @param {Record<string, string> | undefined} vars */
  const vars = (selector, vars) =>
    vars && Object.keys(vars).length > 0
      ? `${selector} {\n${Object.entries(vars).map(([k, v]) => `  --${k}: ${v};`).join("\n")}\n}`
      : "";
  return [
    vars(":root", cssVars.light),
    vars(".dark", cssVars.dark),
    vars("@theme inline", cssVars.theme),
    ...Object.entries(css).map(([key, value]) => `${key} {\n${block(value, "  ")}\n}`),
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** The tokens every copied brick sits on: the theme brick plus what the closure adds, written once. */
function tokensCss(registry, closure) {
  const merged = { cssVars: { light: {}, dark: {}, theme: {} }, css: {} };
  const sources = [...(registry.byName.get("theme") ? [registry.byName.get("theme")] : []), ...closure.css];
  for (const source of sources) {
    for (const scheme of ["light", "dark", "theme"]) Object.assign(merged.cssVars[scheme], source.cssVars?.[scheme] ?? {});
    Object.assign(merged.css, source.css ?? {});
  }
  return renderCss(merged);
}

/** Names a registry file exports. */
function exportedNames(content) {
  const names = new Set();
  for (const match of content.matchAll(/^export\s+(?:default\s+)?(?:async\s+)?(?:function|const|class|let|type|interface)\s+(\w+)/gm)) {
    names.add(match[1]);
  }
  for (const match of content.matchAll(/^export\s*(?:type\s*)?\{([^}]*)\}/gm)) {
    for (const part of match[1].split(",")) {
      const name = part.trim().replace(/^type\s+/, "").split(/\s+as\s+/).at(-1)?.trim();
      if (name) names.add(name);
    }
  }
  return names;
}

// ---------------------------------------------------------------------------------------------------------
// Example code

const NAMED_IMPORT = /^import\s+(type\s+)?\{([^}]*)\}\s+from\s+["']([^"']+)["'];?[ \t]*$/gm;
const OTHER_IMPORT = /^import\s+[^\n]*?["']([^"']+)["'];?[ \t]*$/gm;

/**
 * Splits a catalog example into its import statements and the rest. A named import is kept as names so it can
 * be pointed at copied files; any other import (default, namespace, side effect) is kept as written.
 */
function splitExample(code) {
  const imports = [];
  const named = code.replace(NAMED_IMPORT, (_whole, isType, names, from) => {
    imports.push({ isType: Boolean(isType), names: names.split(",").map((n) => n.trim()).filter(Boolean), from });
    return "";
  });
  const body = named.replace(OTHER_IMPORT, (whole, from) => {
    imports.push({ raw: whole.trim(), from });
    return "";
  });
  return { imports, body: body.trim() };
}

function importLine(entry) {
  return entry.raw ?? `import ${entry.isType ? "type " : ""}{ ${entry.names.join(", ")} } from "${entry.from}";`;
}

/** Packages an example imports besides the kit and the framework: they must be installed for it to run. */
function examplePackages(imports) {
  return [
    ...new Set(
      imports
        .map((entry) => entry.from)
        .filter((from) => !from.startsWith("@/") && !from.startsWith(".") && from !== UI_PACKAGE)
        .map(packageOf)
        .filter((name) => !["react", "react-dom", "next"].includes(name)),
    ),
  ];
}

/** Which brick exports each name, across the whole registry (the first brick that lists the file wins). */
function brickOwners(registry) {
  const owners = new Map();
  for (const item of registry.items) {
    for (const file of item.files) for (const name of exportedNames(file.content)) if (!owners.has(name)) owners.set(name, item.name);
  }
  return owners;
}

/** Bricks an example needs beyond its own: the owners of the kit names it imports. Null when a name has no brick. */
function exampleBricks(registry, brick, code) {
  const own = registryClosure(registry, brick);
  const inOwn = new Set(own.files.flatMap((file) => [...exportedNames(file.content)]));
  const owners = brickOwners(registry);
  const bricks = [];
  for (const entry of splitExample(code).imports.filter((item) => item.from === UI_PACKAGE)) {
    for (const name of entry.names) {
      const bare = name.replace(/^type\s+/, "");
      if (inOwn.has(bare)) continue;
      const owner = owners.get(bare);
      if (!owner) return null;
      if (!bricks.includes(owner)) bricks.push(owner);
    }
  }
  return bricks;
}

/** The first catalog example every mode can show: its kit names all exist as bricks when the need can be copied. */
function chooseExample(need, registry) {
  const examples = need.examples.filter((item) => !item.lang).map((item) => ({ code: item.code, title: item.title }));
  if (!need.registry || !registry.byName.has(need.registry)) return examples[0];
  const found = examples.find((item) => exampleBricks(registry, need.registry, item.code) !== null);
  if (!found) {
    throw new Error(`"${need.need}": no example uses only bricks of the registry; add one that does so the copy path has a working example`);
  }
  return found;
}

/** Points the example's kit imports at the copied files: each name goes to the file of the closure that exports it. */
function copyImports(imports, closure, need) {
  const owners = new Map();
  for (const file of [...closure.files].reverse()) for (const name of exportedNames(file.content)) owners.set(name, file.name);
  const kept = imports.filter((entry) => entry.from !== UI_PACKAGE);
  const grouped = new Map();
  for (const entry of imports.filter((item) => item.from === UI_PACKAGE)) {
    for (const name of entry.names) {
      const bare = name.replace(/^type\s+/, "");
      const owner = owners.get(bare);
      if (!owner) throw new Error(`"${need}": the example imports ${bare}, which no file of its copy-source closure exports`);
      const key = `${entry.isType}:${owner}`;
      if (!grouped.has(key)) grouped.set(key, { isType: entry.isType, names: [], from: `@/components/ui/${owner}` });
      grouped.get(key).names.push(name);
    }
  }
  return [...grouped.values(), ...kept];
}

const NEEDS_CLIENT = /\bon[A-Z]\w*=|\buse[A-Z]\w*\(/;

/** A page that renders the example. A fragment of JSX is wrapped in a page; a whole module is shown as it is. */
function exampleBlock({ code, title, path }, imports) {
  const { body, imports: split } = splitExample(code);
  const importLines = (imports ?? split).map(importLine);
  if (path) {
    return { kind: "file", path, lang: "tsx", code: `${[...importLines, importLines.length > 0 ? "" : null, body].filter((line) => line !== null).join("\n")}\n`, action: "replace" };
  }
  if (!body.startsWith("<")) {
    const text = [...importLines, "", body].join("\n").trim();
    return { kind: "snippet", ...(title ? { title } : {}), lang: "tsx", code: `${text}\n` };
  }
  const indented = body.split("\n").map((line) => (line ? `      ${line}` : line)).join("\n");
  const lines = [
    ...(NEEDS_CLIENT.test(body) ? ['"use client";', ""] : []),
    ...importLines,
    ...(importLines.length > 0 ? [""] : []),
    "export default function Page() {",
    "  return (",
    '    <main className="p-8">',
    indented,
    "    </main>",
    "  );",
    "}",
  ];
  return { kind: "file", path: PAGE_PATH, lang: "tsx", code: `${lines.join("\n")}\n`, action: "replace" };
}

// ---------------------------------------------------------------------------------------------------------
// Modes

function packageOf(specifier) {
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

/** Packages the need needs installed: its own first, then peers and any other module its imports name. */
function packagesFor(packageName, adoption, extra = []) {
  const names = [packageName];
  if (adoption.kind === "js") for (const { from } of adoption.modules) names.push(packageOf(from));
  if (adoption.kind === "css") names.push(...adoption.imports.map(packageOf), ...adoption.install);
  return [...new Set([...names, ...extra])];
}

function stylesheet(adoption) {
  const lines = ['@import "tailwindcss";', ...adoption.imports.map((spec) => `@import "${spec}";`), ...adoption.directives.map((rule) => `${rule};`)];
  return `${lines.join("\n")}\n`;
}

/** The `import` a backend or config-free need starts with. Types come last, as `import type`. */
function importSnippet(adoption) {
  return adoption.modules
    .flatMap(({ from, exports }) => {
      const types = exports.filter((name) => name.endsWith("Props"));
      const values = exports.filter((name) => !name.endsWith("Props"));
      return [
        values.length > 0 ? `import { ${values.join(", ")} } from "${from}";` : "",
        types.length > 0 ? `import type { ${types.join(", ")} } from "${from}";` : "",
      ];
    })
    .filter(Boolean)
    .join("\n");
}

/** @returns {Mode} */
function packageMode({ need, packageName, example }) {
  const adoption = need.adoption;
  const isUi = packageName === UI_PACKAGE;
  const extra = examplePackages(splitExample(example.code).imports);
  /** @type {Step[]} */
  const steps = [
    {
      id: "install",
      blocks: [command((pm) => addCommand(pm, packagesFor(packageName, adoption, extra), { dev: adoption.kind === "config" || adoption.kind === "bin" }))],
    },
  ];
  if (isUi) {
    steps.push({
      id: "styles",
      blocks: [
        {
          kind: "file",
          path: CSS_PATH,
          lang: "css",
          code: stylesheet(adoption.kind === "css" ? adoption : { imports: [`${UI_PACKAGE}/styles.css`], directives: [UI_SOURCE] }),
          action: "replace",
        },
      ],
    });
  }
  if (adoption.kind === "config") {
    steps.push({
      id: "extend",
      blocks: [{ kind: "file", path: "tsconfig.json", lang: "json", code: `${JSON.stringify({ extends: adoption.extends }, null, 2)}\n`, action: "merge" }],
    });
  } else if (isUi) {
    steps.push({
      id: "render",
      blocks: [exampleBlock({ ...example, path: need.exampleFile }, null)],
    });
  } else if (adoption.kind === "js") {
    steps.push({ id: "import", blocks: [{ kind: "snippet", lang: "ts", code: `${importSnippet(adoption)}\n` }] });
  }
  return {
    id: "package",
    group: "package",
    gives: isUi ? "package-ui" : "package-lib",
    requires: [isUi ? "stack" : "runtime"],
    steps,
  };
}

const UI_SOURCE = '@source "../../node_modules/@zedtech/zedkit-ui/src/**/*.{ts,tsx}"';

function copySteps({ need, registry, closure, siteUrl, mode, extra }) {
  const brick = need.registry;
  const params = { brick: need.shortName ?? brick };
  const base = siteUrl.replace(/\/$/, "");
  const run = (pm) => dlxRunnerFor(pm);
  /** @type {Step[]} */
  const steps = [
    {
      id: "init",
      blocks: [command((pm) => `${run(pm)} shadcn@latest init -d`)],
    },
  ];
  if (mode === "cli") {
    if (closure.namespaced) {
      steps.push({
        id: "namespace",
        params,
        blocks: [command((pm) => `${run(pm)} shadcn@latest registry add @zedkit=${base}/r/{name}.json`)],
      });
    }
    steps.push(
      {
        id: "theme",
        blocks: [command((pm) => `${run(pm)} shadcn@latest add ${base}/r/theme.json`)],
      },
      {
        id: "add",
        params: { ...params, files: closure.files.length, packages: closure.dependencies },
        blocks: [command((pm) => `${run(pm)} shadcn@latest add ${base}/r/${brick}.json`)],
      },
    );
    const missing = extra.filter((name) => !closure.dependencies.includes(name));
    if (missing.length > 0) {
      steps.push({
        id: "packages",
        params: { packages: missing },
        blocks: [command((pm) => addCommand(pm, missing))],
      });
    }
  } else {
    steps.push({
      id: "dependencies",
      blocks: [command((pm) => addCommand(pm, [...new Set([...closure.dependencies, ...extra])]))],
    });
    steps.push({
      id: "tokens",
      blocks: [{ kind: "file", path: CSS_PATH, lang: "css", code: `${tokensCss(registry, closure)}\n`, action: "append" }],
    });
    steps.push({
      id: "files",
      params: { ...params, files: closure.files.length },
      blocks: closure.files.map((file, index) => ({
        kind: "file",
        path: `${UI_DIR}/${file.fileName}`,
        lang: file.fileName.endsWith(".tsx") ? "tsx" : "ts",
        code: file.content,
        action: "create",
        role: index === 0 ? "main" : "companion",
      })),
    });
  }
  return steps;
}

/** @returns {Mode[]} */
function copyModes({ need, registry, siteUrl, example }) {
  const closure = registryClosure(registry, [need.registry, ...(exampleBricks(registry, need.registry, example.code) ?? [])]);
  const { imports } = splitExample(example.code);
  const extra = examplePackages(imports);
  const copied = copyImports(imports, closure, need.need);
  const render = {
    id: "render",
    blocks: [exampleBlock({ ...example, path: need.exampleFile }, copied)],
  };
  return [
    {
      id: "cli",
      group: "copy",
      gives: "cli",
      requires: ["stack", "shadcn"],
      steps: [...copySteps({ need, registry, closure, siteUrl, mode: "cli", extra }), render],
    },
    {
      id: "manual",
      group: "copy",
      gives: "manual",
      requires: ["stack", "shadcn"],
      steps: [...copySteps({ need, registry, closure, siteUrl, mode: "manual", extra }), render],
    },
  ];
}

/**
 * @param {{ need: any, packageName: string, siteUrl: string, example?: { code: string, title?: string } }} input
 * @param {{ registry: ReturnType<typeof loadRegistry> }} context
 * @returns {AdoptionPlan}
 */
export function buildAdoptionPlan({ need, packageName, siteUrl, example }, { registry }) {
  if (!need.adoption) throw new Error(`"${need.need}" has no typed adoption contract (run pnpm catalog:build)`);
  const chosen = example ?? chooseExample(need, registry);
  /** @type {Mode[]} */
  const modes = [packageMode({ need, packageName, example: chosen })];
  if (need.registry && registry.byName.has(need.registry)) {
    modes.push(...copyModes({ need, registry, siteUrl, example: chosen }));
  }
  return { need: need.need, packageName, modes };
}

/** Every block of a mode, in the order a person meets them. */
export function allBlocks(mode) {
  return mode.steps.flatMap((step) => step.blocks);
}
