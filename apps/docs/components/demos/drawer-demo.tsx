"use client";

import * as React from "react";
import {
  Badge,
  Button,
  DetailPanel,
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerCloseButton,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Input,
  Stack,
  Text,
  Toaster,
  toast,
} from "@zedtech/zedkit-ui";
import { drawerCopy } from "@/components/demos/i18n/drawer-copy";

type DemoDirection = "auto" | "bottom" | "left" | "right" | "top";

const DIRECTIONS = drawerCopy.demo.directions;

const ACTIVITY = drawerCopy.demo.activity;

export function DrawerDemo() {
  const [choice, setChoice] = React.useState<DemoDirection>("auto");
  const [open, setOpen] = React.useState(false);
  const current = DIRECTIONS.find((entry) => entry.value === choice);
  const direction = choice === "auto" ? "right" : choice;
  const edgeLabel = choice === "auto" ? drawerCopy.demo.edgeDefault : choice;

  return (
    <>
      <Toaster />
      <Stack gap={3} className="min-w-0 items-start">
        <Stack gap={1} className="min-w-0">
          <Text variant="muted" id="drawer-direction-label" className="text-xs font-medium">
            {drawerCopy.demo.directionLabel}
          </Text>
          <Stack
            direction="horizontal"
            gap={1}
            className="flex-wrap"
            role="group"
            aria-labelledby="drawer-direction-label"
          >
            {DIRECTIONS.map((entry) => (
              <Button
                key={entry.value}
                type="button"
                size="sm"
                variant={entry.value === choice ? "default" : "outline"}
                aria-pressed={entry.value === choice}
                onClick={() => setChoice(entry.value)}
              >
                {entry.label}
              </Button>
            ))}
          </Stack>
          <Text variant="muted" className="text-xs">
            {current?.hint}
          </Text>
        </Stack>
        <Drawer direction={direction} mobile={choice === "auto" ? "sheet" : "side"} open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <Button variant="outline">{drawerCopy.demo.open}</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHandle />
            <DrawerHeader>
              <Stack direction="horizontal" gap={2} className="items-start justify-between">
                <Stack gap={1} className="min-w-0 flex-1 text-left">
                  <DrawerTitle>{drawerCopy.demo.title}</DrawerTitle>
                  <DrawerDescription>{drawerCopy.demo.description(edgeLabel)}</DrawerDescription>
                </Stack>
                <DrawerCloseButton className="shrink-0" />
              </Stack>
            </DrawerHeader>
            <DrawerBody>
              <Stack gap={3} className="py-3">
                <Text className="font-medium">{drawerCopy.demo.taskTitle}</Text>
                <DetailPanel
                  items={drawerCopy.demo.detailItems.map((item) =>
                    "badge" in item
                      ? { label: item.label, value: <Badge variant={item.badge}>{item.value}</Badge> }
                      : { label: item.label, value: item.value },
                  )}
                />
                <Text variant="muted" className="text-xs font-medium">
                  {drawerCopy.demo.activityHeading}
                </Text>
                {ACTIVITY.map((line) => (
                  <Text key={line} variant="muted">
                    {line}
                  </Text>
                ))}
                <Input aria-label={drawerCopy.demo.noteAriaLabel} placeholder={drawerCopy.demo.notePlaceholder} />
              </Stack>
            </DrawerBody>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => toast(drawerCopy.demo.savedToast)}
                >
                  {drawerCopy.demo.save}
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </Stack>
    </>
  );
}
