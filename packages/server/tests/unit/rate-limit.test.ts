import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRateLimiter } from "#index.js";

describe("MemoryRateLimiter", () => {
  it("allows up to the limit, then denies", () => {
    const limiter = new MemoryRateLimiter();
    expect(limiter.allow("k", 2)).toBe(true);
    expect(limiter.allow("k", 2)).toBe(true);
    expect(limiter.allow("k", 2)).toBe(false);
  });

  it("tracks keys independently", () => {
    const limiter = new MemoryRateLimiter();
    expect(limiter.allow("a", 1)).toBe(true);
    expect(limiter.allow("b", 1)).toBe(true);
    expect(limiter.allow("a", 1)).toBe(false);
  });

  it("denies everything when the limit is not positive", () => {
    const limiter = new MemoryRateLimiter();
    expect(limiter.allow("k", 0)).toBe(false);
    expect(limiter.allow("k", -1)).toBe(false);
    expect(limiter.allow("k", Number.NaN)).toBe(false);
  });

  it("denies empty or whitespace-only keys", () => {
    const limiter = new MemoryRateLimiter();
    expect(limiter.allow("", 10)).toBe(false);
    expect(limiter.allow("   ", 10)).toBe(false);
    expect(limiter.allow("\t\n", 10)).toBe(false);
  });

  describe("window expiry", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("resets after 60 seconds", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
      const limiter = new MemoryRateLimiter();
      expect(limiter.allow("k", 1)).toBe(true);
      expect(limiter.allow("k", 1)).toBe(false);
      vi.advanceTimersByTime(60_000);
      expect(limiter.allow("k", 1)).toBe(true);
    });

    it("drops expired windows past the key cap", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
      const limiter = new MemoryRateLimiter();
      for (let i = 0; i < 10_001; i++) limiter.allow(`k${i}`, 1);
      vi.advanceTimersByTime(61_000);
      expect(limiter.allow("fresh", 1)).toBe(true);
      // White-box: eviction is memory-only, invisible through allow().
      const windows = (limiter as unknown as { windows: Map<string, unknown> }).windows;
      expect(windows.size).toBe(1);
    });
  });
  describe("options", () => {
    it("uses an injected clock and window length", () => {
      let t = 1_000;
      const limiter = new MemoryRateLimiter({ windowMs: 10_000, now: () => t });
      expect(limiter.allow("k", 1)).toBe(true);
      expect(limiter.allow("k", 1)).toBe(false);
      t += 9_999;
      expect(limiter.allow("k", 1)).toBe(false);
      t += 1;
      expect(limiter.allow("k", 1)).toBe(true);
    });

    it("sweeps expired windows past a custom key cap, never live ones", () => {
      let t = 0;
      const limiter = new MemoryRateLimiter({ windowMs: 1_000, maxKeys: 2, now: () => t });
      for (const k of ["a", "b", "c"]) limiter.allow(k, 1);
      // Past the cap but all live: nothing is evicted, so "a" stays limited.
      t = 500;
      expect(limiter.allow("d", 1)).toBe(true);
      expect(limiter.allow("a", 1)).toBe(false);
      t = 2_000;
      limiter.allow("fresh", 1);
      const windows = (limiter as unknown as { windows: Map<string, unknown> }).windows;
      expect(windows.size).toBe(1);
    });

    it("rejects a misconfigured window or key cap", () => {
      for (const windowMs of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
        expect(() => new MemoryRateLimiter({ windowMs })).toThrow(/windowMs/);
      }
      for (const maxKeys of [0, 1.5, Number.NaN]) {
        expect(() => new MemoryRateLimiter({ maxKeys })).toThrow(/maxKeys/);
      }
    });
  });
});
