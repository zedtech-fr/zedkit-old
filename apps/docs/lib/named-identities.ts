import { tryCatch } from "@zedtech/zedkit-core";
import {
  IDENTITY_CHANGE_EVENT,
  NAMED_IDENTITY_PREFIX,
  applyCustomIdentity,
  isNamedIdentityId,
  parseIdentityTokens,
  type IdentityOption,
  type IdentityTokens,
} from "@zedtech/zedkit-ui";

import {
  DOCS_SITE_IDENTITY_STORAGE_KEY,
  isDocsSiteIdentityOptIn,
} from "@/lib/site-identity-storage";

const NAMED_STORAGE_KEY = "zk-identity-named";
const NAMED_CHANGE_EVENT = "zk-identity-named-change";
const EMPTY_NAMED: NamedIdentity[] = [];

type NamedIdentity = { id: string; label: string; tokens: IdentityTokens };

let snapshotRaw: string | null | undefined;
let snapshot: NamedIdentity[] = EMPTY_NAMED;

function slugId(label: string): string {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${NAMED_IDENTITY_PREFIX}${slug || "look"}`;
}

function parseNamedIdentities(raw: string | null): NamedIdentity[] {
  if (!raw) return EMPTY_NAMED;
  const parsed = tryCatch(() => JSON.parse(raw) as unknown);
  if (!parsed.ok || !Array.isArray(parsed.value)) return EMPTY_NAMED;
  const out: NamedIdentity[] = [];
  for (const item of parsed.value) {
    if (!item || typeof item !== "object") continue;
    const row = item as { id?: unknown; label?: unknown; tokens?: unknown };
    if (typeof row.id !== "string" || !row.id.startsWith(NAMED_IDENTITY_PREFIX)) continue;
    if (typeof row.label !== "string" || row.label.trim() === "") continue;
    const tokens = parseIdentityTokens(row.tokens);
    if (!tokens.success) continue;
    out.push({ id: row.id, label: row.label.trim(), tokens: tokens.data });
  }
  return out.length === 0 ? EMPTY_NAMED : out;
}

function readNamedIdentities(): NamedIdentity[] {
  if (typeof window === "undefined") return EMPTY_NAMED;
  const raw = window.localStorage.getItem(NAMED_STORAGE_KEY);
  if (raw === snapshotRaw) return snapshot;
  snapshotRaw = raw;
  snapshot = parseNamedIdentities(raw);
  return snapshot;
}

function writeNamedIdentities(list: NamedIdentity[]) {
  const raw = JSON.stringify(list);
  window.localStorage.setItem(NAMED_STORAGE_KEY, raw);
  snapshotRaw = raw;
  snapshot = list.length === 0 ? EMPTY_NAMED : list;
  window.dispatchEvent(new Event(NAMED_CHANGE_EVENT));
}

function saveNamedIdentity(label: string, tokens: IdentityTokens): NamedIdentity | undefined {
  const trimmed = label.trim();
  const parsed = parseIdentityTokens(tokens);
  if (trimmed === "" || !parsed.success) return undefined;
  const list = readNamedIdentities();
  const existing = list.find((item) => item.label.toLowerCase() === trimmed.toLowerCase());
  const saved: NamedIdentity = {
    id: existing?.id ?? uniqueId(list, slugId(trimmed)),
    label: trimmed,
    tokens: parsed.data,
  };
  writeNamedIdentities(existing ? list.map((item) => (item.id === saved.id ? saved : item)) : [...list, saved]);
  return saved;
}

function uniqueId(list: NamedIdentity[], base: string): string {
  if (!list.some((item) => item.id === base)) return base;
  let n = 2;
  while (list.some((item) => item.id === `${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

function renameNamedIdentity(id: string, label: string): NamedIdentity | undefined {
  const trimmed = label.trim();
  if (trimmed === "") return undefined;
  const list = readNamedIdentities();
  const current = list.find((item) => item.id === id);
  if (!current) return undefined;
  const saved = { ...current, label: trimmed };
  writeNamedIdentities(list.map((item) => (item.id === id ? saved : item)));
  return saved;
}

function deleteNamedIdentity(id: string) {
  writeNamedIdentities(readNamedIdentities().filter((item) => item.id !== id));
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
  NAMED_STORAGE_KEY,
  deleteNamedIdentity,
  namedIdentityOptions,
  readNamedIdentities,
  renameNamedIdentity,
  restoreNamedIdentity,
  saveNamedIdentity,
  subscribeNamedIdentities,
  type NamedIdentity,
};
