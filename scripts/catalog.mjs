// Catalog generator + checker.
//
// - `node scripts/catalog.mjs build [--root DIR]` regenerates
//   docs/catalog/catalog.json from packages/*/CATALOG.md and syncs the
//   discoverability fields (description, keywords, homepage, bugs,
//   repository.directory) from each CATALOG.md into its package.json.
// - `node scripts/catalog.mjs check [--root DIR]` verifies that every
//   public export of each package appears in that package's CATALOG.md,
//   that catalog.json is up to date, that every public package.json
//   matches its CATALOG.md metadata, and that every UI component export
//   has a four-state entry in packages/ui/four-states.json (CI runs this).
//
// CATALOG.md header format (before the first `## <need>`; single source
// for the npm discoverability fields of public packages):
//
//   # Catalog — @zedtech/zedkit-core
//
//   - Keywords: typescript, utilities, result-type, ...
//   - Audience: Who the package is for, in plain words.
//   - Purpose: What it does, in plain words (becomes the npm description).
//   - Attribution: Original work by the same author. (optional, appended
//     to the description; keep the origin note here, never a project path)
//
// CATALOG.md entry format (one `## <need>` section per need; every
// field is a single `- Name: value` line before the example):
//
//   ## Do X without Y
//   - Import: `@zedtech/zedkit-core` — `a`, `b`
//   - Wraps: `some-npm-package` (or `(none)`)
//   - Status: beta (planned|alpha|beta|stable|deprecated; new entries
//     start at alpha — see docs/catalog/README.md for the promotion
//     criteria)
//   - Short name: ShortName (compact display: sidebars, cards)
//   - Audience: Who the need is for, in plain words.
//   - Purpose: The problem it solves, in one sentence.
//   - When to use: When to reach for it.
//   - When not to use: When to avoid it (+ the alternative).
//   - See also: `Other need`, `Another need` (optional; must name
//     real catalog need headings)
//   - Replaced by: `other-symbol` (required when Status is deprecated)
//   - Derived from: `shadcn/ui` (+ optional item, e.g. `shadcn/ui
//     (dialog)`); omit for kit-authored entries (absence means kit)
//   ```ts
//   ...5-line example...
//   ```
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = resolve(HERE, "..");

function usage() {
  return "Usage: node scripts/catalog.mjs build|check [--root DIR]";
}

function parseArgs(argv) {
  const args = argv.slice(2);
  let mode = null;
  let root = DEFAULT_ROOT;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--root") {
      const value = args[i + 1];
      if (!value || value.startsWith("-")) {
        console.error(`${usage()}\nerror: --root needs a directory.`);
        process.exit(2);
      }
      root = resolve(value);
      i++;
    } else if ((args[i] === "build" || args[i] === "check") && !mode) {
      mode = args[i];
    } else {
      console.error(`${usage()}\nerror: unexpected argument "${args[i]}".`);
      process.exit(2);
    }
  }
  if (!mode) {
    console.error(`${usage()}\nerror: missing mode (build|check).`);
    process.exit(2);
  }
  return { mode, root };
}

function packageDirs(root) {
  const dir = join(root, "packages");
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => join(root, "packages", e.name));
}

function readIfExists(path) {
  if (!existsSync(path)) return null;
  // Normalize CRLF so Windows checkouts parse identically.
  return readFileSync(path, "utf8").replace(/\r\n/g, "\n");
}

// Parse `## <need>` sections: Import / Wraps / Status fields + first ts example.
const STATUSES = ["planned", "alpha", "beta", "stable", "deprecated"];

/** Expected live need counts — Option B catalog (107 needs). */
export const CATALOG_MATURITY_TARGETS = { stable: 60, beta: 39, alpha: 8 };

