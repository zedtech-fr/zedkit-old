// Docs coverage check: fails CI when a catalog need has no doc
// page or a manifest reference goes stale. Runs the generator to a temp
// dir (never touching the build output) and asserts:
//   1. every catalog need maps to exactly one generated page;
//   2. every manifest key matches a catalog need heading exactly;
//   3. every manifest component/props exists in @zedtech/zedkit-ui exports
//      (CSS-only needs: component null + a .css source, no props);
//   4. every manifest demo exists in components/demos/registry.ts and its
//      demo file exports the demo;
//   5. pages and views stay thin: app/** and ui/** import no demo file
//      directly (registry only) and use no namespace imports;
//   6. demos and frame use kit layout modules only (no raw <div>/<span>);
//   7. every page carries install tabs + a titled TSX example +
//      the At-a-glance guidance block (Who/What/Use when/Avoid when),
//      plus the catalog Accessibility section when the need carries one;
//   8. the home gallery covers every UI need exactly once, with the
//      manifest demo (or null);
//   9. the gallery stats match the catalog counts;
//  10. home scenarios resolve to catalog needs and current doc slugs;
//  11. prose files match live pages, avoid generated section titles,
//      and their first section appears in the merged output.
//
// Barrel parsing reuses scripts/catalog.mjs (import-safe).
// Usage: `node scripts/check.mjs`.
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
// Shares parseBarrelExports with root scripts/catalog.mjs. A `#*`
// subpath cannot point outside the package (Node rejects it with
// ERR_INVALID_PACKAGE_TARGET), so the documented alternative is
// impossible here and the relative import stays.
// eslint-disable-next-line no-restricted-imports -- see above
import { parseBarrelExports } from "../../../scripts/catalog.mjs";
// eslint-disable-next-line no-restricted-imports -- repo-root registry.json
import { loadRegistryBrickNames } from "../../../scripts/registry/catalog.mjs";
import { SEO_DESCRIPTION_MAX } from "@zedtech/zedkit-seo";
import {
  catalogPageKeys,
  expandGuideSnippets,
  GENERATED_DOC_SECTIONS,
  GUIDE_NAV_SLUGS,
  generate,
} from "./generate.mjs";
import { countPublishedCatalogNeeds, docsOmitNeed } from "./docs-omitted-needs.mjs";
import { checkGeneratedPage } from "./page-checks.mjs";
import {
  SITE_CHANGELOG_URL,
  SITE_HEADER_INTERNAL_PATHS,
  siteFooterLinkSpecs,
} from "../lib/site-links.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, "..");
const ROOT = join(APP, "..", "..");

const errors = [];
const catalogPath = join(ROOT, "docs", "catalog", "catalog.json");
if (!existsSync(catalogPath)) {
  console.error(`error: ${catalogPath} missing (run pnpm catalog:build at the root).`);
  process.exit(1);
}
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const manifest = JSON.parse(readFileSync(join(APP, "docs-manifest.json"), "utf8"));
const rich = manifest.rich ?? {};
const registryBricks = new Set(loadRegistryBrickNames(ROOT));

const tmp = mkdtempSync(join(tmpdir(), "docs-check-"));
const {
  pages,
  prosePages,
  guidePages,
  gallery,
  stats,
  uiPackage,
  homeScenarios,
  homeEntryPoints,
  catalogIndex,
  homeCuratedGallery,
  maturityModule,
} = generate(tmp);
const livePageKeys = catalogPageKeys(catalog);

function mdxFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...mdxFiles(path));
    else if (entry.name.endsWith(".mdx") && entry.name !== "index.mdx") out.push(path);
  }
  return out;
}

const descriptionsSeen = new Map();
const a11yByTitle = new Map();
for (const entry of Object.values(catalog.packages)) {
  for (const need of entry.needs) {
    if (need.a11y) a11yByTitle.set(need.need, need.a11y);
  }
}

// Every need page carries install tabs (memorized package-manager
// choice) and a titled TSX example — never bare pill blocks.
for (const file of mdxFiles(tmp)) {
  const rel = file.slice(tmp.length + 1);
  const text = readFileSync(file, "utf8");
  checkGeneratedPage(rel, text, { seoMax: SEO_DESCRIPTION_MAX, descriptionsSeen, a11yByTitle }, errors);
}

