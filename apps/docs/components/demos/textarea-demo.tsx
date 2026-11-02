"use client";

import * as React from "react";
import { Label, Stack, Text, Textarea } from "@zedtech/zedkit-ui";
import { textareaCopy } from "@/components/demos/i18n/textarea-copy";

const LIMIT = 280;

export function TextareaDemo() {
  const [note, setNote] = React.useState<string>(textareaCopy.value);
  return (
    <Stack gap={2} className="min-w-0">
      <Label htmlFor="demo-note">{textareaCopy.label}</Label>
      <Textarea
        id="demo-note"
        value={note}
        maxLength={LIMIT}
        placeholder={textareaCopy.placeholder}
        onChange={(event) => setNote(event.target.value)}
      />
      <Text variant="muted" className="text-xs" aria-live="polite">
        {textareaCopy.count(note.length, LIMIT)}
      </Text>
    </Stack>
  );
}
