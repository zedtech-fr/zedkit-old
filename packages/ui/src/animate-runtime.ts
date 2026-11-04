export const ANIMATE_TRIGGERS = ["appear", "scroll", "press", "longpress", "hover", "focus"] as const;
export type AnimateTrigger = (typeof ANIMATE_TRIGGERS)[number];

export const ANIMATE_PRESETS = [
  "fade-up",
  "fade-in",
  "fade-down",
  "pop-in",
  "lift",
  "scale-down",
  "scale-up",
  "pulse",
  "parallax",
] as const;
export type AnimatePreset = (typeof ANIMATE_PRESETS)[number];

/** Preset or a custom `@keyframes` name. */
export type AnimateMotion = AnimatePreset | (string & {});

export type AnimateOn = Partial<Record<AnimateTrigger, AnimateMotion>>;

const PRESETS = new Set<string>(ANIMATE_PRESETS);
const TARGET_SELECTOR =
  "[data-animate], [data-animate-appear], [data-animate-scroll], [data-animate-press], [data-animate-longpress], [data-animate-hover], [data-animate-focus]";
const TRIGGER_ATTR: Record<Exclude<AnimateTrigger, "appear">, string> = {
  scroll: "data-animate-scroll",
  press: "data-animate-press",
  longpress: "data-animate-longpress",
  hover: "data-animate-hover",
  focus: "data-animate-focus",
};

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isPreset(name: string): boolean {
  return PRESETS.has(name);
}

function appearMotion(el: Element): string | null {
  const named = el.getAttribute("data-animate-appear");
  if (named != null && named !== "") return named;
  const shorthand = el.getAttribute("data-animate");
  return shorthand != null && shorthand !== "" ? shorthand : null;
}

function readDelay(el: HTMLElement): void {
  const raw = el.getAttribute("data-animate-delay");
  if (raw == null || raw === "") return;
  const ms = Number.parseFloat(raw);
  if (!Number.isFinite(ms) || ms < 0) return;
  el.style.setProperty("--zk-animate-delay", `${ms}ms`);
}

function applyCustomName(el: HTMLElement, trigger: AnimateTrigger, motion: string): void {
  if (isPreset(motion)) return;
  el.style.setProperty(`--zk-animate-${trigger}-name`, motion);
}

function bindCustomMotions(el: HTMLElement): void {
  const appear = appearMotion(el);
  if (appear) applyCustomName(el, "appear", appear);
  for (const trigger of ANIMATE_TRIGGERS) {
    if (trigger === "appear") continue;
    const motion = el.getAttribute(TRIGGER_ATTR[trigger]);
    if (motion) applyCustomName(el, trigger, motion);
  }
}

function longpressMs(el: HTMLElement): number {
  const raw = getComputedStyle(el).getPropertyValue("--zk-longpress-ms");
  const ms = Number.parseFloat(raw);
  return Number.isFinite(ms) && ms > 0 ? ms : 500;
}

function viewProgress(el: Element): number {
  const rect = el.getBoundingClientRect();
  const view = window.innerHeight || 1;
  const span = view + rect.height || 1;
  return Math.min(1, Math.max(0, (view - rect.top) / span));
}

function supportsViewTimeline(): boolean {
  return typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("animation-timeline: view()");
}

function collect(scope: ParentNode): HTMLElement[] {
  const found = [...scope.querySelectorAll<HTMLElement>(TARGET_SELECTOR)];
  if (scope instanceof HTMLElement && scope.matches(TARGET_SELECTOR)) found.unshift(scope);
  return found;
}

/**
 * Appear (IntersectionObserver), scroll progress fallback, and longpress.
 * Press / hover / focus are CSS-only. No-op on the server and under reduced motion.
 */
export function observeAnimate(root?: ParentNode): () => void {
  if (typeof document === "undefined") return () => {};
  if (prefersReducedMotion()) return () => {};

  const scope = root ?? document;
  const attached = new WeakSet<Element>();
  const scrollNodes = new Set<HTMLElement>();
  const abort = new AbortController();
  const { signal } = abort;
  let frame = 0;
  let queued = false;

  const io =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver(
          (entries, observer) => {
            for (const entry of entries) {
              const el = entry.target;
              if (!(el instanceof HTMLElement)) continue;
              if (entry.isIntersecting) {
                el.setAttribute("data-animate-state", "in");
                observer.unobserve(el);
              } else if (!el.hasAttribute("data-animate-state")) {
                el.setAttribute("data-animate-state", "pending");
              }
            }
          },
          { root: null, rootMargin: "0px 0px -10% 0px", threshold: 0 },
        )
      : null;

  const tick = () => {
    queued = false;
    for (const el of scrollNodes) {
      el.style.setProperty("--zk-animate-progress", String(viewProgress(el)));
    }
  };
  const onScroll = () => {
    if (queued || scrollNodes.size === 0) return;
    queued = true;
    frame = requestAnimationFrame(tick);
  };

  const bindLongpress = (el: HTMLElement) => {
    let timer = 0;
    const start = (event: PointerEvent) => {
      if (event.isPrimary === false) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        el.setAttribute("data-animate-longpress-on", "");
      }, longpressMs(el));
    };
    const end = () => {
      window.clearTimeout(timer);
      el.removeAttribute("data-animate-longpress-on");
    };
    el.addEventListener("pointerdown", start, { signal });
    el.addEventListener("pointerup", end, { signal });
    el.addEventListener("pointercancel", end, { signal });
    el.addEventListener("pointerleave", end, { signal });
  };

  const attach = (el: HTMLElement) => {
    if (attached.has(el)) return;
    attached.add(el);
    readDelay(el);
    bindCustomMotions(el);
    if (appearMotion(el) && io) io.observe(el);
    if (el.hasAttribute("data-animate-scroll") && !supportsViewTimeline()) {
      scrollNodes.add(el);
    }
    if (el.hasAttribute("data-animate-longpress")) bindLongpress(el);
  };

  for (const el of collect(scope)) attach(el);
  if (scrollNodes.size > 0) {
    tick();
    window.addEventListener("scroll", onScroll, { signal, passive: true });
    window.addEventListener("resize", onScroll, { signal, passive: true });
  }

  const mo =
    typeof MutationObserver === "function"
      ? new MutationObserver(() => {
          for (const el of collect(scope)) attach(el);
        })
      : null;
  mo?.observe(scope instanceof Document ? scope.documentElement : scope, { childList: true, subtree: true });

  return () => {
    abort.abort();
    io?.disconnect();
    mo?.disconnect();
    if (frame) cancelAnimationFrame(frame);
    scrollNodes.clear();
  };
}
