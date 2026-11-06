// Validates metadata, sitemap, robots and llms.txt in the static export (apps/docs/out).
// Run after `pnpm exec turbo run build --filter=@zedtech/zedkit-docs`.
//
// Usage: `node scripts/check-seo-export.mjs [outDir]`
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
// eslint-disable-next-line no-restricted-imports -- repo-root registry.json
import { loadRegistryBrickNames } from "../../../scripts/registry/catalog.mjs";
import { SITE_CHANGELOG_URL, siteFooterLinkSpecs } from "../lib/site-links.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, "..");

const REGISTRY_JSON_URL = /\/r\/([a-z][a-z0-9-]*)\.json/g;

export function checkRobots(text, base) {
  const errors = [];
  if (!text.includes(`Sitemap: ${base}/sitemap.xml`)) {
    errors.push("robots.txt: missing Sitemap line for the site");
  }
  if (!/Allow:\s*\//.test(text)) {
    errors.push("robots.txt: missing Allow /");
  }
  return errors;
}

export function checkSitemap(text, base) {
  const errors = [];
  const locs = [...text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  if (locs.length < 3) {
    errors.push(`sitemap.xml: expected at least 3 URLs, got ${locs.length}`);
  }
  for (const loc of locs) {
    if (!loc.startsWith(`${base}/`) && loc !== `${base}/`) {
      errors.push(`sitemap.xml: URL not on site: ${loc}`);
    }
  }
  if (!locs.includes(`${base}/`)) {
    errors.push("sitemap.xml: missing home URL");
  }
  if (!locs.includes(`${base}/docs`)) {
    errors.push("sitemap.xml: missing /docs URL");
  }
  return { errors, urlCount: locs.length };
}

export function checkLlms(text) {
  const errors = [];
  if (!text.startsWith("# zedkit docs")) {
    errors.push("llms.txt: expected generated zedkit docs header");
  }
  if (!text.includes("## Install or copy")) {
    errors.push("llms.txt: missing ## Install or copy section");
  }
  return errors;
}

export function checkLlmsFull(text) {
  const errors = [];
  if (!text.startsWith("# Install or copy")) {
    errors.push("llms-full.txt: expected # Install or copy header");
  }
  if (!text.includes("# Documentation index")) {
    errors.push("llms-full.txt: missing # Documentation index section");
  }
  if (!text.includes("# Set up zedkit AI")) {
    errors.push("llms-full.txt: missing # Set up zedkit AI section");
  }
  return errors;
}

export function checkMeta(html, label, canonicalHref, base, { requireJsonLd = true } = {}) {
  const errors = [];
  if (!html.includes('rel="canonical"')) {
    errors.push(`${label}: missing canonical link`);
  } else {
    const homeAlt = canonicalHref === `${base}/` ? `href="${base}"` : null;
    const ok = html.includes(`href="${canonicalHref}"`) || (homeAlt !== null && html.includes(homeAlt));
    if (!ok) {
      errors.push(`${label}: canonical must be ${canonicalHref}`);
    }
  }
  for (const prop of ["og:title", "og:description", "og:image", "og:url"]) {
    if (!html.includes(`property="${prop}"`)) {
      errors.push(`${label}: missing meta property ${prop}`);
    }
  }
  if (!html.includes('name="twitter:card"')) {
    errors.push(`${label}: missing twitter:card meta`);
  }
  if (requireJsonLd && !html.includes("application/ld+json")) {
    errors.push(`${label}: missing JSON-LD script`);
  }
  return errors;
}

export function checkNotFound(html) {
  const errors = [];
  if (!html.includes('content="noindex')) {
    errors.push("404.html: expected robots noindex metadata");
  }
  if (html.includes("application/ld+json")) {
    errors.push("404.html: must not ship indexable JSON-LD");
  }
  return errors;
}

export function checkSiteShell(html, label, footerSpecs) {
  const errors = [];
  if (!html.includes("Maintained by ZED TECH")) {
    errors.push(`${label}: missing maintainer footer text`);
  }
  for (const { label: linkLabel, href } of footerSpecs) {
    if (!html.includes(href)) {
      errors.push(`${label}: missing footer link ${linkLabel} (${href})`);
    }
  }
  if (!html.includes('href="/docs"')) {
    errors.push(`${label}: missing Documentation nav link`);
  }
  return errors;
}

export function missingRegistryExports(brickNames, existsRel) {
  const errors = [];
  for (const name of brickNames) {
    const rel = join("r", `${name}.json`);
    if (!existsRel(rel)) {
      errors.push(`missing static export ${rel} (run registry:build before docs export).`);
    }
  }
  return errors;
}

export function checkHtmlRegistryLinks(html, existsRel) {
  const errors = [];
  for (const match of html.matchAll(REGISTRY_JSON_URL)) {
    const brick = match[1];
    const rel = join("r", `${brick}.json`);
    if (!existsRel(rel)) {
      errors.push(`export HTML links to /r/${brick}.json but ${rel} is missing.`);
    }
  }
  return errors;
}

function requireFile(outDir, rel, errors) {
  const file = join(outDir, rel);
  if (!existsSync(file)) {
    errors.push(`missing ${rel} (run the docs static export build first).`);
    return null;
  }
  return file;
}

function firstDocHtml(outDir) {
  const docsDir = join(outDir, "docs");
  if (!existsSync(docsDir)) return null;
  const stack = [docsDir];
  while (stack.length > 0) {
    const dir = stack.pop();
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) stack.push(path);
      else if (entry.name.endsWith(".html") && entry.name !== "docs.html") return path;
    }
  }
  return null;
}

