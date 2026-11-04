import { Stack, Text, cn } from "@zedtech/zedkit-ui";

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
      <Text
        variant="muted"
        typeRole="label"
        className={cn(text ? "min-h-5" : "min-h-0")}
        data-assistant-status=""
      >
        {text ?? ""}
      </Text>
    </Stack>
  );
}
