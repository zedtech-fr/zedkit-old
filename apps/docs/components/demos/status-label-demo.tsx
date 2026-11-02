import { Stack, StatusLabel } from "@zedtech/zedkit-ui";
import { statusLabelCopy } from "@/components/demos/i18n/status-label-copy";

export function StatusLabelDemo() {
  return (
    <Stack gap={2}>
      <StatusLabel tone="loading">{statusLabelCopy.saving}</StatusLabel>
      <StatusLabel tone="saved">{statusLabelCopy.saved}</StatusLabel>
      <StatusLabel tone="error">{statusLabelCopy.error}</StatusLabel>
      <StatusLabel tone="offline">{statusLabelCopy.offline}</StatusLabel>
    </Stack>
  );
}
