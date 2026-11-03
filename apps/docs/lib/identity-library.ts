import { tryCatch } from "@zedtech/zedkit-core";
import { NAMED_IDENTITY_PREFIX, isNamedIdentityId, parseIdentityTokens } from "@zedtech/zedkit-ui";
import type { IdentityTokens } from "@zedtech/zedkit-ui";

/**
 * The visitor's saved identities, kept on this device.
 *
 * Versioned and validated: every stored item passes the same schema the editor and the service use before it is
 * trusted, and an item that does not is dropped and counted, never rendered. Storage can be missing, blocked, full
 * or hold something we did not write; each of those is a named result the page can word, not an exception. A save
 * that would replace a different saved identity with the same name asks first (`exists`) instead of overwriting.
 */

export const LIBRARY_KEY = "zk-identity-library";
/** The key the editor used before versions: still read, migrated on the next write. */
export const LEGACY_KEY = "zk-identity-named";
const CORRUPT_BACKUP_KEY = "zk-identity-library-corrupt";
export const LIBRARY_VERSION = 2;
export const MAX_ITEMS = 50;
export const MAX_LABEL = 60;

export type IdentitySource = "editor" | "assistant";

export type SavedIdentity = {
  id: string;
  label: string;
  tokens: IdentityTokens;
  createdAt: number;
  updatedAt: number;
  source: IdentitySource;
};

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type LibraryRead = {
  items: SavedIdentity[];
  /** Why the library is empty or short: storage cannot be read, or what was there is not ours. */
  problem?: "unavailable" | "corrupt";
  /** Stored items that failed validation and were left out. */
  dropped: number;
};

export type SaveFailure = "unavailable" | "full" | "exists" | "invalid" | "missing" | "limit";
export type SaveResult = { ok: true; item: SavedIdentity } | { ok: false; reason: SaveFailure; existing?: SavedIdentity };

const EMPTY: LibraryRead = { items: [], dropped: 0 };

const cleanLabel = (label: string) => label.replace(/[\p{Cc}\p{Cf}]/gu, "").replace(/\s+/g, " ").trim().slice(0, MAX_LABEL);
const sameLabel = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

