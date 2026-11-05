"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconButton, Stack, Text } from "@zedtech/zedkit-ui";

import { identityAssistantCopy as copy } from "@/components/i18n/identity-assistant-copy";
import { identityDockCopy } from "@/components/i18n/identity-dock-copy";
import { IDENTITY_EDITOR_HREF } from "@/lib/site-links.mjs";
import { useIdentityAssistantStore } from "@/lib/identity-assistant-store";

import { ExternalLink, X } from "lucide-react";

export function IdentityDockPanelToolbar({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const { setExpanded } = useIdentityAssistantStore();
  return (
    <Stack direction="horizontal" gap={2} className="items-center border-b border-border px-3 py-2">
      <Text typeRole="label" className="min-w-0 flex-1">
        {identityDockCopy.panelTitle}
      </Text>
      {pathname === IDENTITY_EDITOR_HREF ? null : (
        <Link
          href={IDENTITY_EDITOR_HREF}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground focus-ring-control hover:bg-muted hover:text-foreground"
          data-assistant-editor-link=""
          aria-label={copy.detailedEditorLink}
          title={copy.detailedEditorLink}
          onClick={() => setExpanded(false)}
        >
          <ExternalLink aria-hidden="true" className="size-4" />
        </Link>
      )}
      <IconButton type="button" variant="ghost" size="sm" label={identityDockCopy.closeLabel} onClick={onClose}>
        <X aria-hidden="true" />
      </IconButton>
    </Stack>
  );
}