function proseSectionTitles(text) {
  const titles = [];
  for (const line of text.split("\n")) {
    const match = /^## (.+)$/.exec(line);
    if (match) titles.push(match[1]);
  }
  return titles;
}

function proseMdxFiles() {
  const root = join(APP, "prose");
  if (!existsSync(root)) return [];
  const out = [];
  for (const folderEntry of readdirSync(root, { withFileTypes: true })) {
    if (!folderEntry.isDirectory() || folderEntry.name === "guides") continue;
    const folderDir = join(root, folderEntry.name);
    for (const fileEntry of readdirSync(folderDir, { withFileTypes: true })) {
      if (fileEntry.isFile() && fileEntry.name.endsWith(".mdx")) {
        out.push({
          rel: `${folderEntry.name}/${fileEntry.name}`,
          key: `${folderEntry.name}/${fileEntry.name.replace(/\.mdx$/, "")}`,
          path: join(folderDir, fileEntry.name),
        });
      }
    }
  }
  return out;
}

for (const prose of proseMdxFiles()) {
  if (!livePageKeys.has(prose.key)) {
    errors.push(`prose: ${prose.rel} has no catalog page at /docs/${prose.key}.`);
    continue;
  }
  const source = readFileSync(prose.path, "utf8");
  const titles = proseSectionTitles(source);
  if (titles.length === 0) {
    errors.push(`prose: ${prose.rel} must define at least one "## " section.`);
    continue;
  }
  for (const title of titles) {
    if (GENERATED_DOC_SECTIONS.has(title)) {
      errors.push(`prose: ${prose.rel} redefines generated section "## ${title}".`);
    }
  }
  const mergedPath = join(tmp, `${prose.key}.mdx`);
  if (!existsSync(mergedPath)) {
    errors.push(`prose: merged page missing for ${prose.key} (generator bug).`);
    continue;
  }
  const merged = readFileSync(mergedPath, "utf8");
  if (!merged.includes(`## ${titles[0]}`)) {
    errors.push(`prose: ${prose.rel} first section "## ${titles[0]}" missing from merged page.`);
  }
}

