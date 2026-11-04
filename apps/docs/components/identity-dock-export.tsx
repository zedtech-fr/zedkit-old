"use client";

import { useState } from "react";
import { Button, ConfirmDialog, Stack, Text, identityContrastWarnings, type IdentityTokens } from "@zedtech/zedkit-ui";

import { identityDockCopy as copy } from "@/components/i18n/identity-dock-copy";
import { identityEditorCopy } from "@/components/i18n/identity-editor-copy";
import { identityLeaveBundle } from "@/lib/identity-leave-bundle";

function copyText(value: string, onDone: () => void) {
  const clipboard = navigator.clipboard;
  if (!clipboard) return;
  clipboard.writeText(value).then(onDone, () => {});
}

function CopyLeaveButton({
  value,
  blocked,
  onCopied,
}: {
  value: string;
  blocked: boolean;
  onCopied: () => void;
}) {
  const trigger = (
    <Button type="button" variant="outline" className="w-fit">
      {copy.export.copyAll}
    </Button>
  );
  if (!blocked) {
    return (
      <Button type="button" variant="outline" className="w-fit" onClick={() => copyText(value, onCopied)}>
        {copy.export.copyAll}
      </Button>
    );
  }
  return (
    <ConfirmDialog
      trigger={trigger}
      title={identityEditorCopy.export.contrastTitle}
      description={identityEditorCopy.export.contrastDescription}
      confirmLabel={identityEditorCopy.export.confirmLabel}
      onConfirm={() => copyText(value, onCopied)}
    />
  );
}

export function IdentityDockExport({ tokens }: { tokens: IdentityTokens }) {
  const bundle = identityLeaveBundle(tokens);
  const blocked = identityContrastWarnings(tokens).length > 0;
  const [copied, setCopied] = useState(false);

  return (
    <Stack gap={2} data-slot="identity-dock-export">
      <Text variant="muted" className="text-sm">
        {copy.export.lead}
      </Text>
      {blocked ? (
        <Text role="status" variant="muted" className="text-sm">
          {identityEditorCopy.export.blocked}
        </Text>
      ) : null}
      <CopyLeaveButton value={bundle} blocked={blocked} onCopied={() => setCopied(true)} />
      {copied ? <Text role="status">{copy.export.copied}</Text> : null}
    </Stack>
  );
}
