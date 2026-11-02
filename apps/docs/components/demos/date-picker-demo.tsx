"use client";

import { useState } from "react";
import { DatePicker, Field, FieldLabel } from "@zedtech/zedkit-ui";
import { datePickerCopy } from "@/components/demos/i18n/date-picker-copy";

export function DatePickerDemo() {
  const [due, setDue] = useState<Date | undefined>();
  return (
    <Field>
      <FieldLabel htmlFor="due">{datePickerCopy.dueDateLabel}</FieldLabel>
      <DatePicker
        id="due"
        value={due}
        onValueChange={setDue}
        defaultMonth={new Date(2026, 9, 1)}
        today={new Date(2026, 9, 15)}
      />
    </Field>
  );
}
