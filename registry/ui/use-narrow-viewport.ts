"use client";

import * as React from "react";

const MQ = "(max-width:639px)";

function narrowNow(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const q = typeof window.matchMedia === "function" ? window.matchMedia(MQ) : null;
  return window.innerWidth < 640 || Boolean(q?.matches);
}

/** Tailwind `sm` breakpoint. `ssrWhenUnknown` is the static-export default when `window` is missing. */
export function useNarrowViewport(ssrWhenUnknown = false): boolean {
  const [narrow, setNarrow] = React.useState(() =>
    typeof window === "undefined" ? ssrWhenUnknown : narrowNow(),
  );

  React.useLayoutEffect(() => {
    const sync = () => setNarrow(narrowNow());
    sync();
    if (typeof window.matchMedia !== "function") {
      return;
    }
    const mql = window.matchMedia(MQ);
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);

  return narrow;
}
