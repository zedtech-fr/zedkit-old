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

function setMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduce && query.includes("reduce"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
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
