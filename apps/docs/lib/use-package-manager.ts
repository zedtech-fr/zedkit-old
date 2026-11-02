import { useSyncExternalStore } from "react";
import { tryCatch } from "@zedtech/zedkit-core";
import { packageManagers, type PackageManager } from "./package-manager-commands";

/** The key fumadocs' `<Tabs groupId="package-manager" persist>` writes, so generated pages and these selects agree. */
const STORAGE_KEY = "package-manager";
const listeners = new Set<() => void>();
/** Wins over storage, so the choice still works where storage is blocked. */
let chosen: PackageManager | undefined;

function read(): PackageManager {
  if (chosen) return chosen;
  const stored = tryCatch(() => localStorage.getItem(STORAGE_KEY));
  return packageManagers.find((pm) => stored.ok && pm === stored.value) ?? packageManagers[0];
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  /** Another tab chose: storage is the truth again. */
  const onStorage = () => {
    chosen = undefined;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function isPackageManager(value: string): value is PackageManager {
  return packageManagers.some((pm) => pm === value);
}

function setPackageManager(pm: PackageManager): void {
  chosen = pm;
  tryCatch(() => localStorage.setItem(STORAGE_KEY, pm));
  for (const listener of listeners) listener();
}

/** The visitor's package manager, shared by every command on the page and kept across pages. */
export function usePackageManager(): readonly [PackageManager, (pm: PackageManager) => void] {
  const pm = useSyncExternalStore(subscribe, read, () => packageManagers[0]);
  return [pm, setPackageManager];
}
