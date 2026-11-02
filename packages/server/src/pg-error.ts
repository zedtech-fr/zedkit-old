// Original work by the same author.
/**
 * Reads the Postgres error code (`23505` unique, `23503` FK, ...) from a
 * thrown value. When the value has no string `code`, looks one `cause`
 * level down: ORMs such as drizzle-orm wrap the driver error and keep it
 * as `cause`. Deeper chains are not followed. Lets callers decide
 * conflict-vs-bug without each keeping its own shape check.
 */
export function pgErrorCode(error: unknown): string | null {
  return codeOf(error) ?? codeOf(causeOf(error));
}

function codeOf(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return null;
  }
  const code = (error as { code: unknown }).code;
  return typeof code === "string" ? code : null;
}

function causeOf(error: unknown): unknown {
  if (typeof error !== "object" || error === null || !("cause" in error)) {
    return null;
  }
  return (error as { cause: unknown }).cause;
}

/** SQLSTATE values workers commonly retry (serialization, deadlock, connection blips). */
const PG_RETRYABLE_CODES = new Set([
  "40001",
  "40P01",
  "53300",
  "57P01",
  "08000",
  "08001",
  "08003",
  "08006",
]);

/**
 * Whether a thrown Postgres error is worth retrying. `null` when the value
 * is not a Postgres-shaped error (no string `code`).
 */
export function pgErrorRetryable(error: unknown): boolean | null {
  const code = pgErrorCode(error);
  if (code === null) return null;
  return PG_RETRYABLE_CODES.has(code);
}