const guidesDir = join(APP, "prose", "guides");
const snippetsDir = join(guidesDir, "snippets");
const guideRequiredSections = {
  "getting-started.mdx": [
    "Who this is for",
    "When to use zedkit",
    "Choose a package",
    "Prerequisites",
    "Quickstart",
    "Scenario",
    "Troubleshooting",
    "Next steps",
  ],
  "index.mdx": ["Start here", "Four areas", "Catalog reference"],
  "start-without-writing-code.mdx": ["Who this is for", "The three steps", "What zedkit is not", "Next steps"],
  "add-seo-to-nextjs.mdx": [
    "Who this is for",
    "Prerequisites",
    "Wire the site",
    "Verify",
    "Troubleshooting",
    "Next steps",
  ],
  "build-an-admin-dashboard.mdx": [
    "Who this is for",
    "Prerequisites",
    "Steps",
    "Final result",
    "Troubleshooting",
    "Next steps",
  ],
  "maturity-and-compatibility.mdx": ["Next steps"],
};
for (const [file, sections] of Object.entries(guideRequiredSections)) {
  const sourcePath = join(guidesDir, file);
  if (!existsSync(sourcePath)) {
    errors.push(`guides: missing ${file}.`);
    continue;
  }
  const expanded = expandGuideSnippets(readFileSync(sourcePath, "utf8"));
  for (const section of sections) {
    if (!expanded.includes(`## ${section}`)) {
      errors.push(`guides: ${file} must include "## ${section}".`);
    }
  }
}
if (existsSync(snippetsDir)) {
  const snippetRefs = new Set();
  for (const entry of readdirSync(guidesDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".mdx")) continue;
    const raw = readFileSync(join(guidesDir, entry.name), "utf8");
    for (const match of raw.matchAll(/\{\{snippet:([a-zA-Z0-9._-]+)\}\}/g)) snippetRefs.add(match[1]);
  }
  for (const entry of readdirSync(snippetsDir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (!snippetRefs.has(entry.name)) {
      errors.push(`guides/snippets/${entry.name} is not referenced from guide MDX (use {{snippet:${entry.name}}}).`);
    }
  }
  for (const id of snippetRefs) {
    if (!existsSync(join(snippetsDir, id))) errors.push(`guides: snippet "${id}" has no file under prose/guides/snippets/.`);
  }
}
if (guidePages < 2) errors.push(`guides: expected at least getting-started.mdx and index.mdx (got ${guidePages}).`);
for (const slug of GUIDE_NAV_SLUGS) {
  if (!existsSync(join(tmp, `${slug}.mdx`))) errors.push(`guides: generated /docs/${slug} missing.`);
}
const indexGuidePath = join(guidesDir, "index.mdx");
if (existsSync(indexGuidePath)) {
  const indexText = expandGuideSnippets(readFileSync(indexGuidePath, "utf8"));
  for (const heading of [
    "### UI (`@zedtech/zedkit-ui`)",
    "### Core & server (`core`, `server`, `nest`)",
  ]) {
    if (!indexText.includes(heading)) {
      errors.push(`guides: index.mdx must include "${heading}".`);
    }
  }
  if (/### Admin UI|### Backend \(`core`/.test(indexText)) {
    errors.push("guides: index.mdx uses deprecated Admin UI / Backend area headings.");
  }
}
for (const path of SITE_HEADER_INTERNAL_PATHS) {
  if (!path.startsWith("/docs")) {
    // App routes (catalog, examples), unlike the generated /docs pages below.
    const appPage = join(APP, "app", "(site)", ...path.split("/").filter(Boolean), "page.tsx");
    if (!existsSync(appPage)) {
      errors.push(`site-nav: internal header path ${path} has no app page (${appPage}).`);
    }
    continue;
  }
  const rel = path === "/docs" ? "index.mdx" : `${path.replace(/^\/docs\//, "")}.mdx`;
  if (!existsSync(join(tmp, rel))) {
    errors.push(`site-nav: internal header path ${path} has no generated page (${rel}).`);
  }
}

const llmsPath = join(APP, "public", "llms.txt");
if (existsSync(llmsPath)) {
  const llmsText = readFileSync(llmsPath, "utf8");
  if (!llmsText.includes("## Install or copy")) {
    errors.push("llms.txt: missing ## Install or copy section.");
  }
  const llmsStatusTail = /\) — (alpha|beta|stable|deprecated|planned)$/;
  for (const line of llmsText.split("\n")) {
    if (line.startsWith("- [") && llmsStatusTail.test(line)) {
      errors.push(`llms.txt: legacy status-only entry: ${line.slice(0, 80)}…`);
    }
  }
}
const llmsFullPath = join(APP, "public", "llms-full.txt");
if (!existsSync(llmsFullPath)) {
  errors.push("public/llms-full.txt missing (run docs:generate).");
} else {
  const fullText = readFileSync(llmsFullPath, "utf8");
  if (!fullText.startsWith("# Install or copy")) {
    errors.push("llms-full.txt: expected buildLlmsFull header # Install or copy");
  }
}

rmSync(tmp, { recursive: true, force: true });

const needs = [];
for (const [pkg, entry] of Object.entries(catalog.packages)) {
  for (const need of entry.needs) {
    if (!docsOmitNeed(need.need)) needs.push({ pkg, need: need.need });
  }
}
if (pages !== needs.length) {
  errors.push(`generator emitted ${pages} pages for ${needs.length} published catalog needs.`);
}