/** Maturity definitions — keep aligned with docs/catalog/README.md#maturity. */
export const MATURITY_DEFINITIONS = {
  planned: "Documented shape, not implemented yet. No code, no tests.",
  alpha:
    "Works, but the API can change in any release. Not covered by the semver guarantee.",
  beta:
    "Tested through the public API, documented, accessible for UI; the API may still change in a minor with a migration note; not covered by the semver guarantee.",
  stable:
    "Tested through the public API, accessible for UI, documented, API frozen under semver. No badge on the docs site.",
  deprecated: "Do not adopt; names a replacement and will be removed in a future major.",
};

function parseCatalog(text, catalogPath, errors) {
  const needs = [];
  const sections = text.split(/^## /m).slice(1);
  for (const section of sections) {
    const [heading, ...rest] = section.split("\n");
    const body = rest.join("\n");
    const need = heading.trim();
    const field = (name) => {
      const match = body.match(new RegExp(`^- ${name}:\\s*(.+)$`, "m"));
      return match ? match[1].trim() : null;
    };
    const derivedFrom = field("Derived from");
    if (derivedFrom !== null && !derivedFrom.startsWith("shadcn/ui")) {
      errors.push(
        `${catalogPath}: need "${need}" has Derived from "${derivedFrom}" (want "shadcn/ui" + optional item; omit the line for kit-authored entries).`,
      );
    }
    const entry = {
      need,
      import: field("Import"),
      wraps: field("Wraps"),
      status: field("Status"),
      shortName: field("Short name"),
      audience: field("Audience"),
      purpose: field("Purpose"),
      whenToUse: field("When to use"),
      whenNotToUse: field("When not to use"),
      derivedFrom,
      example: null,
    };
    const exampleBlocks = [...body.matchAll(/```(ts|css)\n([\s\S]*?)```/g)].map((m) => ({
      lang: m[1],
      code: m[2].trim(),
    }));
    if (exampleBlocks.length > 0) entry.example = exampleBlocks[0].code;
    const exampleTitles = field("Examples");
    const titles = exampleTitles ? exampleTitles.split(/,\s*/).map((t) => t.trim()).filter(Boolean) : [];
    entry.examples = exampleBlocks.map((block, i) => ({
      title: titles[i] ?? (i === 0 ? "Simple" : `Example ${i + 1}`),
      ...(block.lang !== "ts" ? { lang: block.lang } : {}),
      code: block.code,
    }));
    const registry = field("Registry");
    if (registry) entry.registry = registry;
    const a11y = field("A11y");
    if (a11y) entry.a11y = a11y;
    const troubleshooting = field("Troubleshooting");
    if (troubleshooting) entry.troubleshooting = troubleshooting;
    for (const key of ["import", "wraps", "status", "shortName", "audience", "purpose", "whenToUse", "whenNotToUse", "example"]) {
      if (!entry[key]) {
        errors.push(`${catalogPath}: need "${need}" is missing ${key}.`);
      }
    }
    const seeAlso = field("See also");
    if (seeAlso !== null) {
      const targets = [...seeAlso.matchAll(/`([^`]+)`/g)].map((m) => m[1].trim()).filter(Boolean);
      if (targets.length === 0) {
        errors.push(`${catalogPath}: need "${need}" has a See also line with no backticked need headings.`);
      } else {
        entry.seeAlso = targets;
      }
    }
    if (entry.status && !STATUSES.includes(entry.status)) {
      errors.push(`${catalogPath}: need "${need}" has status "${entry.status}" (want ${STATUSES.join("|")}).`);
    }
    const replacedBy = field("Replaced by");
    if (entry.status === "deprecated") {
      if (!replacedBy) {
        errors.push(`${catalogPath}: need "${need}" is deprecated but names no replacement ("- Replaced by: ...").`);
      } else {
        entry.replacedBy = replacedBy;
      }
    }
    needs.push(entry);
  }
  return needs;
}

// Strip // comments, ignoring // inside strings (e.g. "https://...").
function stripLineComments(code) {
  return code
    .split("\n")
    .map((line) => {
      let quote = null;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (quote) {
          if (ch === "\\") i++;
          else if (ch === quote) quote = null;
        } else if (ch === '"' || ch === "'" || ch === "`") {
          quote = ch;
        } else if (ch === "/" && line[i + 1] === "/") {
          return line.slice(0, i);
        }
      }
      return line;
    })
    .join("\n");
}

