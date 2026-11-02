import { Stack, StatusDot, Text } from "@zedtech/zedkit-ui";
import { statusDotCopy } from "@/components/demos/i18n/status-dot-copy";

export function StatusDotDemo() {
  return (
    <Stack gap={2}>
      <Stack direction="horizontal" gap={2} className="items-center">
        <StatusDot tone="active" />
        <Text>{statusDotCopy.syncing}</Text>
      </Stack>
      <Stack direction="horizontal" gap={2} className="items-center">
        <StatusDot tone="idle" />
        <Text>{statusDotCopy.idle}</Text>
      </Stack>
      <Stack direction="horizontal" gap={2} className="items-center">
        <StatusDot tone="success" />
        <Text>{statusDotCopy.saved}</Text>
      </Stack>
      <Stack direction="horizontal" gap={2} className="items-center">
        <StatusDot tone="warning" />
        <Text>{statusDotCopy.retrying}</Text>
      </Stack>
      <Stack direction="horizontal" gap={2} className="items-center">
        <StatusDot tone="danger" />
        <Text>{statusDotCopy.failed}</Text>
      </Stack>
    </Stack>
  );
}
