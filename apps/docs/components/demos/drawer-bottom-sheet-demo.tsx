"use client";

import * as React from "react";
import {
  Button,
  Checkbox,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Label,
  Stack,
  Text,
} from "@zedtech/zedkit-ui";
import { drawerCopy } from "@/components/demos/i18n/drawer-copy";

const STATUSES = drawerCopy.bottomSheet.statuses;

export function DrawerBottomSheetDemo() {
  const [checked, setChecked] = React.useState<readonly string[]>(["Paid"]);
  const toggle = (status: string) =>
    setChecked((current) => (current.includes(status) ? current.filter((entry) => entry !== status) : [...current, status]));
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">{drawerCopy.bottomSheet.filters}</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHandle />
        <DrawerHeader>
          <DrawerTitle>{drawerCopy.bottomSheet.filters}</DrawerTitle>
          <DrawerDescription>{drawerCopy.bottomSheet.description}</DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <Stack gap={3} className="py-3">
            {STATUSES.map((status) => (
              <Stack key={status} direction="horizontal" gap={2} className="items-center">
                <Checkbox id={`filter-${status}`} checked={checked.includes(status)} onCheckedChange={() => toggle(status)} />
                <Label htmlFor={`filter-${status}`}>{status}</Label>
              </Stack>
            ))}
            <Text variant="muted">
              {checked.length === 0 ? drawerCopy.bottomSheet.allOrdersShown : drawerCopy.bottomSheet.statusSelected(checked.length)}
            </Text>
          </Stack>
        </DrawerBody>
        <DrawerFooter>
          <Button variant="outline" size="sm" onClick={() => setChecked([])}>
            {drawerCopy.bottomSheet.reset}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
