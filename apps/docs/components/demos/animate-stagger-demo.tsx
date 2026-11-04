"use client";

import { Animate, Stack, Text } from "@zedtech/zedkit-ui";
import { animateCopy } from "@/components/demos/i18n/animate-copy";

export function AnimateStaggerDemo() {
  return (
    <Animate on={{ appear: "fade-up" }} stagger>
      <Stack gap={2}>
        {animateCopy.tasks.map((task) => (
          <Text key={task}>{task}</Text>
        ))}
      </Stack>
    </Animate>
  );
}