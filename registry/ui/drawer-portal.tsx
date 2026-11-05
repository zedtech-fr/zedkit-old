"use client";

import type * as React from "react";
import { ScopePortal } from "@/components/ui/theme-scope";

function DrawerPortal({
  container,
  children,
}: {
  container?: HTMLElement | null;
  children?: React.ReactNode;
}) {
  return <ScopePortal container={container}>{children}</ScopePortal>;
}

export { DrawerPortal };
