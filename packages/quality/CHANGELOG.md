# @zedtech/zedkit-quality

## 1.1.1

### Patch Changes

- 3e25575: Add `nodePreset` for Node/TS packages: eslint + typescript-eslint recommended, raw try/catch ban, and deep relative import ban.

## 1.1.0

### Minor Changes

- a521431: Ship `zedkit-sync-env`, `zedkit-check-no-artifacts`, and `zedkit-check-no-secrets` as package bins. Artifact dirs/files/allowlist are parameterized (`--dirs` / `--files` / `--allow`); the ignore check uses `--no-index` so ignored-but-tracked files fail. Existing eslint/tsconfig exports are unchanged.

### Patch Changes

- 3061a0a: Group `zedkit-check-no-artifacts` directory names so they match path segments (`build/`, `coverage/`), not substrings in filenames like `tsconfig.build.json`.
- 2fde8ae: Catalog entries for Theme, Motion and the TypeScript base now type their adoption (CSS import, CSS directive, utilities, attributes, extended config) instead of listing prose as exports. No code change; the install steps on the docs site are generated from these lines.

## 1.0.0

### Major Changes

- f283163: Catalog maturity Option B: 60 stable, 39 beta, and 8 alpha needs; docs badges only for alpha (sidebar), beta (page + catalog), and none for stable or on the home gallery.

  **1.0.0** on ui, core, server, nest, seo, quality, and payload-seo marks stable catalog entries under real semver. This release does not change runtime behavior by itself — it is a honesty and labeling step. The semver guarantee applies to **stable** needs only (no badge on the docs site). Alpha and beta entries in the same package can still change in minors with migration notes and are not covered by that guarantee.

  **Consumers:** move dependencies from `~0.x` to `^1.0.0` on the packages you use. Follow each package `CHANGELOG.md` for any migrations you have not applied yet (for example ui 0.8–0.9). Packages that stay on 0.x (ai, observability, flags, devtools, i18n, storage) receive minor bumps for catalog status only.

## 0.6.1

### Patch Changes

- fa7ce48: Declare `engines.node` (`>=22`) on every published package; CI blocks tarballs that omit it (reliability R33).

## 0.6.0

### Minor Changes

- 0a30b88: `uiPreset` flags raw focus ring widths (`focus:ring-2`, `focus-visible:ring-2`). Use `focus-ring` or `focus-ring-control`. Decorative `ring-1` and `ring-0` stay.

## 0.5.0

### Minor Changes

- d9da994: `uiPreset` flags arbitrary px/rem in className (`w-[13px]`, `gap-[0.75rem]`). Use the spacing scale (`w-4`, `gap-3`) or the type scale (`text-sm`). Radix CSS variables (`w-[var(--radix-*)]`) stay.

## 0.4.0

### Minor Changes

- 46c235e: `defineLayers` preset `feature-folders`: UI imports ports, adapters are injected at the composition root, model is pure.
- 4cf76ea: `uiPreset` flags explicit `any` (`@typescript-eslint/no-explicit-any`). Name the type, or use `unknown` and narrow. Inline `style` was already banned.
- 0f2db66: `uiPreset` caps UI files at 300 lines and functions at 60. Inline `style` was already banned.
- d074cfd: UI hosts take `ref` as a prop (`ComponentProps<"el">`) and set `data-slot` on each exported root. The quality preset flags `forwardRef` and points at `packages/ui/src/button.tsx`. Upgrade notes: docs/migrations/ui-ref-and-messages.md.

### Patch Changes

- 7f8bfbe: Lint messages include the charter rule id and the explanation; they no longer point at the charter file.

## 0.3.2

### Patch Changes

- 2a0b658: `defineLayers` accepts an empty `actionPatterns` (views may legitimately import data): the view ban is omitted instead of emitting an invalid empty group.

## 0.3.1

### Patch Changes

- e7f0312: Promote the three catalog needs to beta (tested, documented, reviewed) and lock beta example evidence.

## 0.3.0

### Minor Changes

- c0f4692: `defineLayers` accepts `extraPatterns` (`{ kitScope?, viewData?, dataUi? }`) so consumers can add their own `no-restricted-imports` bans without replacing the preset blocks.

## 0.2.0

### Minor Changes

- 8e983cc: Initial release: shared quality setup (UI lint preset, layer boundaries, strict tsconfig base).

### Patch Changes

- e051e19: Config-only package: exports map to committed source (no build step, declared `zedkit.noBuild`), and the repo dogfoods the preset from its own root config.
