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
- `hkdfKey(masterKey, info, { salt?, length? })` — derive a purpose-bound
  key (default 32 bytes) from one master secret with HKDF-SHA256. Same
  inputs, same key; `info` separates purposes. An empty master throws.
- `sealSecret(masterKey, info, plaintext)` / `openSecret(masterKey, info,
  sealed)` — AES-256-GCM envelope (12-byte IV, ciphertext, 16-byte tag)
  for credentials you must read back. The key comes from `hkdfKey`.
  `openSecret` throws on a wrong master or `info`, tampering, or
  truncation. Rotating the master means re-sealing stored values.
- `checkoutSuffix(cwd)` / `suffixedDatabaseUrl(baseUrl, cwd)` /
  `databaseNameFromUrl(url)` — per-checkout test database names so parallel
  checkouts do not drop each other's database; the last one throws on any
  name outside `[A-Za-z0-9_]`.
- `clientKeyFromForwardedFor(header, fallback = "local")` — rate-limit
  key from `X-Forwarded-For`: the last entry (appended by your proxy),
  never the spoofable first. Correct behind exactly one trusted proxy.
- `checkEndpointUrl(url, { allowPrivate? })` / `isPrivateHostname(host)` —
  SSRF guard for URLs your server calls on a customer's behalf (webhook
  targets, callbacks). http/https only; refuses loopback, private,
  link-local (cloud metadata), CGNAT, reserved and special-use names, and
  sees through decimal/octal/hex IPv4 and IPv6 with an embedded IPv4.
  Returns `{ ok: true, value: undefined }` or `{ ok: false, error }`. It
  does not resolve DNS, so a name that points at a private address at
  send time (DNS rebinding) is not caught.
- `computeBackoffMs(attemptNo, random?)` — exponential retry backoff
  (2s × 3^(n-1), ±20% jitter, 1s floor, 1h cap).
- `webhookSignatureHeader(secret, body, timestamp)` /
  `verifyWebhookSignatureHeader(secret, body, header, options?)` —
  Stripe-style `t=…,v1=…` HMAC signatures over exact body bytes, with an
  optional freshness check. Bring your own secret; an empty secret is rejected.
- `@zedtech/zedkit-server/webhook-web` — `verifyWebhookSignatureWeb`
  (async, Web Crypto only): same header format, default ±300 s tolerance
  both ways; for edge and browser runtimes without `node:crypto`.
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
