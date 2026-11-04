"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { tryCatch } from "@zedtech/zedkit-core";
import {
  Stack,
  Text,
  cn,
  identityPresets,
  isPresetId,
  parseIdentityTokens,
  useIdentity,
  type IdentityTokens,
} from "@zedtech/zedkit-ui";

import {
  IdentityDock,
  IdentityDockPanel,
  IdentityDockSwatch,
  IdentityDockTrigger,
} from "@/components/identity-dock-chrome";
import { identityDockCopy } from "@/components/i18n/identity-dock-copy";
import { IdentityDockAssistantPanel } from "@/components/identity-dock-assistant-panel";
import { useIdentityDockPreview } from "@/components/use-identity-dock-preview";
import { useCreatorHandoff } from "@/components/use-creator-handoff";
import { useIdentityDockKeyboard } from "@/components/use-identity-dock-keyboard";
import { DEFAULT_IDENTITY } from "@/lib/default-identity";
import { IDENTITY_EDITOR_HREF } from "@/lib/site-links.mjs";
import { useIdentityAssistantStore } from "@/lib/identity-assistant-store";
import { consumeCreateArrival } from "@/lib/identity-create-arrival";
import { IDENTITY_DOCK_OPEN } from "@/lib/identity-dock-open";
import { docsSiteCustomStorageKey } from "@/lib/site-identity-storage";

const IdentityDockSheet = dynamic(
  () => import("@/components/identity-dock-sheet").then((mod) => ({ default: mod.IdentityDockSheet })),
  { ssr: false },
);

function useNarrowViewport(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mql = window.matchMedia("(max-width: 639px)");
      mql.addEventListener("change", onStoreChange);
      return () => mql.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia("(max-width: 639px)").matches,
    () => false,
  );
}

function readSiteTokens(identityId: string): IdentityTokens {
  if (isPresetId(identityId)) return identityPresets[identityId];
  if (typeof window !== "undefined") {
    const raw = tryCatch(() => window.localStorage.getItem(docsSiteCustomStorageKey()));
    const stored = raw.ok ? raw.value : null;
    if (stored !== null && stored !== undefined) {
      const json = tryCatch(() => JSON.parse(stored) as unknown);
      if (json.ok) {
        const parsed = parseIdentityTokens(json.value);
        if (parsed.success) return parsed.data;
      }
    }
  }
  return identityPresets[isPresetId(DEFAULT_IDENTITY) ? DEFAULT_IDENTITY : "glass"];
}

function useEditorDockAutoOpen(onEditor: boolean, setBrief: (value: string) => void, setExpanded: (open: boolean) => void) {
  useCreatorHandoff((brief) => {
    if (brief) setBrief(brief);
    setExpanded(true);
  });
  useEffect(() => {
    // Drained on every evaluation: a #create arrival followed by an editor revisit must not reopen from a stale flag.
    const arrived = consumeCreateArrival();
    if (onEditor && (window.location.hash === "#create" || arrived)) setExpanded(true);
  }, [onEditor, setExpanded]);
}

function useIdentityDockOpenRequest(setBrief: (value: string) => void, setExpanded: (open: boolean) => void) {
  useEffect(() => {
    const open = (event: Event) => {
      const brief = (event as CustomEvent<unknown>).detail;
      if (typeof brief === "string" && brief.trim() !== "") setBrief(brief);
      setExpanded(true);
    };
    window.addEventListener(IDENTITY_DOCK_OPEN, open);
    return () => window.removeEventListener(IDENTITY_DOCK_OPEN, open);
  }, [setBrief, setExpanded]);
}

function IdentityDockWidget() {
  const pathname = usePathname();
  const onEditor = pathname === IDENTITY_EDITOR_HREF;
  const identityId = useIdentity(DEFAULT_IDENTITY);
  const baseTokens = useMemo(() => readSiteTokens(identityId), [identityId]);
  const { expanded, setExpanded, setBrief } = useIdentityAssistantStore();
  const { workingTokens, setPreviewTokens } = useIdentityDockPreview(baseTokens, identityId);
  const narrow = useNarrowViewport();
  const triggerRef = useIdentityDockKeyboard(expanded, setExpanded);

  useEditorDockAutoOpen(onEditor, setBrief, setExpanded);
  useIdentityDockOpenRequest(setBrief, setExpanded);

  const panel = (
    <IdentityDockAssistantPanel previewTokens={workingTokens} onPreviewTokens={setPreviewTokens} />
  );

  return (
    <IdentityDock data-testid="identity-dock" className="pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-0">
      <IdentityDockTrigger
        ref={triggerRef}
        aria-expanded={expanded}
        aria-label={identityDockCopy.pillLabel}
        aria-keyshortcuts="Control+I Meta+I"
        title={identityDockCopy.shortcutHint}
        tabIndex={expanded ? -1 : undefined}
        className={cn(expanded && "pointer-events-none fixed size-px overflow-hidden opacity-0")}
        onClick={() => setExpanded(true)}
      >
        <IdentityDockSwatch />
        <Text typeRole="label" className="truncate">{identityDockCopy.pillLabel}</Text>
      </IdentityDockTrigger>
      {expanded ? (
        narrow ? (
          <IdentityDockSheet open={expanded} onOpenChange={setExpanded} aria-label={identityDockCopy.panelTitle}>
            <Stack
              data-slot="identity-dock-panel"
              data-state="open"
              className="min-h-0 flex-1 gap-0 overflow-hidden"
            >
              {panel}
            </Stack>
          </IdentityDockSheet>
        ) : (
          <IdentityDockPanel open={expanded} aria-label={identityDockCopy.panelTitle} className="sm:min-h-[min(28rem,85dvh)]">
            {panel}
          </IdentityDockPanel>
        )
      ) : null}
    </IdentityDock>
  );
}

export { IdentityDockWidget };
