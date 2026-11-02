import { projectTrackerDemoCopy } from "@/components/i18n/project-tracker-demo-copy";
import type { TaskRow } from "@/components/project-tracker-demo-data";

/** The example project lives in November 2026; "today" is fixed so the screen reads the same on every visit. */
export const HERO_TODAY = new Date(2026, 10, 2);
export const HERO_FIRST_DAY = new Date(2026, 10, 4);

export const shortDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
export const longDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long" });

/** Due dates are ISO dates; read them as UTC midnight so the day never shifts with the viewer's time zone. */
export const parseDue = (iso: string) => new Date(`${iso}T00:00:00Z`);

export const isDone = (row: TaskRow) => row.status === projectTrackerDemoCopy.status.done;

export const byDue = (a: TaskRow, b: TaskRow) => a.due.localeCompare(b.due);

export const dueOn = (row: TaskRow, day: Date) => {
  const date = parseDue(row.due);
  return date.getUTCFullYear() === day.getFullYear() && date.getUTCMonth() === day.getMonth() && date.getUTCDate() === day.getDate();
};
