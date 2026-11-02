// Original work by the same author. Generalized from a logger helper: the
// private key-material pattern was dropped; only generic secret shapes
// (secret-like keys, bearer/basic tokens) and long-value truncation remain.
/**
 * Recursively replace credential-looking material with placeholders, so a
 * structure is safe to log. Objects keep their shape and prototype; values
 * under secret-like keys become "[redacted]", bearer/basic tokens become
 * "<scheme> [redacted]", and cyclic references become "[circular]".
 * Scrubbing applies to every field; truncation is volume control only (a
 * cut secret still leaks its head), so human-text fields (`msg`,
 * `message`, `stack`) are never truncated and everything else is bounded
 * at 512 code points. Dates and regexes pass through untouched; Maps,
 * Sets, and symbol keys are preserved.
 */
const SECRET_KEY_PATTERN =
  /(api[_-]?key|secret|token|password|passwd|signature|authorization|cookie|set-cookie|private[_-]?key|credentials)/i;
const AUTH_TOKEN_PATTERN = /\b(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi;
const HUMAN_TEXT_KEYS = new Set(["msg", "message", "stack"]);
const LONG_VALUE_MAX = 512;

/** An extra value pattern: every match is replaced by `replacement`, literally. */
export interface RedactValuePattern {
  pattern: RegExp;
  replacement: string;
}

export interface RedactOptions {
  /**
   * Extra patterns for credential shapes specific to your system (for
   * example your own API-key prefix). They run on every string, before the
   * built-in bearer/basic pattern, in the order given. Matching is always
   * global, whatever flags the regex carries.
   */
  valuePatterns?: readonly RedactValuePattern[] | undefined;
}

type CompiledPattern = readonly [RegExp, string];

function compilePatterns(options: RedactOptions | undefined): CompiledPattern[] {
  return (options?.valuePatterns ?? []).map(({ pattern, replacement }) => [
    new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`),
    replacement,
  ]);
}

function redactString(
  value: string,
  key: string | undefined,
  extra: readonly CompiledPattern[],
): string {
  let text = value;
  for (const [pattern, replacement] of extra) text = text.replace(pattern, () => replacement);
  const scrubbed = text.replace(
    AUTH_TOKEN_PATTERN,
    (match) => `${match.split(/\s/, 1)[0]} [redacted]`,
  );
  if (key !== undefined && HUMAN_TEXT_KEYS.has(key.toLowerCase())) return scrubbed;
  // Count in code points so truncation never splits a surrogate pair.
  const chars = Array.from(scrubbed);
  if (chars.length > LONG_VALUE_MAX) {
    return `${chars.slice(0, LONG_VALUE_MAX).join("")}…`;
  }
  return scrubbed;
}

/** See the module notes above; `options.valuePatterns` adds your own credential shapes. */
export function redactValue(value: unknown, key?: string, options?: RedactOptions): unknown {
  return redactInner(value, key, new Set(), compilePatterns(options));
}

function redactInner(
  value: unknown,
  key: string | undefined,
  seen: Set<object>,
  extra: readonly CompiledPattern[],
): unknown {
  if (key !== undefined && SECRET_KEY_PATTERN.test(key)) {
    return "[redacted]";
  }
  if (typeof value === "string") {
    return redactString(value, key, extra);
  }
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (seen.has(value)) {
    return "[circular]";
  }
  seen.add(value);
  if (value instanceof Date || value instanceof RegExp) {
    return value;
  }
  if (value instanceof Map) {
    return new Map(
      [...value].map(([k, v]) => [
        k,
        redactInner(v, typeof k === "string" ? k : undefined, seen, extra),
      ]),
    );
  }
  if (value instanceof Set) {
    return new Set([...value].map((v) => redactInner(v, undefined, seen, extra)));
  }
  if (Array.isArray(value)) {
    return value.map((v) => redactInner(v, undefined, seen, extra));
  }
  const source = value as Record<string | symbol, unknown>;
  const out: Record<string | symbol, unknown> = Object.create(
    Object.getPrototypeOf(value),
  );
  for (const k of Reflect.ownKeys(source)) {
    out[k] = redactInner(source[k], typeof k === "string" ? k : undefined, seen, extra);
  }
  return out;
}
