import { tryCatch } from "@zedtech/zedkit-core";

import { LIMITS } from "./identity-assistant-limits.ts";

/**
 * The brief the visitor is still writing in this tab. Unlike the home handoff, a
 * reload must restore it (criterion 4 resume). Empty means nothing to restore.
 */
export const SESSION_BRIEF_KEY = "zk-creator-session-brief";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function writeCreatorSessionBrief(storage: StorageLike | undefined, brief: string): boolean {
  if (!storage) return false;
  const text = brief.trim();
  if (text === "") {
    return tryCatch(() => storage.removeItem(SESSION_BRIEF_KEY)).ok;
  }
  return tryCatch(() => storage.setItem(SESSION_BRIEF_KEY, text.slice(0, LIMITS.prompt))).ok;
}

export function readCreatorSessionBrief(storage: StorageLike | undefined): string | null {
  if (!storage) return null;
  const raw = tryCatch(() => storage.getItem(SESSION_BRIEF_KEY));
  if (!raw.ok || raw.value === null) return null;
  const text = raw.value.trim();
  if (text === "") return null;
  return text.slice(0, LIMITS.prompt);
}
