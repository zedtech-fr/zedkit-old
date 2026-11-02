"use client";

import { Calendar } from "@zedtech/zedkit-ui";

// A client component on purpose: the dates are built where they are shown. Built in a server component,
// `new Date(2026, 9, 1)` is local midnight on the build host, travels as a UTC instant and lands in the
// visitor's own zone: west of the build host the demo opened on September and failed to hydrate.
export function CalendarDemo() {
  return <Calendar defaultMonth={new Date(2026, 9, 1)} today={new Date(2026, 9, 15)} />;
}
