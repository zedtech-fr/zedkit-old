// Docs content generator: catalog.json -> Fumadocs MDX pages.
//
// - `node scripts/generate.mjs [outDir]` regenerates every catalog need
//   as an MDX page (badge, At-a-glance guidance block from the catalog
//   guidance fields, install tabs with the changesets version,
//   catalog example, wraps line) plus per-folder meta.json nav files.
// - Needs listed in docs-manifest.json also get a live preview (the
//   REAL workspace component via components/component-preview.tsx, which
//   resolves the demo through components/demos/registry.ts) and a props
//   table resolved at build by fumadocs-typescript AutoTypeTable
//   (via components/props-table.tsx, inherited props expanded).
// - Also writes public/llms.txt and public/llms-full.txt (same source, always current).
//
// Catalog fields drive the fixed sections; optional prose under
// `prose/<folder>/<slug>.mdx` is merged after Example (see PAGE-TEMPLATE.md).
// The docs check (scripts/check.mjs) runs this to a temp dir and asserts
// full coverage plus prose rules.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
// eslint-disable-next-line no-restricted-imports -- repo-root registry.json
import { loadRegistryBrickNames } from "../../../scripts/registry/catalog.mjs";
import { buildLlmsFull, truncateDescription } from "@zedtech/zedkit-seo";
import { componentPageSections } from "../lib/component-page-sections.mjs";
import { docsOmitNeed, hrefForOmittedNeed } from "./docs-omitted-needs.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, "..");
const ROOT = join(APP, "..", "..");
const PROSE_DIR = join(APP, "prose");
const GUIDES_DIR = join(PROSE_DIR, "guides");
const GUIDE_SNIPPETS_DIR = join(GUIDES_DIR, "snippets");

/** Standalone guide pages (not catalog needs), first in docs nav when listed here. */
export const GUIDE_NAV_SLUGS = [
  "getting-started",
  "start-without-writing-code",
  "build-an-admin-dashboard",
  "set-up-your-coding-agents",
  "maturity-and-compatibility",
  "zedkit-and-shadcn",
  "add-seo-to-nextjs",
];

/** Section titles owned by the generator — prose must not repeat them. */
export const GENERATED_DOC_SECTIONS = new Set([
  "At a glance",
  "Preview",
  "Install",
  "Install or copy",
  "Example",
  "Usage and states",
  "Props",
  "Accessibility",
  "Related",
]);

function slugify(need) {
  const slug = need
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.length > 0 ? slug : "need";
}

function buildRegistryBrickDocHref(catalog, placementByNeed) {
  const hrefs = {};
  for (const [pkg, entry] of Object.entries(catalog.packages)) {
    const folder = shortName(pkg);
    for (const need of entry.needs) {
      if (!need.registry) continue;
      const placed = placementByNeed.get(need.need);
      if (!placed) continue;
      hrefs[need.registry] = `/docs/${folder}/${placed.slug}`;
    }
  }
  const aliasNeed = (title) => {
    const placed = placementByNeed.get(title);
    if (!placed) throw new Error(`generator: missing placement for "${title}".`);
    return `/docs/${placed.folder}/${placed.slug}`;
  };
  if (!hrefs.theme) hrefs.theme = aliasNeed("Theme an admin app (dark/light included)");
  if (!hrefs.button) hrefs.button = aliasNeed("Trigger actions with buttons");
  if (!hrefs.dialog) hrefs.dialog = aliasNeed("Open modal dialogs");
  if (!hrefs["use-online-status"]) hrefs["use-online-status"] = aliasNeed("Flag offline state with a live note");
  return hrefs;
}

function shortName(pkg) {
  return pkg.startsWith("@zedtech/zedkit-") ? pkg.slice("@zedtech/zedkit-".length) : pkg.replace(/^@/, "").replace("/", "-");
}

function packageVersion(pkgDir) {
  const text = readFileSync(join(ROOT, "packages", pkgDir, "package.json"), "utf8");
  return JSON.parse(text).version ?? "0.0.0";
}

function metaDescription(need, folder) {
  const purpose = (need.purpose ?? "").trim();
  if (purpose.length === 0) {
    throw new Error(`generator: catalog need "${need.need}" is missing purpose.`);
  }
  const text = need.registry
    ? `${purpose} Install with npm or copy published registry bricks.`
    : folder === "ui"
      ? `${purpose} Install with npm.`
      : purpose;
  return truncateDescription(text);
}

function loadPnpmCatalogVersions() {
  const versions = new Map();
  const lines = readFileSync(join(ROOT, "pnpm-workspace.yaml"), "utf8").split("\n");
  let inCatalog = false;
  for (const line of lines) {
    if (line === "catalog:") {
      inCatalog = true;
      continue;
    }
    if (inCatalog && /^\S/.test(line) && !line.startsWith(" ")) inCatalog = false;
    if (!inCatalog) continue;
    if (!line.startsWith("  ") || !line.includes(":")) continue;
    const body = line.slice(2);
    const colon = body.indexOf(":");
    if (colon < 0) continue;
    const key = body.slice(0, colon).replace(/^"|"$/g, "").trim();
    const value = body.slice(colon + 1).trim();
    if (key.length > 0) versions.set(key, value);
  }
  return versions;
}

