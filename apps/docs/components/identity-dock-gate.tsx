"use client";

import dynamic from "next/dynamic";
import { useLayoutEffect } from "react";

import { captureCreateArrival } from "@/lib/identity-create-arrival";

const IdentityDockLazyShell = dynamic(
  () => import("@/components/identity-dock-lazy-shell").then((mod) => ({ default: mod.IdentityDockLazyShell })),
  { ssr: false },
);

export function IdentityDockGate() {
  // First layout pass runs before the editor is ready to replace `#create` with its look query.
  useLayoutEffect(() => {
    captureCreateArrival();
  }, []);
  return <IdentityDockLazyShell />;
}
