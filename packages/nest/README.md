# @zedtech/zedkit-nest

[![npm version](https://img.shields.io/npm/v/@zedtech/zedkit-nest.svg)](https://www.npmjs.com/package/@zedtech/zedkit-nest)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/zedtech-fr/zedkit/blob/main/LICENSE)

Boot a production-ready NestJS API from one factory call: validation,
logging, docs, throttling, errors and graceful shutdown included.
Original work by the same author.

Install from npm only (no shadcn registry copy path). See
[install or copy on the docs site](https://zedkit.app/docs/getting-started#install-or-copy)
for how that differs from UI bricks.

## Install

Framework pieces are peer dependencies (one copy per app — required for
Nest DI). Install them alongside:

```sh
pnpm add @zedtech/zedkit-nest @fastify/static @nestjs/common @nestjs/config \
  @nestjs/core @nestjs/platform-fastify @nestjs/swagger @nestjs/throttler \
  class-transformer class-validator fastify nestjs-pino pino pino-http \
  reflect-metadata
```

## Usage

`createNestApp({ module, envSchema, docs, ... })` wires only standard
pieces and returns the app ready to `listen()`:

- Fastify platform (`platform-fastify`) with exact raw bodies
  (`{ rawBody: true }`, proven by test) and a configurable body cap.
- Validated env (`@nestjs/config` + a class-validator schema per app;
  boot fails fast with one readable error).
- Request-id JSON logs (`nestjs-pino`): honors `x-request-id`,
  generates a UUID otherwise; one id across logs and error bodies.
  `Authorization` and cookies are redacted from logs by default.
  Optional `logger.serializers`, `logger.customLogLevel`, and
  `logger.transformLine` pass through to pino-http / wrap the sink
  (`compactRequestSerializers` and `createRequestLogLevel({ quietPaths })`
  are the compact-line helpers). Unset, today's logger is unchanged.
- Strict global `ValidationPipe` (whitelist, forbid non-whitelisted,
  transform; implicit conversion off — see below). Relax per app with
  `validation: { whitelist: false, forbidNonWhitelisted: false }`.
- One global error shape: `{ code, message, requestId }` (+ status).
  4xx carries the safe message; 5xx never leaks internals. Every response
  echoes `x-request-id` (interceptor on handled routes, filter otherwise).
  Apps with domain errors subclass `AllExceptionsFilter` and override
  `toStatusBody` / `unknownBodyParseError` / `formatBody`, then pass the
  subclass via `exceptionFilter`. String-response HttpException 400/413/415
  still echo the driver text unless the subclass sets
  `sanitizeStringHttpExceptions = true` (opt-in; making that the default
  is a later decision).
- Optional global throttler (`@nestjs/throttler`, default 100/min;
  in-memory, single process — set `trustProxy` before running behind a
  proxy or every client shares one bucket).
- Generated OpenAPI (`@nestjs/swagger`), served as raw Fastify routes:
  public by design, guards do not apply. Enabled by default except in
  production (`NODE_ENV=production`) — opt back in explicitly if you
  serve docs in prod. `docs.aliases` serves the same JSON from extra
  absolute paths. Shutdown hooks.
- Custom body parsers per content type (`bodyParsers`), installed
  before Nest's defaults so an `application/json` entry replaces the
  default parser; rawBody capture included.

```ts
import "reflect-metadata";
import { createNestApp } from "@zedtech/zedkit-nest";

const app = await createNestApp({
  module: AppModule,
  envSchema: AppEnv,
  docs: { title: "My API", version: "v1" },
});
await app.listen(3000);
```

## When to use

Reach for this package when you start a NestJS API and want secure,
observable defaults instead of a blank schematic. For framework-free
server helpers (rate limiting, redaction) see
`@zedtech/zedkit-server` instead.

Rules (non-negotiable):

- Zero product names or logic.
- Numbers need explicit `@Type(() => Number)` (env ints, nested
  DTOs): implicit conversion relies on decorator metadata, which
  vitest can only emit via SWC — and the day one suite forgets SWC,
  implicit conversion silently diverges from `tsc`.
- Tests boot the factory with a product-free fixture domain and hit
  it over HTTP (supertest, ephemeral ports): validation, exact raw
  bytes, error shapes, throttling, request ids, docs, env failure.

Vitest transforms via SWC (`swc.vite()`, options inferred from
tsconfig): esbuild cannot emit decorator metadata, which would
silently disable the global `ValidationPipe` in tests. Never remove
it. Agent rules: [AGENTS.md](AGENTS.md)

Find helpers by need in [CATALOG.md](CATALOG.md).

## Install or copy?

Install: this package is framework integration (DI, decorators, peer
dependencies), not suitable for source-copying.

## Verify

```sh
pnpm --filter @zedtech/zedkit-nest typecheck && pnpm --filter @zedtech/zedkit-nest lint && pnpm --filter @zedtech/zedkit-nest build && pnpm --filter @zedtech/zedkit-nest test
```