function formatPeerDependencies(peerDeps, catalogVersions) {
  if (!peerDeps || Object.keys(peerDeps).length === 0) return "—";
  return Object.entries(peerDeps)
    .map(([name, range]) => {
      if (range === "catalog:") {
        const resolved = catalogVersions.get(name);
        return resolved ? `${name} ${resolved}` : `${name} (catalog)`;
      }
      return `${name} ${range}`;
    })
    .join("; ");
}

function buildMaturityCompatibility(catalog) {
  const rootPkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  const catalogVersions = loadPnpmCatalogVersions();
  const maturityCounts = { planned: 0, alpha: 0, beta: 0, stable: 0, deprecated: 0 };
  for (const entry of Object.values(catalog.packages)) {
    for (const need of entry.needs) {
      maturityCounts[need.status] = (maturityCounts[need.status] ?? 0) + 1;
    }
  }
  const compatibilityRows = Object.keys(catalog.packages)
    .sort()
    .map((pkg) => {
      const dir = shortName(pkg);
      const manifest = JSON.parse(readFileSync(join(ROOT, "packages", dir, "package.json"), "utf8"));
      return {
        package: pkg,
        version: manifest.version ?? "0.0.0",
        node: manifest.engines?.node ?? rootPkg.engines?.node ?? "—",
        peers: formatPeerDependencies(manifest.peerDependencies, catalogVersions),
      };
    });
  const workspaceToolchain = {
    node: rootPkg.engines?.node ?? "—",
    packageManager: rootPkg.packageManager ?? "—",
  };
  const catalogMaturityReadmeUrl =
    "https://github.com/zedtech-fr/zedkit/blob/main/docs/catalog/README.md#maturity";
  const maturityDocHref = "/docs/maturity-and-compatibility";
  return `// GENERATED from docs/catalog/catalog.json + package manifests — do not edit.\nexport const maturityDocHref: string = ${JSON.stringify(maturityDocHref)};\n\nexport const catalogMaturityReadmeUrl: string = ${JSON.stringify(catalogMaturityReadmeUrl)};\n\nexport const maturityCounts: Record<string, number> = ${JSON.stringify(maturityCounts, null, 2)};\n\nexport interface CompatibilityRow {\n  package: string;\n  version: string;\n  node: string;\n  peers: string;\n}\n\nexport const compatibilityRows: CompatibilityRow[] = ${JSON.stringify(compatibilityRows, null, 2)};\n\nexport const workspaceToolchain: { node: string; packageManager: string } = ${JSON.stringify(workspaceToolchain)};\n`;
}

// "At a glance" block, generated from the catalog guidance fields
// (Audience/Purpose/When to use/When not to use/See also) so every
// page answers who/what/when with zero hand-written prose.
function guidanceBlock(need, seeAlsoLinks) {
  const lines = [
    "## At a glance",
    "",
    `- **Who:** ${need.audience}`,
    `- **What:** ${need.purpose}`,
    `- **Use when:** ${need.whenToUse}`,
    `- **Avoid when:** ${need.whenNotToUse}`,
  ];
  if (seeAlsoLinks.length > 0) lines.push(`- **See also:** ${seeAlsoLinks.join(", ")}`);
  lines.push("");
  return lines;
}

/** Stable needs: no frontmatter status and no inline badge (semver = no badge UX). */
function maturityDocParts(need) {
  if (need.status === "stable") {
    return { frontmatterStatus: [], badgeImport: null, badgeLine: [] };
  }
  return {
    frontmatterStatus: [`status: ${need.status}`],
    badgeImport: `import { MaturityBadge } from "../../../components/maturity-badge";`,
    badgeLine: [`<MaturityBadge status={${JSON.stringify(need.status)}} />`, ""],
  };
}