// generate() throws when no "ui" package exists, so uiPackage is set here.
const uiNeeds = catalog.packages[uiPackage].needs.filter((need) => !docsOmitNeed(need.need));
if (gallery.length !== uiNeeds.length) {
  errors.push(`gallery holds ${gallery.length} cards for ${uiNeeds.length} published UI needs.`);
}
const byNeed = new Map(gallery.map((card) => [card.need, card]));
for (const need of uiNeeds) {
  const card = byNeed.get(need.need);
  if (!card) {
    errors.push(`gallery: missing card for "${need.need}".`);
    continue;
  }
  const wantDemo = rich[need.need]?.demo ?? null;
  if (card.demo !== wantDemo) {
    errors.push(`gallery: "${need.need}" demo is ${JSON.stringify(card.demo)}, manifest says ${JSON.stringify(wantDemo)}.`);
  }
}
const totalNeeds = Object.values(catalog.packages).reduce((n, entry) => n + entry.needs.length, 0);
if (stats.packages !== Object.keys(catalog.packages).length || stats.needs !== totalNeeds) {
  errors.push(`gallery: stale stats ${JSON.stringify(stats)}.`);
}
const uiPkgJson = JSON.parse(
  readFileSync(join(ROOT, "packages", "ui", "package.json"), "utf8"),
);
const galleryFile = existsSync(join(APP, "content", "gallery.ts"))
  ? readFileSync(join(APP, "content", "gallery.ts"), "utf8")
  : "";
if (galleryFile && !galleryFile.includes(`featuredPackageVersion: string = ${JSON.stringify(uiPkgJson.version)}`)) {
  errors.push("content/gallery.ts: featuredPackageVersion does not match packages/ui/package.json.");
}
const homeInstallSnippet = join(APP, "home-quickstart", "snippets", "install.sh");
if (galleryFile && existsSync(homeInstallSnippet)) {
  const featuredMatch = /featuredPackage: string = (.+);\n/.exec(galleryFile);
  const featuredPackage = featuredMatch ? JSON.parse(featuredMatch[1]) : null;
  const install = readFileSync(homeInstallSnippet, "utf8").trim();
  if (featuredPackage && install !== `pnpm add ${featuredPackage}`) {
    errors.push(`home-quickstart/snippets/install.sh must be exactly: pnpm add ${featuredPackage}`);
  }
}
const registrySitePath = join(APP, "content", "registry-site.ts");
if (existsSync(registrySitePath)) {
  const registrySite = readFileSync(registrySitePath, "utf8");
  const featuredBrick = /featuredRegistryBrick: string = "([^"]+)"/.exec(registrySite)?.[1];
  const publicSiteUrl = "https://zedkit.app";
  if (featuredBrick) {
    const expectedRegistryAdd = `npx shadcn@latest add ${publicSiteUrl}/r/${featuredBrick}.json`;
    const expectedRegistryNamespace = `npx shadcn@latest registry add @zedkit=${publicSiteUrl}/r/{name}.json`;
    const registrySnippetPaths = [
      join(APP, "home-quickstart", "snippets", "registry-add.sh"),
      join(APP, "prose", "guides", "snippets", "registry-add.sh"),
    ];
    const namespaceSnippetPaths = [
      join(APP, "home-quickstart", "snippets", "registry-namespace.sh"),
      join(APP, "prose", "guides", "snippets", "registry-namespace.sh"),
    ];
    for (const path of registrySnippetPaths) {
      if (!existsSync(path)) {
        errors.push(`${path} missing.`);
      } else if (readFileSync(path, "utf8").trim() !== expectedRegistryAdd) {
        errors.push(`${path} must be exactly: ${expectedRegistryAdd}`);
      }
    }
    for (const path of namespaceSnippetPaths) {
      if (!existsSync(path)) {
        errors.push(`${path} missing.`);
      } else if (readFileSync(path, "utf8").trim() !== expectedRegistryNamespace) {
        errors.push(`${path} must be exactly: ${expectedRegistryNamespace}`);
      }
    }
  }
}
for (const name of ["npm-globals.css", "npm-page.tsx", "registry-page.tsx", "registry-theme-add.sh"]) {
  const path = join(APP, "home-quickstart", "snippets", name);
  if (!existsSync(path)) errors.push(`home-quickstart/snippets/${name} missing.`);
}
const proseSnippetDir = join(APP, "prose", "guides", "snippets");
for (const name of ["npm-globals.css", "npm-page.tsx", "registry-page.tsx", "registry-theme-add.sh", "ui-add.sh"]) {
  const homePath = join(APP, "home-quickstart", "snippets", name === "ui-add.sh" ? "install.sh" : name);
  const prosePath = join(proseSnippetDir, name);
  if (!existsSync(homePath) || !existsSync(prosePath)) continue;
  const homeText = readFileSync(homePath, "utf8").trim();
  const proseText = readFileSync(prosePath, "utf8").trim();
  if (name === "ui-add.sh") {
    if (homeText !== proseText) {
      errors.push("prose/guides/snippets/ui-add.sh must match home-quickstart/snippets/install.sh");
    }
  } else if (homeText !== proseText) {
    errors.push(`home-quickstart/snippets/${name} must match prose/guides/snippets/${name}`);
  }
}
const npmPage = existsSync(join(APP, "home-quickstart", "snippets", "npm-page.tsx"))
  ? readFileSync(join(APP, "home-quickstart", "snippets", "npm-page.tsx"), "utf8")
  : "";
