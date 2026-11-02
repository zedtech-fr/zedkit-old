// Original work by the same author.
import { hkdfSync } from "node:crypto";

export interface HkdfKeyOptions {
  /** Optional salt (default: empty). A per-record salt gives per-record keys. */
  salt?: string | Uint8Array | undefined;
  /** Output length in bytes (default 32, max 8160 for SHA-256). */
  length?: number | undefined;
}

const DEFAULT_LENGTH = 32;
const MAX_LENGTH = 255 * 32;

/**
 * Derive a purpose-bound key from one master secret with HKDF-SHA256.
 * `info` names the purpose (for example `"app/session-cookie/v1"`), so each
 * purpose gets unrelated bytes from the same master and rotation is a
 * version bump inside `info`. Deterministic: same inputs, same key.
 * An empty master key throws instead of deriving a guessable key.
 */
export function hkdfKey(
  masterKey: string | Uint8Array,
  info: string,
  options: HkdfKeyOptions = {},
): Buffer {
  if (masterKey.length === 0) {
    throw new Error("hkdfKey: master key must not be empty");
  }
  const length = options.length ?? DEFAULT_LENGTH;
  if (!Number.isInteger(length) || length < 1 || length > MAX_LENGTH) {
    throw new Error(`hkdfKey: length must be an integer from 1 to ${MAX_LENGTH}, got ${length}`);
  }
  return Buffer.from(hkdfSync("sha256", masterKey, options.salt ?? "", info, length));
}
