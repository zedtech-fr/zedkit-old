# Catalog — @zedtech/zedkit-quality

- Keywords: eslint, eslint-config, tsconfig, typescript, strict, layers, architecture, a11y, tailwindcss, code-quality
- Audience: Teams keeping the same quality gates across repos.
- Purpose: Shared quality setup: UI lint preset, route/view/data layer boundaries, and one strict TypeScript base — consume, do not copy.


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

- Import: `@zedtech/zedkit-quality/tsconfig`
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