// Exported symbol names from a barrel file with explicit named exports.
// Exported for reuse (apps/docs/scripts/check.mjs); the CLI runner below
// is import-guarded so importing this module has no side effects.
export function parseBarrelExports(text, indexPath, errors) {
  const code = stripLineComments(text.replace(/\/\*[\s\S]*?\*\//g, ""));
  if (/^\s*export\s*\*/m.test(code)) {
    errors.push(`${indexPath}: \`export *\` is not allowed; list named exports explicitly so the catalog check can verify them.`);
  }
  if (/^\s*export\s+default\b/m.test(code)) {
    errors.push(`${indexPath}: \`export default\` is not allowed in the barrel; use named exports so the catalog check can verify them.`);
  }
  const names = new Set();
  for (const match of code.matchAll(/^\s*export\s*(?:type\s*)?\{([\s\S]*?)\}/gm)) {
    for (let part of match[1].split(",")) {
      part = part.trim().replace(/^type\s+/, "");
      if (!part) continue;
      const alias = part.split(/\s+as\s+/);
      names.add(alias[alias.length - 1].trim());
    }
  }
  for (const match of code.matchAll(/^\s*export\s+(?:async\s+function|function|class|const|type|interface|enum)\s+(\w+)/gm)) {
    names.add(match[1]);
  }
  return [...names];
}

const UI_TYPE_SUFFIX = /(Props|Variants|Tone|Options|Column|Event|Messages|Data)$/;
const UI_STATES = new Set(["loading", "empty", "error", "success"]);
const UI_STATES_PATH = "packages/ui/four-states.json";
const UI_STATES_EXAMPLE = "packages/ui/tests/unit/four-states.fixture.tsx";
const UI_STATE_HOST = { loading: "Spinner", empty: "EmptyState", error: "ErrorState" };

export function isUiComponentExport(name) {
  if (typeof name !== "string" || !/^[A-Z]/.test(name)) return false;
  if (UI_TYPE_SUFFIX.test(name)) return false;
  if (name.includes("_")) return false;
  return true;
}

export function checkUiExportStates({ symbols, manifest, fileExists, readFile }, errors) {
  const example = manifest?.example?.fixture ?? UI_STATES_EXAMPLE;
  const hint = `Example fixture: \`${example}\`. Add the export to ${UI_STATES_PATH} with \`"states": "none"\` or a fixture, vitest, and axe path.`;
  if (!manifest || typeof manifest !== "object") {
    errors.push(`${UI_STATES_PATH}: missing four-state manifest. ${hint}`);
    return;
  }
  const none = new Set(manifest.none ?? []);
  const withStates = manifest.withStates ?? {};
  const listed = new Set([...none, ...Object.keys(withStates)]);
  const components = [...new Set(symbols)].filter(isUiComponentExport);

  for (const name of components) {
    if (!listed.has(name)) {
      errors.push(`${UI_STATES_PATH}: export \`${name}\` has no four-state entry. ${hint}`);
    }
  }
  for (const name of listed) {
    if (!components.includes(name)) {
      errors.push(`${UI_STATES_PATH}: \`${name}\` is not a UI component export (stale entry).`);
    }
  }
  for (const name of none) {
    if (Object.hasOwn(withStates, name)) {
      errors.push(`${UI_STATES_PATH}: \`${name}\` is in both none and withStates.`);
    }
  }
  for (const [name, entry] of Object.entries(withStates)) {
    const states = entry?.states;
    if (!Array.isArray(states) || states.length === 0 || states.some((state) => !UI_STATES.has(state))) {
      errors.push(`${UI_STATES_PATH}: \`${name}\` states must be a non-empty list of loading|empty|error|success.`);
      continue;
    }
    for (const key of ["fixture", "vitest", "axe"]) {
      const path = entry[key];
      if (typeof path !== "string" || path === "") {
        errors.push(`${UI_STATES_PATH}: \`${name}\` is missing ${key}. ${hint}`);
      } else if (fileExists && !fileExists(path)) {
        errors.push(`${UI_STATES_PATH}: \`${name}\` ${key} \`${path}\` does not exist. ${hint}`);
      }
    }
    if (typeof readFile !== "function" || typeof entry.fixture !== "string") continue;
    const fixtureText = readFile(entry.fixture);
    if (typeof fixtureText !== "string") continue;
    for (const state of states) {
      const host = UI_STATE_HOST[state];
      if (host && !fixtureText.includes(host)) {
        errors.push(
          `${UI_STATES_PATH}: \`${name}\` ${state} fixture must use \`${host}\`. ${hint}`,
        );
      }
    }
  }
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Text where a symbol mention counts as catalog coverage: Import lines,
// fenced code blocks, and inline code spans. Prose mentions do not count.
function catalogSearchText(catalogText) {
  const chunks = [];
  for (const match of catalogText.matchAll(/^-\s*Import:\s*(.+)$/gm)) {
    chunks.push(match[1]);
  }
  for (const match of catalogText.matchAll(/```[\s\S]*?```/g)) {
    chunks.push(match[0]);
  }
  for (const match of catalogText.matchAll(/`([^`]+)`/g)) {
    chunks.push(match[1]);
  }
  return chunks.join("\n");
}

// Discoverability metadata from the CATALOG.md header (before `## `).
function parsePackageMeta(catalogText) {
  const header = catalogText.split(/^## /m)[0];
  const field = (name) => {
    const match = header.match(new RegExp(`^- ${name}:\\s*(.+)$`, "m"));
    return match ? match[1].trim() : null;
  };
  const keywords = field("Keywords");
  return {
    keywords: keywords ? keywords.split(",").map((k) => k.trim()).filter(Boolean) : null,
    audience: field("Audience"),
    purpose: field("Purpose"),
    attribution: field("Attribution"),
  };
}

const REPO_URL = "https://github.com/zedtech-fr/zedkit";

// Expected npm discoverability fields, derived from the catalog header.
function expectedManifestFields(pkg) {
  const directory = `packages/${basename(pkg.dir)}`;
  const description = pkg.meta.attribution
    ? `${pkg.meta.purpose} ${pkg.meta.attribution}`
    : pkg.meta.purpose;
  return {
    description,
    keywords: pkg.meta.keywords,
    homepage: `${REPO_URL}/tree/main/${directory}`,
    bugs: { url: `${REPO_URL}/issues` },
    repositoryDirectory: directory,
  };
}

function collectPackages(root, errors) {
  const collected = [];
  for (const dir of packageDirs(root)) {
    const manifestPath = join(dir, "package.json");
    const manifestText = readIfExists(manifestPath);
    if (!manifestText) continue;
    const manifest = JSON.parse(manifestText);
    const catalogPath = join(dir, "CATALOG.md");
    const catalogText = readIfExists(catalogPath);
    const indexText = readIfExists(join(dir, "src", "index.ts"));
    const subpaths = Object.keys(manifest.exports ?? { ".": "" })
      // Non-code entries need no catalog line.
      .filter((key) => key !== "./package.json")
      .map((key) => (key === "." ? manifest.name : `${manifest.name}${key.slice(1)}`));
    collected.push({
      name: manifest.name,
      dir,
      manifest,
      manifestPath,
      isPrivate: manifest.private === true,
      catalogPath,
      catalogText,
      meta: catalogText ? parsePackageMeta(catalogText) : null,
      needs: catalogText ? parseCatalog(catalogText, catalogPath, errors) : [],
      symbols: indexText ? parseBarrelExports(indexText, join(dir, "src", "index.ts"), errors) : [],
      subpaths,
      hasCode: indexText !== null,
    });
  }
  return collected;
}

function renderCatalogJson(packages) {
  const out = {
    _generated: "Do not edit. Generated from packages/*/CATALOG.md by `pnpm catalog:build`.",
    packages: {},
  };
  for (const pkg of [...packages].sort((a, b) => a.name.localeCompare(b.name))) {
    out.packages[pkg.name] = {
      catalog: `packages/${basename(pkg.dir)}/CATALOG.md`,
      keywords: pkg.meta?.keywords ?? [],
      audience: pkg.meta?.audience ?? null,
      needs: pkg.needs,
    };
  }
  return `${JSON.stringify(out, null, 2)}\n`;
}

// Package maturity = the least mature of its needs (deprecated needs do
// not count unless every need is deprecated). Statuses sort by the
// STATUSES order: planned < alpha < beta < stable.
function packageMaturity(pkg) {
  const rank = Object.fromEntries(STATUSES.map((s, i) => [s, i]));
  const live = pkg.needs.filter((n) => n.status !== "deprecated");
  const pool = live.length > 0 ? live : pkg.needs;
  let worst = "stable";
  for (const need of pool) {
    if ((rank[need.status] ?? 0) < (rank[worst] ?? 0)) worst = need.status;
  }
  return pool.length > 0 ? worst : "planned";
}

export function countCatalogStatuses(packages) {
  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  for (const pkg of packages) {
    for (const need of pkg.needs) {
      if (need.status in counts) counts[need.status] += 1;
    }
  }
  return counts;
}

const PACKAGES_TABLE_OPEN = "<!-- packages-table: generated by `pnpm catalog:build` — do not edit -->";
const PACKAGES_TABLE_CLOSE = "<!-- /packages-table -->";

function renderPackagesTable(packages) {
  const rows = [...packages]
    .filter((pkg) => !pkg.isPrivate)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((pkg) => {
      const dir = `packages/${basename(pkg.dir)}`;
      const npm = `https://www.npmjs.com/package/${pkg.name}`;
      return `| [\`${pkg.name}\`](${dir}/README.md) ([npm](${npm})) | ${pkg.manifest.version} | ${packageMaturity(pkg)} |`;
    });
  return [
    PACKAGES_TABLE_OPEN,
    "",
    "| Package | Version | Maturity |",
    "|---|---|---|",
    ...rows,
    "",
    PACKAGES_TABLE_CLOSE,
  ].join("\n");
}

function syncReadmeTable(root, packages, errors) {
  const readmePath = join(root, "README.md");
  const readme = readIfExists(readmePath);
  if (!readme) {
    errors.push("README.md not found; cannot sync the packages table.");
    return false;
  }
  const table = renderPackagesTable(packages);
  const pattern = new RegExp(
    `${escapeRegExp(PACKAGES_TABLE_OPEN)}[\\s\\S]*?${escapeRegExp(PACKAGES_TABLE_CLOSE)}`,
  );
  if (!pattern.test(readme)) {
    errors.push(`README.md has no ${PACKAGES_TABLE_OPEN} … ${PACKAGES_TABLE_CLOSE} block.`);
    return false;
  }
  const next = readme.replace(pattern, table);
  if (next === readme) return false;
  writeFileSync(readmePath, next);
  return true;
}

function checkManifestFields(pkg, errors) {
  if (pkg.isPrivate || !pkg.meta) return;
  for (const key of ["keywords", "audience", "purpose"]) {
    if (!pkg.meta[key] || pkg.meta[key].length === 0) {
      errors.push(`${pkg.catalogPath}: package header is missing "${key}" (single source for the npm discoverability fields).`);
      return;
    }
  }
  const expected = expectedManifestFields(pkg);
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const mismatch = (field, actual) =>
    `${pkg.manifestPath}: ${field} does not match ${pkg.catalogPath}. Run \`pnpm catalog:build\` and commit the result. (actual: ${JSON.stringify(actual)})`;
  if (!same(pkg.manifest.description, expected.description)) errors.push(mismatch("description", pkg.manifest.description));
  if (!same(pkg.manifest.keywords, expected.keywords)) errors.push(mismatch("keywords", pkg.manifest.keywords));
  if (!same(pkg.manifest.homepage, expected.homepage)) errors.push(mismatch("homepage", pkg.manifest.homepage));
  if (!same(pkg.manifest.bugs, expected.bugs)) errors.push(mismatch("bugs", pkg.manifest.bugs));
  if (!same(pkg.manifest.repository?.directory, expected.repositoryDirectory)) {
    errors.push(mismatch("repository.directory", pkg.manifest.repository?.directory));
  }
}

// Write the discoverability fields into package.json, keeping every other
// key (and their relative order) untouched. New keys land in the
// conventional slot: after publishConfig/description, before license.
function syncManifestFields(pkg) {
  if (pkg.isPrivate || !pkg.meta?.keywords || !pkg.meta.audience || !pkg.meta.purpose) return false;
  const expected = expectedManifestFields(pkg);
  const ordered = {};
  let inserted = false;
  for (const [key, value] of Object.entries(pkg.manifest)) {
    if (key === "description" || key === "keywords" || key === "homepage" || key === "bugs") continue;
    if (!inserted && key !== "name" && key !== "version" && key !== "publishConfig") {
      ordered.description = expected.description;
      ordered.keywords = expected.keywords;
      ordered.homepage = expected.homepage;
      ordered.bugs = expected.bugs;
      inserted = true;
    }
    ordered[key] = value;
  }
  if (!inserted) {
    ordered.description = expected.description;
    ordered.keywords = expected.keywords;
    ordered.homepage = expected.homepage;
    ordered.bugs = expected.bugs;
  }
  const repo = ordered.repository;
  const repoObject = typeof repo === "string" ? { type: "git", url: repo } : (repo ?? {});
  ordered.repository = { ...repoObject, directory: expected.repositoryDirectory };
  const next = `${JSON.stringify(ordered, null, 2)}\n`;
  if (next === `${JSON.stringify(pkg.manifest, null, 2)}\n`) return false;
  // Preserve the original trailing-newline style (all manifests end with \n).
  writeFileSync(pkg.manifestPath, next);
  return true;
}

function check(packages, root, errors) {
  const statusCounts = countCatalogStatuses(packages);
  for (const [status, target] of Object.entries(CATALOG_MATURITY_TARGETS)) {
    if (statusCounts[status] !== target) {
      errors.push(
        `catalog maturity: ${status} count is ${statusCounts[status]} (want ${target} per docs/catalog/README.md).`,
      );
    }
  }
  const headings = new Set();
  const owners = new Map();
  for (const pkg of packages) {
    for (const need of pkg.needs) {
      headings.add(need.need);
      if (owners.has(need.need)) {
        errors.push(
          `${pkg.catalogPath}: need "${need.need}" is also defined in ${owners.get(need.need)} (need headings must be unique across the catalog: docs "See also" links resolve by heading).`,
        );
      } else {
        owners.set(need.need, pkg.catalogPath);
      }
    }
  }
  for (const pkg of packages) {
    if (pkg.hasCode && !pkg.catalogText) {
      errors.push(`${pkg.name}: has src/index.ts but no CATALOG.md.`);
      continue;
    }
    if (!pkg.catalogText) continue;
    checkManifestFields(pkg, errors);
    const searchText = catalogSearchText(pkg.catalogText);
    for (const symbol of pkg.symbols) {
      if (!new RegExp(`\\b${escapeRegExp(symbol)}\\b`).test(searchText)) {
        errors.push(`${pkg.catalogPath}: export \`${symbol}\` is not mentioned in an Import line, example, or code span (every public export must appear in its package CATALOG.md).`);
      }
    }
    for (const subpath of pkg.subpaths) {
      if (!pkg.catalogText.includes(subpath)) {
        errors.push(`${pkg.catalogPath}: import path \`${subpath}\` is not mentioned.`);
      }
    }
    for (const need of pkg.needs) {
      for (const target of need.seeAlso ?? []) {
        if (target === need.need) {
          errors.push(`${pkg.catalogPath}: need "${need.need}" links to itself in See also.`);
        } else if (!headings.has(target)) {
          errors.push(`${pkg.catalogPath}: need "${need.need}" links unknown need "${target}" in See also.`);
        }
      }
    }
    if (pkg.name === "@zedtech/zedkit-ui") {
      const statesPath = join(root, UI_STATES_PATH);
      const raw = readIfExists(statesPath);
      if (!raw) {
        errors.push(`${UI_STATES_PATH}: missing four-state manifest. Example fixture: \`${UI_STATES_EXAMPLE}\`.`);
      } else {
        checkUiExportStates(
          {
            symbols: pkg.symbols,
            manifest: JSON.parse(raw),
            fileExists: (path) => existsSync(join(root, path)),
            readFile: (path) => readIfExists(join(root, path)),
          },
          errors,
        );
      }
    }
  }
  const jsonPath = join(root, "docs", "catalog", "catalog.json");
  const current = readIfExists(jsonPath);
  const rendered = renderCatalogJson(packages);
  if (current !== rendered) {
    errors.push(`${jsonPath} is out of date. Run \`pnpm catalog:build\` and commit the result.`);
  }
  // The README packages table must match the catalog (versions, maturity).
  const readmeText = readIfExists(join(root, "README.md"));
  if (readmeText) {
    const table = renderPackagesTable(packages);
    if (!readmeText.includes(table)) {
      errors.push(`README.md packages table contradicts the catalog. Run \`pnpm catalog:build\` and commit the result.`);
    }
  }
  // The consumer snippet in README.md must match the use-zedkit core rule.
  const skill = readIfExists(join(root, ".agents", "skills", "use-zedkit", "SKILL.md"));
  const readme = readIfExists(join(root, "README.md"));
  if (skill && readme) {
    const quoted = skill.match(/(?:^> .+\n?)+/m);
    const fenced = readme.match(/<!-- use-zedkit-snippet:[^>]*-->\s*```md\n([\s\S]*?)```/);
    const normalize = (s) => s.replace(/^> /gm, "").trim();
    if (!quoted || !fenced || normalize(quoted[0]) !== normalize(fenced[1])) {
      errors.push("README consumer snippet drifted from .agents/skills/use-zedkit/SKILL.md core rule; keep them in sync.");
    }
  }
}

const invoked = process.argv[1] ? resolve(process.argv[1]) : null;
if (invoked === fileURLToPath(import.meta.url)) {
  const { mode, root } = parseArgs(process.argv);
  const errors = [];
  const packages = collectPackages(root, errors);
  if (mode === "build") {
    if (errors.length > 0) {
      console.error(errors.join("\n"));
      process.exitCode = 1;
    } else {
      const jsonPath = join(root, "docs", "catalog", "catalog.json");
      mkdirSync(dirname(jsonPath), { recursive: true });
      writeFileSync(jsonPath, renderCatalogJson(packages));
      let synced = 0;
      for (const pkg of packages) {
        if (syncManifestFields(pkg)) synced++;
      }
      const buildErrors = [];
      const readmeSynced = syncReadmeTable(root, packages, buildErrors);
      if (buildErrors.length > 0) {
        console.error(buildErrors.join("\n"));
        process.exitCode = 1;
      }
      console.log(`catalog: wrote ${jsonPath} (${packages.length} packages, ${synced} manifests synced, README table ${readmeSynced ? "updated" : "unchanged"}).`);
    }
  }
  if (mode === "check") {
    check(packages, root, errors);
    if (errors.length > 0) {
      console.error(errors.join("\n"));
      process.exitCode = 1;
    } else {
      console.log(`catalog: ok (${packages.length} packages).`);
    }
  }
}
