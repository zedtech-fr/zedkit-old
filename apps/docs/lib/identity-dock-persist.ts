import { tryCatch } from "@zedtech/zedkit-core";

import type { SessionState } from "@/lib/identity-creator-session";

export const IDENTITY_DOCK_STORAGE_KEY = "zk-identity-dock-v1";
/** One-shot: open the floating dock on the next page that mounts the dock. */
export const IDENTITY_DOCK_OPEN_REQUEST_KEY = "zk-identity-dock-open-v1";

export function requestIdentityDockOpen(): void {
  if (typeof window === "undefined") return;
  tryCatch(() => window.sessionStorage.setItem(IDENTITY_DOCK_OPEN_REQUEST_KEY, "1"));
}

export function consumeIdentityDockOpenRequest(): boolean {
  if (typeof window === "undefined") return false;
  const raw = tryCatch(() => window.sessionStorage.getItem(IDENTITY_DOCK_OPEN_REQUEST_KEY));
  if (!raw.ok || raw.value !== "1") return false;
  tryCatch(() => window.sessionStorage.removeItem(IDENTITY_DOCK_OPEN_REQUEST_KEY));
  return true;
}

export type IdentityDockPersist = {
  session: SessionState;
  brief: string;
};

export function readIdentityDockPersist(): Partial<IdentityDockPersist> {
  if (typeof window === "undefined") return {};
  const raw = tryCatch(() => window.sessionStorage.getItem(IDENTITY_DOCK_STORAGE_KEY));
  if (!raw.ok) return {};
  const stored = raw.value;
  if (stored === null || stored === undefined) return {};
  const parsed = tryCatch(() => JSON.parse(stored) as IdentityDockPersist & { expanded?: boolean });
  if (!parsed.ok || typeof parsed.value !== "object" || parsed.value === null) return {};
  const { session, brief } = parsed.value;
  const out: Partial<IdentityDockPersist> = {};
  if (session && typeof session === "object") {
    out.session = { ...session, pending: null };
  }
  if (typeof brief === "string") out.brief = brief;
  return out;
}

export function writeIdentityDockPersist(data: IdentityDockPersist): void {
  tryCatch(() => window.sessionStorage.setItem(IDENTITY_DOCK_STORAGE_KEY, JSON.stringify(data)));
}
