"use client";

import { useEffect, useState } from "react";
import { Badge, Card, CardContent, CardDescription, CardHeader, PageHeader, Stack, Text } from "@zedtech/zedkit-ui";
import { projectTrackerDemoCopy } from "@/components/i18n/project-tracker-demo-copy";
import { STATUS_VARIANT, type TaskRow } from "@/components/project-tracker-demo-data";
import { DOCS_TYPE_LABEL_CLASS } from "@/lib/docs-type-roles";
import { byDue, isDone, parseDue, shortDate } from "@/ui/home/home-hero-data";
import { homeCopy } from "@/ui/home/i18n/home-copy";

const copy = homeCopy.heroApp.overview;

/** Counts up from 0 while `active`. Without motion (or before hydration) `active` is false and it is just the value. */
function useCountUp(to: number, active: boolean, duration = 900): number {
  const [value, setValue] = useState(to);
  useEffect(() => {
    if (!active) {
      setValue(to);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setValue(Math.round(to * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    setValue(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to, active, duration]);
  return value;
}

function Stat({ label, value, active, beat }: { label: string; value: number; active: boolean; beat: number }) {
  const shown = useCountUp(value, active);
  return (
    <Card className="min-w-0 shadow-none" data-hero-block="" data-beat={beat}>
      <Stack gap={1} className="p-3">
        <Text variant="muted" className="text-xs leading-tight">
          {label}
        </Text>
        {/* The number counts up on screen; assistive tech gets the final value, once. */}
        <Text as="span" className="text-2xl leading-none font-semibold tracking-tight tabular-nums">
          <span className="sr-only">{value}</span>
          <span aria-hidden="true">{shown}</span>
        </Text>
      </Stack>
    </Card>
  );
}

/** Bars grow from the baseline. Their height is a level from 1 to 6 (see `home-hero.css`), not an inline style. */
function Activity() {
  return (
    <Card className="min-w-0 shadow-none" data-hero-block="" data-beat={4}>
      <CardHeader className="p-3 pb-2">
        <CardDescription className="text-xs">{copy.activity}</CardDescription>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <ul className="m-0 flex list-none items-end gap-1.5 p-0" aria-label={copy.activity} data-hero-bars="">
          {copy.activityValues.map((value, index) => (
            <li key={index} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
              <span
                data-hero-bar=""
                data-level={value}
                className="w-full rounded-sm bg-primary"
                role="img"
                aria-label={`${copy.activityDays[index]}: ${value}`}
              />
              <span aria-hidden="true" className="text-xs leading-none text-muted-foreground">
                {copy.activityDays[index]}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function UpNext({ rows }: { rows: TaskRow[] }) {
  const next = rows
    .filter((row) => !isDone(row))
    .sort(byDue)
    .slice(0, 3);
  return (
    <Stack gap={2} className="min-w-0" data-hero-block="" data-beat={5}>
      <Text variant="muted" className={DOCS_TYPE_LABEL_CLASS}>
        {copy.upNext}
      </Text>
      <ul className="m-0 flex list-none flex-col divide-y divide-border rounded-lg border border-border p-0">
        {next.map((row) => (
          <li key={row.id} className="flex min-w-0 items-center justify-between gap-3 px-3 py-2">
            <span className="min-w-0 truncate text-sm font-medium">{row.title}</span>
            <span className="flex shrink-0 items-center gap-2">
              <Badge variant={STATUS_VARIANT[row.status]} className="max-sm:hidden">
                {row.status}
              </Badge>
              <span className="text-xs text-muted-foreground tabular-nums">{shortDate.format(parseDue(row.due))}</span>
            </span>
          </li>
        ))}
      </ul>
    </Stack>
  );
}

export function HeroOverviewPage({ rows, active }: { rows: TaskRow[]; active: boolean }) {
  const { status } = projectTrackerDemoCopy;
  return (
    <Stack gap={4} className="min-w-0">
      <PageHeader titleAs="h2" title={copy.title} description={copy.description} className="mb-0" />
      <div className="grid min-w-0 grid-cols-3 gap-2">
        <Stat label={copy.stats.open} value={rows.filter((row) => !isDone(row)).length} active={active} beat={1} />
        <Stat label={copy.stats.review} value={rows.filter((row) => row.status === status.inReview).length} active={active} beat={2} />
        <Stat label={copy.stats.done} value={rows.filter(isDone).length} active={active} beat={3} />
      </div>
      <Activity />
      <UpNext rows={rows} />
    </Stack>
  );
}
