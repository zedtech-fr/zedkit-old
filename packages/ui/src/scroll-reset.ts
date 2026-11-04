"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

export interface ScrollResetOptions {
  /**
   * Element that scrolls the page. Defaults to the window. Pass a getter
   * when the app scrolls an inner container (for example `AppShell` main).
   */
  target?: () => HTMLElement | null;
  /** Scroll behaviour when motion is allowed. Defaults to `"auto"` (jump). */
  behavior?: "auto" | "smooth";
}

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

// A popstate only marks the route change that follows it right away; a
// hash-only back/forward (same route key) must not swallow the next link click.
const POP_WINDOW_MS = 1000;
let lastPop = -Infinity;
let popListeners = 0;
const onPop = () => {
  lastPop = Date.now();
};

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// Percent-decode without throwing on malformed input.
function decodeHash(raw: string): string {
  const bytes = raw.match(/%[0-9a-f]{2}|[^]/giu) ?? [];
  const encoder = new TextEncoder();
  return new TextDecoder().decode(
    new Uint8Array(
      bytes.flatMap((part) =>
        part.length === 3 && part[0] === "%"
          ? [Number.parseInt(part.slice(1), 16)]
          : [...encoder.encode(part)],
      ),
    ),
  );
}

function hashTarget(): HTMLElement | null {
  const raw = window.location.hash.slice(1);
  if (!raw) return null;
  return (
    document.getElementById(raw) ?? document.getElementById(decodeHash(raw))
  );
}

/**
 * Reset scroll when `routeKey` (usually the pathname) changes, after the
 * first render. Router-agnostic: pass the pathname from your router.
 * - A `#hash` in the URL scrolls to that anchor instead of the top.
 * - Back/forward (popstate) is left to the browser's own restoration.
 * - Under `prefers-reduced-motion: reduce` the jump is always instant.
 */
export function useScrollReset(
  routeKey: string,
  options: ScrollResetOptions = {},
): void {
  const previous = useRef(routeKey);
  const { target, behavior = "auto" } = options;

  useEffect(() => {
    if (popListeners++ === 0) window.addEventListener("popstate", onPop);
    return () => {
      if (--popListeners === 0) window.removeEventListener("popstate", onPop);
    };
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (previous.current === routeKey) return;
    previous.current = routeKey;
    if (Date.now() - lastPop < POP_WINDOW_MS) {
      lastPop = -Infinity;
      return;
    }
    const mode: ScrollBehavior =
      prefersReducedMotion() || behavior === "auto" ? "instant" : "smooth";
    const anchor = hashTarget();
    if (anchor) {
      anchor.scrollIntoView({ behavior: mode, block: "start" });
      return;
    }
    const scroller = target?.() ?? null;
    if (scroller) scroller.scrollTo({ top: 0, left: 0, behavior: mode });
    else window.scrollTo({ top: 0, left: 0, behavior: mode });
  }, [routeKey, target, behavior]);
}

export interface ScrollResetProps extends ScrollResetOptions {
  /** Current route key, usually the pathname (`usePathname()` in Next.js). */
  routeKey: string;
}

/** Component form of `useScrollReset`: renders nothing. */
export function ScrollReset({ routeKey, ...options }: ScrollResetProps): null {
  useScrollReset(routeKey, options);
  return null;
}
