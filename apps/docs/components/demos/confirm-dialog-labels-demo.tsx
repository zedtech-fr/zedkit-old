"use client";

import * as React from "react";
import { Badge, Button, ConfirmDialog, Stack, Text } from "@zedtech/zedkit-ui";
import { confirmDialogCopy } from "@/components/demos/i18n/confirm-dialog-copy";

export function ConfirmDialogLabelsDemo() {
  const [revoked, setRevoked] = React.useState(false);
  return (
    <Stack gap={3} className="min-w-0 items-start">
      <Stack direction="horizontal" gap={2} className="items-center">
        <Text className="font-medium">{confirmDialogCopy.labels.keySummary}</Text>
        <Badge variant={revoked ? "secondary" : "outline"}>{revoked ? confirmDialogCopy.labels.revoked : confirmDialogCopy.labels.inUse}</Badge>
      </Stack>
      {revoked ? (
        <Button variant="outline" size="sm" onClick={() => setRevoked(false)}>
          {confirmDialogCopy.labels.restoreDemo}
        </Button>
      ) : (
        <ConfirmDialog
          trigger={<Button variant="outline">{confirmDialogCopy.labels.revoke}</Button>}
          title={confirmDialogCopy.labels.title}
          description={confirmDialogCopy.labels.description}
          confirmLabel={confirmDialogCopy.labels.confirmLabel}
          cancelLabel={confirmDialogCopy.labels.cancelLabel}
          onConfirm={() => setRevoked(true)}
        />
      )}
    </Stack>
  );
}
