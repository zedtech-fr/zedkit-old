"use client";

import { useState } from "react";
import { DateRangePicker, Field, FieldLabel, type DateRangePickerProps } from "@zedtech/zedkit-ui";
import { dateRangePickerCopy } from "@/components/demos/i18n/date-picker-copy";

export function DateRangePickerDemo() {
  const [span, setSpan] = useState<DateRangePickerProps["value"]>();
  return (
    <Field>
      <FieldLabel htmlFor="leave">{dateRangePickerCopy.leaveLabel}</FieldLabel>
      <DateRangePicker
        id="leave"
        value={span}
        onValueChange={setSpan}
        defaultMonth={new Date(2026, 9, 1)}
        today={new Date(2026, 9, 15)}
      />
    </Field>
  );
}
