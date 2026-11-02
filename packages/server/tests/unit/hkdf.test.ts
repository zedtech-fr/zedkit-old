import { describe, expect, it } from "vitest";
import { hkdfKey } from "#index.js";

const MASTER = "example-master-key-0123456789abcdef";
const INFO = "example/purpose/v1";

describe("hkdfKey", () => {
  it("matches fixed vectors (empty salt, salted, shorter length)", () => {
    expect(hkdfKey(MASTER, INFO).toString("hex")).toBe(
      "4c9947e035909bd103e647a4691a50c4ecfab7de535aca1ad24c148a0cbc33a8",
    );
    expect(hkdfKey(MASTER, INFO, { salt: "record-42" }).toString("hex")).toBe(
      "58f0140f52d11952d5219289a262b5a364f996bac7c8090e1381b9668c01a117",
    );
    expect(hkdfKey(MASTER, INFO, { length: 16 }).toString("hex")).toBe(
      "4c9947e035909bd103e647a4691a50c4",
    );
  });

  it("matches RFC 5869 test case 3 (zero-length salt and info)", () => {
    const ikm = new Uint8Array(22).fill(0x0b);
    expect(hkdfKey(ikm, "", { length: 42 }).toString("hex")).toBe(
      "8da4e775a563c18f715f802a063c5a31b8a11f5c5ee1879ec3454e5f3c738d2d9d201395faa4b61a96c8",
    );
  });

  it("is deterministic and separated by master, info, and salt", () => {
    const base = hkdfKey(MASTER, INFO);
    expect(hkdfKey(MASTER, INFO).equals(base)).toBe(true);
    expect(hkdfKey("other-master-key-0123456789abcdef", INFO).equals(base)).toBe(false);
    expect(hkdfKey(MASTER, "example/purpose/v2").equals(base)).toBe(false);
    expect(hkdfKey(MASTER, INFO, { salt: "a" }).equals(hkdfKey(MASTER, INFO, { salt: "b" }))).toBe(
      false,
    );
  });

  it("treats a string and its UTF-8 bytes as the same key material", () => {
    const bytes = new TextEncoder().encode(MASTER);
    expect(hkdfKey(bytes, INFO).equals(hkdfKey(MASTER, INFO))).toBe(true);
    const salt = new TextEncoder().encode("record-42");
    expect(hkdfKey(MASTER, INFO, { salt }).equals(hkdfKey(MASTER, INFO, { salt: "record-42" }))).toBe(
      true,
    );
  });

  it("rejects an empty master and bad lengths", () => {
    expect(() => hkdfKey("", INFO)).toThrow(/master key/);
    expect(() => hkdfKey(new Uint8Array(0), INFO)).toThrow(/master key/);
    expect(() => hkdfKey(MASTER, INFO, { length: 0 })).toThrow(/length/);
    expect(() => hkdfKey(MASTER, INFO, { length: 1.5 })).toThrow(/length/);
    expect(() => hkdfKey(MASTER, INFO, { length: 255 * 32 + 1 })).toThrow(/length/);
  });
});
