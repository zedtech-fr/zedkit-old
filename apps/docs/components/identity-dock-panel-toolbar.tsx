"use client";

import { useSyncExternalStore } from "react";
import { Button, IconButton, Stack, Text, cn } from "@zedtech/zedkit-ui";

import { dockNewConversationLabel } from "@/components/dock-new-conversation-label";
import { identityDockCopy } from "@/components/i18n/identity-dock-copy";

import { X } from "lucide-react";

function useDocumentLang(): string {
  return useSyncExternalStore(
    () => () => {},
    () => document.documentElement.lang,
    () => "en",
  );
}

export function IdentityDockPanelToolbar({
  onNewConversation,
  onClose,
}: {
  onNewConversation: () => void;
  onClose: () => void;
}) {
  const newConversation = dockNewConversationLabel(useDocumentLang());
  return (
    <Stack direction="horizontal" gap={2} className="items-center border-b border-border px-3 py-2">
      <Text typeRole="label" className="min-w-0 flex-1">
        {identityDockCopy.panelTitle}
      </Text>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        data-testid="identity-dock-new-conversation"
        className={cn("h-8 shrink-0 px-2 text-xs text-muted-foreground")}
        aria-label={identityDockCopy.newConversationLabel}
        onClick={onNewConversation}
      >
        {newConversation}
      </Button>
      <IconButton type="button" variant="ghost" size="sm" label={identityDockCopy.closeLabel} onClick={onClose}>
        <X aria-hidden="true" />
      </IconButton>
    </Stack>
  );
}
