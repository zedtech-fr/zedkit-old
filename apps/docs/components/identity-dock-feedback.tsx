import { Stack, Text } from "@zedtech/zedkit-ui";

import { UnavailableBanner } from "@/components/identity-assistant-parts";
import type { Unavailable } from "@/lib/identity-assistant";

export function DockFeedback({
  text,
  off,
  busy,
}: {
  text: string | null;
  off: Unavailable | null;
  busy: boolean;
}) {
  return (
    <Stack
      gap={2}
      role="status"
      aria-live="polite"
      aria-busy={busy || undefined}
      data-assistant-feedback=""
    >
      {off ? <UnavailableBanner reason={off} live={false} /> : null}
      <Text className="min-h-5 text-sm text-muted-foreground" data-assistant-status="">
        {text ?? ""}
      </Text>
    </Stack>
  );
}
