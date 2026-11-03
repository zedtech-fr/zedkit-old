"use client";

import type { ReactNode } from "react";
import { useEffect, useLayoutEffect } from "react";
import dynamic from "next/dynamic";
import { RootProvider } from "fumadocs-ui/provider/next";
import { CustomIdentityBar } from "@/components/custom-identity-bar";
import { IdentityDockWidget } from "@/components/identity-dock-widget";
import { IdentityAssistantStoreProvider } from "@/lib/identity-assistant-store";
import { purgeLegacyIdentityStorage } from "@/lib/site-identity-storage";
import { SiteChromeA11yPatch } from "@/ui/site-chrome-a11y";
import { ThemeColorMeta } from "@/ui/theme-color-meta";

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
    <RootProvider search={{ SearchDialog: StaticSearchDialog, preload: false }}>
      <IdentityAssistantStoreProvider>
        <SiteChromeA11yPatch />
        <ThemeColorMeta />
        <CustomIdentityBar />
        <IdentityDockWidget />
        {children}
      </IdentityAssistantStoreProvider>
    </RootProvider>
  );
}
