"use client";

import { useLayoutEffect, type RefObject } from "react";
import { usePathname } from "next/navigation";

import { IDENTITY_EDITOR_HREF } from "@/lib/site-links.mjs";

/** On the editor at phone widths, keep assistant errors below the sticky draft preview. */
export function useEditorDockFeedbackScroll(
  panelRef: RefObject<HTMLElement | null>,
  scrollRef: RefObject<HTMLElement | null>,
  tick: string | number | boolean | null | undefined,
) {
  const pathname = usePathname();
  useLayoutEffect(() => {
    if (pathname !== IDENTITY_EDITOR_HREF) return;
    const panel = panelRef.current;
    if (!panel) return;
    const pinned = document.querySelector("[data-slot='identity-editor-preview']");
    if (!pinned) return;
    const pinnedRect = pinned.getBoundingClientRect();
    const gap = 8;
    const nodes = panel.querySelectorAll("[data-assistant-unavailable], [data-assistant-notice]");
    let maxNeed = 0;
    for (const node of nodes) {
      if (!(node instanceof HTMLElement)) continue;
      const msgRect = node.getBoundingClientRect();
      if (msgRect.width === 0 && msgRect.height === 0) continue;
      maxNeed = Math.max(maxNeed, pinnedRect.bottom + gap - msgRect.top);
    }
    if (maxNeed <= 0) return;
    const need = maxNeed;
    const scroller = scrollRef.current;
    if (scroller) scroller.scrollTop += need;
    window.scrollBy({ top: need, behavior: "instant" });
  }, [pathname, panelRef, scrollRef, tick]);
}
