# @zedtech/zedkit-server

## 1.3.0

### Minor Changes

- 56be20a: Add `@zedtech/zedkit-server/webhook-web` with `verifyWebhookSignatureWeb` (Web Crypto, no `node:` imports).

## 1.2.0

### Minor Changes

- e2ff1da: Add `checkEndpointUrl` and `isPrivateHostname`: an SSRF guard for URLs your server calls on someone else's behalf. It allows http and https only and refuses loopback, private, link-local (cloud metadata), CGNAT, reserved and special-use hosts, including decimal, octal and hex IPv4 spellings and IPv6 with an embedded IPv4. It does not resolve DNS, so DNS rebinding is not covered. New exports only; the need starts at alpha.
- 11de855: `redactValue` accepts a third `options` argument with `valuePatterns` (extra `{ pattern, replacement }` credential shapes, applied before the bearer/basic pattern). `pgErrorCode` (and so `pgErrorRetryable`) also reads the code from `error.cause` one level down, which ORM-wrapped driver errors need. `new MemoryRateLimiter({ windowMs?, now?, maxKeys? })` is optional; the defaults match the previous behavior. The only result that changes: `pgErrorCode` now returns the code for wrapped errors that returned `null` before.

## 1.1.0

### Minor Changes

- 59f113b: Add `hkdfKey` (HKDF-SHA256 purpose-bound keys), `sealSecret` / `openSecret` (AES-256-GCM secret envelope), `checkoutSuffix` / `suffixedDatabaseUrl` / `databaseNameFromUrl` (per-checkout test database names) and `clientKeyFromForwardedFor` (rate-limit key from `X-Forwarded-For`). These four needs start at alpha. Existing exports are unchanged.

## 1.0.0

### Major Changes

- f283163: Catalog maturity Option B: 60 stable, 39 beta, and 8 alpha needs; docs badges only for alpha (sidebar), beta (page + catalog), and none for stable or on the home gallery.

  **1.0.0** on ui, core, server, nest, seo, quality, and payload-seo marks stable catalog entries under real semver. This release does not change runtime behavior by itself — it is a honesty and labeling step. The semver guarantee applies to **stable** needs only (no badge on the docs site). Alpha and beta entries in the same package can still change in minors with migration notes and are not covered by that guarantee.

  **Consumers:** move dependencies from `~0.x` to `^1.0.0` on the packages you use. Follow each package `CHANGELOG.md` for any migrations you have not applied yet (for example ui 0.8–0.9). Packages that stay on 0.x (ai, observability, flags, devtools, i18n, storage) receive minor bumps for catalog status only.

## 0.3.2

### Patch Changes

- fa7ce48: Declare `engines.node` (`>=22`) on every published package; CI blocks tarballs that omit it (reliability R33).

## 0.3.1

### Patch Changes

- 7065895: `verifyWebhookSignatureHeader` fails closed when the secret is empty.

## 0.3.0

### Minor Changes

- 281bd29: Add `pgErrorRetryable` for worker retry policy on common transient Postgres SQLSTATE codes.

### Patch Changes

- 2b1e019: `MemoryRateLimiter.allow` fails closed when the key is empty or whitespace-only.

## 0.2.1

### Patch Changes

- a5f9902: Docs: getting started backend scenario after paths C–E (#301).
- 0155efe: Docs: getting started Path D with tested server-add snippet (#301).
- fda0f62: Docs: getting started troubleshooting row for bad env on server/nest paths (#301).

## 0.2.0

### Minor Changes

- 926b60b: Add `loadEnv` for zod-validated boot-time environment parsing.

### Patch Changes

- b4ceccb: README: npm-only install path with link to docs install-or-copy section.

## 0.1.2

### Patch Changes

- 03cacd0: Catalog: every need documents its short name, audience, purpose, when to (not) use it, and related needs (single-sourced from CATALOG.md, enforced by `pnpm catalog:check`), feeding the doc pages.

## 0.1.1

### Patch Changes

- 59a12be: Discoverability: benefit-oriented descriptions, 8–12 npm keywords, homepage and bugs links per package (single-sourced from the CATALOG.md header, enforced by `pnpm catalog:check`), plus README badges and Install/Usage/When-to-use sections.

## 0.1.0

### Minor Changes

- 0f3d592: Initial release: in-process rate limiting, secret redaction.
- c301c5e: Add retry backoff and webhook signatures.
