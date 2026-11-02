import { describe, expect, it } from "vitest";
import { openSecret, sealSecret } from "#index.js";

const MASTER = "example-master-key-0123456789abcdef";
const INFO = "example/purpose/v1";

describe("sealSecret / openSecret", () => {
  it("round-trips and randomizes the IV", () => {
    const a = sealSecret(MASTER, INFO, "s3-secret-key");
    const b = sealSecret(MASTER, INFO, "s3-secret-key");
    expect(a.equals(b)).toBe(false);
    expect(openSecret(MASTER, INFO, a)).toBe("s3-secret-key");
    expect(openSecret(MASTER, INFO, b)).toBe("s3-secret-key");
  });

  it("round-trips empty and multi-byte plaintext", () => {
    expect(openSecret(MASTER, INFO, sealSecret(MASTER, INFO, ""))).toBe("");
    expect(openSecret(MASTER, INFO, sealSecret(MASTER, INFO, "clé-秘密-🔑"))).toBe("clé-秘密-🔑");
  });

  it("opens a stored envelope (fixed vector: iv | ciphertext | tag, key from HKDF)", () => {
    const stored = Buffer.from("AAECAwQFBgcICQoLnPHEBeUJWg+HbSFqael0g0MwBrwZxeNi4WP1CSk=", "base64");
    expect(openSecret(MASTER, INFO, stored)).toBe("s3-secret-key");
  });

  it("fails closed on wrong master, wrong info, tamper, and truncation", () => {
    const sealed = sealSecret(MASTER, INFO, "s3-secret-key");
    expect(() => openSecret("wrong-master-key-0123456789abcdef", INFO, sealed)).toThrow();
    expect(() => openSecret(MASTER, "example/other/v1", sealed)).toThrow();
    const tampered = Buffer.from(sealed);
    tampered[tampered.length - 1] = (tampered[tampered.length - 1] ?? 0) ^ 0xff;
    expect(() => openSecret(MASTER, INFO, tampered)).toThrow();
    const flippedBody = Buffer.from(sealed);
    flippedBody[13] = (flippedBody[13] ?? 0) ^ 0x01;
    expect(() => openSecret(MASTER, INFO, flippedBody)).toThrow();
    expect(() => openSecret(MASTER, INFO, sealed.subarray(0, 10))).toThrow("too short");
  });

  it("refuses an empty master key", () => {
    expect(() => sealSecret("", INFO, "x")).toThrow(/master key/);
  });
});
