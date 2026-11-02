// Original work by the same author.
import { createHash } from "node:crypto";

/**
 * Per-checkout test database names. Suites that drop and recreate their
 * database must not share one across parallel checkouts on the same
 * Postgres: derive the name from a stable hash of the checkout path.
 */

/** First 6 hex chars of the path hash: stable in one checkout, different in another. */
export function checkoutSuffix(cwd: string): string {
  return createHash("sha256").update(cwd).digest("hex").slice(0, 6);
}

/** Base URL with the checkout suffix appended to its database name. */
export function suffixedDatabaseUrl(baseUrl: string, cwd: string): string {
  const url = new URL(baseUrl);
  url.pathname = `${url.pathname}_${checkoutSuffix(cwd)}`;
  return url.toString();
}

/**
 * Database name from a URL. Test setup interpolates it into DROP/CREATE,
 * so anything outside `[A-Za-z0-9_]` throws instead of reaching SQL.
 */
export function databaseNameFromUrl(url: string): string {
  const name = new URL(url).pathname.replace(/^\//, "");
  if (!/^[A-Za-z0-9_]+$/.test(name)) {
    throw new Error(`refusing to use database with unsafe name ${JSON.stringify(name)}`);
  }
  return name;
}