function componentPageMdx(pkg, need, version, spec, related, prose) {
  const examples = need.examples ?? [{ title: "Simple", code: need.example }];
  const pageTitle = need.shortName ?? need.need;
  const propsPriority = spec.propsPriority ?? null;
  const propsRest = spec.propsRest ?? null;
  const registryBrick = spec.registry ?? need.registry ?? "";
  const purpose = (need.purpose ?? "").trim();
  if (purpose.length === 0) {
    throw new Error(`generator: catalog need "${need.need}" is missing purpose.`);
  }
  if (!need.a11y && !spec.a11yNotApplicable) {
    throw new Error(
      `generator: "${need.need}" has no A11y line in its CATALOG.md entry. Document it, or set "a11yNotApplicable" with a reason on its docs-manifest.json entry when it has no interactive or semantic behavior.`,
    );
  }
  const sections = componentPageSections({
    hasProps: Boolean(spec.propsFile && spec.propsName),
    a11y: need.a11y,
    related,
    troubleshooting: need.troubleshooting,
  });
  const maturity = maturityDocParts(need);
  const head = [
    "---",
    `title: ${JSON.stringify(pageTitle)}`,
    `description: ${JSON.stringify(purpose)}`,
    ...maturity.frontmatterStatus,
    "componentPage: true",
    `componentSections: ${JSON.stringify(sections)}`,
    "---",
    "",
    "{/* GENERATED from docs/catalog/catalog.json — do not edit. */}",
    "",
  ];
  head.push(`import { ComponentPage } from "../../../components/component-page";`);
  if (prose?.includes("<ComponentPreview")) {
    head.push(`import { ComponentPreview } from "../../../components/component-preview";`);
  }
  head.push(
    "",
    "<ComponentPage",
    `  packageName={${JSON.stringify(pkg)}}`,
    `  version={${JSON.stringify(version)}}`,
    `  status={${JSON.stringify(need.status)}}`,
    `  purpose={${JSON.stringify(need.purpose)}}`,
    `  audience={${JSON.stringify(need.audience)}}`,
    `  whenToUse={${JSON.stringify(need.whenToUse)}}`,
    `  whenNotToUse={${JSON.stringify(need.whenNotToUse)}}`,
    `  importLine={${JSON.stringify(need.import)}}`,
    `  wraps={${JSON.stringify(need.wraps)}}`,
    `  registry={${JSON.stringify(registryBrick)}}`,
    `  demo={${JSON.stringify(spec.demo)}}`,
    `  propsFile={${JSON.stringify(spec.propsFile)}}`,
    `  propsName={${JSON.stringify(spec.propsName)}}`,
    ...(propsPriority ? [`  propsPriority={${JSON.stringify(propsPriority)}}`] : []),
    ...(propsRest ? [`  propsRest={${JSON.stringify(propsRest)}}`] : []),
    `  examples={${JSON.stringify(examples)}}`,
    ...(spec.examples && Object.keys(spec.examples).length > 0
      ? [`  examplePreviews={${JSON.stringify(spec.examples)}}`]
      : []),
    `  a11y={${JSON.stringify(need.a11y ?? "")}}`,
    `  troubleshooting={${JSON.stringify(need.troubleshooting ?? "")}}`,
    `  related={${JSON.stringify(related)}}`,
    "/>",
    "",
  );
  if (prose) head.push(prose);
  return head.join("\n");
}

/** Valid `folder/slug` keys for every catalog need page. */
export function catalogPageKeys(catalog) {
  const keys = new Set();
  for (const [pkg, entry] of Object.entries(catalog.packages)) {
    const folder = shortName(pkg);
    const seen = new Set();
    for (const need of entry.needs) {
      let slug = slugify(need.need);
      for (let i = 2; seen.has(slug); i++) slug = `${slugify(need.need)}-${i}`;
      seen.add(slug);
      if (docsOmitNeed(need.need)) continue;
      keys.add(`${folder}/${slug}`);
    }
  }
  return keys;
}

function readProse(folder, slug) {
  const path = join(PROSE_DIR, folder, `${slug}.mdx`);
  if (!existsSync(path)) return null;
  const text = expandFencePreviews(readFileSync(path, "utf8")).trim();
  if (text.length === 0) return null;
  return `${text}\n`;
}

export function expandGuideSnippets(text) {
  return text.replace(/\{\{snippet:([a-zA-Z0-9._-]+)\}\}/g, (_, id) => {
    const path = join(GUIDE_SNIPPETS_DIR, id);
    if (!existsSync(path)) throw new Error(`guide snippet missing: ${id}`);
    return readFileSync(path, "utf8").trimEnd();
  });
}

const PREVIEW_META = / preview="([A-Za-z0-9]+)"/;

/**
 * A code fence with `preview="<DemoKey>"` in its meta gets that registry demo
 * rendered live right above it. `withImport` adds the component import for
 * pages that do not already import it (guide pages).
 */
export function expandFencePreviews(text, withImport = null) {
  let used = false;
  const out = text.replace(/^```(tsx|jsx)([^\n]*)$/gm, (line, lang, meta) => {
    const key = meta.match(PREVIEW_META)?.[1];
    if (!key) return line;
    used = true;
    const rest = meta.replace(PREVIEW_META, "");
    return `<ComponentPreview demo="${key}" hasProps={false} />\n\n\`\`\`${lang}${rest}`;
  });
  if (!used || !withImport || out.includes("import { ComponentPreview }")) return out;
  const frontmatter = out.match(/^---\n[\s\S]*?\n---\n/);
  const importLine = `import { ComponentPreview } from "${withImport}";\n`;
  return frontmatter
    ? `${frontmatter[0]}\n${importLine}${out.slice(frontmatter[0].length)}`
    : `${importLine}\n${out}`;
}

