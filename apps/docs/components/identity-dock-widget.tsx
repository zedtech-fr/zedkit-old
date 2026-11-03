"use client";

import { useEffect, useMemo, useState } from "react";
import { tryCatch } from "@zedtech/zedkit-core";
import {
  IdentityDock,
  IdentityDockPanel,
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
import { DEFAULT_IDENTITY } from "@/lib/default-identity";
import { useIdentityAssistantStore } from "@/lib/identity-assistant-store";
import { docsSiteCustomStorageKey } from "@/lib/site-identity-storage";

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

  useEffect(() => {
    setPreviewTokens(baseTokens);
  }, [baseTokens]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setExpanded(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded, setExpanded]);

  return (
    <IdentityDock data-testid="identity-dock">
      {expanded ? (
        <IdentityDockPanel open={expanded} aria-label={identityDockCopy.panelTitle}>
          <IdentityDockAssistantPanel previewTokens={previewTokens} onPreviewTokens={setPreviewTokens} />
        </IdentityDockPanel>
      ) : (
        <IdentityDockTrigger
          aria-expanded={false}
          aria-label={identityDockCopy.pillLabel}
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
