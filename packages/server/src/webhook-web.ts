/**
 * Receiver-side webhook verification using global Web Crypto (no `node:*`).
 * Parses `t=<unix-seconds>,v1=<hex hmac-sha256(secret, "<ts>.<body>")>` and
 * recomputes the MAC over the exact raw bytes received.
 */

export interface VerifyWebhookWebOptions {
  /** Max header age in seconds either side of now. Default 300. */
  toleranceSeconds?: number | undefined;
  /** Unix seconds to compare against; default `Date.now() / 1000`. For tests. */
  nowSeconds?: number | undefined;
}

const HEADER_PATTERN = /^t=(\d+),v1=([0-9a-f]+)$/;

function toBytes(value: Uint8Array | string): Uint8Array {
  return typeof value === "string" ? new TextEncoder().encode(value) : value;
}

function hexToBytes(hex: string): Uint8Array | undefined {
  if (hex.length === 0 || hex.length % 2 !== 0) return undefined;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i += 1) {
    const byte = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    if (Number.isNaN(byte)) return undefined;
    out[i] = byte;
  }
  return out;
}

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}

export async function verifyWebhookSignatureWeb(
  secret: Uint8Array | string,
  signatureHeader: string | undefined,
  rawBody: Uint8Array | string,
  options?: VerifyWebhookWebOptions,
): Promise<boolean> {
  if (!signatureHeader) return false;
  const keyBytes = toBytes(secret);
  if (keyBytes.length === 0) return false;
  const match = HEADER_PATTERN.exec(signatureHeader);
  const timestamp = match?.[1];
  const claimedHex = match?.[2];
  if (!timestamp || !claimedHex) return false;
  const claimed = hexToBytes(claimedHex);
  if (!claimed) return false;
  const tolerance = options?.toleranceSeconds ?? 300;
  const now = options?.nowSeconds ?? Date.now() / 1000;
  const age = Math.abs(now - Number.parseInt(timestamp, 10));
  if (!Number.isFinite(age) || age > tolerance) return false;
  const keyMaterial = Uint8Array.from(keyBytes);
  const key = await crypto.subtle.importKey("raw", keyMaterial, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const prefix = new TextEncoder().encode(`${timestamp}.`);
  const body = toBytes(rawBody);
  const signed = new Uint8Array(prefix.length + body.length);
  signed.set(prefix, 0);
  signed.set(body, prefix.length);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, signed));
  return bytesEqual(claimed, mac);
}
