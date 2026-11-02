import { useSyncExternalStore } from "react";
import { tryCatch } from "@zedtech/zedkit-core";

/**
 * A visitor's choice among a fixed list, kept in localStorage and shared by every control that reads it.
 * The first value is the default. Server render and first paint use the default, so hydration always agrees;
 * the stored choice arrives right after. Where storage is blocked the choice still works for the session.
 */
export function createStoredChoice<const Values extends readonly string[]>(storageKey: string, values: Values) {
  type Value = Values[number];
  const fallback = values[0] as Value;
  const listeners = new Set<() => void>();
  /** Wins over storage, so the choice still works where storage is blocked. */
  let chosen: Value | undefined;

  const isValue = (value: string): value is Value => values.some((item) => item === value);

  function read(): Value {
    if (chosen) return chosen;
    const stored = tryCatch(() => localStorage.getItem(storageKey));
    return values.find((item) => stored.ok && item === stored.value) ?? fallback;
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    /** Another tab chose: storage is the truth again. */
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== storageKey) return;
      chosen = undefined;
      listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  function set(value: Value): void {
    chosen = value;
    tryCatch(() => localStorage.setItem(storageKey, value));
    for (const listener of listeners) listener();
  }

  function useChoice(): readonly [Value, (value: Value) => void] {
    const value = useSyncExternalStore(subscribe, read, () => fallback);
    return [value, set];
  }

  return { isValue, useChoice };
}
