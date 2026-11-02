# @zedtech/zedkit-server

[![npm version](https://img.shields.io/npm/v/@zedtech/zedkit-server.svg)](https://www.npmjs.com/package/@zedtech/zedkit-server)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/zedtech-fr/zedkit/blob/main/LICENSE)

Harden any Node server in minutes: in-process rate limiting, secret/PII
redaction for logs, HKDF crypto and HTTP helpers. Original work by the
same author. Zero runtime dependencies.

Install from npm only (no shadcn registry copy path). See
[install or copy on the docs site](https://zedkit.app/docs/getting-started#install-or-copy)
for how that differs from UI bricks.

## Install

```sh
pnpm add @zedtech/zedkit-server
```

## Usage

```ts
import { redactValue } from "@zedtech/zedkit-server";

logger.info({ event: "login", user: redactValue(user) });
```

## When to use

Reach for this package when you rate-limit, redact logs, sign webhooks,
or read database error codes on a Node server. For typed errors and IDs
see `@zedtech/zedkit-core` instead.

## API

- `MemoryRateLimiter` — fixed-window, in-process rate limiting:
  `allow(key, limitPerMinute)`. Empty or whitespace-only keys are denied.
  `new MemoryRateLimiter({ windowMs?, now?, maxKeys? })` changes the
  window (default 60 s), injects a clock for tests, and sets the key count
  past which expired windows are swept (default 10 000); live windows are
  never evicted.
  Correct for single-instance deployments;
  multi-instance enforcement needs a shared store behind the same shape.
- `redactValue(value, key?, options?)` — recursively replace credential-looking
  material with placeholders before logging. Secret-like keys become
  `"[redacted]"`, bearer/basic tokens become `"<scheme> [redacted]"`,
  cyclic references become `"[circular]"`. Scrubbing applies to every
  field; truncation is volume control only, so `msg`/`message`/`stack`
  are never truncated and everything else is bounded at 512 code points.
  Dates pass through; Maps, Sets, prototypes, and symbol keys are
  preserved. `options.valuePatterns` (`{ pattern, replacement }[]`) adds
  your own credential shapes: matches are replaced literally on every
  string, before the bearer/basic pattern.
- `computeBackoffMs(attemptNo, random?)` — exponential retry backoff
  (2s × 3^(n-1), ±20% jitter, 1s floor, 1h cap).
- `webhookSignatureHeader(secret, body, timestamp)` /
  `verifyWebhookSignatureHeader(secret, body, header, options?)` —
  Stripe-style `t=…,v1=…` HMAC signatures over exact body bytes, with an
  optional freshness check. Bring your own secret; an empty secret is rejected.
- `pgErrorCode(error)` — read the Postgres error code (`23505`
  unique, `23503` FK, ...) from a thrown value, or `null` when it
  has none. Also reads one `cause` level down, where ORMs keep the
  driver error. Lets callers decide conflict-vs-bug.
- `pgErrorRetryable(error)` — `true` for common transient SQLSTATE
  values (serialization, deadlock, connection loss), `false` for other
  Postgres codes, `null` when there is no Postgres `code`.

Find helpers by need in [CATALOG.md](CATALOG.md).

## Install or copy?

These modules are small and dependency-free: source-copying the files
is a sane alternative to installing (MIT allows it). Install the package
for versioned updates.

## Verify

```sh
pnpm --filter @zedtech/zedkit-server typecheck && pnpm --filter @zedtech/zedkit-server lint && pnpm --filter @zedtech/zedkit-server build && pnpm --filter @zedtech/zedkit-server test
```
