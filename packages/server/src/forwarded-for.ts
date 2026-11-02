// Original work by the same author.
/**
 * Client key for rate limiting from an `X-Forwarded-For` header. Proxies
 * APPEND the downstream address, so the LAST entry is the one your own
 * proxy saw; every earlier entry is client-controlled, and keying on it
 * would hand an attacker a fresh budget per spoofed value. Correct only
 * behind exactly one trusted proxy that appends (use your framework's
 * trusted-proxy setting when you run more than one hop).
 * A missing or blank header returns `fallback`.
 */
export function clientKeyFromForwardedFor(
  header: string | null | undefined,
  fallback = "local",
): string {
  if (header === null || header === undefined) return fallback;
  const entries = header
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  return entries[entries.length - 1] ?? fallback;
}
