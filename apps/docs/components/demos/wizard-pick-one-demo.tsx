"use client";

import { useState } from "react";
import { OptionCards, Stack, Text } from "@zedtech/zedkit-ui";
import { wizardCopy } from "@/components/demos/i18n/wizard-copy";

export function WizardPickOneDemo() {
  const [picked, setPicked] = useState<string[]>(["standard"]);
  const labels: Record<string, string> = {
    standard: wizardCopy.shipping.standard.title,
    express: wizardCopy.shipping.express.title,
    pickup: wizardCopy.shipping.pickup.title,
  };
  return (
    <Stack gap={2} className="min-w-0">
      <OptionCards
        multiple={false}
        label={wizardCopy.shippingLabel}
        options={Object.entries(wizardCopy.shipping).map(([id, option]) => ({ id, ...option }))}
        selected={picked}
        onChange={setPicked}
      />
      <Text variant="muted" className="text-xs" aria-live="polite">
        {wizardCopy.pickedOne(labels[picked[0] ?? ""] ?? "")}
      </Text>
    </Stack>
  );
}
