// Original work by the same author.
import { tryCatch, tryCatchAsync } from "@zedtech/zedkit-core";
import { createLiveSource, type LiveSource } from "./source.js";

export interface WsReconnectOptions {
  /** First retry delay. Default 500. */
  minDelayMs?: number;
  /** Delay ceiling. Default 30000. */
  maxDelayMs?: number;
  /** Multiplier per consecutive failure. Default 2. */
  factor?: number;
  /** Random spread as a fraction of the delay (0 to 1). Default 0.2. */
  jitter?: number;
}

export interface WsSourceOptions<T> {
  /**
   * Socket URL. Pass a function to resolve it on every attempt (for example
   * to mint a fresh token); a rejection counts as a failed attempt.
   */
  url: string | (() => string | Promise<string>);
  protocols?: string | string[];
  /**
   * Turn a frame into a message. Default: `JSON.parse` for text frames.
   * Return `undefined` to drop a frame; a throw is reported and dropped.
   */
  parse?: (data: unknown) => T | undefined;
  /** Socket factory. Default: `new WebSocket(url, protocols)`. */
  createSocket?: (url: string, protocols?: string | string[]) => WebSocket;
  reconnect?: WsReconnectOptions;
  /**
   * Source to run while the socket is not open, for example a
   * `pollingSource`. It starts after the first failed or closed connection
   * and stops once the socket opens again.
   */
  fallback?: LiveSource<T>;
  /** Random source for jitter, in [0, 1). Default `Math.random`. */
  random?: () => number;
  /** Receives socket, parse, and listener errors. */
  onError?: (error: Error) => void;
}

function defaultParse(data: unknown): unknown {
  return typeof data === "string" ? JSON.parse(data) : undefined;
}

/**
 * Receive messages over a WebSocket with jittered exponential reconnect and
 * an optional fallback source for the gaps. Status is the socket's:
 * `connecting` on the first attempt, `live` while open, `retrying` after
 * a failure, even while the fallback delivers messages.
 * Messages sent while the socket was down are not replayed.
 */
export function wsSource<T = unknown>(options: WsSourceOptions<T>): LiveSource<T> {
  const parse = (options.parse ?? defaultParse) as (data: unknown) => T | undefined;
  const createSocket =
    options.createSocket ?? ((url, protocols) => new WebSocket(url, protocols));
  const minDelayMs = options.reconnect?.minDelayMs ?? 500;
  const maxDelayMs = Math.max(options.reconnect?.maxDelayMs ?? 30_000, minDelayMs);
  const factor = options.reconnect?.factor ?? 2;
  const jitter = Math.min(Math.max(options.reconnect?.jitter ?? 0.2, 0), 1);
  const random = options.random ?? Math.random;
  const { fallback } = options;

  return createLiveSource<T>(
    (host) => {
      let stopped = false;
      let attempt = 0;
      let timer: ReturnType<typeof setTimeout> | undefined;
      let socket: WebSocket | undefined;
      let detach: (() => void) | undefined;
      let stopFallback: (() => void) | undefined;

      const startFallback = (): void => {
        if (fallback && !stopFallback) {
          stopFallback = fallback.subscribe((message) => host.emit(message));
        }
      };
      const endFallback = (): void => {
        stopFallback?.();
        stopFallback = undefined;
      };

      const retryDelay = (): number => {
        const base = Math.min(maxDelayMs, minDelayMs * factor ** attempt);
        return Math.max(0, base * (1 + jitter * (2 * random() - 1)));
      };

      const fail = (error: Error): void => {
        if (stopped) {
          return;
        }
        host.reportError(error);
        host.setStatus("retrying");
        startFallback();
        timer = setTimeout(connect, retryDelay());
        attempt += 1;
      };

      const connect = (): void => {
        timer = undefined;
        if (attempt === 0) {
          host.setStatus("connecting");
        }
        void tryCatchAsync(async () =>
          typeof options.url === "function" ? options.url() : options.url,
        ).then((resolved) => {
          if (stopped) {
            return;
          }
          if (!resolved.ok) {
            fail(resolved.error);
            return;
          }
          const created = tryCatch(() => createSocket(resolved.value, options.protocols));
          if (!created.ok) {
            fail(created.error);
            return;
          }
          attach(created.value);
        });
      };

      const attach = (ws: WebSocket): void => {
        let settled = false;
        socket = ws;
        const onOpen = (): void => {
          attempt = 0;
          endFallback();
          host.setStatus("live");
        };
        const onMessage = (event: Event): void => {
          const parsed = tryCatch(() => parse((event as MessageEvent).data));
          if (!parsed.ok) {
            host.reportError(parsed.error);
          } else if (parsed.value !== undefined) {
            host.emit(parsed.value);
          }
        };
        const onClose = (): void => {
          if (settled) {
            return;
          }
          settled = true;
          release();
          fail(new Error("WebSocket closed"));
        };
        const onSocketError = (): void => {
          host.reportError(new Error("WebSocket error"));
        };
        ws.addEventListener("open", onOpen);
        ws.addEventListener("message", onMessage);
        ws.addEventListener("close", onClose);
        ws.addEventListener("error", onSocketError);
        const release = (): void => {
          ws.removeEventListener("open", onOpen);
          ws.removeEventListener("message", onMessage);
          ws.removeEventListener("close", onClose);
          ws.removeEventListener("error", onSocketError);
          detach = undefined;
          socket = undefined;
        };
        detach = release;
      };

      connect();
      return () => {
        stopped = true;
        if (timer !== undefined) {
          clearTimeout(timer);
        }
        const open = socket;
        detach?.();
        open?.close();
        endFallback();
      };
    },
    { onError: options.onError },
  );
}
