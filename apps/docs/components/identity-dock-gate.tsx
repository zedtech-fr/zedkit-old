"use client";

import dynamic from "next/dynamic";

const IdentityDockLazyShell = dynamic(
  () => import("@/components/identity-dock-lazy-shell").then((mod) => ({ default: mod.IdentityDockLazyShell })),
  { ssr: false },
);

export function IdentityDockGate() {
  return <IdentityDockLazyShell />;
}
