"use client";

import * as React from "react";
import { Badge, Button, ConfirmDialog, Stack, Text } from "@zedtech/zedkit-ui";
import { confirmDialogCopy } from "@/components/demos/i18n/confirm-dialog-copy";

export function ConfirmDialogDemo() {
  const [deleted, setDeleted] = React.useState(false);
  return (
    <Stack gap={3} className="min-w-0 items-start">
      <Stack direction="horizontal" gap={2} className="items-center">
        <Text className="font-medium">{confirmDialogCopy.demo.projectName}</Text>
        <Badge variant={deleted ? "secondary" : "outline"}>{deleted ? confirmDialogCopy.demo.deleted : confirmDialogCopy.demo.active}</Badge>
      </Stack>
      {deleted ? (
        <Stack gap={2} className="items-start">
          <Text variant="muted">{confirmDialogCopy.demo.deletedMessage}</Text>
          <Button variant="outline" size="sm" onClick={() => setDeleted(false)}>
            {confirmDialogCopy.demo.restoreDemo}
          </Button>
        </Stack>
      ) : (
        <ConfirmDialog
          trigger={<Button variant="destructive">{confirmDialogCopy.demo.deleteItem}</Button>}
          title={confirmDialogCopy.demo.title}
          description={confirmDialogCopy.demo.description}
          confirmLabel={confirmDialogCopy.demo.confirmLabel}
          onConfirm={() => setDeleted(true)}
        />
      )}
    </Stack>
  );
}
