import { tryCatch } from "@zedtech/zedkit-core";
import type { IdentityTokens } from "@zedtech/zedkit-ui";

import { isSpecimenDomain, type SpecimenDomain } from "./brief-specimen-domain.ts";
import { initialSession, type SessionState } from "./identity-creator-session.ts";

/** Current persisted dock state (localStorage). */
export const IDENTITY_DOCK_STORAGE_KEY = "zk-identity-dock-v2";

/** Legacy sessionStorage key — read once for migration, then removed. */
export const LEGACY_IDENTITY_DOCK_STORAGE_KEY = "zk-identity-dock-v1";

export const IDENTITY_DOCK_MAX_THREAD_TURNS = 20;
export const IDENTITY_DOCK_MAX_BYTES = 64 * 1024;

const textEncoder = typeof TextEncoder !== "undefined" ? new TextEncoder() : null;

function encodedByteLength(json: string): number {
  return textEncoder ? textEncoder.encode(json).length : json.length;
}

export type IdentityDockPersist = {
  session: SessionState;
  brief: string;
  /** Last identity the visitor accepted in the dock; restored on reload for the next tweak. */
  previewTokens?: IdentityTokens;
  /** Specimen domain accepted with those tokens; kept even if thread trim drops the original brief. */
  previewDomain?: SpecimenDomain;
};

/**
 * A sync read. `previewTokensRaw` is unvalidated: pass it to `parsePersistedPreviewTokens`, which loads the zod schema
 * on demand so the root provider does not ship zod in every page's first load.
 */
export type IdentityDockPersistRead = Partial<Omit<IdentityDockPersist, "previewTokens">> & { previewTokensRaw?: unknown };

/** Validates persisted preview tokens; `null` when absent or invalid. */
export async function parsePersistedPreviewTokens(raw: unknown): Promise<IdentityTokens | null> {
  if (raw === undefined || raw === null) return null;
  const { parseIdentityTokens } = await import("./identity-tokens-parse.ts");
  const tokens = parseIdentityTokens(raw);
  return tokens.success ? tokens.data : null;
}

function parsePersistBlob(raw: string | null): IdentityDockPersistRead {
  if (raw === null || raw === undefined || raw === "") return {};
  const parsed = tryCatch(() => JSON.parse(raw) as IdentityDockPersist);
  if (!parsed.ok || typeof parsed.value !== "object" || parsed.value === null) return {};
  const { session, brief } = parsed.value;
  const out: IdentityDockPersistRead = {};
  if (session && typeof session === "object") {
    out.session = { ...session, pending: null };
  }
  if (typeof brief === "string") out.brief = brief;
  if (parsed.value.previewTokens !== undefined && parsed.value.previewTokens !== null) {
    out.previewTokensRaw = parsed.value.previewTokens;
  }
  if (isSpecimenDomain(parsed.value.previewDomain)) {
    out.previewDomain = parsed.value.previewDomain;
  }
  return out;
}

function readLegacyV1(): IdentityDockPersistRead {
  if (typeof window === "undefined") return {};
  for (const store of [window.sessionStorage, window.localStorage]) {
    const raw = tryCatch(() => store.getItem(LEGACY_IDENTITY_DOCK_STORAGE_KEY));
    if (!raw.ok) continue;
    const out = parsePersistBlob(raw.value);
    if (out.session || out.brief) return out;
  }
  return {};
}

function clearLegacyV1(): void {
  if (typeof window === "undefined") return;
  tryCatch(() => window.sessionStorage.removeItem(LEGACY_IDENTITY_DOCK_STORAGE_KEY));
  tryCatch(() => window.localStorage.removeItem(LEGACY_IDENTITY_DOCK_STORAGE_KEY));
}

/** Last N thread turns; never persist an in-flight request. */
export function trimSessionForPersist(session: SessionState): SessionState {
  return {
    ...session,
    pending: null,
    thread: session.thread.slice(-IDENTITY_DOCK_MAX_THREAD_TURNS),
  };
}

/** JSON under the byte cap; drops oldest thread turns first, then proposal/references, then brief tail. */
export function encodeIdentityDockPersist(data: IdentityDockPersist): string {
  let session = trimSessionForPersist(data.session);
  let brief = data.brief;
  let previewTokens = data.previewTokens;
  const previewDomain = data.previewDomain;

  const pack = () =>
    JSON.stringify({
      session,
      brief,
      ...(previewTokens ? { previewTokens } : {}),
      ...(previewDomain ? { previewDomain } : {}),
    });

  let json = pack();
  while (encodedByteLength(json) > IDENTITY_DOCK_MAX_BYTES && session.thread.length > 0) {
    session = { ...session, thread: session.thread.slice(1) };
    json = pack();
  }
  if (encodedByteLength(json) > IDENTITY_DOCK_MAX_BYTES) {
    session = { ...session, proposal: null, references: [] };
    json = pack();
  }
  if (encodedByteLength(json) > IDENTITY_DOCK_MAX_BYTES && previewTokens) {
    previewTokens = undefined;
    json = pack();
  }
  while (encodedByteLength(json) > IDENTITY_DOCK_MAX_BYTES && brief.length > 0) {
    brief = brief.slice(0, Math.max(0, brief.length - 256));
    json = pack();
  }
  if (encodedByteLength(json) > IDENTITY_DOCK_MAX_BYTES) {
    session = { ...session, thread: [] };
    json = pack();
  }
  return json;
}

export function readIdentityDockPersist(): IdentityDockPersistRead {
  if (typeof window === "undefined") return {};

  const current = tryCatch(() => window.localStorage.getItem(IDENTITY_DOCK_STORAGE_KEY));
  if (current.ok && current.value) {
    const out = parsePersistBlob(current.value);
    if (out.session || out.brief) return out;
  }

  const legacy = readLegacyV1();
  if (legacy.session || legacy.brief) {
    writeIdentityDockPersist({
      session: legacy.session ?? initialSession,
      brief: legacy.brief ?? "",
    });
    clearLegacyV1();
    return legacy;
  }

  return {};
}

export function writeIdentityDockPersist(data: IdentityDockPersist): void {
  if (typeof window === "undefined") return;

  const attempt = (payload: IdentityDockPersist) => {
    const encoded = encodeIdentityDockPersist(payload);
    return tryCatch(() => {
      window.localStorage.setItem(IDENTITY_DOCK_STORAGE_KEY, encoded);
    });
  };

  let result = attempt(data);
  if (result.ok) return;

  const shrunk: IdentityDockPersist = {
    brief: data.brief.slice(0, 512),
    session: {
      ...trimSessionForPersist(data.session),
      proposal: null,
      references: [],
      thread: trimSessionForPersist(data.session).thread.slice(-8),
    },
  };
  result = attempt(shrunk);
  if (result.ok) return;

  tryCatch(() =>
    window.localStorage.setItem(
      IDENTITY_DOCK_STORAGE_KEY,
      JSON.stringify({
        session: { ...initialSession, pending: null },
        brief: data.brief.slice(0, 256),
      }),
    ),
  );
}

export function clearIdentityDockPersist(): void {
  if (typeof window === "undefined") return;
  tryCatch(() => window.localStorage.removeItem(IDENTITY_DOCK_STORAGE_KEY));
}
