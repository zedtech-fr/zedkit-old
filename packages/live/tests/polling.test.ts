import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pollingSource } from "../src/index.js";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("pollingSource", () => {
  it("rejects a non-positive interval", () => {
    expect(() => pollingSource({ poll: async () => 1, intervalMs: 0 })).toThrow(RangeError);
  });

  it("polls immediately, then on the interval, without overlapping", async () => {
    let n = 0;
    const poll = vi.fn(async () => ++n);
    const source = pollingSource({ poll, intervalMs: 1000 });
    const seen: number[] = [];
    source.subscribe((v) => seen.push(v));
    await vi.advanceTimersByTimeAsync(0);
    expect(seen).toEqual([1]);
    expect(source.getStatus()).toBe("live");
    await vi.advanceTimersByTimeAsync(999);
    expect(poll).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(seen).toEqual([1, 2]);
  });

  it("shares one loop between subscribers and stops when the last leaves", async () => {
    const poll = vi.fn(async () => 1);
    const source = pollingSource({ poll, intervalMs: 1000 });
    const offA = source.subscribe(() => {});
    const offB = source.subscribe(() => {});
    await vi.advanceTimersByTimeAsync(0);
    expect(poll).toHaveBeenCalledTimes(1);
    offA();
    await vi.advanceTimersByTimeAsync(1000);
    expect(poll).toHaveBeenCalledTimes(2);
    offB();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(poll).toHaveBeenCalledTimes(2);
    expect(source.getStatus()).toBe("idle");
  });

  it("aborts the in-flight poll on stop and drops its result", async () => {
    let signal!: AbortSignal;
    let resolve!: (v: number) => void;
    const source = pollingSource<number>({
      poll: (s) => {
        signal = s;
        return new Promise<number>((r) => {
          resolve = r;
        });
      },
      intervalMs: 1000,
    });
    const seen: number[] = [];
    const off = source.subscribe((v) => seen.push(v));
    await vi.advanceTimersByTimeAsync(0);
    off();
    expect(signal.aborted).toBe(true);
    resolve(5);
    await vi.advanceTimersByTimeAsync(5000);
    expect(seen).toEqual([]);
  });

  it("skips equal values when isEqual is set", async () => {
    const values = [1, 1, 2];
    const source = pollingSource({
      poll: async () => values.shift() ?? 2,
      intervalMs: 100,
      isEqual: (a, b) => a === b,
    });
    const seen: number[] = [];
    source.subscribe((v) => seen.push(v));
    await vi.advanceTimersByTimeAsync(300);
    expect(seen).toEqual([1, 2]);
  });

  it("backs off on failure, reports it, and recovers", async () => {
    let calls = 0;
    const onError = vi.fn();
    const poll = vi.fn(async () => {
      calls += 1;
      if (calls <= 3) {
        throw new Error("down");
      }
      return calls;
    });
    const source = pollingSource({ poll, intervalMs: 100, maxBackoffMs: 300, onError });
    const seen: number[] = [];
    source.subscribe((v) => seen.push(v));
    await vi.advanceTimersByTimeAsync(0);
    expect(source.getStatus()).toBe("retrying");
    // failure 1 -> 200ms, failure 2 -> 300ms (capped from 400)
    await vi.advanceTimersByTimeAsync(199);
    expect(poll).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(poll).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(299);
    expect(poll).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(poll).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(300);
    expect(seen).toEqual([4]);
    expect(source.getStatus()).toBe("live");
    expect(onError).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(100);
    expect(seen).toEqual([4, 5]);
  });
});