function writeGuidePages(outDir) {
  if (!existsSync(GUIDES_DIR)) return 0;
  let count = 0;
  for (const entry of readdirSync(GUIDES_DIR, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".mdx")) continue;
    const body = expandFencePreviews(
      expandGuideSnippets(readFileSync(join(GUIDES_DIR, entry.name), "utf8")),
      "../../components/component-preview",
    );
    writeFileSync(join(outDir, entry.name), body.endsWith("\n") ? body : `${body}\n`);
    count += 1;
  }
  return count;
}

function pageMdx(pkg, need, version, rich, seeAlsoLinks, prose, folder) {
  const maturity = maturityDocParts(need);
  const head = [
    "---",
    `title: ${JSON.stringify(need.need)}`,
    `description: ${JSON.stringify(metaDescription(need, folder))}`,
    ...maturity.frontmatterStatus,
    "---",
    "",
    "{/* GENERATED from docs/catalog/catalog.json — do not edit. */}",
    "",
  ];
  if (maturity.badgeImport) head.push(maturity.badgeImport);
  head.push(`import { Tab, Tabs } from "fumadocs-ui/components/tabs";`);
  if (rich || prose?.includes("<ComponentPreview")) head.push(`import { ComponentPreview } from "../../../components/component-preview";`);
  if (rich && rich.propsFile && rich.propsName) {
    head.push(`import { PropsTable } from "../../../components/props-table";`);
  }
  head.push(`import { ComponentWrapsLine } from "../../../components/component-wraps-line";`);
  head.push("", ...maturity.badgeLine);
  head.push(...guidanceBlock(need, seeAlsoLinks));
  if (rich) {
    const hasProps = Boolean(rich.propsFile && rich.propsName);
    head.push(
      "## Preview",
      "",
      `<ComponentPreview demo="${rich.demo}" hasProps={${JSON.stringify(hasProps)}} />`,
      "",
    );
  }
  head.push(
    "## Install",
    "",
    `<Tabs groupId="package-manager" persist items={["pnpm", "npm", "yarn"]}>`,
    `  <Tab value="pnpm">`,
    "",
    "```sh",
    `pnpm add ${pkg}`,
    "```",
    "",
    "  </Tab>",
    `  <Tab value="npm">`,
    "",
    "```sh",
    `npm install ${pkg}`,
    "```",
    "",
    "  </Tab>",
    `  <Tab value="yarn">`,
    "",
    "```sh",
    `yarn add ${pkg}`,
    "```",
    "",
    "  </Tab>",
    "</Tabs>",
    "",
    `Latest: \`${version}\` (via changesets).`,
    "",
    "## Example",
    "",
  );
  // The first example is titled "Usage" and is covered by the page preview;
  // every further example gets its own live preview (manifest `examples`) above its code.
  const examples = need.examples ?? [{ title: "Usage", code: need.example }];
  examples.forEach((ex, index) => {
    const preview = index > 0 ? rich?.examples?.[ex.title] : null;
    if (preview) {
      head.push(`<ComponentPreview demo="${preview}" hasProps={false} />`, "");
    }
    head.push(`\`\`\`${ex.lang === "css" ? "css" : "tsx"} title=${JSON.stringify(index === 0 ? "Usage" : ex.title)}`, ex.code, "```", "");
  });
  head.push(`<ComponentWrapsLine wraps={${JSON.stringify(need.wraps)}} />`, "");
  if (prose) head.push(prose);
  if (rich && rich.propsFile && rich.propsName) {
    head.push("## Props", "", `<PropsTable file="${rich.propsFile}" name="${rich.propsName}" />`, "");
  }
  if (need.a11y) {
    head.push("## Accessibility", "", need.a11y, "");
  }
  return head.join("\n");
}