const registryPage = existsSync(join(APP, "home-quickstart", "snippets", "registry-page.tsx"))
  ? readFileSync(join(APP, "home-quickstart", "snippets", "registry-page.tsx"), "utf8")
  : "";
if (npmPage && !npmPage.includes('@zedtech/zedkit-ui"')) {
  errors.push("npm-page.tsx must import Button from @zedtech/zedkit-ui");
}
if (registryPage && !registryPage.includes('@/components/ui/button"')) {
  errors.push("registry-page.tsx must import Button from @/components/ui/button");
}
if (registryPage && registryPage.includes("@zedtech/zedkit-ui")) {
  errors.push("registry-page.tsx must not depend on @zedtech/zedkit-ui");
}

if (catalogIndex.length !== countPublishedCatalogNeeds(catalog)) {
  errors.push(
    `catalog index holds ${catalogIndex.length} entries for ${countPublishedCatalogNeeds(catalog)} published catalog needs.`,
  );
}
if (homeCuratedGallery.length < 4 || homeCuratedGallery.length > 8) {
  errors.push(`home-curated.json: expected 4–8 UI previews, got ${homeCuratedGallery.length}.`);
}
for (const card of homeCuratedGallery) {
  if (!byNeed.has(card.need)) {
    errors.push(`home-curated: "${card.need}" is not in the UI gallery.`);
  }
}

const scenariosPath = join(APP, "content", "home-scenarios.ts");
if (!existsSync(scenariosPath)) {
  errors.push("content/home-scenarios.ts missing (run pnpm docs:generate).");
} else {
  const onDisk = readFileSync(scenariosPath, "utf8");
  const expected = JSON.stringify(homeScenarios, null, 2);
  if (!onDisk.includes(expected)) {
    errors.push("content/home-scenarios.ts is stale (run pnpm docs:generate).");
  }
}

const entryPointsPath = join(APP, "content", "home-entry-points.ts");
if (!existsSync(entryPointsPath)) {
  errors.push("content/home-entry-points.ts missing (run pnpm docs:generate).");
} else {
  const onDisk = readFileSync(entryPointsPath, "utf8");
  const expected = JSON.stringify(homeEntryPoints, null, 2);
  if (!onDisk.includes(expected)) {
    errors.push("content/home-entry-points.ts is stale (run pnpm docs:generate).");
  }
}

const maturityPath = join(APP, "content", "maturity-compatibility.ts");
if (!existsSync(maturityPath)) {
  errors.push("content/maturity-compatibility.ts missing (run pnpm docs:generate).");
} else if (readFileSync(maturityPath, "utf8") !== maturityModule) {
  errors.push("content/maturity-compatibility.ts is stale (run pnpm docs:generate).");
}

const headings = new Set(
  Object.values(catalog.packages).flatMap((entry) => entry.needs.map((need) => need.need)),
);
for (const key of Object.keys(rich)) {
  if (!headings.has(key)) errors.push(`docs-manifest.json: "${key}" matches no catalog need heading.`);
}

function barrelExports(indexPath) {
  return new Set(parseBarrelExports(readFileSync(indexPath, "utf8"), indexPath, errors));
}

