import { describe, expect, it, vi } from "vitest";
import { createLiveSource, type LiveHost, type LiveStatus } from "../src/index.js";

function setup() {
  let host!: LiveHost<number>;
  const start = vi.fn((h: LiveHost<number>) => {
    host = h;
    return stop;
  });
  const stop = vi.fn();
  const onError = vi.fn();
  const source = createLiveSource<number>(start, { onError });
  return { source, start, stop, onError, host: () => host };
}

describe("createLiveSource", () => {
  it("starts on first subscribe and stops on last unsubscribe", () => {
    const { source, start, stop } = setup();
    expect(source.getStatus()).toBe("idle");
    const a = source.subscribe(() => {});
    const b = source.subscribe(() => {});
    expect(start).toHaveBeenCalledTimes(1);
    expect(source.getStatus()).toBe("connecting");
    a();
    expect(stop).not.toHaveBeenCalled();
    b();
    b();
    expect(stop).toHaveBeenCalledTimes(1);
    expect(source.getStatus()).toBe("idle");
  });

  it("restarts after a full stop", () => {
    const { source, start } = setup();
    source.subscribe(() => {})();
    source.subscribe(() => {});
    expect(start).toHaveBeenCalledTimes(2);
  });

  it("delivers to every listener and ignores a stopped run", () => {
    const { source, host } = setup();
    const seen: number[] = [];
    const off = source.subscribe((n) => seen.push(n));
    source.subscribe((n) => seen.push(n * 10));
    const first = host();
    first.emit(1);
    expect(seen).toEqual([1, 10]);
    off();
    first.emit(2);
    expect(seen).toEqual([1, 10, 20]);
  });

  it("drops emits and status from a run that was stopped", () => {
    const { source, host } = setup();
    const seen: number[] = [];
    const off = source.subscribe((n) => seen.push(n));
    const stale = host();
    off();
    stale.emit(1);
    stale.setStatus("live");
    expect(seen).toEqual([]);
    expect(source.getStatus()).toBe("idle");
  });

  it("isolates listener errors and reports them", () => {
    const { source, host, onError } = setup();
    const seen: number[] = [];
    source.subscribe(() => {
      throw new Error("boom");
    });
    source.subscribe((n) => seen.push(n));
    host().emit(7);
    expect(seen).toEqual([7]);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("notifies status changes once per change", () => {
    const { source, host } = setup();
    const statuses: LiveStatus[] = [];
    const off = source.onStatus((s) => statuses.push(s));
    source.subscribe(() => {});
    host().setStatus("live");
    host().setStatus("live");
    host().setStatus("retrying");
    off();
    host().setStatus("live");
    expect(statuses).toEqual(["connecting", "live", "retrying"]);
  });

  it("survives a throwing error hook", () => {
    const source = createLiveSource<number>(
      (h) => {
        h.reportError(new Error("x"));
        return () => {};
      },
      {
        onError: () => {
          throw new Error("hook");
        },
      },
    );
    expect(() => source.subscribe(() => {})).not.toThrow();
  });
});
