# AGENTS.md — @zedtech/zedkit-brand

1. The zedkit logos only: mark, wordmark, lockup. Plain data in
   `src/geometry.ts`; the string builder (`src/svg.ts`) and the React
   component (`src/react.tsx`) both read it. Never fork the path data.
2. No dependency on `@zedtech/zedkit-ui`. The main entry has no React
   dependency; `./react` peers `react`.
3. `assets/*.svg` are generated, never hand-edited. Change the geometry or
   the builders, then run `UPDATE_ASSETS=1 pnpm --filter
   @zedtech/zedkit-brand test`. No committed binaries (PNG, ICO).
4. TypeScript strict, ESM, Node 22, pnpm. Explicit named exports; each
   symbol in CATALOG.md. No raw `try`/`catch`. No skipped tests.
5. Definition of done: `pnpm --filter @zedtech/zedkit-brand typecheck &&
   lint && build && test` green, `pnpm catalog:check` green.
