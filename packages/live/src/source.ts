// Original work by the same author.
import { tryCatch } from "@zedtech/zedkit-core";

/** Connection state of a source. `idle` means nobody is subscribed. */
export type LiveStatus = "idle" | "connecting" | "live" | "retrying";

export type LiveListener<T> = (message: T) => void;

/**
 * A stream of messages that starts on the first subscriber and stops on the
 * last unsubscribe. No framework types: wire `subscribe` / `onStatus` /
 * `getStatus` into whatever state layer you use.
 */
export interface LiveSource<T = void> {
  /** Start receiving messages. Returns an idempotent unsubscribe function. */
  subscribe(listener: LiveListener<T>): () => void;
  /** Current status (stable between changes, safe for `useSyncExternalStore`). */
  getStatus(): LiveStatus;
  /** Observe status changes. Returns an idempotent unsubscribe function. */
  onStatus(listener: (status: LiveStatus) => void): () => void;
}

/** What a source implementation uses to talk to its subscribers. */
export interface LiveHost<T> {
  emit(message: T): void;
  setStatus(status: LiveStatus): void;
  reportError(error: Error): void;
}

export interface CreateLiveSourceOptions {
  /** Called for listener errors and source-reported errors. Never throws into the source. */
  onError?: ((error: Error) => void) | undefined;
}

/**
 * Build a `LiveSource` from a start function. `start` runs once per active
 * period (first subscribe to last unsubscribe) and returns its stop function.
 * After stop, late calls on that run's host are ignored.
 */
export function createLiveSource<T = void>(
  start: (host: LiveHost<T>) => () => void,
  options: CreateLiveSourceOptions = {},
): LiveSource<T> {
  const listeners = new Set<LiveListener<T>>();
  const statusListeners = new Set<(status: LiveStatus) => void>();
  let status: LiveStatus = "idle";
  let stop: (() => void) | undefined;

  const report = (error: Error): void => {
    if (options.onError) {
      // A throwing error hook must not take the source down.
      tryCatch(() => options.onError?.(error));
    }
  };

  const changeStatus = (next: LiveStatus): void => {
    if (next === status) {
      return;
    }
    status = next;
    for (const listener of [...statusListeners]) {
      const result = tryCatch(() => listener(next));
      if (!result.ok) {
        report(result.error);
      }
    }
  };

  const run = (): void => {
    let active = true;
    changeStatus("connecting");
    const host: LiveHost<T> = {
      emit(message) {
        if (!active) {
          return;
        }
        for (const listener of [...listeners]) {
          const result = tryCatch(() => listener(message));
          if (!result.ok) {
            report(result.error);
          }
        }
      },
      setStatus(next) {
        if (active) {
          changeStatus(next);
        }
      },
      reportError(error) {
        if (active) {
          report(error);
        }
      },
    };
    const stopRun = start(host);
    stop = () => {
      active = false;
      stopRun();
    };
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      if (listeners.size === 1 && !stop) {
        run();
      }
      return () => {
        if (!listeners.delete(listener) || listeners.size > 0) {
          return;
        }
        const stopRun = stop;
        stop = undefined;
        stopRun?.();
        changeStatus("idle");
      };
    },
    getStatus: () => status,
    onStatus(listener) {
      statusListeners.add(listener);
      return () => {
        statusListeners.delete(listener);
      };
    },
  };
}
