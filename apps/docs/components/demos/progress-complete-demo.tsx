import { Button, ProgressBar, Stack, Text } from "@zedtech/zedkit-ui";
import { progressCopy } from "@/components/demos/i18n/progress-copy";

export function ProgressCompleteDemo() {
  return (
    <Stack gap={3} className="min-w-0">
      <ProgressBar value={100} label={progressCopy.complete} />
      <Stack direction="horizontal" gap={3} className="items-center">
        <Text variant="muted">{progressCopy.file}</Text>
        <Button size="sm" variant="outline">
          {progressCopy.open}
        </Button>
      </Stack>
    </Stack>
  );
}
