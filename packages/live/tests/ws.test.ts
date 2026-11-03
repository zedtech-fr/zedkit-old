import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pollingSource, wsSource, type LiveStatus } from "../src/index.js";

class FakeSocket extends EventTarget {
  static instances: FakeSocket[] = [];
  closed = false;
  constructor(
    readonly url: string,
    readonly protocols?: string | string[],
  ) {
    super();
    FakeSocket.instances.push(this);
  }
  open(): void {
    this.dispatchEvent(new Event("open"));
  }
  frame(data: unknown): void {
    this.dispatchEvent(new MessageEvent("message", { data }));
  }
  drop(): void {
    this.dispatchEvent(new Event("error"));
    this.dispatchEvent(new Event("close"));
  }
  close(): void {
    this.closed = true;
  }
}

const createSocket = (url: string, protocols?: string | string[]) =>
  new FakeSocket(url, protocols) as unknown as WebSocket;
const last = () => FakeSocket.instances[FakeSocket.instances.length - 1] as FakeSocket;

beforeEach(() => {
  vi.useFakeTimers();
  FakeSocket.instances = [];
});
afterEach(() => {
  vi.useRealTimers();
});

const base = { url: "wss://example.test/live", createSocket, random: () => 0.5 };

describe("wsSource", () => {
  it("connects lazily, parses JSON frames, and reports live", async () => {
    const source = wsSource<{ id: number }>({ ...base, protocols: ["v1"] });
    expect(FakeSocket.instances).toHaveLength(0);
    const seen: unknown[] = [];
    source.subscribe((m) => seen.push(m));
    await vi.advanceTimersByTimeAsync(0);
    expect(last().url).toBe("wss://example.test/live");
    expect(last().protocols).toEqual(["v1"]);
    expect(source.getStatus()).toBe("connecting");
    last().open();
    expect(source.getStatus()).toBe("live");
    last().frame('{"id":1}');
    last().frame(new ArrayBuffer(1));
    expect(seen).toEqual([{ id: 1 }]);
  });

  it("drops frames the parser rejects and reports parse errors", async () => {
    const onError = vi.fn();
    const source = wsSource<string>({
      ...base,
      onError,
      parse: (d) => {
        if (d === "bad") {
          throw new Error("nope");
        }
        return d === "skip" ? undefined : String(d);
      },
    });
    const seen: string[] = [];
    source.subscribe((m) => seen.push(m));
    await vi.advanceTimersByTimeAsync(0);
    last().open();
    for (const f of ["a", "skip", "bad", "b"]) {
      last().frame(f);
    }
    expect(seen).toEqual(["a", "b"]);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("reconnects with exponential backoff and resets after open", async () => {
    const source = wsSource({ ...base, reconnect: { minDelayMs: 100, maxDelayMs: 350, jitter: 0 } });
    const statuses: LiveStatus[] = [];
    source.onStatus((s) => statuses.push(s));
    source.subscribe(() => {});
    await vi.advanceTimersByTimeAsync(0);
    last().drop();
    expect(source.getStatus()).toBe("retrying");
    await vi.advanceTimersByTimeAsync(99);
    expect(FakeSocket.instances).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(FakeSocket.instances).toHaveLength(2);
    last().drop(); // second failure: 200ms
    await vi.advanceTimersByTimeAsync(199);
    expect(FakeSocket.instances).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(FakeSocket.instances).toHaveLength(3);
    last().drop(); // third failure: 400 capped to 350
    await vi.advanceTimersByTimeAsync(349);
    expect(FakeSocket.instances).toHaveLength(3);
    await vi.advanceTimersByTimeAsync(1);
    expect(FakeSocket.instances).toHaveLength(4);
    last().open();
    last().drop(); // reset: back to 100ms
    await vi.advanceTimersByTimeAsync(100);
    expect(FakeSocket.instances).toHaveLength(5);
    expect(statuses).toEqual(["connecting", "retrying", "live", "retrying"]);
  });

  it("applies jitter around the delay", async () => {
    const source = wsSource({
      ...base,
      random: () => 1,
      reconnect: { minDelayMs: 100, jitter: 0.5 },
    });
    source.subscribe(() => {});
    await vi.advanceTimersByTimeAsync(0);
    last().drop();
    await vi.advanceTimersByTimeAsync(149);
    expect(FakeSocket.instances).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(FakeSocket.instances).toHaveLength(2);
  });

  it("resolves the url per attempt and retries when it rejects", async () => {
    let n = 0;
    const url = vi.fn(async () => {
      n += 1;
      if (n === 1) {
        throw new Error("token service down");
      }
      return `wss://example.test/live?t=${n}`;
    });
    const onError = vi.fn();
    const source = wsSource({ ...base, url, onError, reconnect: { minDelayMs: 50, jitter: 0 } });
    source.subscribe(() => {});
    await vi.advanceTimersByTimeAsync(0);
    expect(FakeSocket.instances).toHaveLength(0);
    expect(source.getStatus()).toBe("retrying");
    await vi.advanceTimersByTimeAsync(50);
    expect(last().url).toBe("wss://example.test/live?t=2");
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("retries when the socket constructor throws", async () => {
    let calls = 0;
    const source = wsSource({
      ...base,
      createSocket: (url) => {
        calls += 1;
        if (calls === 1) {
          throw new SyntaxError("bad url");
        }
        return createSocket(url);
      },
      reconnect: { minDelayMs: 10, jitter: 0 },
    });
    source.subscribe(() => {});
    await vi.advanceTimersByTimeAsync(0);
    expect(source.getStatus()).toBe("retrying");
    await vi.advanceTimersByTimeAsync(10);
    expect(FakeSocket.instances).toHaveLength(1);
  });

  it("runs the fallback only while the socket is down", async () => {
    let n = 0;
    const poll = vi.fn(async () => ++n);
    const source = wsSource<number>({
      ...base,
      fallback: pollingSource({ poll, intervalMs: 1000 }),
      reconnect: { minDelayMs: 5000, jitter: 0 },
    });
    const seen: number[] = [];
    source.subscribe((m) => seen.push(m));
    await vi.advanceTimersByTimeAsync(0);
    last().open();
    await vi.advanceTimersByTimeAsync(3000);
    expect(poll).not.toHaveBeenCalled();
    last().drop();
    await vi.advanceTimersByTimeAsync(0);
    expect(seen).toEqual([1]);
    await vi.advanceTimersByTimeAsync(1000);
    expect(seen).toEqual([1, 2]);
    await vi.advanceTimersByTimeAsync(4000); // reconnect attempt at 5000
    last().open();
    const calls = poll.mock.calls.length;
    const delivered = seen.length;
    await vi.advanceTimersByTimeAsync(5000);
    expect(poll).toHaveBeenCalledTimes(calls);
    last().frame("99");
    expect(seen).toHaveLength(delivered + 1);
    expect(seen.at(-1)).toBe(99);
  });

  it("closes the socket, cancels retries, and stops the fallback on unsubscribe", async () => {
    const poll = vi.fn(async () => 1);
    const source = wsSource<number>({
      ...base,
      fallback: pollingSource({ poll, intervalMs: 1000 }),
      reconnect: { minDelayMs: 100, jitter: 0 },
    });
    const off = source.subscribe(() => {});
    await vi.advanceTimersByTimeAsync(0);
    const socket = last();
    socket.open();
    off();
    expect(socket.closed).toBe(true);
    expect(source.getStatus()).toBe("idle");
    socket.drop(); // late events are ignored
    await vi.advanceTimersByTimeAsync(10_000);
    expect(FakeSocket.instances).toHaveLength(1);
    expect(poll).not.toHaveBeenCalled();

    const off2 = source.subscribe(() => {});
    await vi.advanceTimersByTimeAsync(0);
    last().drop();
    await vi.advanceTimersByTimeAsync(0);
    const before = poll.mock.calls.length;
    off2();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(poll).toHaveBeenCalledTimes(before);
  });

  it("uses the global WebSocket by default", async () => {
    const original = globalThis.WebSocket;
    globalThis.WebSocket = FakeSocket as unknown as typeof WebSocket;
    const source = wsSource({ url: "wss://example.test/x" });
    const off = source.subscribe(() => {});
    await vi.advanceTimersByTimeAsync(0);
    expect(last().url).toBe("wss://example.test/x");
    off();
    globalThis.WebSocket = original;
  });
});
