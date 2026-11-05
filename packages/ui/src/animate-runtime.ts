import { isMotionReduced } from "./motion-preference.js";

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

type Session = {
  refs: number;
  attached: WeakSet<Element>;
  scrollNodes: Set<HTMLElement>;
  io: IntersectionObserver | null;
  mo: MutationObserver | null;
  htmlMo: MutationObserver | null;
  mql: MediaQueryList | null;
  abort: AbortController;
  nodeAbort: AbortController;
  scrollAbort: AbortController | null;
  frame: number;
  queued: boolean;
  reduced: boolean;
};

let session: Session | null = null;

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

function attachTree(s: Session, node: Node): void {
  if (node instanceof HTMLElement) {
    attach(s, node);
    for (const el of collect(node)) attach(s, el);
  } else if (node instanceof DocumentFragment) {
    for (const child of node.childNodes) attachTree(s, child);
  }
}

function purgeTree(s: Session, node: Node): void {
  if (!(node instanceof Element)) return;
  if (node instanceof HTMLElement) s.scrollNodes.delete(node);
  for (const el of s.scrollNodes) {
    if (node.contains(el)) s.scrollNodes.delete(el);
  }
}

function tick(s: Session): void {
  s.queued = false;
  const reads: { el: HTMLElement; progress: number }[] = [];
  for (const el of s.scrollNodes) {
    if (!el.isConnected) {
      s.scrollNodes.delete(el);
      continue;
    }
    reads.push({ el, progress: viewProgress(el) });
  }
  for (const { el, progress } of reads) {
    el.style.setProperty("--zk-animate-progress", String(progress));
  }
  if (s.scrollNodes.size === 0) stopScroll(s);
}

function onScroll(s: Session): void {
  if (s.queued || s.scrollNodes.size === 0) return;
  s.queued = true;
  s.frame = requestAnimationFrame(() => tick(s));
}

function stopScroll(s: Session): void {
  s.scrollAbort?.abort();
  s.scrollAbort = null;
  if (s.frame) {
    cancelAnimationFrame(s.frame);
    s.frame = 0;
  }
  s.queued = false;
}

function startScroll(s: Session): void {
  if (s.reduced || s.scrollNodes.size === 0 || s.scrollAbort) return;
  s.scrollAbort = new AbortController();
  const { signal } = s.scrollAbort;
  document.addEventListener("scroll", () => onScroll(s), { signal, passive: true, capture: true });
  window.addEventListener("resize", () => onScroll(s), { signal, passive: true });
}

function ensureScroll(s: Session): void {
  if (s.reduced || s.scrollNodes.size === 0) {
    stopScroll(s);
    return;
  }
  startScroll(s);
  tick(s);
}

function ensureIo(s: Session): IntersectionObserver | null {
  if (s.io) return s.io;
  if (typeof IntersectionObserver !== "function") return null;
  s.io = new IntersectionObserver(
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
  );
  return s.io;
}

function bindLongpress(s: Session, el: HTMLElement): void {
  let timer = 0;
  const { signal } = s.nodeAbort;
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
}

function attach(s: Session, el: HTMLElement): void {
  if (s.reduced || s.attached.has(el) || !el.matches(TARGET_SELECTOR)) return;
  s.attached.add(el);
  readDelay(el);
  bindCustomMotions(el);
  if (appearMotion(el)) ensureIo(s)?.observe(el);
  if (el.hasAttribute("data-animate-scroll") && !supportsViewTimeline()) {
    s.scrollNodes.add(el);
  }
  if (el.hasAttribute("data-animate-longpress")) bindLongpress(s, el);
}

function startMutation(s: Session): void {
  if (s.mo || typeof MutationObserver !== "function") return;
  s.mo = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) attachTree(s, node);
      for (const node of record.removedNodes) purgeTree(s, node);
    }
    ensureScroll(s);
  });
  s.mo.observe(document.documentElement, { childList: true, subtree: true });
}

function pause(s: Session): void {
  s.io?.disconnect();
  s.io = null;
  s.mo?.disconnect();
  s.mo = null;
  stopScroll(s);
  s.scrollNodes.clear();
  s.attached = new WeakSet();
  s.nodeAbort.abort();
  s.nodeAbort = new AbortController();
}

function resume(s: Session): void {
  startMutation(s);
  for (const el of collect(document)) attach(s, el);
}

function onMotionChange(s: Session): void {
  const reduced = isMotionReduced();
  if (reduced === s.reduced) return;
  s.reduced = reduced;
  if (reduced) pause(s);
  else resume(s);
}

function bindMotionWatchers(s: Session): void {
  if (typeof window.matchMedia === "function") {
    s.mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    s.mql.addEventListener?.("change", () => onMotionChange(s), { signal: s.abort.signal });
  }
  if (typeof MutationObserver === "function") {
    s.htmlMo = new MutationObserver(() => onMotionChange(s));
    s.htmlMo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
  }
}

function ensureSession(): Session {
  if (session) return session;
  const s: Session = {
    refs: 0,
    attached: new WeakSet(),
    scrollNodes: new Set(),
    io: null,
    mo: null,
    htmlMo: null,
    mql: null,
    abort: new AbortController(),
    nodeAbort: new AbortController(),
    scrollAbort: null,
    frame: 0,
    queued: false,
    reduced: isMotionReduced(),
  };
  bindMotionWatchers(s);
  session = s;
  return s;
}

function teardown(): void {
  if (!session) return;
  pause(session);
  session.htmlMo?.disconnect();
  session.abort.abort();
  session = null;
}

/**
 * Appear (IntersectionObserver), scroll progress fallback, and longpress.
 * Press / hover / focus are CSS-only. No-op on the server. One global
 * listener set, even when several observers mount. Stays alive under
 * reduced motion so a later `change` or `data-motion` toggle can start it.
 */
export function observeAnimate(root?: ParentNode): () => void {
  if (typeof document === "undefined") return () => {};
  const s = ensureSession();
  s.refs += 1;
  if (!s.reduced) {
    const scope = root ?? document;
    for (const el of collect(scope)) attach(s, el);
    startMutation(s);
    ensureScroll(s);
  }
  return () => {
    s.refs -= 1;
    if (s.refs <= 0) teardown();
  };
}
