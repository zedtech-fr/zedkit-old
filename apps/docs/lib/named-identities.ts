import { tryCatch } from "@zedtech/zedkit-core";
import {
  IDENTITY_CHANGE_EVENT,
  applyCustomIdentity,
  isNamedIdentityId,
  type IdentityOption,
  type IdentityTokens,
} from "@zedtech/zedkit-ui";

import {
  LEGACY_KEY,
  LIBRARY_KEY,
  deleteIdentity,
  readLibrary,
  renameIdentity,
  saveIdentity,
  type IdentitySource,
  type LibraryRead,
  type SaveResult,
  type SavedIdentity,
} from "@/lib/identity-library";
import { DOCS_SITE_IDENTITY_STORAGE_KEY, isDocsSiteIdentityOptIn } from "@/lib/site-identity-storage";

/**
 * The saved identities as the editor and the header read them: a live view over the versioned library
 * (`identity-library.ts`), in browser storage, with a change event so every reader follows a save or a delete.
 */
const NAMED_CHANGE_EVENT = "zk-identity-named-change";
const EMPTY: NamedIdentity[] = [];
const EMPTY_READ: LibraryRead = { items: EMPTY, dropped: 0 };

type NamedIdentity = SavedIdentity;

let snapshotKey: string | undefined;
let snapshot: LibraryRead = EMPTY_READ;

function storage(): Storage | undefined {
  if (typeof window === "undefined") return undefined;
  const found = tryCatch(() => window.localStorage);
  return found.ok ? found.value : undefined;
}

/** The library as it is stored now. The same object is returned until storage changes, as a store snapshot must. */
function readLibrarySnapshot(): LibraryRead {
  const store = storage();
  if (!store) return snapshotKey === undefined ? EMPTY_READ : snapshot;
  const key = tryCatch(() => `${store.getItem(LIBRARY_KEY)}|${store.getItem(LEGACY_KEY)}`);
  const next = key.ok ? key.value : "unreadable";
  if (next === snapshotKey) return snapshot;
  snapshotKey = next;
  const read = readLibrary(store);
  snapshot = read.items.length === 0 && !read.problem && read.dropped === 0 ? EMPTY_READ : read;
  return snapshot;
}

function readNamedIdentities(): NamedIdentity[] {
  return readLibrarySnapshot().items;
}

function changed(result: SaveResult | string): void {
  if (typeof window === "undefined") return;
  if (typeof result === "string" || result.ok) window.dispatchEvent(new Event(NAMED_CHANGE_EVENT));
}

/** Saves under a name. A name another saved identity holds is not replaced unless `replace` says so. */
function saveNamedIdentity(label: string, tokens: IdentityTokens, options: { replace?: boolean; source?: IdentitySource } = {}): SaveResult {
  const result = saveIdentity(storage(), { label, tokens, ...options });
  changed(result);
  return result;
}

function renameNamedIdentity(id: string, label: string): SaveResult {
  const result = renameIdentity(storage(), id, label);
  changed(result);
  return result;
}

function deleteNamedIdentity(id: string): void {
  changed(deleteIdentity(storage(), id));
}

function namedIdentityOptions(list: NamedIdentity[]): IdentityOption[] {
  return list.map((item) => ({ id: item.id, label: item.label }));
}

function subscribeNamedIdentities(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(NAMED_CHANGE_EVENT, onStoreChange);
  window.addEventListener(IDENTITY_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(NAMED_CHANGE_EVENT, onStoreChange);
    window.removeEventListener(IDENTITY_CHANGE_EVENT, onStoreChange);
  };
}

/** Re-apply a stored named look after hydration (uses the docs site identity keys). */
function restoreNamedIdentity() {
  if (!isDocsSiteIdentityOptIn()) return;
  const id = window.localStorage.getItem(DOCS_SITE_IDENTITY_STORAGE_KEY);
  if (!id || !isNamedIdentityId(id)) return;
  const saved = readNamedIdentities().find((item) => item.id === id);
  if (saved) applyCustomIdentity(saved.tokens, saved.id, DOCS_SITE_IDENTITY_STORAGE_KEY);
}

export {
  LIBRARY_KEY as NAMED_STORAGE_KEY,
  deleteNamedIdentity,
  namedIdentityOptions,
  readLibrarySnapshot,
  readNamedIdentities,
  renameNamedIdentity,
  restoreNamedIdentity,
  saveNamedIdentity,
  subscribeNamedIdentities,
  type NamedIdentity,
};
