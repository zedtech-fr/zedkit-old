"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { tryCatch } from "@zedtech/zedkit-core";
import {
  IdentityDock,
  IdentityDockPanel,
  IdentityDockSheet,
  IdentityDockSwatch,
  IdentityDockTrigger,
  Text,
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
  const identityId = useIdentity(DEFAULT_IDENTITY);
  const baseTokens = useMemo(() => readSiteTokens(identityId), [identityId]);
  const [previewTokens, setPreviewTokens] = useState(baseTokens);
  const { expanded, setExpanded } = useIdentityAssistantStore();
  const narrow = useNarrowViewport();
  const triggerRef = useIdentityDockKeyboard(expanded, setExpanded);

  useEffect(() => {
    setPreviewTokens(baseTokens);
  }, [baseTokens]);

  const panel = (
    <IdentityDockAssistantPanel previewTokens={previewTokens} onPreviewTokens={setPreviewTokens} />
  );

  return (
    <IdentityDock data-testid="identity-dock">
      {expanded ? (
        narrow ? (
          <IdentityDockSheet open={expanded} onOpenChange={setExpanded}>
            <div data-slot="identity-dock-panel" data-state="open" aria-label={identityDockCopy.panelTitle}>
              {panel}
            </div>
          </IdentityDockSheet>
        ) : (
          <IdentityDockPanel open={expanded} aria-label={identityDockCopy.panelTitle}>
            {panel}
          </IdentityDockPanel>
        )
      ) : (
        <IdentityDockTrigger
          ref={triggerRef}
          aria-expanded={false}
          aria-label={identityDockCopy.pillLabel}
          aria-keyshortcuts="Control+I Meta+I"
          title={identityDockCopy.shortcutHint}
          onClick={() => setExpanded(true)}
        >
          <IdentityDockSwatch />
          <Text className="truncate text-sm font-medium">{identityDockCopy.pillLabel}</Text>
        </IdentityDockTrigger>
      )}
    </IdentityDock>
  );
}

export { IdentityDockWidget };
