# Catalog — @zedtech/zedkit-quality

- Keywords: eslint, eslint-config, tsconfig, typescript, strict, layers, architecture, a11y, tailwindcss, code-quality, ci, hygiene
- Audience: Teams keeping the same quality gates across repos.
- Purpose: Shared quality setup: UI lint preset, route/view/data layer boundaries, one strict TypeScript base, and repo hygiene bins — consume, do not copy.


## Lint Node and TypeScript libraries

- Import: `@zedtech/zedkit-quality/eslint` — `nodePreset`
- Wraps: `@eslint/js`, `typescript-eslint`
- Status: stable
- Short name: NodePreset
- Audience: Backend and library packages that share the same try/catch and import-depth rules as the monorepo root.
- Purpose: Spread eslint + typescript-eslint recommended, ban raw try/catch (point callers at `tryCatch` / `tryCatchAsync`), and ban deep `../..` imports in favor of `#*` subpaths.
- When to use: When a package eslint.config.mjs today copies the root Node block from another repo.
- When not to use: When the package is UI-only (use `Lint UI files for accessibility, Tailwind and tokens`).
- See also: `Lint UI files for accessibility, Tailwind and tokens`

```ts
import { nodePreset } from "@zedtech/zedkit-quality/eslint";

export default [
  ...nodePreset(),
  { ignores: ["dist/**"] },
  { files: ["src/try-catch.ts"], rules: { "no-restricted-syntax": "off" } },
];
```

## Lint UI files for accessibility, Tailwind and tokens

- Import: `@zedtech/zedkit-quality/eslint` — `uiPreset`
- Wraps: `eslint-plugin-jsx-a11y`, `eslint-plugin-better-tailwindcss`, `typescript-eslint`
- Status: stable
- Short name: UiPreset
- Audience: Frontend teams linting tsx/jsx everywhere the same way.
- Purpose: Enforce a11y, Tailwind hygiene, tokens-only classes (no arbitrary px/rem, no raw focus:ring-N), no inline style, no forwardRef, no explicit any, and a 300/60 size budget on every UI file.
- When to use: When UI rules must match across repos without copying a preset file.
- When not to use: When the repo has no Tailwind theme (the entryPoint has nothing to read).
- See also: `Enforce route, view and data layer boundaries`

```ts
import { uiPreset } from "@zedtech/zedkit-quality/eslint";

export default [...uiPreset({ entryPoint: "./app/globals.css" })];
```

## Enforce route, view and data layer boundaries

- Import: `@zedtech/zedkit-quality/eslint` — `defineLayers`
- Wraps: `eslint`
- Status: stable
- Short name: DefineLayers
- Audience: Frontend teams keeping routes thin, views presentational and data UI-free.
- Purpose: Ban cross-layer imports (route to kit, view to data client, data to UI) at lint time.
- When to use: When features map onto route/view/data folders and bypasses must fail the gate.
- When not to use: When the repo has no layered folders (nothing to map the globs onto), or when features live in `features/<name>/{ui,ports,adapters,model}` (use `Enforce feature-folder ports and adapters`).
- See also: `Lint UI files for accessibility, Tailwind and tokens`, `Enforce feature-folder ports and adapters`

```ts
import { defineLayers } from "@zedtech/zedkit-quality/eslint";

export default [
  ...defineLayers({
    kitPackage: "@acme/ui",
    viewDirs: ["app/**/ui/**"],
    dataDirs: ["lib/**"],
    actionPatterns: ["@/lib/*", "**/actions", "**/actions/**"],
  }),
];
```

## Enforce feature-folder ports and adapters

- Import: `@zedtech/zedkit-quality/eslint` — `defineLayers`
- Wraps: `eslint`
- Status: stable
- Short name: FeatureFolders
- Audience: Teams that colocate each feature as `features/<name>/{ui,ports,adapters,model}`.
- Purpose: Ban UI→adapter imports, keep the model pure, and leave adapter injection to the composition root.
- When to use: When each feature owns ui/ports/adapters/model folders and bypasses must fail the gate.
- When not to use: When the repo maps onto route/view/data folders (use `Enforce route, view and data layer boundaries`).
- See also: `Enforce route, view and data layer boundaries`

