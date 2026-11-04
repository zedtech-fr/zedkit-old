"use client";

import { IconButton, Stack, Text } from "@zedtech/zedkit-ui";

import { identityDockCopy } from "@/components/i18n/identity-dock-copy";

import { X } from "lucide-react";

export function IdentityDockPanelToolbar({ onClose }: { onClose: () => void }) {
  return (
    <Stack direction="horizontal" gap={2} className="items-center border-b border-border px-3 py-2">
      <Text typeRole="label" className="min-w-0 flex-1">
        {identityDockCopy.panelTitle}
      </Text>
      <IconButton type="button" variant="ghost" size="sm" label={identityDockCopy.closeLabel} onClick={onClose}>
        <X aria-hidden="true" />
      </IconButton>
    </Stack>
  );
}
