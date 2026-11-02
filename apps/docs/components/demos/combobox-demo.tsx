"use client";

import { useState } from "react";
import { Combobox, Stack, Text, type ComboboxOption, zedkitUiMessagesEn, ZedkitUiProvider } from "@zedtech/zedkit-ui";
import { comboboxCopy } from "@/components/demos/i18n/combobox-copy";

const CITIES: ComboboxOption[] = [...comboboxCopy.cities];

export function ComboboxDemo() {
  const [city, setCity] = useState<string | null>(null);
  return (
    <ZedkitUiProvider messages={zedkitUiMessagesEn}>
      <Stack gap={2} className="max-w-sm min-w-0">
        <Combobox
          options={CITIES}
          value={city}
          onValueChange={setCity}
          aria-label={comboboxCopy.officeCityAriaLabel}
          placeholder={comboboxCopy.placeholder}
        />
        <Text variant="muted" className="text-xs" aria-live="polite">
          {city
            ? comboboxCopy.selected(CITIES.find((entry) => entry.value === city)?.label ?? city)
            : comboboxCopy.filterHint}
        </Text>
      </Stack>
    </ZedkitUiProvider>
  );
}
