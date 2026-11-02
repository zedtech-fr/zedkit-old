# Catalog — @zedtech/zedkit-nest

- Keywords: nestjs, nest, bootstrap, typescript, api, validation, logging, openapi, swagger, throttling, health-check, graceful-shutdown
- Audience: Teams starting a production NestJS API who want secure defaults, not a blank schematic.
- Purpose: Boot a production-ready NestJS app from one factory call: validation, logging, docs, throttling, errors and shutdown included.
- Attribution: Original work by the same author.


## Bootstrap a Nest app

- Import: `@zedtech/zedkit-nest` — `createNestApp`, `NestBootstrapOptions`, `ThrottleOptions`, `DocsOptions`, `LoggerOptions`, `ValidationOptions`, `REQUEST_ID_HEADER`, `RequestIdInterceptor`
- Wraps: `@nestjs/platform-fastify`, `@nestjs/config`, `@nestjs/swagger`, `@nestjs/throttler`, `nestjs-pino`, `class-validator`
- Status: stable
- Short name: Bootstrap
- Audience: Teams starting a production NestJS API with secure defaults.
- Purpose: Boot a hardened Nest app (validation, logging, docs, throttling, errors, shutdown) from one factory call.
- When to use: For every new Nest service that needs production defaults on day one.
- When not to use: For an existing app with its own bootstrap — adopt single pieces (logger, filter) instead.
- See also: `Ship request logs without leaking credentials`, `Return uniform error bodies`

```ts
import { createNestApp } from "@zedtech/zedkit-nest";
const app = await createNestApp({ module: AppModule, envSchema: AppEnv });
await app.listen(3000);
```

## Ship request logs without leaking credentials

- Import: `@zedtech/zedkit-nest` — `LoggerOptions`
- Wraps: `nestjs-pino`
- Status: stable
- Short name: Safe logs
- Audience: API developers who log requests but must never leak auth headers or cookies.
- Purpose: Request logging with auth headers and cookies redacted by default.
- When to use: Whenever request logs leave the process (files, collectors, consoles).
- When not to use: For full-fidelity debug of auth flows — reproduce locally with redaction off instead.
- See also: `Bootstrap a Nest app`, `Redact secrets before logging`

```ts
import { createNestApp } from "@zedtech/zedkit-nest";
const app = await createNestApp({
  module: AppModule,
  logger: { level: "info" }, // default: auth header + cookies redacted
});
```

## Return uniform error bodies

- Import: `@zedtech/zedkit-nest` — `AllExceptionsFilter`, `ErrorBody`
- Wraps: `(none)`
- Status: stable
- Short name: Error bodies
- Audience: API developers who want one error shape for every failure.
- Purpose: A global exception filter that returns the same error body for all failures.
- When to use: As the last-resort error mapper in front of API clients.
- When not to use: For domain validation errors with field detail — return those from the handler instead.
- See also: `Bootstrap a Nest app`, `Start a safe NestJS API`

```ts
import { AllExceptionsFilter } from "@zedtech/zedkit-nest";
// wired globally by createNestApp; reuse standalone:
app.useGlobalFilters(new AllExceptionsFilter());
```

## Start a safe NestJS API

- Import: `@zedtech/zedkit-nest` — `createNestApp`, `ErrorBody`; `@zedtech/zedkit-core` — `newPrefixedId`
- Wraps: `@nestjs/platform-fastify`, `nestjs-pino`, `@nestjs/throttler`, `class-validator`
- Status: stable
- Short name: Safe API tutorial
- Audience: Backend developers shipping a first HTTP API with validation, logging, rate limits, and stable error JSON.
- Purpose: End-to-end tutorial: boot with `createNestApp`, validate DTOs, return prefixed ids, and exercise the documented error shape with `curl`.
- When to use: When you want one walkthrough that wires nest, core ids, and the global error filter together.
- When not to use: When you only need a single piece — use the focused needs (`Bootstrap a Nest app`, `Return uniform error bodies`) instead.
- See also: `Bootstrap a Nest app`, `Return uniform error bodies`, `Generate prefixed unique IDs`

```ts
import { createNestApp } from "@zedtech/zedkit-nest";
import { newPrefixedId } from "@zedtech/zedkit-core";
const app = await createNestApp({ module: AppModule, envSchema: AppEnv });
await app.listen(3000);
// Walkthrough sources: packages/nest/examples/safe-api (compiled in @zedtech/zedkit-nest tests).
```
