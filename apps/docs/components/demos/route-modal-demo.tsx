"use client";

import { useState } from "react";
import { Badge, Button, DetailPanel, RouteModal, Stack, Text } from "@zedtech/zedkit-ui";
import { routeModalCopy } from "@/components/demos/i18n/route-modal-copy";

export function RouteModalDemo() {
  const [open, setOpen] = useState(false);
  return (
    <Stack gap={3} className="min-w-0 items-start">
      <Text variant="muted">{routeModalCopy.drawer.intro}</Text>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        {routeModalCopy.drawer.open}
      </Button>
      {open ? (
        <RouteModal
          title={routeModalCopy.drawer.title}
          description={routeModalCopy.drawer.description}
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
            <Text variant="muted">{routeModalCopy.drawer.footnote}</Text>
          </Stack>
        </RouteModal>
      ) : null}
    </Stack>
  );
}