const uiExports = barrelExports(join(ROOT, "packages", "ui", "src", "index.ts"));
const registryText = readFileSync(join(APP, "components", "demos", "registry.ts"), "utf8");
const registryEntries = new Map();
for (const line of registryText.split("\n")) {
  const match = /^ {2}(\w+): \{ Demo: \w+, file: "([^"]+)"(?:, center: true)?(?:, pinned: true)? \},?$/.exec(line);
  if (match) registryEntries.set(match[1], match[2]);
}
for (const needEntry of Object.values(catalog.packages).flatMap((p) => p.needs)) {
  const spec = rich[needEntry.need];
  if (needEntry.registry && !registryBricks.has(needEntry.registry)) {
    errors.push(
      `catalog: "${needEntry.need}" Registry "${needEntry.registry}" is missing from registry.json.`,
    );
  }
  if (!spec?.registry) continue;
  if (needEntry.registry !== spec.registry) {
    errors.push(
      `docs-manifest.json: "${needEntry.need}" registry "${spec.registry}" does not match catalog Registry "${needEntry.registry ?? "(missing)"}".`,
    );
  }
  const examples = needEntry.examples ?? [];
  if (examples.length < 2) {
    errors.push(`catalog: "${needEntry.need}" component page needs at least 2 examples (has ${examples.length}).`);
  }
  if (!needEntry.a11y) errors.push(`catalog: "${needEntry.need}" component page is missing A11y.`);
  if (!needEntry.troubleshooting) {
    errors.push(`catalog: "${needEntry.need}" component page is missing Troubleshooting.`);
  }
  if (!spec.props || !spec.source) {
    errors.push(`docs-manifest.json: "${needEntry.need}" registry page needs props + source for AutoTypeTable.`);
  }
}

function richSourcePath(spec) {
  if (spec.package === "@zedtech/zedkit-flags") {
    return join(ROOT, "packages", "flags", "src", spec.source);
  }
  return join(ROOT, "packages", "ui", "src", spec.source);
}

function richPreviewOnlyNeed(spec) {
  if (spec.component !== null) return false;
  if (spec.props || spec.registry) return false;
  if (typeof spec.source !== "string") return false;
  if (spec.source.endsWith(".css")) return true;
  return spec.package === "@zedtech/zedkit-flags";
}

for (const [key, spec] of Object.entries(rich)) {
  // CSS-only needs (utilities, no component) set component to null and
  // must point source at their stylesheet; they get no props table.
  const previewOnly = richPreviewOnlyNeed(spec);
  if (spec.component === null && !previewOnly) {
    errors.push(`docs-manifest.json: "${key}" has component null but is not a CSS-only need (want a .css source, no props, no registry).`);
  } else if (!previewOnly && !uiExports.has(spec.component)) {
    errors.push(`docs-manifest.json: "${key}" references missing @zedtech/zedkit-ui export \`${spec.component}\`.`);
  }
  if (spec.props && !uiExports.has(spec.props)) {
    errors.push(`docs-manifest.json: "${key}" references missing @zedtech/zedkit-ui export \`${spec.props}\`.`);
  }
  if (!registryEntries.has(spec.demo)) {
    errors.push(`docs-manifest.json: "${key}" references missing registry demo \`${spec.demo}\`.`);
  } else {
    const demoPath = join(APP, "components", "demos", registryEntries.get(spec.demo));
    if (!existsSync(demoPath)) {
      errors.push(`registry: demo file \`${demoPath.slice(APP.length + 1)}\` missing for \`${spec.demo}\`.`);
    } else if (!readFileSync(demoPath, "utf8").includes(`export function ${spec.demo}`)) {
      errors.push(`registry: \`${demoPath.slice(APP.length + 1)}\` does not export \`${spec.demo}\`.`);
    }
  }
  if (spec.source && !existsSync(richSourcePath(spec))) {
    errors.push(`docs-manifest.json: "${key}" references missing source file \`${spec.source}\`.`);
  }
}

function tsxFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...tsxFiles(path));
    else if (entry.name.endsWith(".tsx")) out.push(path);
  }
  return out;
}

