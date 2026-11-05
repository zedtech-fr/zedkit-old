"use client";

import dynamic from "next/dynamic";
import { useEffect, useLayoutEffect } from "react";

import { captureCreateArrival } from "@/lib/identity-create-arrival";
import { useIdentityAssistantStore } from "@/lib/identity-assistant-store";

const IdentityDockLazyShell = dynamic(
  () => import("@/components/identity-dock-lazy-shell").then((mod) => ({ default: mod.IdentityDockLazyShell })),
  { ssr: false },
);

export function IdentityDockGate() {
  const { setExpanded } = useIdentityAssistantStore();
  // First layout pass runs before the editor is ready to replace `#create` with its look query.
  useLayoutEffect(() => {
    captureCreateArrival();
  }, []);
  useEffect(() => {
    void import("@/components/identity-dock-lazy-shell");
  }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable);
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "i" && !typing) {
        event.preventDefault();
        setExpanded(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setExpanded]);
  return <IdentityDockLazyShell />;
}
