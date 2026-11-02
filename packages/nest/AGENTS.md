# AGENTS.md — @zedtech/zedkit-nest

1. Generic NestJS bootstrap factory: `createNestApp` wires Fastify,
   validated env, request-id logs, strict validation, uniform errors,
   throttling, OpenAPI, shutdown. Zero product names or logic in `src`;
   test fixtures stay product-free too (the `inventory` domain).
2. TypeScript strict, ESM, Node 22, pnpm. Dev deps use `catalog:`
   pins; peerDependencies use `^` ranges from the same pins (one copy
   per app — Nest DI breaks across duplicates). Runtime dep:
   `@zedtech/zedkit-core` (`tryCatch` in the optional log-line transform).
3. No raw `try`/`catch`: use `tryCatch`/`tryCatchAsync` from
   `@zedtech/zedkit-core` (add a `workspace:*` dep if a module ever needs it).
4. Explicit named exports from `src/index.ts` (no `export *`, no default
   exports) — the catalog check verifies each one appears in CATALOG.md.
5. No `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, or `any`
   without a one-line reason. No skipped tests.
6. Tests boot the factory with the fixture module and hit it over HTTP
   (supertest, ephemeral ports). Deterministic; no external network.
   Do not remove `swc.vite()` from `vitest.config.ts` (see README).
   `tsconfig.json` is the check config (src + tests); `tsconfig.build.json`
   emits `dist` — kept split because SWC infers decorator options from
   `tsconfig.json`.
7. Standard Nest pieces only. A custom line needs a one-line
   justification (why no Nest/npm option exists). Prefer deleting code
   over rewriting it; keep the options surface minimal.
8. Every new export needs a CATALOG.md entry; regenerate `catalog.json`
   (`pnpm catalog:build` from the root).
9. Definition of done: `pnpm --filter @zedtech/zedkit-nest typecheck && pnpm --filter @zedtech/zedkit-nest lint && pnpm --filter @zedtech/zedkit-nest build && pnpm --filter @zedtech/zedkit-nest test`
   green (each command separately), `pnpm catalog:check` green.
