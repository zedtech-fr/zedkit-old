"use client";

import { X } from "lucide-react";
import { Button, IconButton, Stack, Text, cn } from "@zedtech/zedkit-ui";

import { identityDockCopy } from "@/components/i18n/identity-dock-copy";

export function IdentityDockPanelToolbar({
  onNewConversation,
  onClose,
}: {
  onNewConversation: () => void;
  onClose: () => void;
}) {
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
        {identityDockCopy.newConversation}
      </Button>
      <IconButton type="button" variant="ghost" size="sm" label={identityDockCopy.closeLabel} onClick={onClose}>
        <X aria-hidden="true" />
      </IconButton>
    </Stack>
  );
}
