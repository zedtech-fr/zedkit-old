import { Badge, Button, DetailPanelRow, Stack, StatusDot, Text } from "@zedtech/zedkit-ui";
import { detailsCopy } from "@/components/demos/i18n/details-copy";

/** Rows with custom content (badge, dot, button) inside your own definition list. */
export function DetailsComposedDemo() {
  return (
    <dl className="divide-y divide-border rounded-lg border">
      <DetailPanelRow label={detailsCopy.composed.labels.customer} value={detailsCopy.composed.customer} />
      <DetailPanelRow label={detailsCopy.composed.labels.plan} value={<Badge variant="success">{detailsCopy.composed.planBadge}</Badge>} />
      <DetailPanelRow
        label={detailsCopy.composed.labels.lastSeen}
        value={
          <Stack direction="horizontal" gap={2}>
            <StatusDot tone="success" />
            <Text>{detailsCopy.composed.lastSeen}</Text>
          </Stack>
        }
      />
      <DetailPanelRow label={detailsCopy.composed.labels.renews} value={detailsCopy.composed.renews} />
      <DetailPanelRow
        label={detailsCopy.composed.labels.customerId}
        value={
          <Button size="sm" variant="outline">
            {detailsCopy.composed.copyId}
          </Button>
        }
      />
    </dl>
  );
}
