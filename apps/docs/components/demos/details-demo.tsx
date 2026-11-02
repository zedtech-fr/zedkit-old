import { Badge, DetailPanel, Heading, LivePulse, Stack, Text } from "@zedtech/zedkit-ui";
import { detailsCopy } from "@/components/demos/i18n/details-copy";

/** A parcel tracking panel: title with a live indicator, then the key-value details. */
export function DetailsDemo() {
  return (
    <Stack gap={4}>
      <Stack direction="horizontal" gap={3}>
        <Heading level={3}>{detailsCopy.demo.title}</Heading>
        <LivePulse label={detailsCopy.demo.trackingLive} />
      </Stack>
      <DetailPanel
        items={detailsCopy.demo.items.map((item) =>
          "badge" in item
            ? { label: item.label, value: <Badge variant={item.badge}>{item.value}</Badge> }
            : { label: item.label, value: item.value },
        )}
      />
      <Stack direction="horizontal" gap={3}>
        <LivePulse active={false} />
        <Text variant="muted">{detailsCopy.demo.trackingStoppedHint}</Text>
      </Stack>
    </Stack>
  );
}
