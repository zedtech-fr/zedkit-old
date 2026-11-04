"use client";

import { Animate, Stack, Text } from "@zedtech/zedkit-ui";
import { revealOnScrollCopy } from "@/components/demos/i18n/reveal-on-scroll-copy";

export function RevealOnScrollDemo() {
  return (
    <Animate on={{ appear: "fade-up" }} stagger className="min-w-0">
      <Stack>
        {revealOnScrollCopy.tasks.map((task) => (
          <Text key={task}>{task}</Text>
        ))}
      </Stack>
    </Animate>
  );
}
