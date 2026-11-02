// Original work by the same author.
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { hkdfKey } from "./hkdf.js";

const IV_BYTES = 12;
const TAG_BYTES = 16;

/**
 * Reversible secret envelope (AES-256-GCM) for credentials you must present
 * again later (for example a customer's storage keys). The data key comes
 * from `hkdfKey(masterKey, info)`, so each purpose is domain-separated from
 * one master key. Wire format: 12-byte IV, then ciphertext, then the
 * 16-byte auth tag, concatenated.
 *
 * Rotating the master key means re-sealing every stored value; no key
 * version is embedded in the envelope.
 */
export function sealSecret(masterKey: string, info: string, plaintext: string): Buffer {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", hkdfKey(masterKey, info), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return Buffer.concat([iv, ciphertext, cipher.getAuthTag()]);
}

/**
 * Open an envelope made by `sealSecret`. Throws on a wrong master key,
 * wrong `info`, tampering, or truncation.
 */
export function openSecret(masterKey: string, info: string, sealed: Buffer): string {
  if (sealed.length < IV_BYTES + TAG_BYTES) throw new Error("sealed secret too short");
  const iv = sealed.subarray(0, IV_BYTES);
  const tag = sealed.subarray(sealed.length - TAG_BYTES);
  const ciphertext = sealed.subarray(IV_BYTES, sealed.length - TAG_BYTES);
  const decipher = createDecipheriv("aes-256-gcm", hkdfKey(masterKey, info), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
