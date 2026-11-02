"use client";

import { useState } from "react";
import {
  MultiSelect,
  Stack,
  Text,
  type ComboboxOption,
  zedkitUiMessagesEn,
  ZedkitUiProvider,
} from "@zedtech/zedkit-ui";
import { multiSelectCopy } from "@/components/demos/i18n/multi-select-copy";

const TAGS: ComboboxOption[] = [
  { value: "design", label: multiSelectCopy.design },
  { value: "docs", label: multiSelectCopy.docs },
  { value: "infra", label: multiSelectCopy.infra },
  { value: "release", label: multiSelectCopy.release },
];

export function MultiSelectDemo() {
  const [tags, setTags] = useState<string[]>(["docs"]);
  return (
    <ZedkitUiProvider messages={zedkitUiMessagesEn}>
      <Stack gap={2} className="max-w-sm min-w-0">
        <MultiSelect options={TAGS} value={tags} onValueChange={setTags} aria-label={multiSelectCopy.label} placeholder={multiSelectCopy.placeholder} />
        <Text variant="muted" className="text-xs" aria-live="polite">
          {tags.length === 0 ? multiSelectCopy.empty : multiSelectCopy.selected(tags.length)}
        </Text>
      </Stack>
    </ZedkitUiProvider>
  );
}
