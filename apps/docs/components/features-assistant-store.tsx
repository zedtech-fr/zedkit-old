"use client";

import type { ReactNode } from "react";

import { IdentityAssistantStoreProvider } from "@/lib/identity-assistant-store";

export function FeaturesAssistantStore({ children }: { children: ReactNode }) {
  return <IdentityAssistantStoreProvider>{children}</IdentityAssistantStoreProvider>;
}
