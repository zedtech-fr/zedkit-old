"use client";

import { useRouter } from "next/navigation";
import { Button, Stack, Text } from "@zedtech/zedkit-ui";

import { identityEditorCopy } from "@/components/i18n/identity-editor-copy";
import { requestIdentityDockOpen } from "@/lib/identity-dock-persist";

/** Points visitors at the floating IdentityDock without duplicating it on the full editor page. */
export function IdentityEditorDockEntry() {
  const router = useRouter();
  const copy = identityEditorCopy.panel;
  return (
    <Stack
      gap={2}
      className="rounded-lg border border-border bg-muted/40 px-3 py-3"
      data-slot="identity-editor-dock-entry"
    >
      <Text typeRole="label">{copy.dockEntryTitle}</Text>
      <Text variant="muted" className="text-sm">
        {copy.dockEntryBody}
      </Text>
      <Button
        type="button"
        variant="outline"
        className="w-full sm:w-auto"
        onClick={() => {
          requestIdentityDockOpen();
          router.push("/docs");
        }}
      >
        {copy.dockEntryAction}
      </Button>
    </Stack>
  );
}
