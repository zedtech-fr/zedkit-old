"use client";

import { useEffect, useRef } from "react";
import type { IdentityTokens } from "@zedtech/zedkit-ui";

import { useIdentityAssistantStore } from "@/lib/identity-assistant-store";
import { applyWidgetSpecimenPreview } from "@/lib/identity-widget-specimen-preview";

/** Restores specimen preview from persisted tokens and resets when the site identity changes. */
export function useIdentityDockPreview(baseTokens: IdentityTokens, identityId: string) {
  const { previewTokens, setPreviewTokens, setPreviewDomain } = useIdentityAssistantStore();
  const prevIdentityId = useRef(identityId);

  useEffect(() => {
    if (previewTokens !== null) applyWidgetSpecimenPreview(previewTokens);
  }, [previewTokens]);

  useEffect(() => {
    if (prevIdentityId.current === identityId) return;
    prevIdentityId.current = identityId;
    setPreviewTokens(null);
    setPreviewDomain(null);
    applyWidgetSpecimenPreview(baseTokens);
  }, [identityId, baseTokens, setPreviewTokens, setPreviewDomain]);

  return { workingTokens: previewTokens ?? baseTokens, setPreviewTokens };
}
