"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { tryCatch } from "@zedtech/zedkit-core";
import {
  IdentityDock,
  IdentityDockPanel,
  IdentityDockSheet,
  IdentityDockSwatch,
  IdentityDockTrigger,
  Stack,
  Text,
  cn,
  identityPresets,
  isPresetId,
  parseIdentityTokens,
  useIdentity,
  type IdentityTokens,
} from "@zedtech/zedkit-ui";

import { identityDockCopy } from "@/components/i18n/identity-dock-copy";
import { IdentityDockAssistantPanel } from "@/components/identity-dock-assistant-panel";
import { useIdentityDockKeyboard } from "@/components/use-identity-dock-keyboard";
import { DEFAULT_IDENTITY } from "@/lib/default-identity";
import { IDENTITY_EDITOR_HREF } from "@/lib/site-links.mjs";
import { useIdentityAssistantStore } from "@/lib/identity-assistant-store";
import { docsSiteCustomStorageKey } from "@/lib/site-identity-storage";

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

function IdentityDockWidget() {
  const pathname = usePathname();
  const onEditor = pathname === IDENTITY_EDITOR_HREF;
  const identityId = useIdentity(DEFAULT_IDENTITY);
  const baseTokens = useMemo(() => readSiteTokens(identityId), [identityId]);
  const [previewTokens, setPreviewTokens] = useState(baseTokens);
  const { expanded, setExpanded } = useIdentityAssistantStore();
  const narrow = useNarrowViewport();
  const triggerRef = useIdentityDockKeyboard(expanded, setExpanded);

  useEffect(() => {
    if (onEditor) setExpanded(true);
  }, [onEditor, setExpanded]);

  useEffect(() => {
    setPreviewTokens(baseTokens);
  }, [baseTokens]);

  const panel = (
    <IdentityDockAssistantPanel previewTokens={previewTokens} onPreviewTokens={setPreviewTokens} />
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
          <IdentityDockSheet
            open={expanded}
            onOpenChange={setExpanded}
            aria-label={identityDockCopy.panelTitle}
            detentLabels={identityDockCopy.detentLabels}
            detentGroupLabel={identityDockCopy.detentGroupLabel}
          >
            <Stack
              data-slot="identity-dock-panel"
              data-state="open"
              className="min-h-0 flex-1 gap-0 overflow-hidden"
            >
              {panel}
            </Stack>
          </IdentityDockSheet>
        ) : (
          <IdentityDockPanel open={expanded} aria-label={identityDockCopy.panelTitle}>
            {panel}
          </IdentityDockPanel>
        )
      ) : null}
    </IdentityDock>
  );
}

export { IdentityDockWidget };