export function generate(outDir) {
  const catalog = JSON.parse(readFileSync(join(ROOT, "docs", "catalog", "catalog.json"), "utf8"));
  const manifest = JSON.parse(readFileSync(join(APP, "docs-manifest.json"), "utf8"));
  const rich = manifest.rich ?? {};
  const sorted = Object.entries(catalog.packages).sort(([a], [b]) => a.localeCompare(b));

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  // First pass: folder + slug per need heading, so "See also" targets
  // (plain need headings, unique across the catalog per catalog:check)
  // resolve to links before any page is written.
  const placementByNeed = new Map();
  for (const [pkg, entry] of sorted) {
    const folder = shortName(pkg);
    const seen = new Set();
    for (const need of entry.needs) {
      let slug = slugify(need.need);
      for (let i = 2; seen.has(slug); i++) slug = `${slugify(need.need)}-${i}`;
      seen.add(slug);
      placementByNeed.set(need.need, { folder, slug });
    }
  }

  let pages = 0;
  let prosePages = 0;
  const folders = [];
  const slugsByNeed = new Map();
  const registryBrickCount = loadRegistryBrickNames(ROOT).length;
  const llms = [
    "# zedkit docs",
    "",
    "> GENERATED from docs/catalog/catalog.json — do not edit.",
    "",
    "## Install or copy",
    "",
    "- **npm:** `pnpm add @zedtech/zedkit-ui` (and other `@zedtech/*` packages) — versioned updates via your package manager.",
    `- **registry:** \`npx shadcn@latest add https://zedkit.app/r/<brick>.json\` — source in your repo (${registryBrickCount} brick${registryBrickCount === 1 ? "" : "s"} today; see [zedkit and shadcn/ui](/docs/zedkit-and-shadcn)).`,
    "",
    "- [Getting started](/docs/getting-started) — choose a package and reach a first result",
    "- [Set up your coding agents](/docs/set-up-your-coding-agents) — zedkit-ai init and validate",
    "- [Maturity and compatibility](/docs/maturity-and-compatibility) — badge legend link and package matrix",
    "- [zedkit and shadcn/ui](/docs/zedkit-and-shadcn) — wraps, registry install, when to use plain shadcn",
    "- [Add SEO to a Next.js app](/docs/add-seo-to-nextjs) — robots, sitemap, metadata, JSON-LD",
    "",
  ];
  for (const [pkg, entry] of sorted) {
    const folder = shortName(pkg);
    const dir = join(outDir, folder);
    mkdirSync(dir, { recursive: true });
    folders.push(folder);
    const version = packageVersion(folder);
    const slugs = [];
    llms.push(`## ${pkg}`, "");
    for (const need of entry.needs) {
      if (docsOmitNeed(need.need)) continue;
      const { slug } = placementByNeed.get(need.need);
      slugs.push(slug);
      slugsByNeed.set(`${pkg} ${need.need}`, { folder, slug });
      const spec = rich[need.need];
      let richBlock = null;
      if (spec) {
        richBlock = {
          demo: spec.demo,
          examples: spec.examples ?? null,
          propsFile: spec.source ?? null,
          propsName: spec.props ?? null,
          registry: spec.registry ?? null,
          propsPriority: spec.propsPriority ?? null,
          propsRest: spec.propsRest ?? null,
          a11yNotApplicable: spec.a11yNotApplicable ?? null,
        };
      }
      const related = (need.seeAlso ?? []).map((target) => {
        if (docsOmitNeed(target)) {
          const href = hrefForOmittedNeed(target);
          if (!href) throw new Error(`generator: omitted need "${target}" has no public href.`);
          return { title: target, href };
        }
        const placed = placementByNeed.get(target);
        if (!placed) throw new Error(`generator: "${need.need}" links unknown need "${target}" in See also.`);
        return { title: target, href: `/docs/${placed.folder}/${placed.slug}` };
      });
      const links = related.map((r) => `[${r.title}](${r.href})`);
      const prose = readProse(folder, slug);
      if (prose) prosePages += 1;
      const body = richBlock
        ? componentPageMdx(
            pkg,
            need,
            version,
            { ...richBlock, registry: richBlock.registry ?? need.registry ?? "" },
            related,
            prose,
          )
        : pageMdx(pkg, need, version, richBlock, links, prose, folder);
      writeFileSync(join(dir, `${slug}.mdx`), body);
      pages += 1;
      llms.push(`- [${need.need}](/docs/${folder}/${slug}) — ${metaDescription(need, folder)}`);
    }
    llms.push("");
    writeFileSync(join(dir, "meta.json"), `${JSON.stringify({ title: pkg, pages: slugs }, null, 2)}\n`);
  }
  const guidePages = writeGuidePages(outDir);
  if (guidePages === 0) throw new Error("prose/guides: expected getting-started.mdx and index.mdx.");
  for (const slug of GUIDE_NAV_SLUGS) {
    if (!existsSync(join(outDir, `${slug}.mdx`))) {
      throw new Error(`prose/guides/${slug}.mdx missing (required guide page).`);
    }
  }
  if (!existsSync(join(outDir, "index.mdx"))) {
    throw new Error("prose/guides/index.mdx missing (docs index).");
  }
  writeFileSync(
    join(outDir, "meta.json"),
    `${JSON.stringify({ title: "Docs", pages: [...GUIDE_NAV_SLUGS, ...folders] }, null, 2)}\n`,
  );
  const publicDir = join(APP, "public");
  mkdirSync(publicDir, { recursive: true });
  writeFileSync(join(publicDir, "llms.txt"), `${llms.join("\n")}\n`);
  const llmsBody = llms.join("\n");
  const installOrCopyBody = [
    "Two paths into the UI kit:",
    "",
    "- npm: pnpm add @zedtech/zedkit-ui — versioned package and styles.css",
    `- registry: npx shadcn@latest add https://zedkit.app/r/<brick>.json — copy source (${registryBrickCount} brick${registryBrickCount === 1 ? "" : "s"} today)`,
    "",
    "Guide: https://zedkit.app/docs/zedkit-and-shadcn",
  ].join("\n");
  const llmsFull = buildLlmsFull([
    { title: "Install or copy", body: installOrCopyBody },
    { title: "Documentation index", body: llmsBody },
  ]);
  writeFileSync(join(publicDir, "llms-full.txt"), `${llmsFull}\n`);
  // Gallery data: one card per UI need (live demo first, then the rest),
  // catalog stats, and the featured install package — single source.
  const uiPackage = Object.keys(catalog.packages).find((pkg) => shortName(pkg) === "ui") ?? null;
  if (!uiPackage) throw new Error('gallery: no package with short name "ui" in the catalog.');
  const live = [];
  const rest = [];
  for (const need of catalog.packages[uiPackage].needs) {
    const spec = rich[need.need];
    const placed = slugsByNeed.get(`${uiPackage} ${need.need}`);
    if (!placed) continue;
    const card = {
      href: `/docs/${placed.folder}/${placed.slug}`,
      title: cardTitle(need, spec),
      need: need.need,
      status: need.status,
      detail: need.import.replace(/`/g, ""),
      demo: spec ? spec.demo : null,
    };
    (spec ? live : rest).push(card);
  }
  const gallery = [...live, ...rest];
  const homeCuratedGallery = buildHomeCuratedGallery(gallery);
  const catalogIndex = buildCatalogIndex(sorted, slugsByNeed, rich);
  const docsSearchCanonicalByHref = buildDocsSearchCanonical(sorted, slugsByNeed);
  const stats = {
    packages: Object.keys(catalog.packages).length,
    needs: Object.values(catalog.packages).reduce((n, entry) => n + entry.needs.length, 0),
  };
  const uiVersion = packageVersion("ui");
  const uiChangelogUrl =
    "https://github.com/zedtech-fr/zedkit/blob/main/packages/ui/CHANGELOG.md";
  const uiReleasesUrl = "https://github.com/zedtech-fr/zedkit/releases";
  const galleryModule = `// GENERATED from docs/catalog/catalog.json — do not edit.\nexport interface GalleryCard {\n  href: string;\n  title: string;\n  need: string;\n  status: string;\n  detail: string;\n  demo: string | null;\n}\n\nexport const gallery: GalleryCard[] = ${JSON.stringify(gallery, null, 2)};\n\nexport const homeCuratedGallery: GalleryCard[] = ${JSON.stringify(homeCuratedGallery, null, 2)};\n\nexport const catalogStats: { packages: number; needs: number } = ${JSON.stringify(stats)};\n\nexport const featuredPackage: string = ${JSON.stringify(uiPackage)};\n\nexport const featuredPackageVersion: string = ${JSON.stringify(uiVersion)};\n\nexport const featuredPackageChangelogUrl: string = ${JSON.stringify(uiChangelogUrl)};\nexport const featuredPackageReleasesUrl: string = ${JSON.stringify(uiReleasesUrl)};\n\nexport const uiGalleryStats: { components: number; livePreviews: number } = ${JSON.stringify({
    components: gallery.length,
    livePreviews: gallery.filter((card) => card.demo).length,
  })};\n`;
  const catalogIndexModule = `// GENERATED from docs/catalog/catalog.json — do not edit.\nexport type CatalogArea = "ui" | "backend" | "seo" | "agents";\n\nexport interface CatalogIndexEntry {\n  href: string;\n  title: string;\n  need: string;\n  status: string;\n  area: CatalogArea;\n  package: string;\n}\n\nexport const catalogIndex: CatalogIndexEntry[] = ${JSON.stringify(catalogIndex, null, 2)};\n`;
  const docsSearchCanonicalModule = `// GENERATED from docs/catalog/catalog.json — do not edit.\nexport interface DocsSearchCanonicalEntry {\n  href: string;\n  label: string;\n}\n\n/** Canonical UI component doc pages keyed by pathname (e.g. \`/docs/ui/trigger-actions-with-buttons\`). */\nexport const docsSearchCanonicalByHref: Record<string, DocsSearchCanonicalEntry> = ${JSON.stringify(docsSearchCanonicalByHref, null, 2)};\n`;
  const homeScenarios = buildHomeScenarios(slugsByNeed, catalog);
  const homeEntryPoints = buildHomeEntryPoints(catalog, slugsByNeed);
  const scenariosModule = `// GENERATED from home-scenarios.json + catalog slugs — do not edit.\nexport interface HomeScenario {\n  situation: string;\n  goal: string;\n  action: string;\n  href: string;\n  linkLabel: string;\n}\n\nexport const homeScenarios: HomeScenario[] = ${JSON.stringify(homeScenarios, null, 2)};\n`;
  const entryPointsModule = `// GENERATED from home-entry-points.json + catalog — do not edit.\nexport interface HomeEntryPoint {\n  title: string;\n  summary: string;\n  href: string;\n  needCount: number;\n  linkLabel: string;\n}\n\nexport const homeEntryPoints: HomeEntryPoint[] = ${JSON.stringify(homeEntryPoints, null, 2)};\n`;
  const registryBricks = loadRegistryBrickNames(ROOT);
  const registryBrickDocHref = buildRegistryBrickDocHref(catalog, placementByNeed);
  const registrySiteModule = `// GENERATED from registry.json — do not edit.\nexport const registryBrickNames: string[] = ${JSON.stringify(registryBricks)};\n\nexport const featuredRegistryBrick: string = ${JSON.stringify(registryBricks.includes("button") ? "button" : (registryBricks.find((name) => name !== "theme") ?? registryBricks[0]))};\n\nexport const registryBrickDocHref: Record<string, string> = ${JSON.stringify(registryBrickDocHref, null, 2)};\n`;
  const maturityModule = buildMaturityCompatibility(catalog);
  return {
    pages,
    prosePages,
    guidePages,
    folders,
    gallery,
    stats,
    uiPackage,
    galleryModule,
    homeScenarios,
    scenariosModule,
    homeEntryPoints,
    entryPointsModule,
    registrySiteModule,
    catalogIndex,
    catalogIndexModule,
    docsSearchCanonicalModule,
    homeCuratedGallery,
    maturityModule,
  };
}

