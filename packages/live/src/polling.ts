// Original work by the same author.
import { tryCatchAsync } from "@zedtech/zedkit-core";
import { createLiveSource, type LiveSource } from "./source.js";

export interface PollingSourceOptions<T> {
  /** Fetch the latest value. The signal aborts when the source stops. */
  poll: (signal: AbortSignal) => Promise<T>;
  /** Delay between the end of one poll and the start of the next. Must be > 0. */
  intervalMs: number;
  /** Upper bound for the failure backoff. Default: `intervalMs * 8`. */
  maxBackoffMs?: number;
  /** Skip emitting when the new value equals the previous one. Default: emit every result. */
  isEqual?: (previous: T, next: T) => boolean;
  /** Receives poll and listener errors. */
  onError?: (error: Error) => void;
}

/**
 * Poll on an interval and emit each result. Failures keep the loop alive with
 * exponential backoff (status `retrying`); one success resets it.
 * Polls never overlap: the next delay starts when the previous poll settles.
 */
export function pollingSource<T>(options: PollingSourceOptions<T>): LiveSource<T> {
  const { poll, intervalMs, isEqual, onError } = options;
  if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
    throw new RangeError("pollingSource: intervalMs must be a positive number");
  }
  const maxBackoffMs = Math.max(options.maxBackoffMs ?? intervalMs * 8, intervalMs);

  return createLiveSource<T>(
    (host) => {
      const controller = new AbortController();
      let timer: ReturnType<typeof setTimeout> | undefined;
      let failures = 0;
      let hasPrevious = false;
      let previous: T | undefined;

      const schedule = (): void => {
        const delay =
          failures === 0 ? intervalMs : Math.min(maxBackoffMs, intervalMs * 2 ** failures);
        timer = setTimeout(tick, delay);
      };

      const tick = (): void => {
        void tryCatchAsync(() => poll(controller.signal)).then((result) => {
          if (controller.signal.aborted) {
            return;
          }
          if (!result.ok) {
            failures += 1;
            host.setStatus("retrying");
            host.reportError(result.error);
          } else {
            failures = 0;
            host.setStatus("live");
            const next = result.value;
            const unchanged =
              hasPrevious && isEqual !== undefined && isEqual(previous as T, next);
            hasPrevious = true;
            previous = next;
            if (!unchanged) {
              host.emit(next);
            }
          }
          if (!controller.signal.aborted) {
            schedule();
          }
        });
      };

      tick();
      return () => {
        controller.abort();
        if (timer !== undefined) {
          clearTimeout(timer);
        }
      };
    },
    { onError },
  );
}