```ts
import { defineLayers } from "@zedtech/zedkit-quality/eslint";

export default [
  ...defineLayers({
    preset: "feature-folders",
    kitPackage: "@acme/ui",
    featureRoot: "features",
  }),
];
```

## Share one strict TypeScript base

- Import: `@zedtech/zedkit-quality/tsconfig` (tsconfig preset, not a JavaScript module)
- Extends: `@zedtech/zedkit-quality/tsconfig`
- Wraps: `(none)`
- Status: stable
- Short name: TsconfigBase
- Audience: TypeScript repos that want the same strictness without copying a file.
- Purpose: One strict base (`strict`, exact optionals, unchecked indexed access, unused checks) every tsconfig extends.
- When to use: When several tsconfigs must stay strict and identical.
- When not to use: When the repo needs looser settings (extend and override instead).
- See also: `Lint UI files for accessibility, Tailwind and tokens`

```ts
// tsconfig.json
{
  "extends": "@zedtech/zedkit-quality/tsconfig",
  "compilerOptions": { "outDir": "dist", "rootDir": "src" },
  "include": ["src"]
}
```

## Keep .env complete without overwriting local values

- Import: `@zedtech/zedkit-quality` (CLI bin, not a JavaScript module)
- Bin: `zedkit-sync-env`
- Wraps: `(none)`
- Status: alpha
- Short name: SyncEnv
- Audience: Teams whose `.env.example` gains keys across pulls and whose local `.env` must stay complete.
- Purpose: Copy `.env.example` on first run, then append missing keys only — existing values are never overwritten.
- When to use: At the start of `dev` / `build` so a new example key cannot silently fall back to a default.
- When not to use: When env files are generated another way (direnv, a secret manager, a deploy hook).
- See also: `Fail CI when secrets are tracked`

```ts
// package.json
{
  "scripts": {
    "dev": "zedkit-sync-env && next dev"
  }
}
```

## Fail CI when build artifacts are tracked

- Import: `@zedtech/zedkit-quality` (CLI bin, not a JavaScript module)
- Bin: `zedkit-check-no-artifacts`
- Wraps: `(none)`
- Status: alpha
- Short name: CheckNoArtifacts
- Audience: Teams that must never commit caches, build output, or oversized binaries.
- Purpose: Fail if tracked files match a parameterized artifact list, match `.gitignore` (including ignored-but-tracked, via `--no-index`), or exceed a size cap.
- When to use: As a CI hygiene step on every repo that already has a `.gitignore` for build output.
- When not to use: For secret scanning — use `zedkit-check-no-secrets`.
- See also: `Fail CI when secrets are tracked`

```ts
// package.json
{
  "scripts": {
    "check:artifacts": "zedkit-check-no-artifacts --allow '^docs/catalog/catalog\\.json$'"
  }
}
```

## Fail CI when secrets are tracked

- Import: `@zedtech/zedkit-quality` (CLI bin, not a JavaScript module)
- Bin: `zedkit-check-no-secrets`
- Wraps: `(none)`
- Status: alpha
- Short name: CheckNoSecrets
- Audience: Teams that must never commit `.env` files or high-signal credentials.
- Purpose: Fail if a tracked `.env` (other than `.env.example`) or a private key / token pattern is in git.
- When to use: As a CI hygiene step next to the artifact check.
- When not to use: As a substitute for a full secret scanner (GitHub secret scanning, gitleaks) on history.
- See also: `Fail CI when build artifacts are tracked`, `Keep .env complete without overwriting local values`

```ts
// package.json
{
  "scripts": {
    "check:secrets": "zedkit-check-no-secrets"
  }
}
```
