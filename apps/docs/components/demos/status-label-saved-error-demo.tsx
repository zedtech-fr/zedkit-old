"use client";

import { useState } from "react";
import { Button, Stack, StatusLabel, Text } from "@zedtech/zedkit-ui";
import { statusLabelCopy } from "@/components/demos/i18n/status-label-copy";

export function StatusLabelSavedErrorDemo() {
  const [invoiceSaved, setInvoiceSaved] = useState(false);
  return (
    <Stack gap={3} className="min-w-0">
      <Stack gap={1}>
        <Text className="font-medium">{statusLabelCopy.notes}</Text>
        <StatusLabel tone="saved">{statusLabelCopy.saved}</StatusLabel>
      </Stack>
      <Stack gap={1}>
        <Text className="font-medium">{statusLabelCopy.invoice}</Text>
        {invoiceSaved ? (
          <StatusLabel tone="saved">{statusLabelCopy.saved}</StatusLabel>
        ) : (
          <Stack direction="horizontal" gap={3} className="items-center">
            <StatusLabel tone="error">{statusLabelCopy.error}</StatusLabel>
            <Button size="sm" variant="outline" onClick={() => setInvoiceSaved(true)}>
              {statusLabelCopy.retry}
            </Button>
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}
