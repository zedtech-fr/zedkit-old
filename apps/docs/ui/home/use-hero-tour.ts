import { useEffect, type RefObject } from "react";

/**
 * One lap of the guided tour: go to a page by its sidebar entry, then use one control on it.
 * Targets are plain selectors inside the window; the tour clicks the real controls, so every state
 * change on screen is the kit component doing its job, not a recording.
 */
const LAP = [
  { page: "overview", use: null, dwell: 3600 },
  { page: "apps", use: "[data-slot='data-table'] tbody tr:nth-child(2) td:first-child button", dwell: 2800 },
  { page: "calendar", use: "[data-day='2026-11-06'] button", dwell: 2800 },
  { page: "team", use: "[data-hero-person='Luca Moretti']", dwell: 2800 },
  { page: "settings", use: "[data-hero-switch]", dwell: 2600 },
] as const;

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
export function useHeroTour({ rootRef, enabled }: { rootRef: RefObject<HTMLElement | null>; enabled: boolean }) {
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

    const press = async (target: Element) => {
      moveTo(target);
      await beat(820);
      if (stopped) return;
      cursor.dataset.press = "";
      (target as HTMLElement).click();
      await beat(260);
      delete cursor.dataset.press;
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
      await beat(1900);
      if (stopped) return;
      park();
      while (!stopped) {
        for (const step of LAP) {
          if (stopped) return;
          const nav = root.querySelector(`[data-tour-nav='${step.page}']`);
          // The sidebar is gone when the window narrows below md: nothing left to point at.
          if (!nav || nav.getBoundingClientRect().width === 0) return;
          root.dataset.tour = "on";
          if (step.page !== "overview" || cursor.dataset.placed) await press(nav);
          cursor.dataset.placed = "";
          await beat(650);
          if (stopped) return;
          if (step.use) {
            const control = root.querySelector(`[data-hero-page='${step.page}'] ${step.use}`);
            if (control) await press(control);
          }
          await beat(step.dwell);
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
