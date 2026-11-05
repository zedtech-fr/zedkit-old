"use client";

import { Animate, Text } from "@zedtech/zedkit-ui";
import { animateCopy } from "@/components/demos/i18n/animate-copy";

export function AnimateTriggersDemo() {
  return (
    <Animate
      on={{ appear: "fade-up", press: "scale-down", longpress: "pulse", hover: "lift" }}
      className="rounded-xl border bg-card p-card-padding"
    >
      <Text>{animateCopy.band}</Text>
    </Animate>
  );
}
