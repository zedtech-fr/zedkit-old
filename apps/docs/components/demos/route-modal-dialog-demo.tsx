"use client";

import { useState } from "react";
import { Badge, Button, DetailPanel, RouteModal, Stack, Text } from "@zedtech/zedkit-ui";
import { routeModalCopy } from "@/components/demos/i18n/route-modal-copy";

export function RouteModalDialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <Stack gap={3} className="min-w-0 items-start">
      <Text variant="muted">{routeModalCopy.dialog.intro}</Text>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        {routeModalCopy.dialog.open}
      </Button>
      {open ? (
        <RouteModal
          title={routeModalCopy.dialog.title}
          description={routeModalCopy.dialog.description}
          variant="dialog"
          onClose={() => setOpen(false)}
        >
          <Stack gap={3}>
            <DetailPanel
              items={[
                { label: routeModalCopy.details.customer, value: routeModalCopy.details.customerName },
                { label: routeModalCopy.details.total, value: routeModalCopy.details.totalValue },
                { label: routeModalCopy.details.status, value: <Badge variant="warning">{routeModalCopy.details.statusValue}</Badge> },
              ]}
            />
            <Text variant="muted">{routeModalCopy.dialog.footnote}</Text>
          </Stack>
        </RouteModal>
      ) : null}
    </Stack>
  );
}
