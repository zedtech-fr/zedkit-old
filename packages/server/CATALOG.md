# Catalog — @zedtech/zedkit-server

- Keywords: nodejs, server, environment, zod, rate-limit, rate-limiting, redaction, pii, secrets, logging, hkdf, crypto, http
- Audience: Node server developers who need hardening without a framework.
- Purpose: Harden any Node server in minutes: boot-time env parsing, rate limiting, secret/PII redaction, HKDF crypto and HTTP helpers.
- Attribution: Original work by the same author.


## Fail fast on bad environment variables

- Import: `@zedtech/zedkit-server` — `loadEnv`
- Wraps: `zod`
- Status: stable
- Short name: loadEnv
- Audience: Node service authors who want typed `process.env` without Nest.
- Purpose: Parse env with a zod shape and throw one readable error at boot.
- When to use: Standalone workers, scripts, and services that do not use the Nest config hook.
- When not to use: Inside Nest apps — use the nest package env validation instead.
- See also: `Bootstrap a Nest app`

```ts
import { loadEnv } from "@zedtech/zedkit-server";
import { z } from "zod";
const env = loadEnv({ PORT: z.coerce.number(), DATABASE_URL: z.string().url() });
```

## Rate-limit calls per key

- Import: `@zedtech/zedkit-server` — `MemoryRateLimiter`
- Wraps: `(none)`
- Status: stable
- Short name: Rate limiting
- Audience: Node developers protecting endpoints from abuse without infrastructure.
- Purpose: In-process per-key rate limiting with a two-line check.
- When to use: For single-instance services and per-IP/per-user throttling.
- When not to use: Across multiple instances — use a shared-store (Redis) limiter instead.

```ts
import { MemoryRateLimiter } from "@zedtech/zedkit-server";
const limiter = new MemoryRateLimiter();
if (!limiter.allow(clientIp, 100)) return tooManyRequests();
```

## Redact secrets before logging

- Import: `@zedtech/zedkit-server` — `redactValue`
- Wraps: `(none)`
- Status: stable
- Short name: Redaction
- Audience: Server developers who log objects that may contain tokens or PII.
- Purpose: Deep-redact secrets and PII from any value before it reaches the logs.
- When to use: On every object logged outside a trusted debug session.
- When not to use: When you need the real values — debug locally, never in shared logs.
- See also: `Ship request logs without leaking credentials`

```ts
import { redactValue } from "@zedtech/zedkit-server";
logger.info(redactValue({ user, token, headers }));
```

## Retry with exponential backoff

- Import: `@zedtech/zedkit-server` — `computeBackoffMs`
- Wraps: `(none)`
- Status: stable
- Short name: Backoff
- Audience: Developers calling flaky dependencies (APIs, queues, databases).
- Purpose: Compute exponential-backoff delays with jitter from the attempt number.
- When to use: Around retries of transient failures (network, 429, 503).
- When not to use: For permanent errors (4xx validation) — fail fast instead of retrying.

```ts
import { computeBackoffMs } from "@zedtech/zedkit-server";
const waitMs = computeBackoffMs(failedAttemptNo);
await sleep(waitMs);
```

## Sign and verify webhook deliveries

- Import: `@zedtech/zedkit-server` — `webhookSignatureHeader`, `verifyWebhookSignatureHeader`, `VerifyWebhookOptions`
- Wraps: `(none)`
- Status: stable
- Short name: Webhook signatures
- Audience: Developers receiving webhooks who must prove the sender and freshness.
- Purpose: Sign outgoing and verify incoming webhook payloads (HMAC + timestamp window).
- When to use: For every webhook endpoint exposed to a third party.
- When not to use: For internal service-to-service calls — use mTLS or network policy instead.

```ts
import { verifyWebhookSignatureHeader as verify } from "@zedtech/zedkit-server";
if (!verify(secret, rawBody, headers["webhook-signature"], { maxAgeSeconds: 300 })) {
  return unauthorized();
}
```

## Tell a Postgres conflict from a bug

- Import: `@zedtech/zedkit-server` — `pgErrorCode`
- Wraps: `(none)`
- Status: stable
- Short name: Postgres errors
- Audience: Developers mapping Postgres driver errors to HTTP responses.
- Purpose: Extract the Postgres error code so unique violations map to 409, not 500.
- When to use: Around writes where a conflict is an expected outcome (signup, idempotent creates).
- When not to use: For query building or migrations — use your ORM or migration tool instead.
- See also: `Return uniform error bodies`

```ts
import { pgErrorCode } from "@zedtech/zedkit-server";
try {
  await db.insert(users).values(row);
} catch (error) {
  if (pgErrorCode(error) === "23505") return conflict();
  throw error;
}
```

## Retry transient Postgres failures

- Import: `@zedtech/zedkit-server` — `pgErrorRetryable`
- Wraps: `(none)`
- Status: stable
- Short name: Postgres retry
- Audience: Workers and job runners using `@zedtech/zedkit-core` backoff helpers.
- Purpose: Map serialization/deadlock/connection errors to retry without duplicating SQLSTATE lists.
- When to use: After a failed query in a retry loop.
- When not to use: For HTTP mapping — use `pgErrorCode` and your API error model.
- See also: `Tell a Postgres conflict from a bug`

```ts
import { pgErrorRetryable } from "@zedtech/zedkit-server";
import { computeBackoffMs } from "@zedtech/zedkit-server";

if (pgErrorRetryable(error) === true) {
  await sleep(computeBackoffMs(attempt));
  continue;
}
```
