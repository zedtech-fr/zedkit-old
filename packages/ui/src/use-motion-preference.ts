"use client";

import { useSyncExternalStore } from "react";

import { MOTION_CHANGE_EVENT, isMotionReduced, type MotionPreference } from "./motion-preference.js";

function subscribe(onStoreChange: () => void): () => void {
  const mql = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  mql?.addEventListener("change", onStoreChange);
  window.addEventListener(MOTION_CHANGE_EVENT, onStoreChange);
  const mo =
    typeof MutationObserver === "function"
      ? new MutationObserver(onStoreChange)
      : null;
  mo?.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
  return () => {
    mql?.removeEventListener("change", onStoreChange);
    window.removeEventListener(MOTION_CHANGE_EVENT, onStoreChange);
    mo?.disconnect();
  };
}

function getSnapshot(): MotionPreference {
  return isMotionReduced() ? "reduce" : "no-preference";
}

/** `"reduce"` on the server and before hydration so the static page is the baseline. */
export function useMotionPreference(): MotionPreference {
  return useSyncExternalStore(subscribe, getSnapshot, () => "reduce");
}