const CATALOG_AREA_BY_FOLDER = {
  ui: "ui",
  ai: "agents",
  seo: "seo",
  "payload-seo": "seo",
  core: "backend",
  server: "backend",
  storage: "backend",
  flags: "backend",
  devtools: "backend",
  nest: "backend",
  observability: "backend",
  quality: "backend",
  i18n: "ui",
};

function catalogAreaForFolder(folder) {
  const area = CATALOG_AREA_BY_FOLDER[folder];
  if (!area) throw new Error(`catalog index: unmapped docs folder "${folder}"`);
  return area;
}

/** UI kit short names -> doc href for docs search ranking (e.g. button -> Button page). */
function buildDocsSearchCanonical(sorted, slugsByNeed) {
  /** @type {Record<string, { href: string; label: string }>} */
  const byHref = {};
  for (const [pkg, entry] of sorted) {
    if (shortName(pkg) !== "ui") continue;
    for (const need of entry.needs) {
      const name = need.shortName;
      if (!name || typeof name !== "string") continue;
      const placed = slugsByNeed.get(`${pkg} ${need.need}`);
      if (!placed) continue;
      const href = `/docs/${placed.folder}/${placed.slug}`;
      byHref[href] = { href, label: name };
    }
  }
  return byHref;
}

function buildCatalogIndex(sorted, slugsByNeed, rich) {
  const entries = [];
  for (const [pkg, entry] of sorted) {
    const folder = shortName(pkg);
    const area = catalogAreaForFolder(folder);
    for (const need of entry.needs) {
      const placed = slugsByNeed.get(`${pkg} ${need.need}`);
      if (!placed) continue;
      const spec = rich[need.need];
      entries.push({
        href: `/docs/${placed.folder}/${placed.slug}`,
        title: cardTitle(need, spec),
        need: need.need,
        status: need.status,
        area,
        package: folder,
      });
    }
  }
  return entries.sort((a, b) => a.title.localeCompare(b.title, "en"));
}

