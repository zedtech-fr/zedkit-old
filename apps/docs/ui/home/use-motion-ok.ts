import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: no-preference)";

function subscribe(onChange: () => void) {
  const list = window.matchMedia(QUERY);
  list.addEventListener("change", onChange);
  return () => list.removeEventListener("change", onChange);
}

/** True once the visitor allows motion. False on the server and before hydration, so the static page is the baseline. */
export function useMotionOk(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}
