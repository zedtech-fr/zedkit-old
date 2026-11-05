"use client";

import type { ReactNode } from "react";
import { useEffect, useLayoutEffect } from "react";
import dynamic from "next/dynamic";
import { RootProvider } from "fumadocs-ui/provider/next";
import { CustomIdentityBar } from "@/components/custom-identity-bar";
import { IdentityDockGate } from "@/components/identity-dock-gate";
import { IdentityAssistantStoreProvider } from "@/lib/identity-assistant-store";
import { purgeLegacyIdentityStorage } from "@/lib/site-identity-storage";
import { SiteChromeA11yPatch, SiteHeaderSurfacePatch } from "@/ui/site-chrome-a11y";
import { ThemeColorMeta } from "@/ui/theme-color-meta";
import { RouteScrollReset } from "@/ui/route-scroll-reset";
import { DocsAppLink } from "@/ui/docs-app-link";

/** Scroll-reveal runtime runs after hydration; it stays out of the first load. */
const AnimateObserver = dynamic(() => import("@zedtech/zedkit-ui").then((mod) => ({ default: mod.AnimateObserver })), {
  ssr: false,
});
const StaticSearchDialog = dynamic(() => import("../components/search"));

/** Client wrapper: search dialog JS loads on first open, not on every page. */
export function Provider({ children }: { children: ReactNode }) {
  useEffect(() => {
    void import("./fonts-identity");
  }, []);
  useLayoutEffect(() => {
    purgeLegacyIdentityStorage();
    void import("@/lib/named-identities").then((mod) => mod.restoreNamedIdentity());
  }, []);

  return (
    <RootProvider search={{ SearchDialog: StaticSearchDialog, preload: false }} components={{ Link: DocsAppLink }}>
      <SiteChromeA11yPatch />
      <SiteHeaderSurfacePatch />
      <ThemeColorMeta />
      <RouteScrollReset />
      <AnimateObserver />
      <CustomIdentityBar />
      <IdentityAssistantStoreProvider>
        <IdentityDockGate />
        {children}
      </IdentityAssistantStoreProvider>
    </RootProvider>
  );
}
