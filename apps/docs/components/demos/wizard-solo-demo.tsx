"use client";

import { useState } from "react";
import { OptionCard, Stack, Text } from "@zedtech/zedkit-ui";
import { wizardCopy } from "@/components/demos/i18n/wizard-copy";

export function WizardSoloDemo() {
  const [digest, setDigest] = useState(true);
  return (
    <Stack gap={2} className="min-w-0">
      <OptionCard
        title={wizardCopy.solo.title}
        description={wizardCopy.solo.description}
        checked={digest}
        onChange={() => setDigest(!digest)}
      />
      <Text variant="muted" className="text-xs" aria-live="polite">
        {digest ? wizardCopy.solo.on : wizardCopy.solo.off}
      </Text>
    </Stack>
  );
}
