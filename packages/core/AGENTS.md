# AGENTS.md — @zedtech/zedkit-core

1. Foundational package: `Result`, `tryCatch`/`tryCatchAsync`, prefixed
   IDs. Zero business logic; the only runtime dependency is `ulid`.
2. TypeScript strict, ESM, Node 22, pnpm. Deps use `catalog:` only.
3. This package owns the `TryStatement` lint exception: only
   `src/try-catch.ts` may use raw `try`/`catch`, because it implements
   the wrappers. Everything else (including tests) uses them.
4. Explicit named exports from `src/index.ts` (no `export *`, no default
   exports) — the catalog check verifies each one appears in CATALOG.md.
5. No `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, or `any`
   without a one-line reason. No skipped tests. Caps: <=60/function,
   complexity <=10.
6. Tests: vitest unit only, through the public interface. Deterministic;
   no network. Typecheck covers `src` and `tests`.
7. Every new export needs a CATALOG.md entry; regenerate `catalog.json`
   (`pnpm catalog:build` from the root).
8. Definition of done: `pnpm --filter @zedtech/zedkit-core typecheck && pnpm --filter @zedtech/zedkit-core lint && pnpm --filter @zedtech/zedkit-core build && pnpm --filter @zedtech/zedkit-core test`
   green (each command separately), `pnpm catalog:check` green.

## Domain and identity

- Public hygiene (`tryCatch`, no secrets): [public-hygiene.md](../../.agents/domain/public-hygiene.md)
- Cursor pointer: [packages-core.mdc](../../.cursor/rules/packages-core.mdc) only
  names this file.
