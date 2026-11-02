"use client";

import { Calendar, CircleCheck, FolderOpen, MessageSquare, Package, RotateCcw, Truck, Users } from "lucide-react";
import { Heading, IconLabel, Stack, Text } from "@zedtech/zedkit-ui";
import { iconLabelCopy } from "@/components/demos/i18n/icon-label-copy";

/** Project details: a row of small facts, each with a quiet decorative icon. */
export function IconLabelDemo() {
  return (
    <Stack gap={3} className="min-w-0 rounded-lg border border-border bg-background p-4">
      <Stack gap={1}>
        <Heading level={2}>{iconLabelCopy.project.title}</Heading>
        <Text variant="muted" className="text-sm">
          {iconLabelCopy.project.summary}
        </Text>
      </Stack>
      <Stack direction="horizontal" gap={4} className="flex-wrap text-sm">
        <IconLabel icon={FolderOpen}>{iconLabelCopy.project.studio}</IconLabel>
        <IconLabel icon={Calendar}>{iconLabelCopy.project.due}</IconLabel>
        <IconLabel icon={Users}>{iconLabelCopy.project.members}</IconLabel>
        <IconLabel icon={MessageSquare}>{iconLabelCopy.project.comments}</IconLabel>
      </Stack>
    </Stack>
  );
}

const ORDERS = [
  { ...iconLabelCopy.orders.delivered, icon: CircleCheck },
  { ...iconLabelCopy.orders.shipped, icon: Truck },
  { ...iconLabelCopy.orders.packing, icon: Package },
  { ...iconLabelCopy.orders.returned, icon: RotateCcw },
];

/** Order list: the state keeps its readable text; the icon only adds a quick visual cue. */
export function IconLabelOrdersDemo() {
  return (
    <ul aria-label={iconLabelCopy.orders.label} className="divide-y divide-border rounded-lg border border-border bg-background">
      {ORDERS.map((order) => (
        <li key={order.number} className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3">
          <Stack gap={1} className="min-w-0">
            <Text as="span" className="font-medium">
              {order.number}
            </Text>
            <Text as="span" variant="muted" className="text-xs">
              {order.item}
            </Text>
          </Stack>
          <IconLabel icon={order.icon} className="text-sm">
            {order.state}
          </IconLabel>
        </li>
      ))}
    </ul>
  );
}
