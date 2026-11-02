# @zedtech/zedkit-seo

## 1.0.0

### Major Changes

- f283163: Catalog maturity Option B: 60 stable, 39 beta, and 8 alpha needs; docs badges only for alpha (sidebar), beta (page + catalog), and none for stable or on the home gallery.

  **1.0.0** on ui, core, server, nest, seo, quality, and payload-seo marks stable catalog entries under real semver. This release does not change runtime behavior by itself — it is a honesty and labeling step. The semver guarantee applies to **stable** needs only (no badge on the docs site). Alpha and beta entries in the same package can still change in minors with migration notes and are not covered by that guarantee.

  **Consumers:** move dependencies from `~0.x` to `^1.0.0` on the packages you use. Follow each package `CHANGELOG.md` for any migrations you have not applied yet (for example ui 0.8–0.9). Packages that stay on 0.x (ai, observability, flags, devtools, i18n, storage) receive minor bumps for catalog status only.

## 0.1.6

### Patch Changes

- fa7ce48: Declare `engines.node` (`>=22`) on every published package; CI blocks tarballs that omit it (reliability R33).

## 0.1.5

### Patch Changes

- 440ae47: `truncateDescription` now keeps the last complete sentence that fits
  the 160-char cap instead of slicing mid-sentence with an ellipsis.
  Sentence ends must be followed by a capital, so decimals, domains and
  "e.g." never cut early; the hard slice remains as fallback.

## 0.1.4

### Patch Changes

- db86533: Docs: getting started SEO scenario (#301).
- fa20bd4: Docs: SEO package row links to Scenario — SEO (#301).

## 0.1.3

### Patch Changes

- 818bb02: Add `localeInPath` for single-locale sites whose URLs omit a locale prefix.

## 0.1.2

### Patch Changes

- 03cacd0: Catalog: every need documents its short name, audience, purpose, when to (not) use it, and related needs (single-sourced from CATALOG.md, enforced by `pnpm catalog:check`), feeding the doc pages.

## 0.1.1

### Patch Changes

- 59a12be: Discoverability: benefit-oriented descriptions, 8–12 npm keywords, homepage and bugs links per package (single-sourced from the CATALOG.md header, enforced by `pnpm catalog:check`), plus README badges and Install/Usage/When-to-use sections.

## 0.1.0

### Minor Changes

- e081fcf: Initial release: robots, sitemaps, video sitemap, JSON-LD, metadata, llms.txt, slugs.