for (const dir of ["app", "ui"]) {
  if (!existsSync(join(APP, dir))) continue;
  for (const file of tsxFiles(join(APP, dir))) {
    const rel = file.slice(APP.length + 1);
    for (const line of readFileSync(file, "utf8").split("\n")) {
      if (/from\s+["'].*components\/demos\//.test(line) && !line.includes("components/demos/registry")) {
        errors.push(`${rel}: import demos through components/demos/registry, never directly.`);
      }
      if (/^import\s+\*\s+as\s+/.test(line)) {
        errors.push(`${rel}: namespace imports are banned in pages; use named imports.`);
      }
    }
  }
}

for (const file of tsxFiles(join(APP, "components"))) {
  const rel = file.slice(APP.length + 1);
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (/<(div|span)[\s>/]/.test(line)) {
      errors.push(`${rel}: raw <${/<(div|span)[\s>/]/.exec(line)[1]}> is banned; use kit Stack/Text/Section/Heading.`);
    }
  }
}

const nextConfig = readFileSync(join(APP, "next.config.mjs"), "utf8");
if (nextConfig.includes('output: "export"')) {
  const staticExportRoutes = [
    "app/robots.ts",
    "app/sitemap.ts",
    "app/opengraph-image.tsx",
    "app/api/search/route.ts",
  ];
  const forceStatic = /export const dynamic = "force-static"/;
  for (const rel of staticExportRoutes) {
    const file = join(APP, rel);
    const text = readFileSync(file, "utf8");
    if (!forceStatic.test(text)) {
      errors.push(
        `${rel}: missing export const dynamic = "force-static" (required with output: "export").`,
      );
    }
  }
}

for (const { href, external } of siteFooterLinkSpecs(SITE_CHANGELOG_URL)) {
  if (external && !href.startsWith("https://")) {
    errors.push(`site-footer: ${href} must be an https URL.`);
  }
}
const siteLayout = readFileSync(join(APP, "ui", "site-layout.tsx"), "utf8");
if (!siteLayout.includes("siteHeaderLinks")) {
  errors.push("site-layout: expected shared siteHeaderLinks in the marketing shell.");
}
if (!existsSync(join(APP, "ui", "site-footer.tsx"))) {
  errors.push("site-footer: missing ui/site-footer.tsx.");
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  const seoBuild = spawnSync("pnpm", ["--filter", "@zedtech/zedkit-seo", "build"], {
    cwd: ROOT,
    stdio: "pipe",
  });
  if (seoBuild.status !== 0) {
    console.error("docs:check: @zedtech/zedkit-seo build failed.");
    process.exitCode = 1;
  } else {
    const tutorial = spawnSync("node", [join(HERE, "verify-seo-tutorial.mjs")], {
      cwd: APP,
      stdio: "inherit",
    });
    if (tutorial.status !== 0) process.exitCode = 1;
    else {
      const aiBuild = spawnSync("pnpm", ["--filter", "@zedtech/zedkit-ai", "build"], {
        cwd: ROOT,
        stdio: "pipe",
      });
      if (aiBuild.status !== 0) {
        console.error("docs:check: @zedtech/zedkit-ai build failed.");
        process.exitCode = 1;
      } else {
        const aiTutorial = spawnSync("node", [join(HERE, "verify-ai-agent-tutorial.mjs")], {
          cwd: APP,
          stdio: "inherit",
        });
        if (aiTutorial.status !== 0) process.exitCode = 1;
        const adminTutorial = spawnSync("node", [join(HERE, "verify-admin-dashboard-tutorial.mjs")], {
          cwd: APP,
          stdio: "inherit",
        });
        if (adminTutorial.status !== 0) process.exitCode = 1;
        else {
          const agentIcons = spawnSync("node", [join(HERE, "check-agent-icons.mjs")], {
            cwd: APP,
            stdio: "inherit",
          });
          if (agentIcons.status !== 0) process.exitCode = 1;
          const domainIcons = spawnSync("node", [join(HERE, "check-domain-icons.mjs")], {
            cwd: APP,
            stdio: "inherit",
          });
          if (domainIcons.status !== 0) process.exitCode = 1;
        }
      }
    }
  }
}

if (process.exitCode !== 1) {
  console.log(
    `docs: ok (${pages} pages cover ${needs.length} needs, ${guidePages} guides, ${prosePages} with prose, ${Object.keys(rich).length} rich, gallery ${gallery.length}).`,
  );
}
