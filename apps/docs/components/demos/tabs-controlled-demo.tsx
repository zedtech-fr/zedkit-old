"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Stack,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
} from "@zedtech/zedkit-ui";
import { tabsCopy } from "@/components/demos/i18n/tabs-copy";

const views = {
  day: tabsCopy.controlled.day,
  week: tabsCopy.controlled.week,
  month: tabsCopy.controlled.month,
} as const;

type View = keyof typeof views;

/** Controlled tabs: the page owns the state, so a button outside the tabs can drive them. */
export function TabsControlledDemo() {
  const [view, setView] = useState<View>("week");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tabsCopy.controlled.title}</CardTitle>
        <CardDescription>{tabsCopy.controlled.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Stack gap={4}>
          <Stack direction="horizontal" gap={3}>
            <Badge variant="secondary" className="whitespace-nowrap">{tabsCopy.controlled.showing(views[view].label)}</Badge>
            <Button variant="outline" size="sm" onClick={() => setView("month")}>
              {tabsCopy.controlled.jump}
            </Button>
          </Stack>
          <Tabs value={view} onValueChange={(next) => setView(next as View)}>
            <TabsList aria-label={tabsCopy.controlled.range}>
              {(Object.keys(views) as View[]).map((key) => (
                <TabsTrigger key={key} value={key}>
                  {views[key].label}
                </TabsTrigger>
              ))}
            </TabsList>
            {(Object.keys(views) as View[]).map((key) => (
              <TabsContent key={key} value={key}>
                <Text>{views[key].detail}</Text>
              </TabsContent>
            ))}
          </Tabs>
        </Stack>
      </CardContent>
    </Card>
  );
}
