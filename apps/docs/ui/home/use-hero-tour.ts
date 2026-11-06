import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { AI_SETUP_MINI_PROMPT } from "@/lib/ai-setup-onboarding.generated";
import { DEFAULT_IDENTITY, HERO_TOUR_LOOK } from "@/lib/default-identity";

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
  { page: "apps", use: "[data-slot='data-table'] thead th:first-child button", dwell: 1500, look: HERO_TOUR_LOOK },
  { page: "calendar", use: "[data-day='2026-11-06'] button", dwell: 1500, look: null },
  { page: "team", use: "[data-hero-person='Luca Moretti']", dwell: 1400, look: "maison" },
  { page: "settings", use: "[data-hero-switch]", dwell: 1400, look: DEFAULT_IDENTITY },
] as const;

/** What the tour needs from the agent panel: load it ahead, empty it, put text in its composer. */
export type HeroTourAgent = { preload: () => void; reset: (close?: boolean) => void; paste: (text: string) => void };

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

/** A cursor only makes sense with a pointer and room for the sidebar; a phone keeps the page still. */
const TOUR_QUERY = "(min-width: 48rem) and (hover: hover) and (pointer: fine)";

function subscribeTourQuery(onChange: () => void) {
  const list = window.matchMedia(TOUR_QUERY);
  list.addEventListener("change", onChange);
  return () => list.removeEventListener("change", onChange);
}

/** Whether this visitor can have a tour at all: motion allowed, a pointer, room for the sidebar. False on the server. */
export function useHeroTourAvailable(motionOk: boolean): boolean {
  const room = useSyncExternalStore(subscribeTourQuery, () => window.matchMedia(TOUR_QUERY).matches, () => false);
  return motionOk && room;
}

/** Whether the tour is playing, and the three things that change it: the visitor taking over, pausing, playing again. */
export function useHeroTourState(motionOk: boolean) {
  const available = useHeroTourAvailable(motionOk);
  const [playing, setPlaying] = useState(true);
  return { available, playing, takeover: () => setPlaying(false), toggle: () => setPlaying((value) => !value) };
}

/** The control that pauses or replays the tour carries this attribute: pressing it is not a takeover. */
export const TOUR_CONTROL_ATTRIBUTE = "data-hero-tour-control";

/**
 * Plays the tour while `playing`, the window is on screen and the visitor has not touched it. Any pointer, key
 * or touch event inside the frame (except the tour's own control) is a takeover: `onTakeover` is called and the
 * tour stops until the visitor asks for it again. It never restarts by itself.
 * Off the screen or in a hidden tab it waits; nothing runs without motion allowed.
 */
export function useHeroTour({
  rootRef,
  enabled,
  playing,
  onTakeover,
  onLook,
  agent,
  intro = false,
}: {
  rootRef: RefObject<HTMLElement | null>;
  enabled: boolean;
  playing: boolean;
  onTakeover: () => void;
  onLook: (id: string) => void;
  agent: HeroTourAgent;
  /** While the window is still assembling, the lap waits so the home CLS guard is not fighting the tour. */
  intro?: boolean;
}) {
  const lookRef = useRef(onLook);
  const agentRef = useRef(agent);
  const takeoverRef = useRef(onTakeover);
  const introRef = useRef(intro);
  useEffect(() => {
    lookRef.current = onLook;
    agentRef.current = agent;
    takeoverRef.current = onTakeover;
    introRef.current = intro;
  });
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const cursor = root.querySelector<HTMLElement>("[data-hero-cursor]");
    if (!cursor) return;
    if (!enabled) {
      // The window narrowed (a phone, or reduced motion): an invisible cursor left at its desktop offset would still
      // widen the page, so it goes back to the corner at once, with no glide.
      delete root.dataset.tour;
      cursor.style.transition = "none";
      cursor.style.translate = "";
      void cursor.offsetWidth;
      cursor.style.transition = "";
      return;
    }
    if (!playing) {
      root.dataset.tour = "off";
      return;
    }

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

    let tourPressing = false;
    const takeover = (event: Event) => {
      if (stopped || tourPressing) return;
      if (event.target instanceof Element && event.target.closest(`[${TOUR_CONTROL_ATTRIBUTE}]`)) return;
      stopped = true;
      root.dataset.tour = "off";
      wake?.();
      takeoverRef.current();
    };
    // The whole frame counts, so using the Display row under the window is a takeover too.
    const touchArea = root.closest("[data-home-hero-preview]") ?? root;
    const events = ["pointerdown", "keydown", "touchstart"] as const;
    for (const name of events) touchArea.addEventListener(name, takeover, { passive: true });

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
      tourPressing = true;
      act();
      await beat(160);
      tourPressing = false;
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

    /** Polls for an element (the panel's chunk may still be loading), holding like every other beat. */
    const waitFor = async (find: () => Element | null, limitMs: number) => {
      for (let waited = 0; waited < limitMs && !stopped && !find(); waited += 100) await beat(100);
      return find();
    };

    /**
     * Opens the agent panel, pastes the one prompt, presses send and waits for the scripted run to finish, then
     * closes it. About 10s from the first glide to the closed panel. Every press is on the real control; the run itself is the panel's own timers (no network).
     */
    const agentStep = async () => {
      const open = root.querySelector("[data-hero-agent-open]");
      if (!open) return;
      await press(open);
      const field = await waitFor(() => root.querySelector("[data-hero-agent-panel] textarea"), 15000);
      if (!field || stopped) return;
      agentRef.current.paste(AI_SETUP_MINI_PROMPT);
      await beat(100);
      await press(field);
      await beat(450);
      const send = root.querySelector("[data-hero-agent-panel] [data-slot='prompt-input'] button[type='submit']");
      if (!send || stopped) return;
      await press(send);
      await waitFor(() => root.querySelector("[data-hero-agent-panel][data-status='done']"), 12000);
      await beat(1300);
      const close = root.querySelector("[data-hero-agent-close]");
      if (close && !stopped) await press(close);
      await beat(SETTLE_MS);
    };

    const run = async () => {
      // A replay (or a tour paused with the panel open) starts from a closed, empty panel.
      agentRef.current.reset(true);
      agentRef.current.preload();
      await beat(START_MS);
      if (stopped) return;
      park();
      root.dataset.tour = "on";
      while (!stopped && introRef.current) await beat(100);
      if (stopped) return;
      // The one prompt is the headline, so it plays first, once per run; the lap that follows only tours the pages.
      await agentStep();
      if (stopped) return;
      let first = false;
      while (!stopped) {
        for (const step of LAP) {
          if (stopped) return;
          const nav = root.querySelector(`[data-tour-nav='${step.page}']`);
          // The sidebar is gone when the window narrows below md: nothing left to point at.
          if (!nav || nav.getBoundingClientRect().width === 0) return;
          // The first Overview is the page shown on load; every later one is a real press (a replay starts here).
          if (step.page !== "overview" || cursor.dataset.placed !== undefined) await press(nav);
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
      for (const name of events) touchArea.removeEventListener(name, takeover);
      root.dataset.tour = "off";
    };
  }, [rootRef, enabled, playing]);
}