function buildHomeCuratedGallery(gallery) {
  const sourcePath = join(APP, "home-curated.json");
  if (!existsSync(sourcePath)) {
    throw new Error("home-curated.json missing (apps/docs/home-curated.json).");
  }
  const source = JSON.parse(readFileSync(sourcePath, "utf8"));
  const needs = source.catalogNeeds;
  if (!Array.isArray(needs)) {
    throw new Error("home-curated.json: catalogNeeds must be an array.");
  }
  const byNeed = new Map(gallery.map((card) => [card.need, card]));
  const curated = [];
  for (const need of needs) {
    const card = byNeed.get(need);
    if (!card) throw new Error(`home-curated.json: "${need}" is not a UI gallery entry.`);
    curated.push(card);
  }
  return curated;
}

function buildHomeScenarios(slugsByNeed, catalog) {
  const sourcePath = join(APP, "home-scenarios.json");
  if (!existsSync(sourcePath)) {
    throw new Error("home-scenarios.json missing (apps/docs/home-scenarios.json).");
  }
  const source = JSON.parse(readFileSync(sourcePath, "utf8"));
  const scenarios = [];
  const seenLabels = new Set();
  for (const row of source) {
    if (!row.linkLabel) {
      throw new Error(`home-scenarios.json: "${row.situation}" needs linkLabel.`);
    }
    if (seenLabels.has(row.linkLabel)) {
      throw new Error(`home-scenarios.json: duplicate linkLabel "${row.linkLabel}".`);
    }
    seenLabels.add(row.linkLabel);
    let pkg = null;
    for (const [name, entry] of Object.entries(catalog.packages)) {
      if (entry.needs.some((need) => need.need === row.catalogNeed)) {
        pkg = name;
        break;
      }
    }
    if (!pkg) throw new Error(`home-scenarios.json: "${row.catalogNeed}" matches no catalog need.`);
    const placed = slugsByNeed.get(`${pkg} ${row.catalogNeed}`);
    if (!placed) throw new Error(`home-scenarios.json: no doc slug for "${row.catalogNeed}".`);
    scenarios.push({
      situation: row.situation,
      goal: row.goal,
      action: row.action,
      href: `/docs/${placed.folder}/${placed.slug}`,
      linkLabel: row.linkLabel,
    });
  }
  return scenarios;
}

