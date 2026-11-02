import { describe, expect, it } from "vitest";
import { redactValue } from "#index.js";

describe("redactValue", () => {
  it("redacts values under secret-like keys", () => {
    expect(redactValue("hunter2", "password")).toBe("[redacted]");
    expect(redactValue("abc", "X-Api-Key")).toBe("[redacted]");
    expect(redactValue("abc", "authorization")).toBe("[redacted]");
    expect(redactValue("visible", "username")).toBe("visible");
  });

  it("redacts bearer tokens inside strings", () => {
    expect(redactValue("call with Bearer abcDEF123._~+/=-")).toBe(
      "call with Bearer [redacted]",
    );
  });

  it("bounds ordinary long values instead of cutting everyday strings", () => {
    const everyday = `endpoint https://hooks.example.com/tenant-42/inbound delivery queued`;
    expect(redactValue({ url: everyday })).toEqual({ url: everyday });
    const out = redactValue("x".repeat(600)) as string;
    expect(out).toBe(`${"x".repeat(512)}…`);
    expect(redactValue("short")).toBe("short");
  });

  it("never truncates human-text fields", () => {
    const msg = "worker tick: claimed=3 attempted=12 delivered=11 failed=1 reconciled=0";
    const redacted = redactValue({
      msg,
      err: { message: `${msg} failed`, stack: `Error: boom\n    at f (${"y".repeat(600)})` },
    }) as { msg: string; err: { message: string; stack: string } };
    expect(redacted.msg).toBe(msg);
    expect(redacted.err.message).toBe(`${msg} failed`);
    expect(redacted.err.stack).toContain("y".repeat(600));
  });

  it("still scrubs tokens inside human-text fields", () => {
    const redacted = redactValue({
      msg: `call to https://hooks.example.com/x failed with Bearer abcdef123456 attached`,
    }) as { msg: string };
    expect(redacted.msg).not.toContain("abcdef123456");
    expect(redacted.msg).toContain("Bearer [redacted]");
    expect(redacted.msg).toContain("call to https://hooks.example.com/x failed");
  });

  it("recurses into objects and arrays, keeping shape", () => {
    expect(
      redactValue({ user: "u", token: "t", nested: { secret: "s" }, list: ["a", "b"] }),
    ).toEqual({
      user: "u",
      token: "[redacted]",
      nested: { secret: "[redacted]" },
      list: ["a", "b"],
    });
  });

  it("passes non-string scalars through", () => {
    expect(redactValue(42)).toBe(42);
    expect(redactValue(null)).toBe(null);
    expect(redactValue(undefined)).toBe(undefined);
    expect(redactValue(true)).toBe(true);
  });

  it("redacts common secret key names", () => {
    for (const key of ["privateKey", "private_key", "credentials", "passwd"]) {
      expect(redactValue("SUPERSECRET", key)).toBe("[redacted]");
    }
  });

  it("returns [circular] for cyclic structures", () => {
    const obj: Record<string, unknown> = {};
    obj.self = obj;
    expect(redactValue(obj)).toEqual({ self: "[circular]" });
    const arr: unknown[] = [];
    arr.push(arr);
    expect(redactValue(arr)).toEqual(["[circular]"]);
  });

  it("redacts basic credentials in strings", () => {
    expect(redactValue("Authorization: Basic dXNlcjpwYXNz")).toBe(
      "Authorization: Basic [redacted]",
    );
  });

  it("preserves dates, maps, sets, and symbol keys", () => {
    const date = new Date("2026-01-01T00:00:00Z");
    expect(redactValue(date)).toBe(date);
    const sym = Symbol("s");
    const out = redactValue({
      at: date,
      m: new Map([["token", "t"]]),
      s: new Set(["Bearer abc"]),
      [sym]: "v",
    }) as { m: Map<string, string>; s: Set<string> } & Record<symbol, unknown>;
    expect(out.m).toBeInstanceOf(Map);
    expect(out.m.get("token")).toBe("[redacted]");
    expect([...out.s][0]).toBe("Bearer [redacted]");
    expect(out[sym]).toBe("v");
  });

  it("keeps class instances usable", () => {
    class Creds {
      token = "t";
      user = "u";
    }
    const out = redactValue(new Creds()) as Creds;
    expect(out).toBeInstanceOf(Creds);
    expect(out.token).toBe("[redacted]");
    expect(out.user).toBe("u");
  });

  it("does not split surrogate pairs when truncating", () => {
    expect(redactValue("x".repeat(511) + "😀")).toBe("x".repeat(511) + "😀");
    expect(redactValue("x".repeat(512) + "😀")).toBe(`${"x".repeat(512)}…`);
  });
  describe("valuePatterns", () => {
    const valuePatterns = [{ pattern: /\bacme_[A-Za-z0-9_-]{8,}\b/, replacement: "[redacted-key]" }];

    it("replaces every match, even without the g flag", () => {
      const out = redactValue({ note: "a acme_abcdefgh1 b acme_zzzzzzzz2" }, undefined, { valuePatterns });
      expect(out).toEqual({ note: "a [redacted-key] b [redacted-key]" });
    });

    it("reaches human-text fields, nested values, arrays, and Maps", () => {
      const out = redactValue(
        { message: "bad key acme_abcdefgh1", list: ["acme_abcdefgh1"], m: new Map([["k", "acme_abcdefgh1"]]) },
        undefined,
        { valuePatterns },
      ) as { message: string; list: string[]; m: Map<string, string> };
      expect(out.message).toBe("bad key [redacted-key]");
      expect(out.list).toEqual(["[redacted-key]"]);
      expect(out.m.get("k")).toBe("[redacted-key]");
    });

    it("runs before the bearer pattern, in the given order", () => {
      const out = redactValue("Bearer acme_abcdefgh1", undefined, { valuePatterns });
      // The custom replacement wins: the bearer pattern no longer matches the token.
      expect(out).toBe("Bearer [redacted-key]");
      const ordered = redactValue("x1", undefined, {
        valuePatterns: [
          { pattern: /x1/, replacement: "y2" },
          { pattern: /y2/, replacement: "z3" },
        ],
      });
      expect(ordered).toBe("z3");
    });

    it("keeps replacements literal and leaves defaults unchanged", () => {
      const literal = redactValue("secret1234", undefined, {
        valuePatterns: [{ pattern: /secret\d+/, replacement: "$&-$1" }],
      });
      expect(literal).toBe("$&-$1");
      expect(redactValue("acme_abcdefgh1")).toBe("acme_abcdefgh1");
      expect(redactValue("acme_abcdefgh1", undefined, {})).toBe("acme_abcdefgh1");
    });

    it("is stateless across calls for sticky and global regexes", () => {
      const options = { valuePatterns: [{ pattern: /acme_[a-z0-9]{8}/gy, replacement: "[k]" }] };
      expect(redactValue("acme_abcdefg1", undefined, options)).toBe("[k]");
      expect(redactValue("acme_abcdefg1", undefined, options)).toBe("[k]");
    });
  });
});
