"use client";

import { useState } from "react";
import { Button, Card, CardDescription, CardHeader, CardTitle, Stack, Text } from "@zedtech/zedkit-ui";
import { motionCopy } from "@/components/demos/i18n/motion-copy";

// Literal class names so Tailwind generates each stagger step.
const STEPS = [
  { ...motionCopy.steps.install, className: "hover-lift animate-fade-up stagger-1" },
  { ...motionCopy.steps.compose, className: "hover-lift animate-fade-up stagger-2" },
  { ...motionCopy.steps.ship, className: "hover-lift animate-fade-up stagger-3" },
] as const;

export function MotionDemo() {
  const [run, setRun] = useState(0);
  return (
    <Stack gap={4}>
      <Stack key={`cards-${run}`} gap={3}>
        {STEPS.map((step) => (
          <Card key={step.title} className={step.className}>
            <CardHeader>
              <CardTitle>{step.title}</CardTitle>
              <CardDescription>{step.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </Stack>
      <Stack key={`list-${run}`} gap={1} data-stagger="in">
        <Text variant="muted">{motionCopy.staggerNote}</Text>
        <Text variant="muted">{motionCopy.reducedMotion}</Text>
      </Stack>
      <Stack direction="horizontal" gap={2}>
        <Button className="hover-press" onClick={() => setRun((n) => n + 1)}>
          {motionCopy.replayEntrance}
        </Button>
      </Stack>
    </Stack>
  );
}
