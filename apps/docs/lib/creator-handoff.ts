import { tryCatch } from "@zedtech/zedkit-core";

/**
 * A brief carried from the home page to the editor. It travels in session storage, for this tab only, and is read
 * once: the editor opens with the text in its form and sends nothing. Any link is part of the text.
 */
export const HANDOFF_KEY = "zk-creator-handoff";
const MAX_BRIEF = 1_000;

export type Handoff = { brief: string };
type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function writeCreatorHandoff(storage: StorageLike | undefined, handoff: Handoff): boolean {
  if (!storage) return false;
  return tryCatch(() => storage.setItem(HANDOFF_KEY, JSON.stringify(handoff))).ok;
}

/** The waiting brief, or null. Removed as it is read, so a reload does not refill a form the visitor emptied. */
export function readCreatorHandoff(storage: StorageLike | undefined): Handoff | null {
  if (!storage) return null;
  const raw = tryCatch(() => storage.getItem(HANDOFF_KEY));
  if (!raw.ok || raw.value === null) return null;
  tryCatch(() => storage.removeItem(HANDOFF_KEY));
  const text = raw.value;
  const json = tryCatch(() => JSON.parse(text) as unknown);
  if (!json.ok || !json.value || typeof json.value !== "object") return null;
  const body = json.value as { brief?: unknown };
  if (typeof body.brief !== "string" || body.brief.trim() === "") return null;
  return { brief: body.brief.slice(0, MAX_BRIEF) };
}
