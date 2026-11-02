# Catalog — @zedtech/zedkit-core

- Keywords: typescript, utilities, result-type, error-handling, typed-errors, ulid, unique-id, prefixed-id, functional, try-catch
- Audience: TypeScript developers tired of untyped throws and ad-hoc helpers.
- Purpose: Typed Result helpers, safe try/catch wrappers, and prefixed IDs for any JS/TS project — stop writing the same utilities in every repo.
- Attribution: Original work by the same author.


## Model success or failure without throwing

- Import: `@zedtech/zedkit-core` — `Result`, `ok`, `err`, `isOk`, `isErr`, `mapResult`, `unwrapOr`
- Wraps: `(none)`
- Status: stable
- Short name: Result
- Audience: TypeScript developers who want typed outcomes instead of try/catch everywhere.
- Purpose: Return `ok`/`err` Results so failures are values the compiler forces you to handle.
- When to use: For fallible operations (parsing, lookups, validation) where the caller must handle failure.
- When not to use: For truly exceptional programmer bugs — throw (or assert) instead of returning `err`.
- See also: `Handle errors without try/catch`

```ts
import { isOk, ok, unwrapOr } from "@zedtech/zedkit-core";
const found = ok({ name: "zed" });
if (isOk(found)) console.log(found.value.name);
const name = unwrapOr(found, { name: "?" }).name;
```

## Handle errors without try/catch

- Import: `@zedtech/zedkit-core` — `tryCatch`, `tryCatchAsync`, `normalizeThrown`
- Wraps: `(none)`
- Status: stable
- Short name: tryCatch
- Audience: TypeScript developers wrapping throwing calls (JSON, IO, third-party SDKs).
- Purpose: Turn any throwing call into a typed Result without a try/catch block.
- When to use: At the boundary with throwing code you do not control.
- When not to use: Inside code that already returns Results — compose with `mapResult` instead.
- See also: `Model success or failure without throwing`

```ts
import { tryCatch } from "@zedtech/zedkit-core";
const parsed = tryCatch(() => JSON.parse(input));
if (!parsed.ok) return fallback(parsed.error);
```

## Classify failures for retry policy

- Import: `@zedtech/zedkit-core` — `DomainError`, `TransientError`, `PermanentError`, `classifyError`, `ErrorKind`
- Wraps: `(none)`
- Status: stable
- Short name: Error taxonomy
- Audience: Service authors who route failures to retry, dead-letter, or client-facing errors.
- Purpose: Typed error kinds plus `classifyError` so workers and HTTP layers pick the same policy.
- When to use: At domain boundaries and queue consumers where retry vs fail-fast must be explicit.
- When not to use: For validation-only failures — return a `Result` or map to 400 without throwing.

```ts
import { classifyError, DomainError, TransientError } from "@zedtech/zedkit-core";
if (classifyError(err) === "transient") await retryLater();
throw new DomainError("slot_taken", "Slot already booked");
throw new TransientError("upstream timeout", { cause: err });
```

## Inject time in domain code

- Import: `@zedtech/zedkit-core` — `Clock`, `systemClock`, `fixedClock`
- Wraps: `(none)`
- Status: stable
- Short name: Clock
- Audience: Developers who need deterministic dates in tests without mocking `Date` globally.
- Purpose: A tiny `Clock` port with production and fixed implementations.
- When to use: When domain rules depend on "now" (expiry, windows, staleness).
- When not to use: For one-off `Date.now()` in infrastructure glue — keep those at the edges.

```ts
import { fixedClock, systemClock, type Clock } from "@zedtech/zedkit-core";
const clock: Clock = process.env.NODE_ENV === "test" ? fixedClock(new Date("2026-01-01")) : systemClock;
const ageMs = clock.now().getTime() - createdAt.getTime();
```

## Generate prefixed unique IDs

- Import: `@zedtech/zedkit-core` — `newPrefixedId`, `isPrefixedId`
- Wraps: `ulid`
- Status: stable
- Short name: Prefixed IDs
- Audience: Developers who want readable, sortable, collision-free IDs (orders, jobs, keys).
- Purpose: Generate ULID-based IDs with a type prefix (`order_...`) plus a prefix check.
- When to use: For public-facing or log-friendly IDs where the prefix disambiguates the kind.
- When not to use: For database primary keys — use the database's native id/uuid default instead.

```ts
import { isPrefixedId, newPrefixedId } from "@zedtech/zedkit-core";
const id = newPrefixedId("order"); // order_01M5Q75SHJ9CVV6E3RBF0FGEM1
if (!isPrefixedId(id, "order")) throw new Error("bad id");
```
