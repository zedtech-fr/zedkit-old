import { ProgressBar, Stack } from "@zedtech/zedkit-ui";
import { progressCopy } from "@/components/demos/i18n/progress-copy";

export function ProgressBarDemo() {
  return (
    <Stack gap={2}>
      <ProgressBar value={40} label={progressCopy.uploading} />
      <ProgressBar value={100} label={progressCopy.complete} />
    </Stack>
  );
}
