"use client";

import { IdentityAssistantStoreProvider } from "@/lib/identity-assistant-store";
import { IdentityDockWidget } from "@/components/identity-dock-widget";

/** Loaded with the dock chunk so the home first-load bundle stays under budget. */
export function IdentityDockLazyShell() {
  return (
    <IdentityAssistantStoreProvider>
      <IdentityDockWidget />
    </IdentityAssistantStoreProvider>
  );
}