function buildHomeEntryPoints(catalog, slugsByNeed) {
  const sourcePath = join(APP, "home-entry-points.json");
  if (!existsSync(sourcePath)) {
    throw new Error("home-entry-points.json missing (apps/docs/home-entry-points.json).");
  }
  const source = JSON.parse(readFileSync(sourcePath, "utf8"));
  const entryPoints = [];
  for (const row of source) {
    let needCount = 0;
    let href = null;
    for (const pkg of row.packages) {
      const entry = catalog.packages[pkg];
      if (!entry) throw new Error(`home-entry-points.json: unknown package "${pkg}".`);
      needCount += entry.needs.length;
    }
    if (!row.linkLabel) {
      throw new Error(`home-entry-points.json: "${row.title}" needs linkLabel.`);
    }
    if (row.guideSlug) {
      if (!GUIDE_NAV_SLUGS.includes(row.guideSlug)) {
        throw new Error(`home-entry-points.json: guideSlug "${row.guideSlug}" is not a guide page.`);
      }
      href = `/docs/${row.guideSlug}`;
    } else if (row.need) {
      let pkg = null;
      for (const name of row.packages) {
        const entry = catalog.packages[name];
        if (entry?.needs.some((need) => need.need === row.need)) {
          pkg = name;
          break;
        }
      }
      if (!pkg) {
        throw new Error(`home-entry-points.json: "${row.title}" need "${row.need}" matches no listed package.`);
      }
      const placed = slugsByNeed.get(`${pkg} ${row.need}`);
      if (!placed) {
        throw new Error(`home-entry-points.json: no doc slug for "${row.need}".`);
      }
      href = `/docs/${placed.folder}/${placed.slug}`;
    } else {
      throw new Error(`home-entry-points.json: "${row.title}" needs need or guideSlug.`);
    }
    entryPoints.push({
      title: row.title,
      summary: row.summary,
      href,
      needCount,
      linkLabel: row.linkLabel,
    });
  }
  return entryPoints;
}

// Gallery titles are short component names: the curated manifest
// component when rich, else the first symbol in the import line,
// else the need phrase (non-component needs like theming).
function cardTitle(need, spec) {
  if (spec?.component) return spec.component;
  const match = /`([A-Za-z_$][A-Za-z0-9_$]*)`/.exec(need.import ?? "");
  return match ? match[1] : need.need;
}

const invoked = process.argv[1] ? resolve(process.argv[1]) : null;
if (invoked === fileURLToPath(import.meta.url)) {
  const outDir = process.argv[2] ? resolve(process.argv[2]) : join(APP, "content", "docs");
  if (!existsSync(join(ROOT, "docs", "catalog", "catalog.json"))) {
    console.error("error: docs/catalog/catalog.json missing (run pnpm catalog:build at the root).");
    process.exitCode = 1;
  } else {
    const {
      pages,
      folders,
      galleryModule,
      scenariosModule,
      entryPointsModule,
      registrySiteModule,
      catalogIndexModule,
      docsSearchCanonicalModule,
      maturityModule,
    } = generate(outDir);
    writeFileSync(join(APP, "content", "gallery.ts"), galleryModule);
    writeFileSync(join(APP, "content", "home-scenarios.ts"), scenariosModule);
    writeFileSync(join(APP, "content", "home-entry-points.ts"), entryPointsModule);
    writeFileSync(join(APP, "content", "registry-site.ts"), registrySiteModule);
    writeFileSync(join(APP, "content", "catalog-index.ts"), catalogIndexModule);
    writeFileSync(join(APP, "content", "docs-search-canonical.ts"), docsSearchCanonicalModule);
    writeFileSync(join(APP, "content", "maturity-compatibility.ts"), maturityModule);
    console.log(`docs: generated ${pages} pages in ${folders.length} folders -> ${outDir}.`);
  }
}