function slug(label: string): string {
  const text = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${NAMED_IDENTITY_PREFIX}${text || "look"}`;
}

function uniqueId(items: SavedIdentity[], base: string): string {
  if (!items.some((item) => item.id === base)) return base;
  let n = 2;
  while (items.some((item) => item.id === `${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

/** The first label not taken by another saved identity: "Press", then "Press 2", "Press 3". */
export function freeLabel(items: readonly SavedIdentity[], label: string): string {
  const base = cleanLabel(label) || "My identity";
  if (!items.some((item) => sameLabel(item.label, base))) return base;
  let n = 2;
  while (items.some((item) => sameLabel(item.label, `${base} ${n}`))) n += 1;
  return `${base} ${n}`;
}

function parseItem(value: unknown, now: number): SavedIdentity | undefined {
  if (!value || typeof value !== "object") return undefined;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string" || !isNamedIdentityId(row.id)) return undefined;
  if (typeof row.label !== "string" || cleanLabel(row.label) === "") return undefined;
  const tokens = parseIdentityTokens(row.tokens);
  if (!tokens.success) return undefined;
  const stamp = (field: unknown) => (typeof field === "number" && Number.isFinite(field) && field > 0 ? field : now);
  return {
    id: row.id,
    label: cleanLabel(row.label),
    tokens: tokens.data,
    createdAt: stamp(row.createdAt),
    updatedAt: stamp(row.updatedAt),
    source: row.source === "assistant" ? "assistant" : "editor",
  };
}

function parseList(rows: unknown[], now: number): LibraryRead {
  const items: SavedIdentity[] = [];
  const ids = new Set<string>();
  // A hand-edited or runaway value is read up to the limit the editor itself enforces; the rest is counted, not parsed.
  let dropped = Math.max(0, rows.length - MAX_ITEMS);
  for (const row of rows.slice(0, MAX_ITEMS)) {
    const item = parseItem(row, now);
    if (item && !ids.has(item.id)) {
      ids.add(item.id);
      items.push(item);
    } else dropped += 1;
  }
  return { items, dropped };
}

const isNewer = (body: unknown) => typeof (body as { version?: unknown } | null)?.version === "number" && (body as { version: number }).version > LIBRARY_VERSION;

/** The saved identities, from storage, validated. Never throws. */
export function readLibrary(storage: StorageLike | undefined, now: number = Date.now()): LibraryRead {
  if (!storage) return { ...EMPTY, problem: "unavailable" };
  const raw = tryCatch(() => storage.getItem(LIBRARY_KEY));
  if (!raw.ok) return { ...EMPTY, problem: "unavailable" };
  if (raw.value !== null) {
    const json = tryCatch(() => JSON.parse(raw.value as string) as unknown);
    const body = json.ok ? json.value : undefined;
    const rows = body && typeof body === "object" ? (body as { version?: unknown; items?: unknown }).items : undefined;
    if (!json.ok || !Array.isArray(rows)) return { ...EMPTY, problem: "corrupt" };
    // Written by a newer page: not understood, so not edited. The next write keeps a copy of it aside.
    if (isNewer(body)) return { ...EMPTY, problem: "corrupt" };
    return parseList(rows, now);
  }
  const legacy = tryCatch(() => storage.getItem(LEGACY_KEY));
  if (!legacy.ok || legacy.value === null) return EMPTY;
  const json = tryCatch(() => JSON.parse(legacy.value as string) as unknown);
  if (!json.ok || !Array.isArray(json.value)) return { ...EMPTY, problem: "corrupt" };
  return parseList(json.value, now);
}

function isFull(error: unknown): boolean {
  const e = error as { name?: string; code?: number } | null;
  return e?.name === "QuotaExceededError" || e?.name === "NS_ERROR_DOM_QUOTA_REACHED" || e?.code === 22 || e?.code === 1014;
}

/** Writes the whole library. A corrupt value that is about to be replaced is first copied aside, best effort. */
function writeLibrary(storage: StorageLike | undefined, items: SavedIdentity[]): "ok" | "unavailable" | "full" {
  if (!storage) return "unavailable";
  const before = tryCatch(() => storage.getItem(LIBRARY_KEY));
  if (before.ok && before.value !== null) {
    const text = before.value;
    const parsed = tryCatch(() => JSON.parse(text) as { items?: unknown; version?: unknown });
    if (!parsed.ok || !Array.isArray(parsed.value?.items) || isNewer(parsed.value)) tryCatch(() => storage.setItem(CORRUPT_BACKUP_KEY, text));
  }
  const written = tryCatch(() => storage.setItem(LIBRARY_KEY, JSON.stringify({ version: LIBRARY_VERSION, items })));
  if (!written.ok) return isFull(written.error) ? "full" : "unavailable";
  tryCatch(() => storage.removeItem(LEGACY_KEY));
  return "ok";
}

function fail(reason: SaveFailure, existing?: SavedIdentity): SaveResult {
  return existing ? { ok: false, reason, existing } : { ok: false, reason };
}

/**
 * Saves an identity under a name. If another saved identity already has that name, nothing is written and the
 * answer is `exists` with that identity: the caller asks the visitor to replace it or to pick `freeLabel`.
 */
export function saveIdentity(
  storage: StorageLike | undefined,
  input: { label: string; tokens: unknown; source?: IdentitySource; replace?: boolean },
  now: number = Date.now(),
): SaveResult {
  const label = cleanLabel(input.label);
  const parsed = parseIdentityTokens(input.tokens);
  if (label === "" || !parsed.success) return fail("invalid");
  const read = readLibrary(storage, now);
  if (read.problem === "unavailable") return fail("unavailable");
  const clash = read.items.find((item) => sameLabel(item.label, label));
  if (clash && !input.replace) return fail("exists", clash);
  if (!clash && read.items.length >= MAX_ITEMS) return fail("limit");
  const item: SavedIdentity = clash
    ? { ...clash, label, tokens: parsed.data, updatedAt: now, source: input.source ?? clash.source }
    : { id: uniqueId(read.items, slug(label)), label, tokens: parsed.data, createdAt: now, updatedAt: now, source: input.source ?? "editor" };
  const items = clash ? read.items.map((existing) => (existing.id === clash.id ? item : existing)) : [...read.items, item];
  const wrote = writeLibrary(storage, items);
  return wrote === "ok" ? { ok: true, item } : fail(wrote);
}

/** Renames one saved identity. A name another one holds is refused (`exists`), not taken over. */
export function renameIdentity(storage: StorageLike | undefined, id: string, label: string, now: number = Date.now()): SaveResult {
  const next = cleanLabel(label);
  if (next === "") return fail("invalid");
  const read = readLibrary(storage, now);
  if (read.problem === "unavailable") return fail("unavailable");
  const current = read.items.find((item) => item.id === id);
  if (!current) return fail("missing");
  const clash = read.items.find((item) => item.id !== id && sameLabel(item.label, next));
  if (clash) return fail("exists", clash);
  const item = { ...current, label: next, updatedAt: now };
  const wrote = writeLibrary(storage, read.items.map((existing) => (existing.id === id ? item : existing)));
  return wrote === "ok" ? { ok: true, item } : fail(wrote);
}

export function deleteIdentity(storage: StorageLike | undefined, id: string): "ok" | "missing" | "unavailable" | "full" {
  const read = readLibrary(storage);
  if (read.problem === "unavailable") return "unavailable";
  if (!read.items.some((item) => item.id === id)) return "missing";
  return writeLibrary(storage, read.items.filter((item) => item.id !== id));
}

/** The recipe a person can keep or share: the tokens, named, with the format that wrote it. */
export function exportRecipe(item: SavedIdentity): string {
  return JSON.stringify({ format: "zedkit-identity", version: LIBRARY_VERSION, name: item.label, tokens: item.tokens }, null, 2);
}

/** A recipe pasted back in: either the export above or bare tokens. Null when it holds no valid identity. */
export function importRecipe(text: string): { name?: string; tokens: IdentityTokens } | null {
  const json = tryCatch(() => JSON.parse(text) as unknown);
  if (!json.ok || !json.value || typeof json.value !== "object") return null;
  const body = json.value as { format?: unknown; name?: unknown; tokens?: unknown };
  const parsed = parseIdentityTokens(body.format === "zedkit-identity" ? body.tokens : json.value);
  if (!parsed.success) return null;
  return { ...(typeof body.name === "string" && cleanLabel(body.name) ? { name: cleanLabel(body.name) } : {}), tokens: parsed.data };
}
