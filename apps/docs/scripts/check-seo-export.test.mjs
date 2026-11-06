import assert from "node:assert/strict";
import test from "node:test";
import { join } from "node:path";
import { SITE_CHANGELOG_URL, siteFooterLinkSpecs } from "../lib/site-links.mjs";
import {
  checkHtmlRegistryLinks,
  checkLlms,
  checkLlmsFull,
  checkMeta,
  checkNotFound,
  checkRobots,
  checkSitemap,
  checkSiteShell,
  missingRegistryExports,
} from "./check-seo-export.mjs";

const base = "https://zedkit.app";
const footerSpecs = siteFooterLinkSpecs(SITE_CHANGELOG_URL);

function pageHtml({ canonical = `${base}/`, jsonLd = true, extras = "" } = {}) {
  const json = jsonLd ? '<script type="application/ld+json">{}</script>' : "";
  return [
    `<link rel="canonical" href="${canonical}">`,
    '<meta property="og:title">',
    '<meta property="og:description">',
    '<meta property="og:image">',
    '<meta property="og:url">',
    '<meta name="twitter:card">',
    json,
    "Maintained by ZED TECH",
    ...footerSpecs.map((link) => `href="${link.href}"`),
    'href="/docs"',
    extras,
  ].join("\n");
}

test("checkRobots is silent when Sitemap and Allow / are present", () => {
  assert.deepEqual(checkRobots(`Sitemap: ${base}/sitemap.xml\nAllow: /`, base), []);
});

test("checkRobots reports a missing Sitemap line and a missing Allow /", () => {
  assert.deepEqual(checkRobots("User-agent: *", base), [
    "robots.txt: missing Sitemap line for the site",
    "robots.txt: missing Allow /",
  ]);
});

test("checkSitemap is silent for three on-site URLs including home and /docs", () => {
  const xml = ["/", "/docs", "/catalog"].map((path) => `<loc>${base}${path === "/" ? "/" : path}</loc>`).join("");
  assert.deepEqual(checkSitemap(xml, base).errors, []);
  assert.equal(checkSitemap(xml, base).urlCount, 3);
});

test("checkSitemap reports too few URLs, an off-site loc, and missing home or /docs", () => {
  const xml = "<loc>https://example.com/other</loc><loc>https://zedkit.app/catalog</loc>";
  const { errors, urlCount } = checkSitemap(xml, base);
  assert.equal(urlCount, 2);
  assert.deepEqual(errors, [
    "sitemap.xml: expected at least 3 URLs, got 2",
    "sitemap.xml: URL not on site: https://example.com/other",
    "sitemap.xml: missing home URL",
    "sitemap.xml: missing /docs URL",
  ]);
});

test("checkLlms accepts the generated header and rejects anything else", () => {
  assert.deepEqual(checkLlms("# zedkit docs\n\n## Install or copy\n"), []);
  assert.deepEqual(checkLlms("# zedkit docs\n"), ["llms.txt: missing ## Install or copy section"]);
  assert.deepEqual(checkLlms("# other"), [
    "llms.txt: expected generated zedkit docs header",
    "llms.txt: missing ## Install or copy section",
  ]);
});

test("checkLlmsFull accepts buildLlmsFull sections", () => {
  const body =
    "# Install or copy\n\nnpm\n\n# Set up zedkit AI\n\nsteps\n\n# Documentation index\n\n# zedkit docs\n";
  assert.deepEqual(checkLlmsFull(body), []);
  assert.deepEqual(checkLlmsFull("# other"), [
    "llms-full.txt: expected # Install or copy header",
    "llms-full.txt: missing # Documentation index section",
    "llms-full.txt: missing # Set up zedkit AI section",
  ]);
});

test("checkMeta is silent for a complete page and accepts a bare home href", () => {
  assert.deepEqual(checkMeta(pageHtml(), "index.html", `${base}/`, base), []);
  assert.deepEqual(
    checkMeta(pageHtml({ canonical: base }), "index.html", `${base}/`, base),
    [],
  );
});

test("checkMeta reports missing canonical, og, twitter and JSON-LD", () => {
  const errors = checkMeta("<html></html>", "docs.html", `${base}/docs`, base);
  assert.equal(errors[0], "docs.html: missing canonical link");
  assert.ok(errors.includes('docs.html: missing meta property og:title'));
  assert.ok(errors.includes("docs.html: missing twitter:card meta"));
  assert.ok(errors.includes("docs.html: missing JSON-LD script"));
});

test("checkMeta reports a canonical that does not match the page", () => {
  const html = pageHtml({ canonical: `${base}/other` });
  assert.deepEqual(checkMeta(html, "docs.html", `${base}/docs`, base), [
    "docs.html: canonical must be https://zedkit.app/docs",
  ]);
});

test("checkNotFound requires noindex and forbids JSON-LD", () => {
  assert.deepEqual(checkNotFound('content="noindex, follow"'), []);
  assert.deepEqual(checkNotFound("<html></html>"), ["404.html: expected robots noindex metadata"]);
  assert.deepEqual(checkNotFound('content="noindex"><script type="application/ld+json">'), [
    "404.html: must not ship indexable JSON-LD",
  ]);
});

test("checkSiteShell is silent when footer text, footer hrefs and /docs are present", () => {
  assert.deepEqual(checkSiteShell(pageHtml(), "index.html", footerSpecs), []);
});

test("checkSiteShell names the missing footer text, link and docs nav", () => {
  assert.deepEqual(checkSiteShell("<html></html>", "404.html", footerSpecs), [
    "404.html: missing maintainer footer text",
    ...footerSpecs.map((link) => `404.html: missing footer link ${link.label} (${link.href})`),
    "404.html: missing Documentation nav link",
  ]);
});

test("missingRegistryExports names a brick whose JSON is absent", () => {
  const present = new Set([join("r", "button.json")]);
  assert.deepEqual(missingRegistryExports(["button"], (rel) => present.has(rel)), []);
  assert.deepEqual(missingRegistryExports(["toast"], (rel) => present.has(rel)), [
    `missing static export ${join("r", "toast.json")} (run registry:build before docs export).`,
  ]);
});

test("checkHtmlRegistryLinks names a linked brick whose JSON is missing", () => {
  const present = new Set([join("r", "button.json")]);
  assert.deepEqual(checkHtmlRegistryLinks('href="/r/button.json"', (rel) => present.has(rel)), []);
  assert.deepEqual(checkHtmlRegistryLinks('href="/r/toast.json"', (rel) => present.has(rel)), [
    `export HTML links to /r/toast.json but ${join("r", "toast.json")} is missing.`,
  ]);
});
