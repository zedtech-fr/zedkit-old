# AGENTS.md — @zedtech/zedkit-live

1. Framework-free and browser-safe: no React, no `node:` imports, no globals
   beyond `setTimeout`, `AbortController`, and `WebSocket` (injectable).
2. Only dependency is `@zedtech/zedkit-core` (`tryCatch`, `tryCatchAsync`).
3. TypeScript strict, ESM, vitest with fake timers and a fake socket (no network).
4. Every export in CATALOG.md; `pnpm catalog:check` after changes.
5. Definition of done: `pnpm --filter @zedtech/zedkit-live typecheck &&
   lint && build && test` green.
