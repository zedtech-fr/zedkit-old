"use client";

import { Bot, LayoutDashboard, Server, TrendingUp } from "lucide-react";
import { IconLabel, Stack, Text } from "@zedtech/zedkit-ui";
import { iconLabelCopy } from "@/components/demos/i18n/icon-label-copy";

const AREAS = [
  { label: iconLabelCopy.areas.build, icon: LayoutDashboard },
  { label: iconLabelCopy.areas.core, icon: Server },
  { label: iconLabelCopy.areas.seo, icon: TrendingUp },
  { label: iconLabelCopy.areas.agents, icon: Bot },
] as const;

/** Home areas: each catalog family keeps its name; the icon is only a cue. */
export function IconLabelAreasDemo() {
  return (
    <Stack gap={3} className="min-w-0">
      <Text variant="muted">{iconLabelCopy.areas.intro}</Text>
      <Stack gap={2}>
        {AREAS.map((area) => (
          <IconLabel key={area.label} icon={area.icon}>
            {area.label}
          </IconLabel>
        ))}
      </Stack>
    </Stack>
  );
}
