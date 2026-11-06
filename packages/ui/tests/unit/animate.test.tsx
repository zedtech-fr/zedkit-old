import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  Animate,
  AnimateObserver,
  ANIMATE_PRESETS,
  ANIMATE_TRIGGERS,
  observeAnimate,
} from "#index.js";

const src = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src");
const motionCss = readFileSync(join(src, "motion.css"), "utf8");

type IoCallback = (entries: Pick<IntersectionObserverEntry, "target" | "isIntersecting">[], observer: IntersectionObserver) => void;

class FakeIo implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds = [0];
  static instances: FakeIo[] = [];
  observed = new Set<Element>();
  constructor(private readonly callback: IoCallback) {
    FakeIo.instances.push(this);
  }
  observe(el: Element) {
    this.observed.add(el);
  }
  unobserve(el: Element) {
    this.observed.delete(el);
  }
  disconnect() {
    this.observed.clear();
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  trigger(el: Element, intersecting: boolean) {
    this.callback([{ target: el, isIntersecting: intersecting }], this);
  }
}

type MotionMql = {
  matches: boolean;
  media: string;
  addEventListener: (type: string, fn: (event: MediaQueryListEvent) => void) => void;
  removeEventListener: (type: string, fn: (event: MediaQueryListEvent) => void) => void;
  dispatch: (matches: boolean) => void;
};

function setMotion(reduce: boolean): MotionMql {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const mql: MotionMql = {
    matches: reduce,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: (_type, fn) => {
      listeners.add(fn);
    },
    removeEventListener: (_type, fn) => {
      listeners.delete(fn);
    },
    dispatch: (matches: boolean) => {
      mql.matches = matches;
      for (const fn of listeners) fn({ matches } as MediaQueryListEvent);
    },
  };
  window.matchMedia = vi.fn().mockImplementation((query: string) => {
    if (query.includes("reduce")) return mql;
    return { matches: false, media: query, addEventListener: () => {}, removeEventListener: () => {} };
  }) as unknown as typeof window.matchMedia;
  return mql;
}

