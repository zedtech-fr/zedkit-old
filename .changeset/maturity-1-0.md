---
"@zedtech/zedkit-ui": major
"@zedtech/zedkit-core": major
"@zedtech/zedkit-server": major
"@zedtech/zedkit-nest": major
"@zedtech/zedkit-seo": major
"@zedtech/zedkit-quality": major
"@zedtech/zedkit-payload-seo": major
"@zedtech/zedkit-ai": minor
"@zedtech/zedkit-observability": minor
"@zedtech/zedkit-flags": minor
"@zedtech/zedkit-devtools": minor
---

Catalog maturity Option B: 60 stable, 39 beta, and 8 alpha needs; docs badges only for alpha (sidebar), beta (page + catalog), and none for stable or on the home gallery.

**1.0.0** on ui, core, server, nest, seo, quality, and payload-seo marks stable catalog entries under real semver. This release does not change runtime behavior by itself — it is a honesty and labeling step. The semver guarantee applies to **stable** needs only (no badge on the docs site). Alpha and beta entries in the same package can still change in minors with migration notes and are not covered by that guarantee.

**Consumers:** move dependencies from `~0.x` to `^1.0.0` on the packages you use. Follow each package `CHANGELOG.md` for any migrations you have not applied yet (for example ui 0.8–0.9). Packages that stay on 0.x (ai, observability, flags, devtools, i18n, storage) receive minor bumps for catalog status only.
