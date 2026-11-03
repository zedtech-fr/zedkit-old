import { Stack, Text } from "@zedtech/zedkit-ui";

import { UnavailableBanner } from "@/components/identity-assistant-parts";
import type { Unavailable } from "@/lib/identity-assistant";

export function DockFeedback({ text, off }: { text: string | null; off: Unavailable | null }) {
  return (
    <Stack gap={2} data-assistant-feedback="">
      {off ? <UnavailableBanner reason={off} /> : null}
      <Text role="status" aria-live="polite" className="text-sm text-muted-foreground empty:hidden" data-assistant-status="">
        {text}
      </Text>
    </Stack>
  );
}
