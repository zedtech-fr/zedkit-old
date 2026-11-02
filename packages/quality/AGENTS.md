# AGENTS.md — @zedtech/zedkit-quality

1. Config-only package: an ESLint entry (`.mjs` + hand-written `.d.mts`,
   shipped as source), a strict `tsconfig.base.json`, and hygiene bins
   under `src/bin` (`zedkit-sync-env`, `zedkit-check-no-artifacts`,
   `zedkit-check-no-secrets`). No build step (`"zedkit": { "noBuild":
   true }`, exempt from the pack gate's dist requirement); config and
   bins must be consumable with zero build.
2. Node 22, pnpm, ESM. Deps use `catalog:` only. Peer deps (`eslint`,
   `eslint-plugin-jsx-a11y`, `eslint-plugin-better-tailwindcss`,
   `typescript-eslint`) are also devDeps so the tests load the real plugins.
3. Explicit named exports from `src/index.mjs` (no `export *`, no default
   exports); the `.d.mts` files mirror them and `tests/types/usage.ts`
   proves they typecheck.
4. TypeScript strict applies to `tests/types` and the fixtures; unit tests
   are `.mjs`. The tsconfig smoke uses the TypeScript API (no `tsc`
   spawn). Hygiene-bin tests spawn the scripts in a throwaway git repo.
5. No `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, or `any`
   without a one-line reason. No skipped tests.
6. Every export and subpath needs a CATALOG.md entry; regenerate
   `catalog.json` (`pnpm catalog:build` from the root).
7. `uiPreset` moves `eslint/ui-preset.mjs` logic verbatim (only
   `entryPoint` is a parameter); `defineLayers` encodes the
   route/view/data doctrine from the `console-architecture` agent,
   plus preset `feature-folders` (ui→ports, adapters at the
   composition root, model pure). The live example lives in
   `apps/docs/features/note-list`, not under `components/demos`.
8. Definition of done: `pnpm --filter @zedtech/zedkit-quality typecheck
   && pnpm --filter @zedtech/zedkit-quality lint
   && pnpm --filter @zedtech/zedkit-quality test` green (each command
   separately), `pnpm catalog:check` green.
