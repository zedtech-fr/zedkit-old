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

- Import: `@zedtech/zedkit-server` — `MemoryRateLimiter`, `MemoryRateLimiterOptions`
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

// Optional: another window, a test clock, a different sweep threshold.
const perTenSeconds = new MemoryRateLimiter({ windowMs: 10_000, now: () => clock.now(), maxKeys: 5_000 });
```

## Redact secrets before logging

- Import: `@zedtech/zedkit-server` — `redactValue`, `RedactOptions`, `RedactValuePattern`
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

// Add your own credential shape (replaces every match, before bearer/basic).
const valuePatterns = [{ pattern: /\bsk_[A-Za-z0-9_-]{8,}\b/, replacement: "[redacted-key]" }];
logger.info(redactValue(record, undefined, { valuePatterns }));
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

## Verify webhooks in browsers and edge runtimes

- Import: `@zedtech/zedkit-server/webhook-web` — `verifyWebhookSignatureWeb`, `VerifyWebhookWebOptions`
- Wraps: `(none)`
- Status: alpha
- Short name: Webhook verify (Web Crypto)
- Audience: Authors verifying signed webhook deliveries outside Node (Workers, Deno, browser tests).
- Purpose: Async HMAC verification with global `crypto.subtle`, symmetric tolerance both ways of the clock (default 300 s).
- When to use: When the main server verifier cannot load (`node:crypto`) but the runtime provides Web Crypto.
- When not to use: On Node servers — use `verifyWebhookSignatureHeader` on the main export instead.
- See also: `Sign and verify webhook deliveries`

```ts
import { verifyWebhookSignatureWeb } from "@zedtech/zedkit-server/webhook-web";
const ok = await verifyWebhookSignatureWeb(secret, request.headers.get("webhook-signature") ?? undefined, rawBody);
if (!ok) return unauthorized();
```

## Tell a Postgres conflict from a bug

- Import: `@zedtech/zedkit-server` — `pgErrorCode`
- Wraps: `(none)`
- Status: stable
- Short name: Postgres errors
- Audience: Developers mapping Postgres driver errors to HTTP responses.
- Purpose: Extract the Postgres error code (also from an ORM-wrapped `cause`) so unique violations map to 409, not 500.
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

## Derive purpose-bound keys from one master secret

- Import: `@zedtech/zedkit-server` — `hkdfKey`, `HkdfKeyOptions`
- Wraps: `(none)`
- Status: alpha
- Short name: HKDF keys
- Audience: Node developers who hold one master secret and need separate keys for cookies, tokens, or signing.
- Purpose: Derive unrelated 32-byte keys per purpose from a single master with HKDF-SHA256, so rotation is a version bump.
- When to use: When two features must not share key bytes but you only want to manage one secret.
- When not to use: For passwords or low-entropy input — use a password hash (argon2, scrypt) instead.
- See also: `Store secrets you must read back`, `Sign and verify webhook deliveries`

```ts
import { hkdfKey } from "@zedtech/zedkit-server";
const cookieKey = hkdfKey(process.env.MASTER_KEY!, "app/session-cookie/v1");
const perTenantKey = hkdfKey(process.env.MASTER_KEY!, "app/export/v1", { salt: tenantId });
```

## Store secrets you must read back

- Import: `@zedtech/zedkit-server` — `sealSecret`, `openSecret`
- Wraps: `(none)`
- Status: alpha
- Short name: Secret box
- Audience: Node developers who keep third-party credentials (API keys, storage keys) in their own database.
- Purpose: Encrypt a secret with AES-256-GCM under a key derived from your master, and open it again later.
- When to use: For credentials you must present to another service, so hashing is not an option.
- When not to use: For user passwords (hash them) or when a managed secret store is available.
- See also: `Derive purpose-bound keys from one master secret`

```ts
import { openSecret, sealSecret } from "@zedtech/zedkit-server";
const sealed = sealSecret(masterKey, "app/storage-credentials/v1", secretAccessKey);
const plain = openSecret(masterKey, "app/storage-credentials/v1", sealed);
```

## Give each checkout its own test database

- Import: `@zedtech/zedkit-server` — `checkoutSuffix`, `suffixedDatabaseUrl`, `databaseNameFromUrl`
- Wraps: `(none)`
- Status: alpha
- Short name: Test DB names
- Audience: Developers whose test suites drop and recreate a Postgres database.
- Purpose: Derive a stable per-checkout database name and refuse unsafe names before they reach DROP.
- When to use: When several checkouts or worktrees run tests against one Postgres server.
- When not to use: For production database naming, or when each test run gets a throwaway container.

```ts
import { databaseNameFromUrl, suffixedDatabaseUrl } from "@zedtech/zedkit-server";
const url = suffixedDatabaseUrl(process.env.TEST_DATABASE_URL!, process.cwd());
const name = databaseNameFromUrl(url); // safe to interpolate into DROP/CREATE
```

## Key rate limits by client address behind a proxy

- Import: `@zedtech/zedkit-server` — `clientKeyFromForwardedFor`
- Wraps: `(none)`
- Status: alpha
- Short name: Forwarded-for key
- Audience: Developers rate-limiting public endpoints that sit behind one reverse proxy.
- Purpose: Take the client key from the last `X-Forwarded-For` entry, which the proxy appended, not the spoofable first one.
- When to use: With `MemoryRateLimiter` behind exactly one trusted proxy that appends to the header.
- When not to use: Behind several proxies or a CDN — use your framework's trusted-proxy setting instead.
- See also: `Rate-limit calls per key`

```ts
import { clientKeyFromForwardedFor, MemoryRateLimiter } from "@zedtech/zedkit-server";
const limiter = new MemoryRateLimiter();
const key = clientKeyFromForwardedFor(request.headers.get("x-forwarded-for"));
if (!limiter.allow(key, 30)) return tooManyRequests();
```

## Refuse private targets before calling a customer URL

- Import: `@zedtech/zedkit-server` — `checkEndpointUrl`, `isPrivateHostname`, `EndpointCheckOptions`, `EndpointCheckResult`
- Wraps: `(none)`
- Status: alpha
- Short name: SSRF guard
- Audience: Developers whose server sends requests to URLs that users or customers supply (webhooks, callbacks).
- Purpose: Reject non-http(s) URLs and loopback, private, link-local, cloud-metadata and special-use hosts before any request is made.
- When to use: When saving or sending to a user-supplied URL; keep `allowPrivate` for local development only.
- When not to use: As your only defense. It does not resolve DNS, so DNS rebinding is not covered; also pin the resolved address, or send through an egress proxy.
- See also: `Sign and verify webhook deliveries`

```ts
import { checkEndpointUrl } from "@zedtech/zedkit-server";
const check = checkEndpointUrl(input, { allowPrivate: process.env.NODE_ENV !== "production" });
if (!check.ok) return badRequest(check.error.message);
```
