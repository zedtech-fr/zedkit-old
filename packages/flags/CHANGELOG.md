# @zedtech/zedkit-flags

## 0.3.0

### Minor Changes

- f283163: Catalog maturity Option B: 60 stable, 39 beta, and 8 alpha needs; docs badges only for alpha (sidebar), beta (page + catalog), and none for stable or on the home gallery.

  **1.0.0** on ui, core, server, nest, seo, quality, and payload-seo marks stable catalog entries under real semver. This release does not change runtime behavior by itself — it is a honesty and labeling step. The semver guarantee applies to **stable** needs only (no badge on the docs site). Alpha and beta entries in the same package can still change in minors with migration notes and are not covered by that guarantee.

  **Consumers:** move dependencies from `~0.x` to `^1.0.0` on the packages you use. Follow each package `CHANGELOG.md` for any migrations you have not applied yet (for example ui 0.8–0.9). Packages that stay on 0.x (ai, observability, flags, devtools, i18n, storage) receive minor bumps for catalog status only.

### Patch Changes

- Updated dependencies [f283163]
  - @zedtech/zedkit-core@1.0.0

## 0.2.3

### Patch Changes

- fa7ce48: Declare `engines.node` (`>=22`) on every published package; CI blocks tarballs that omit it (reliability R33).
- Updated dependencies [fa7ce48]
  - @zedtech/zedkit-core@0.2.2

## 0.2.2

### Patch Changes

- e1d2a22: getFlag return types widen boolean, string, and number flags beyond registry literal defaults.

## 0.2.1

### Patch Changes

- Updated dependencies [a810ef0]
- Updated dependencies [867edd7]
- Updated dependencies [6cf1204]
  - @zedtech/zedkit-core@0.2.1

## 0.2.0

### Minor Changes

- 58e9cf1: Initial `@zedtech/zedkit-flags`: typed registry, in-memory and JSON/env providers, server `getFlag`, React `useFlag` with local override storage, and OpenFeature re-exports.

### Patch Changes

- Updated dependencies [f6df11a]
- Updated dependencies [b4ceccb]
  - @zedtech/zedkit-core@0.2.0
