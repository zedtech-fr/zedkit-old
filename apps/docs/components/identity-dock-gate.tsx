"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const IdentityDockLazyShell = dynamic(
  () => import("@/components/identity-dock-lazy-shell").then((mod) => ({ default: mod.IdentityDockLazyShell })),
  { ssr: false },
);

/** Full-screen identity flows ship their own assistant; skip the floating dock there. */
const SKIP_PREFIXES = ["/features/identity-editor"];

export function IdentityDockGate() {
  const path = usePathname();
  if (path && SKIP_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) return null;
  return <IdentityDockLazyShell />;
}
