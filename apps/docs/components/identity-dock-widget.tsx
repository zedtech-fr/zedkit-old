"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";
import { tryCatch } from "@zedtech/zedkit-core";
import {
  Drawer,
  DrawerContent,
  DrawerHandle,
  Stack,
  Text,
  cn,
  identityPresets,
  isPresetId,
  parseIdentityTokens,
  useIdentity,
  type IdentityTokens,
} from "@zedtech/zedkit-ui";

import { IdentityDock, IdentityDockSwatch, IdentityDockTrigger } from "@/components/identity-dock-chrome";
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

function useEditorDockAutoOpen(
  onEditor: boolean,
  pathname: string,
  setBrief: (value: string) => void,
  setExpanded: (open: boolean) => void,
) {
  useCreatorHandoff((brief) => {
    if (brief) setBrief(brief);
    setExpanded(true);
  });
  useEffect(() => {
    if (!onEditor) return;
    const arrived = consumeCreateArrival();
    if (window.location.hash === "#create" || arrived) {
      setExpanded(true);
      return;
    }
    setExpanded(false);
  }, [onEditor, pathname, setExpanded]);
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
  const triggerRef = useIdentityDockKeyboard(expanded, setExpanded);

  useEditorDockAutoOpen(onEditor, pathname, setBrief, setExpanded);
  useIdentityDockOpenRequest(setBrief, setExpanded);

  return (
    <>
      <IdentityDock data-testid="identity-dock">
        <IdentityDockTrigger
          ref={triggerRef}
          aria-expanded={expanded}
          aria-label={identityDockCopy.pillLabel}
          aria-keyshortcuts="Control+I Meta+I"
          title={identityDockCopy.shortcutHint}
          tabIndex={expanded ? -1 : undefined}
          className={cn(expanded && "pointer-events-none opacity-0")}
          onClick={() => setExpanded(true)}
        >
          <IdentityDockSwatch />
          <Text typeRole="label" className="truncate">
            {identityDockCopy.pillLabel}
          </Text>
        </IdentityDockTrigger>
      </IdentityDock>
      <Drawer open={expanded} onOpenChange={setExpanded} direction="right" mobile="sheet" modal={false} handleOnly noBodyStyles>
        <DrawerContent
          size="lg"
          modal={false}
          aria-label={identityDockCopy.panelTitle}
          data-slot="identity-dock-panel"
          data-state={expanded ? "open" : "closed"}
          className="flex min-h-0 flex-col gap-0 p-0 [&>:not([data-slot^=drawer-],[data-vaul-handle],button)]:px-0"
        >
          <DrawerHandle className="mt-2 mb-0 h-1 w-10 shrink-0 bg-border/45" aria-label="Drag to resize" />
          <Stack data-state="open" className="min-h-0 flex-1 gap-0">
            <IdentityDockAssistantPanel
              previewTokens={workingTokens}
              onPreviewTokens={setPreviewTokens}
              viewSwitchAlways={!onEditor}
            />
          </Stack>
        </DrawerContent>
      </Drawer>
    </>
  );
}

export { IdentityDockWidget };
