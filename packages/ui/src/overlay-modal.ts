import type { RefObject } from "react";
import * as React from "react";
import { tryCatch } from "@zedtech/zedkit-core";

function resolveModalMountAutoFocus(autoFocus: boolean | undefined, modal: boolean): boolean {
  return autoFocus ?? modal;
}

/**
 * Opt-in initial focus target for overlay panels: a ref to the field, or a
 * selector resolved inside the panel. Anything unresolvable falls back to
 * the panel itself.
 */
type OverlayInitialFocus = RefObject<HTMLElement | null> | string;

function resolveOverlayInitialTarget(
  container: HTMLElement | null,
  initialFocus: OverlayInitialFocus | undefined,
): HTMLElement | null {
  if (typeof initialFocus === "string") {
    if (!container) return null;
    const found = tryCatch(() => container.querySelector<HTMLElement>(initialFocus));
    return (found.ok ? found.value : null) ?? container;
  }
  return initialFocus?.current ?? container;
}

/** Input types whose value exposes a caret (the rest throw on setSelectionRange). */
const CARET_INPUT_TYPES = new Set(["text", "search", "tel", "url", "password"]);

/** Caret at the end of a text field; every other element is focus-only. Never selects. */
function placeCaretAtEnd(target: HTMLElement): void {
  const field =
    target instanceof HTMLTextAreaElement
      ? target
      : target instanceof HTMLInputElement && CARET_INPUT_TYPES.has(target.type)
        ? target
        : null;
  if (field) {
    const length = field.value.length;
    tryCatch(() => field.setSelectionRange(length, length));
  }
}

/**
 * Shared open-focus for overlay panels: focus lands on the panel itself
 * (which keeps the focus trap engaged) unless `initialFocus` names a field,
 * and a focused field always gets the caret at the end, never a selection.
 */
function focusOverlayInitial(
  container: HTMLElement | null,
  initialFocus: OverlayInitialFocus | undefined,
): void {
  const target = resolveOverlayInitialTarget(container, initialFocus);
  if (!target) return;
  target.focus({ preventScroll: true });
  placeCaretAtEnd(target);
}

/** Grace beyond the exit animation before the fallback synthesizes its end event. */
const EXIT_FALLBACK_GRACE_MS = 1000;

/** First CSS duration in a (possibly comma-list) duration value, in ms; unparseable → 0. */
function parseCssDurationMs(value: string): number {
  const first = value.split(",")[0]?.trim() ?? "";
  const match = /^([\d.]+)(m?s)$/.exec(first);
  if (!match) return 0;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return 0;
  return match[2] === "s" ? amount * 1000 : amount;
}

function dispatchSyntheticAnimationEnd(node: HTMLElement): void {
  const view = node.ownerDocument.defaultView;
  const name = (view && view.getComputedStyle(node).animationName) || "none";
  // Sending the current name always satisfies Presence's check (it tests inclusion).
  const event =
    typeof AnimationEvent === "function"
      ? new AnimationEvent("animationend", { animationName: name, bubbles: true })
      : (() => {
          const fallback = new Event("animationend", { bubbles: true });
          Object.defineProperty(fallback, "animationName", { value: name });
          return fallback;
        })();
  node.dispatchEvent(event);
}

/**
 * Exit safety net for overlay/panel nodes: when `data-state` flips to `closed`, arm a timeout for the
 * exit animation duration plus a grace period; if the node is still mounted and closed (the real
 * `animationend`/`animationcancel` never fired), synthesize `animationend` so Presence unmounts. Instant
 * closes (reduced motion: no closed phase renders at all) never arm the timer.
 */
function useExitUnmountFallback<T extends HTMLElement>(): React.RefCallback<T> {
  const timer = React.useRef<number | undefined>(undefined);
  const observer = React.useRef<MutationObserver | null>(null);
  const clear = React.useCallback(() => {
    if (timer.current !== undefined) {
      window.clearTimeout(timer.current);
      timer.current = undefined;
    }
    observer.current?.disconnect();
    observer.current = null;
  }, []);
  React.useEffect(() => clear, [clear]);
  return React.useCallback(
    (node: T | null) => {
      clear();
      if (!node) return;
      const arm = () => {
        if (node.getAttribute("data-state") !== "closed" || timer.current !== undefined) return;
        const view = node.ownerDocument.defaultView;
        const duration = parseCssDurationMs(view ? view.getComputedStyle(node).animationDuration : "");
        timer.current = window.setTimeout(
          () => {
            timer.current = undefined;
            if (!node.isConnected || node.getAttribute("data-state") !== "closed") return;
            dispatchSyntheticAnimationEnd(node);
          },
          duration + EXIT_FALLBACK_GRACE_MS,
        );
      };
      const watcher = new MutationObserver(() => {
        if (node.getAttribute("data-state") !== "closed") {
          if (timer.current !== undefined) {
            window.clearTimeout(timer.current);
            timer.current = undefined;
          }
          return;
        }
        arm();
      });
      watcher.observe(node, { attributes: true, attributeFilter: ["data-state"] });
      observer.current = watcher;
      arm();
      return () => {
        watcher.disconnect();
        if (observer.current === watcher) observer.current = null;
        if (timer.current !== undefined) {
          window.clearTimeout(timer.current);
          timer.current = undefined;
        }
      };
    },
    [clear],
  );
}

/** D5 overlay role: header/footer inherit the panel surface (no opaque chrome bands). */
const overlayDialogHeaderClass =
  "sticky top-0 z-10 flex flex-col gap-dialog-header-stack pr-dialog-header-end text-left";
const overlayDialogFooterClass =
  "sticky bottom-0 z-10 flex flex-col-reverse gap-2 pb-dialog-footer-safe sm:flex-row sm:justify-end sm:items-center";
const overlayDialogCloseClass =
  "absolute top-0 right-0 z-20 grid size-overlay-touch-target min-h-[45px] min-w-[45px] shrink-0 place-content-center rounded-sm opacity-70 focus-ring-control transition-opacity hover:opacity-100 disabled:pointer-events-none";

const overlayDrawerHeaderClass =
  "sticky top-0 z-10 flex shrink-0 flex-col gap-drawer-header-gap border-b border-border p-4 text-left";
const overlayDrawerFooterClass =
  "sticky bottom-0 z-10 mt-auto flex shrink-0 flex-col gap-2 border-t border-border px-4 pt-4 pb-drawer-footer-safe sm:flex-row sm:justify-end sm:items-center";

export {
  focusOverlayInitial,
  overlayDialogCloseClass,
  overlayDialogFooterClass,
  overlayDialogHeaderClass,
  overlayDrawerFooterClass,
  overlayDrawerHeaderClass,
  type OverlayInitialFocus,
  resolveModalMountAutoFocus,
  resolveOverlayInitialTarget,
  useExitUnmountFallback,
};
