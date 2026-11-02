import { describe, expect, it } from "vitest";
import { clientKeyFromForwardedFor } from "#index.js";

describe("clientKeyFromForwardedFor", () => {
  it("keys on the last entry (appended by the trusted proxy)", () => {
    expect(clientKeyFromForwardedFor("spoofed, 203.0.113.7")).toBe("203.0.113.7");
    expect(clientKeyFromForwardedFor("a, b, 10.0.0.9 ")).toBe("10.0.0.9");
  });

  it("returns a single value as is", () => {
    expect(clientKeyFromForwardedFor("203.0.113.7")).toBe("203.0.113.7");
  });

  it("falls back for missing or blank headers", () => {
    expect(clientKeyFromForwardedFor(null)).toBe("local");
    expect(clientKeyFromForwardedFor(undefined)).toBe("local");
    expect(clientKeyFromForwardedFor("")).toBe("local");
    expect(clientKeyFromForwardedFor("  ")).toBe("local");
    expect(clientKeyFromForwardedFor(" , ,")).toBe("local");
    expect(clientKeyFromForwardedFor(null, "unknown")).toBe("unknown");
  });

  it("skips trailing empty entries", () => {
    expect(clientKeyFromForwardedFor("1.1.1.1, 2.2.2.2,")).toBe("2.2.2.2");
  });

  it("gives one attacker one budget whatever they put first", () => {
    const keys = new Set(
      ["evil-1", "evil-2", "evil-3"].map((spoof) =>
        clientKeyFromForwardedFor(`${spoof}, 203.0.113.7`),
      ),
    );
    expect([...keys]).toEqual(["203.0.113.7"]);
  });
});
