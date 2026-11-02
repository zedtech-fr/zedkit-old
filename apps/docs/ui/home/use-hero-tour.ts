import { useEffect, useRef, type RefObject } from "react";
import { DEFAULT_IDENTITY } from "@/lib/default-identity";

/**
 * One lap of the guided tour: go to a page by its sidebar entry, use one control on it, and sometimes change the
 * look in the Display row under the window (`look`), so the same app is seen in more than one identity.
 * Targets are plain selectors inside the window; the tour clicks the real controls, so every state change on
 * screen is the kit component doing its job, not a recording. The one exception is the look: a menu popping open
 * would cover the window, so the cursor presses the select and the look is set through the page's own state.
 */
const LAP = [
  { page: "overview", use: null, dwell: 1400, look: null },
  // Sorting by name reorders every row at once: a change anyone can see, with nothing opening over the page.
  { page: "apps", use: "[data-slot='data-table'] thead th:first-child button", dwell: 1500, look: "glass" },
  { page: "calendar", use: "[data-day='2026-11-06'] button", dwell: 1500, look: null },
  { page: "team", use: "[data-hero-person='Luca Moretti']", dwell: 1400, look: "maison" },
  { page: "settings", use: "[data-hero-switch]", dwell: 1400, look: DEFAULT_IDENTITY },
] as const;

/** The cursor starts moving as soon as the window is on screen, while the first page is still assembling. */
const START_MS = 400;
/** How long the cursor takes between two controls. Keep equal to the `translate` transition in `home-hero.css`. */
const GLIDE_MS = 560;
/** After pressing: time to see the result before moving on. */
const SETTLE_MS = 380;
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** What the window shows under the cursor; the cursor is positioned in the window's own coordinates. */
function centreOf(root: HTMLElement, target: Element) {
  const frame = root.getBoundingClientRect();
  const box = target.getBoundingClientRect();
  return { x: box.left - frame.left + Math.min(box.width * 0.5, 28), y: box.top - frame.top + box.height * 0.55 };
}

/**
 * Plays the tour while the window is on screen and the visitor has not touched it. Any pointer, key or
 * touch event inside the frame ends the tour for good: from then on the window only does what the visitor asks.
 * Off the screen or in a hidden tab it waits; nothing runs without motion allowed.
 */
export function useHeroTour({
  rootRef,
  enabled,
  onLook,
}: {
  rootRef: RefObject<HTMLElement | null>;
  enabled: boolean;
  onLook: (id: string) => void;
}) {
  const lookRef = useRef(onLook);
  useEffect(() => {
    lookRef.current = onLook;
  });
  useEffect(() => {
    const root = rootRef.current;
    // A cursor only makes sense with a pointer and room for the sidebar; a phone keeps the page still.
    if (!enabled || !root || !window.matchMedia("(min-width: 48rem) and (hover: hover) and (pointer: fine)").matches) return;
    const cursor = root.querySelector<HTMLElement>("[data-hero-cursor]");
    if (!cursor) return;

    let stopped = false;
    let onScreen = false;
    let wake: (() => void) | undefined;
    const ready = () => onScreen && !document.hidden;
    const resume = () => {
      if (ready()) wake?.();
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry?.isIntersecting ?? false;
        resume();
      },
      { threshold: 0.45 },
    );
    observer.observe(root);
    document.addEventListener("visibilitychange", resume);

    const stop = () => {
      if (stopped) return;
      stopped = true;
      root.dataset.tour = "off";
      wake?.();
    };
    // The whole frame counts, so using the Display row under the window also ends the tour.
    const touchArea = root.closest("[data-home-hero-preview]") ?? root;
    const events = ["pointerdown", "keydown", "touchstart"] as const;
    for (const name of events) touchArea.addEventListener(name, stop, { passive: true });

    /** Waits `ms`, then holds while the window is off screen or the tab is hidden. */
    const beat = async (ms: number) => {
      await sleep(ms);
      while (!stopped && !ready()) await new Promise<void>((resolve) => (wake = resolve));
    };

    const moveTo = (target: Element) => {
      const { x, y } = centreOf(root, target);
      cursor.style.translate = `${x}px ${y}px`;
    };

    const press = async (target: Element, act: () => void = () => (target as HTMLElement).click()) => {
      moveTo(target);
      await beat(GLIDE_MS + 40);
      if (stopped) return;
      cursor.dataset.press = "";
      act();
      await beat(160);
      delete cursor.dataset.press;
    };

    /** The Display row's identity select sits under the window, still inside the frame. */
    const changeLook = async (id: string) => {
      const select = touchArea.querySelector("[data-hero-look-select]");
      if (select) await press(select, () => lookRef.current(id));
      await beat(SETTLE_MS + 520);
    };

    /** Parks the cursor at the lower right of the window without gliding there from the corner. */
    const park = () => {
      const frame = root.getBoundingClientRect();
      cursor.style.transition = "none";
      cursor.style.translate = `${frame.width * 0.74}px ${frame.height * 0.8}px`;
      void cursor.offsetWidth;
      cursor.style.transition = "";
    };

    const run = async () => {
      await beat(START_MS);
      if (stopped) return;
      park();
      let first = true;
      while (!stopped) {
        for (const step of LAP) {
          if (stopped) return;
          const nav = root.querySelector(`[data-tour-nav='${step.page}']`);
          // The sidebar is gone when the window narrows below md: nothing left to point at.
          if (!nav || nav.getBoundingClientRect().width === 0) return;
          root.dataset.tour = "on";
          if (step.page !== "overview" || cursor.dataset.placed) await press(nav);
          cursor.dataset.placed = "";
          await beat(first && step.page === "overview" ? 0 : SETTLE_MS);
          if (stopped) return;
          if (step.use) {
            const control = root.querySelector(`[data-hero-page='${step.page}'] ${step.use}`);
            if (control) await press(control);
          }
          // The very first page was just shown on load: the cursor sets off at once instead of waiting beside it.
          await beat(first && step.page === "overview" ? 0 : step.dwell);
          first = false;
          if (stopped) return;
          if (step.look) await changeLook(step.look);
        }
      }
    };
    void run();

    return () => {
      stopped = true;
      wake?.();
      observer.disconnect();
      document.removeEventListener("visibilitychange", resume);
      for (const name of events) touchArea.removeEventListener(name, stop);
      delete root.dataset.tour;
    };
  }, [rootRef, enabled]);
}
