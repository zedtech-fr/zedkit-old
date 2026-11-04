export const MOTION_STORAGE_KEY = "zk-motion";
export const MOTION_CHANGE_EVENT = "zk-motion-change";

export type MotionPreference = "reduce" | "no-preference";

/** True when the OS asks to reduce motion or `<html data-motion="reduce">` is set. */
export function isMotionReduced(): boolean {
  if (typeof document === "undefined") return true;
  if (document.documentElement.getAttribute("data-motion") === "reduce") return true;
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Sets `data-motion` on `<html>`, stores the choice, and notifies listeners.
 * `"no-preference"` clears the attribute so OS reduced-motion remains in charge.
 */
export function applyMotionPreference(
  preference: MotionPreference,
  storageKey: string = MOTION_STORAGE_KEY,
): void {
  if (typeof document === "undefined") return;
  if (preference === "reduce") {
    document.documentElement.setAttribute("data-motion", "reduce");
    window.localStorage.setItem(storageKey, "reduce");
  } else {
    document.documentElement.removeAttribute("data-motion");
    window.localStorage.removeItem(storageKey);
  }
  window.dispatchEvent(new Event(MOTION_CHANGE_EVENT));
}
