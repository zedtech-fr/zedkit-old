"use client";

import { useEffect } from "react";
import { applySurfaceGlassPanel } from "@zedtech/zedkit-ui";

/** Fumadocs renders the Guides viewport with no prop seam: apply kit glass Surface chrome. */
const GUIDES_PANEL_SELECTOR = ".flex.w-full.justify-center > *";

function tagGuidesPanel(root: ParentNode): void {
  const panel = root.querySelector(GUIDES_PANEL_SELECTOR);
  if (panel instanceof HTMLElement && panel.getAttribute("data-surface") !== "glass") {
    applySurfaceGlassPanel(panel, { elevation: 3, radius: "xl" });
  }
}

export function SiteHeaderSurfacePatch() {
  useEffect(() => {
    const nav = document.querySelector("#nd-nav");
    if (!nav) return;
    tagGuidesPanel(nav);
    const observer = new MutationObserver(() => tagGuidesPanel(nav));
    observer.observe(nav, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return null;
}

/** Adds native tooltips where Fumadocs chrome only sets `aria-label` (#396). */
export function SiteChromeA11yPatch() {
  useEffect(() => {
    const titles: Record<string, string> = {
      GitHub: "View zedkit repository on GitHub",
      "Toggle Menu": "Open site menu",
      "Open Sidebar": "Open navigation sidebar",
      "Close Sidebar": "Close navigation sidebar",
      "Collapse Sidebar": "Collapse navigation sidebar",
    };
    for (const [ariaLabel, title] of Object.entries(titles)) {
      for (const el of document.querySelectorAll(`[aria-label="${ariaLabel}"]`)) {
        if (!el.getAttribute("title")) el.setAttribute("title", title);
      }
    }
  }, []);
  return null;
}