describe("animate CSS", () => {
  it("styles every published trigger and preset", () => {
    for (const trigger of ["appear", "scroll", "press", "longpress", "hover", "focus"] as const) {
      if (trigger === "appear") expect(motionCss).toContain("[data-animate=");
      else expect(motionCss).toContain(`[data-animate-${trigger}`);
    }
    for (const preset of ANIMATE_PRESETS) {
      expect(motionCss).toContain(`"${preset}"`);
    }
    expect(motionCss).toContain("animation-timeline: view()");
    expect(motionCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(motionCss).toContain("[data-animate]");
    expect(motionCss).toContain("translate");
    expect(motionCss).toContain("zk-word-roll-exit-up");
    expect(motionCss).not.toMatch(/\[data-animate[^\]]*\{[^}]*\b(top|height|width)\s*:/);
  });
});

describe("Animate", () => {
  afterEach(() => cleanup());

  it("writes trigger attributes from on, delay and stagger", () => {
    const { container } = render(
      <Animate
        on={{ appear: "fade-up", press: "scale-down", longpress: "pulse", scroll: "parallax", hover: "lift", focus: "lift" }}
        delay={100}
        stagger
      >
        Hello
      </Animate>,
    );
    const host = container.querySelector('[data-slot="animate"]');
    expect(host?.getAttribute("data-animate")).toBe("fade-up");
    expect(host?.getAttribute("data-animate-press")).toBe("scale-down");
    expect(host?.getAttribute("data-animate-longpress")).toBe("pulse");
    expect(host?.getAttribute("data-animate-scroll")).toBe("parallax");
    expect(host?.getAttribute("data-animate-hover")).toBe("lift");
    expect(host?.getAttribute("data-animate-focus")).toBe("lift");
    expect(host?.getAttribute("data-animate-delay")).toBe("100");
    expect(host?.hasAttribute("data-animate-stagger")).toBe(true);
    expect(host?.textContent).toBe("Hello");
  });
});

describe("observeAnimate", () => {
  let restoreIo: typeof globalThis.IntersectionObserver;

  beforeEach(() => {
    FakeIo.instances = [];
    restoreIo = globalThis.IntersectionObserver;
    globalThis.IntersectionObserver = FakeIo as never;
    setMotion(false);
    vi.stubGlobal("CSS", { supports: () => false });
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    document.documentElement.removeAttribute("data-motion");
    globalThis.IntersectionObserver = restoreIo;
    vi.unstubAllGlobals();
  });

  it("leaves content visible until the first observer callback", () => {
    const el = document.createElement("div");
    el.setAttribute("data-animate", "fade-up");
    document.body.append(el);
    const stop = observeAnimate();
    expect(el.hasAttribute("data-animate-state")).toBe(false);
    stop();
  });

  it("sets pending when the first callback is off-screen, then in on intersect", () => {
    const el = document.createElement("div");
    el.setAttribute("data-animate", "fade-up");
    el.setAttribute("data-animate-delay", "100");
    document.body.append(el);
    const stop = observeAnimate();
    const io = FakeIo.instances[0];
    expect(io).toBeTruthy();
    io?.trigger(el, false);
    expect(el.getAttribute("data-animate-state")).toBe("pending");
    expect(el.style.getPropertyValue("--zk-animate-delay")).toBe("100ms");
    io?.trigger(el, true);
    expect(el.getAttribute("data-animate-state")).toBe("in");
    expect(io?.observed.has(el)).toBe(false);
    stop();
  });

  it("sets in without pending when the element is already on screen", () => {
    const el = document.createElement("div");
    el.setAttribute("data-animate-appear", "fade-in");
    document.body.append(el);
    const stop = observeAnimate();
    FakeIo.instances[0]?.trigger(el, true);
    expect(el.getAttribute("data-animate-state")).toBe("in");
    stop();
  });

  it("does not hide or observe under reduced motion", () => {
    setMotion(true);
    const el = document.createElement("div");
    el.setAttribute("data-animate", "fade-up");
    document.body.append(el);
    const stop = observeAnimate();
    expect(FakeIo.instances).toHaveLength(0);
    expect(el.hasAttribute("data-animate-state")).toBe(false);
    stop();
  });

  it("writes scroll progress when view timelines are missing", () => {
    const el = document.createElement("div");
    el.setAttribute("data-animate-scroll", "parallax");
    vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
      top: 50,
      height: 100,
      bottom: 150,
      left: 0,
      right: 0,
      width: 0,
      x: 0,
      y: 50,
      toJSON: () => ({}),
    });
    vi.stubGlobal("innerHeight", 200);
    document.body.append(el);
    const stop = observeAnimate();
    expect(el.style.getPropertyValue("--zk-animate-progress")).toBe("0.5");
    stop();
  });

  it("sets the longpress flag after the token delay", () => {
    vi.useFakeTimers();
    const el = document.createElement("button");
    el.setAttribute("data-animate-longpress", "pulse");
    document.body.append(el);
    const stop = observeAnimate();
    fireEvent.pointerDown(el, { isPrimary: true });
    expect(el.hasAttribute("data-animate-longpress-on")).toBe(false);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(el.hasAttribute("data-animate-longpress-on")).toBe(true);
    fireEvent.pointerUp(el);
    expect(el.hasAttribute("data-animate-longpress-on")).toBe(false);
    stop();
    vi.useRealTimers();
  });

  it("copies a custom keyframe name onto the appear CSS variable", () => {
    const el = document.createElement("div");
    el.setAttribute("data-animate", "wiggle");
    document.body.append(el);
    const stop = observeAnimate();
    expect(el.style.getPropertyValue("--zk-animate-appear-name")).toBe("wiggle");
    stop();
  });

  it("does not treat press-only nodes as appear targets", () => {
    const el = document.createElement("button");
    el.setAttribute("data-animate-press", "scale-down");
    document.body.append(el);
    const stop = observeAnimate();
    expect(FakeIo.instances[0]?.observed.has(el) ?? false).toBe(false);
    stop();
  });

  it("shares one scroll listener across several observeAnimate calls", () => {
    const spy = vi.spyOn(document, "addEventListener");
    const el = document.createElement("div");
    el.setAttribute("data-animate-scroll", "parallax");
    document.body.append(el);
    const stopA = observeAnimate();
    const stopB = observeAnimate();
    expect(spy.mock.calls.filter((call) => call[0] === "scroll")).toHaveLength(1);
    stopA();
    stopB();
    spy.mockRestore();
  });

  it("starts scroll updates when a scroll node is added after init", async () => {
    const stop = observeAnimate();
    const el = document.createElement("div");
    el.setAttribute("data-animate-scroll", "parallax");
    vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
      top: 50,
      height: 100,
      bottom: 150,
      left: 0,
      right: 0,
      width: 0,
      x: 0,
      y: 50,
      toJSON: () => ({}),
    });
    vi.stubGlobal("innerHeight", 200);
    document.body.append(el);
    await act(async () => {
      await Promise.resolve();
    });
    expect(el.style.getPropertyValue("--zk-animate-progress")).toBe("0.5");
    stop();
  });

  it("stops reading detached scroll nodes", async () => {
    const el = document.createElement("div");
    el.setAttribute("data-animate-scroll", "parallax");
    const rect = vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
      top: 0,
      height: 10,
      bottom: 10,
      left: 0,
      right: 0,
      width: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    document.body.append(el);
    const stop = observeAnimate();
    el.remove();
    rect.mockClear();
    document.dispatchEvent(new Event("scroll", { bubbles: true }));
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
    });
    expect(rect).not.toHaveBeenCalled();
    stop();
  });

  it("starts after reduced motion is turned off", () => {
    const mql = setMotion(true);
    const el = document.createElement("div");
    el.setAttribute("data-animate", "fade-up");
    document.body.append(el);
    const stop = observeAnimate();
    expect(FakeIo.instances).toHaveLength(0);
    mql.dispatch(false);
    expect(FakeIo.instances.length).toBeGreaterThan(0);
    expect(FakeIo.instances[0]?.observed.has(el)).toBe(true);
    stop();
  });

  it("drops longpress listeners when motion is reduced", async () => {
    vi.useFakeTimers();
    const el = document.createElement("button");
    el.setAttribute("data-animate-longpress", "pulse");
    document.body.append(el);
    const stop = observeAnimate();
    document.documentElement.setAttribute("data-motion", "reduce");
    await act(async () => {
      await Promise.resolve();
    });
    fireEvent.pointerDown(el, { isPrimary: true });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(el.hasAttribute("data-animate-longpress-on")).toBe(false);
    stop();
    vi.useRealTimers();
  });

  it("pauses when data-motion is reduce", async () => {
    const el = document.createElement("div");
    el.setAttribute("data-animate", "fade-up");
    document.body.append(el);
    const stop = observeAnimate();
    expect(FakeIo.instances[0]?.observed.has(el)).toBe(true);
    document.documentElement.setAttribute("data-motion", "reduce");
    await act(async () => {
      await Promise.resolve();
    });
    expect(FakeIo.instances[0]?.observed.size ?? 0).toBe(0);
    stop();
  });
  it("reads a delay and ignores a negative or unreadable one", () => {
    const good = document.createElement("div");
    good.setAttribute("data-animate", "fade-up");
    good.setAttribute("data-animate-delay", "120");
    const negative = document.createElement("div");
    negative.setAttribute("data-animate", "fade-up");
    negative.setAttribute("data-animate-delay", "-5");
    const junk = document.createElement("div");
    junk.setAttribute("data-animate", "fade-up");
    junk.setAttribute("data-animate-delay", "soon");
    document.body.append(good, negative, junk);
    const stop = observeAnimate();
    expect(good.style.getPropertyValue("--zk-animate-delay")).toBe("120ms");
    expect(negative.style.getPropertyValue("--zk-animate-delay")).toBe("");
    expect(junk.style.getPropertyValue("--zk-animate-delay")).toBe("");
    stop();
  });

  it("copies custom keyframe names for every trigger and keeps presets as they are", () => {
    const el = document.createElement("div");
    el.setAttribute("data-animate-appear", "wiggle");
    el.setAttribute("data-animate-press", "squish");
    el.setAttribute("data-animate-hover", "lift");
    el.setAttribute("data-animate-focus", "glow");
    document.body.append(el);
    const stop = observeAnimate();
    expect(el.style.getPropertyValue("--zk-animate-appear-name")).toBe("wiggle");
    expect(el.style.getPropertyValue("--zk-animate-press-name")).toBe("squish");
    expect(el.style.getPropertyValue("--zk-animate-focus-name")).toBe("glow");
    expect(el.style.getPropertyValue("--zk-animate-hover-name")).toBe("");
    stop();
  });

  it("ignores non-primary pointers for longpress and clears on leave", () => {
    vi.useFakeTimers();
    const el = document.createElement("button");
    el.setAttribute("data-animate-longpress", "pulse");
    document.body.append(el);
    const stop = observeAnimate();
    fireEvent.pointerDown(el, { isPrimary: false });
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(el.hasAttribute("data-animate-longpress-on")).toBe(false);
    fireEvent.pointerDown(el, { isPrimary: true });
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(el.hasAttribute("data-animate-longpress-on")).toBe(true);
    fireEvent.pointerLeave(el);
    expect(el.hasAttribute("data-animate-longpress-on")).toBe(false);
    stop();
    vi.useRealTimers();
  });

  it("uses the longpress token when the page sets one", () => {
    vi.useFakeTimers();
    const el = document.createElement("button");
    el.setAttribute("data-animate-longpress", "pulse");
    el.style.setProperty("--zk-longpress-ms", "200");
    document.body.append(el);
    const stop = observeAnimate();
    fireEvent.pointerDown(el, { isPrimary: true });
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(el.hasAttribute("data-animate-longpress-on")).toBe(true);
    stop();
    vi.useRealTimers();
  });

  it("attaches targets inside an added subtree and forgets removed scroll nodes", async () => {
    const stop = observeAnimate();
    const wrap = document.createElement("section");
    const inner = document.createElement("div");
    inner.setAttribute("data-animate-scroll", "parallax");
    const rect = vi.spyOn(inner, "getBoundingClientRect");
    wrap.append(inner);
    document.body.append(wrap);
    await act(async () => {
      await Promise.resolve();
    });
    expect(inner.style.getPropertyValue("--zk-animate-progress")).not.toBe("");
    wrap.remove();
    await act(async () => {
      await Promise.resolve();
    });
    rect.mockClear();
    document.dispatchEvent(new Event("scroll", { bubbles: true }));
    expect(rect).not.toHaveBeenCalled();
    stop();
  });

  it("recomputes scroll progress on resize", async () => {
    const el = document.createElement("div");
    el.setAttribute("data-animate-scroll", "parallax");
    const rect = vi.spyOn(el, "getBoundingClientRect");
    document.body.append(el);
    const stop = observeAnimate();
    rect.mockClear();
    window.dispatchEvent(new Event("resize"));
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
    });
    expect(rect).toHaveBeenCalled();
    stop();
  });

  it("leaves appear targets alone when IntersectionObserver is missing", () => {
    globalThis.IntersectionObserver = undefined as never;
    const el = document.createElement("div");
    el.setAttribute("data-animate", "fade-up");
    document.body.append(el);
    const stop = observeAnimate();
    expect(el.hasAttribute("data-animate-state")).toBe(false);
    stop();
  });

  it("keeps running until the last observer stops", async () => {
    const first = observeAnimate();
    const second = observeAnimate();
    first();
    const early = document.createElement("div");
    early.setAttribute("data-animate", "fade-up");
    document.body.append(early);
    await act(async () => {
      await Promise.resolve();
    });
    expect(FakeIo.instances[0]?.observed.has(early)).toBe(true);
    second();
    const late = document.createElement("div");
    late.setAttribute("data-animate", "fade-up");
    document.body.append(late);
    await act(async () => {
      await Promise.resolve();
    });
    expect(FakeIo.instances.some((io) => io.observed.has(late))).toBe(false);
  });

});

describe("AnimateObserver", () => {
  beforeEach(() => {
    FakeIo.instances = [];
    globalThis.IntersectionObserver = FakeIo as never;
    setMotion(false);
  });
  afterEach(() => cleanup());

  it("starts the runtime on mount", () => {
    const el = document.createElement("div");
    el.setAttribute("data-animate", "fade-up");
    document.body.append(el);
    render(<AnimateObserver />);
    expect(FakeIo.instances.length).toBeGreaterThan(0);
    expect(FakeIo.instances[0]?.observed.has(el)).toBe(true);
  });
});

describe("animate catalogs", () => {
  it("lists every trigger and preset the spec names", () => {
    expect([...ANIMATE_TRIGGERS]).toEqual(["appear", "scroll", "press", "longpress", "hover", "focus"]);
    expect(ANIMATE_PRESETS).toContain("fade-up");
    expect(ANIMATE_PRESETS).toContain("parallax");
  });
});