function walkHtml(dir, visit) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(path, visit);
    else if (entry.name.endsWith(".html")) visit(readFileSync(path, "utf8"));
  }
}

function main() {
  const outDir = resolve(process.argv[2] ?? join(APP, "out"));
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://zedkit.app").replace(/\/$/, "");
  const errors = [];
  let sitemapUrlCount = 0;
  const footerSpecs = siteFooterLinkSpecs(SITE_CHANGELOG_URL);

  const robotsPath = requireFile(outDir, "robots.txt", errors);
  if (robotsPath) errors.push(...checkRobots(readFileSync(robotsPath, "utf8"), base));

  const sitemapPath = requireFile(outDir, "sitemap.xml", errors);
  if (sitemapPath) {
    const result = checkSitemap(readFileSync(sitemapPath, "utf8"), base);
    sitemapUrlCount = result.urlCount;
    errors.push(...result.errors);
  }

  const llmsPath = requireFile(outDir, "llms.txt", errors);
  if (llmsPath) errors.push(...checkLlms(readFileSync(llmsPath, "utf8")));

  const llmsFullPath = requireFile(outDir, "llms-full.txt", errors);
  if (llmsFullPath) errors.push(...checkLlmsFull(readFileSync(llmsFullPath, "utf8")));

  const aiSetupMd = requireFile(outDir, "ai/setup.md", errors);
  if (aiSetupMd && !readFileSync(aiSetupMd, "utf8").includes("npx zedkit-ai setup")) {
    errors.push("ai/setup.md: missing setup command");
  }

  const homePath = requireFile(outDir, "index.html", errors);
  if (homePath) {
    const html = readFileSync(homePath, "utf8");
    errors.push(...checkMeta(html, "index.html", `${base}/`, base));
    errors.push(...checkSiteShell(html, "index.html", footerSpecs));
  }

  const notFoundPath = requireFile(outDir, "404.html", errors);
  if (notFoundPath) {
    const html = readFileSync(notFoundPath, "utf8");
    errors.push(...checkNotFound(html));
    errors.push(...checkSiteShell(html, "404.html", footerSpecs));
  }

  const docsIndex = requireFile(outDir, "docs.html", errors);
  if (docsIndex) {
    const html = readFileSync(docsIndex, "utf8");
    errors.push(...checkMeta(html, "docs.html", `${base}/docs`, base));
    errors.push(...checkSiteShell(html, "docs.html", footerSpecs));
  }

  const catalogPath = requireFile(outDir, "catalog.html", errors);
  if (catalogPath) {
    errors.push(...checkMeta(readFileSync(catalogPath, "utf8"), "catalog.html", `${base}/catalog`, base));
  }

  const sampleDoc = firstDocHtml(outDir);
  if (!sampleDoc) {
    errors.push("docs export: no sample .html page under docs/");
  } else {
    const html = readFileSync(sampleDoc, "utf8");
    const rel = sampleDoc.slice(outDir.length).replace(/\.html$/, "");
    errors.push(...checkMeta(html, rel, `${base}${rel}`, base));
    errors.push(...checkSiteShell(html, "sample doc page", footerSpecs));
  }

  const registryRoot = join(HERE, "..", "..", "..");
  const brickNames = loadRegistryBrickNames(registryRoot);
  errors.push(...missingRegistryExports(brickNames, (rel) => existsSync(join(outDir, rel))));
  walkHtml(outDir, (html) => {
    errors.push(...checkHtmlRegistryLinks(html, (rel) => existsSync(join(outDir, rel))));
  });

  if (errors.length > 0) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
    return;
  }
  console.log(
    `docs-seo-export: ok (${outDir}, ${sitemapUrlCount} sitemap URLs, ${brickNames.length} registry JSON).`,
  );
}

const invoked = process.argv[1] ? resolve(process.argv[1]) : null;
if (invoked === fileURLToPath(import.meta.url)) main();
