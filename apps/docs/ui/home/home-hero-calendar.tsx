"use client";

import { Badge, Calendar, PageHeader, Stack, Text } from "@zedtech/zedkit-ui";
import { STATUS_VARIANT, type TaskRow } from "@/components/project-tracker-demo-data";
import { DOCS_TYPE_LABEL_CLASS } from "@/lib/docs-type-roles";
import { HERO_TODAY, dueOn, isDone, longDate, parseDue } from "@/ui/home/home-hero-data";
import { homeCopy } from "@/ui/home/i18n/home-copy";

const copy = homeCopy.heroApp.calendar;

/** Days with something due are set in bold, so the visitor knows where to click. */
function dueDays(rows: TaskRow[]): Date[] {
  return rows.filter((row) => !isDone(row)).map((row) => {
    const date = parseDue(row.due);
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  });
}

function Agenda({ rows, day }: { rows: TaskRow[]; day: Date | undefined }) {
  const agenda = day ? rows.filter((row) => !isDone(row) && dueOn(row, day)) : [];
  return (
    <Stack gap={2} className="min-w-40 flex-1" aria-live="polite" data-hero-block="" data-beat={2}>
      <Text variant="muted" className={DOCS_TYPE_LABEL_CLASS}>
        {day ? copy.dueOn(longDate.format(day)) : copy.description}
      </Text>
      {agenda.length === 0 ? (
        <Text variant="muted" className="text-sm">
          {copy.nothingDue}
        </Text>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {agenda.map((row) => (
            <li key={row.id} className="flex min-w-0 flex-col gap-1 rounded-lg border border-border p-3">
              <span className="text-sm font-medium">{row.title}</span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant={STATUS_VARIANT[row.status]}>{row.status}</Badge>
                {row.owner}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Stack>
  );
}

export function HeroCalendarPage({
  rows,
  day,
  onDay,
}: {
  rows: TaskRow[];
  day: Date | undefined;
  onDay: (day: Date | undefined) => void;
}) {
  return (
    <Stack gap={3} className="min-w-0">
      <PageHeader titleAs="h2" title={copy.title} description={copy.description} className="mb-0" />
      <div className="flex min-w-0 flex-wrap items-start gap-4" data-hero-calendar="">
        <div data-hero-block="" data-beat={1}>
          <Calendar
            mode="single"
            defaultMonth={HERO_TODAY}
            today={HERO_TODAY}
            selected={day}
            onSelect={onDay}
            modifiers={{ due: dueDays(rows) }}
            modifiersClassNames={{ due: "font-semibold" }}
          />
        </div>
        <Agenda rows={rows} day={day} />
      </div>
    </Stack>
  );
}
