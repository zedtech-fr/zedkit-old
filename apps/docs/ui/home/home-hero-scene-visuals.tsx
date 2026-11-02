"use client";

import { useState } from "react";
import { Badge, Calendar, DetailPanel, Heading, Stack, Text } from "@zedtech/zedkit-ui";
import { DOCS_TYPE_H3_CLASS, DOCS_TYPE_LABEL_CLASS } from "@/lib/docs-type-roles";
import { HOME_CARD_CONTENT_GAP } from "@/ui/home/home-rhythm";
import { homeCopy } from "@/ui/home/i18n/home-copy";

const MONTH = new Date(2026, 9, 1);
const DAY = new Date(2026, 9, 15);

const copy = homeCopy.heroScenes;

const DAY_LABEL = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long" });

/** Detail panel example: the record a row opens. Read-only on purpose; nothing here pretends to save. */
export function HomeHeroDrawerScene() {
  return (
    <Stack gap={HOME_CARD_CONTENT_GAP} className="min-w-0 p-3 sm:p-4">
      <Stack gap={1}>
        <Heading level={2} className={`${DOCS_TYPE_H3_CLASS} tracking-tight`}>
          {copy.drawerTitle}
        </Heading>
        <Text variant="muted" className={DOCS_TYPE_LABEL_CLASS}>
          {copy.drawerSub}
        </Text>
      </Stack>
      <Text className="font-medium">{copy.drawerTask}</Text>
      <DetailPanel
        items={[
          { label: copy.assignee, value: copy.assigneeValue },
          { label: copy.due, value: copy.dueValue },
          { label: copy.status, value: <Badge>{copy.statusValue}</Badge> },
        ]}
      />
    </Stack>
  );
}

/** Date picker example: a real calendar, so choosing a day shows what a choice looks like. */
export function HomeHeroCalendarScene() {
  const [day, setDay] = useState<Date | undefined>(DAY);
  return (
    <Stack gap={HOME_CARD_CONTENT_GAP} className="min-w-0 items-center p-3 sm:p-4">
      <Text variant="muted" className={DOCS_TYPE_LABEL_CLASS}>
        {day ? copy.calendarChosen(DAY_LABEL.format(day)) : copy.calendarCaption}
      </Text>
      <Calendar mode="single" defaultMonth={MONTH} today={DAY} selected={day} onSelect={setDay} />
    </Stack>
  );
}
