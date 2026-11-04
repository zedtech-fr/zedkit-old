"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@zedtech/zedkit-ui";
import { animateCopy } from "@/components/demos/i18n/animate-copy";

export function AnimateDemo() {
  return (
    <Card data-animate="fade-up" data-animate-delay="100" data-animate-press="scale-down">
      <CardHeader>
        <CardTitle>{animateCopy.cardTitle}</CardTitle>
        <CardDescription>{animateCopy.cardBody}</CardDescription>
      </CardHeader>
    </Card>
  );
}
