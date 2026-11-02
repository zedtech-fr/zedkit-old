"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stack,
  Text,
} from "@zedtech/zedkit-ui";
import { selectCopy } from "@/components/demos/i18n/select-copy";

const DELIVERY: Record<string, string> = {
  eu: selectCopy.delivery.eu,
  us: selectCopy.delivery.us,
  apac: selectCopy.delivery.apac,
};

export function SelectDemo() {
  const [region, setRegion] = React.useState<string | undefined>(undefined);
  return (
    <Stack gap={2} className="min-w-0">
      <Select {...(region === undefined ? {} : { value: region })} onValueChange={setRegion}>
        <SelectTrigger aria-label={selectCopy.label}>
          <SelectValue placeholder={selectCopy.placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="eu">{selectCopy.europe}</SelectItem>
          <SelectItem value="us">{selectCopy.americas}</SelectItem>
          <SelectItem value="apac">{selectCopy.apac}</SelectItem>
        </SelectContent>
      </Select>
      <Text variant="muted" className="text-xs" aria-live="polite">
        {region ? DELIVERY[region] : selectCopy.empty}
      </Text>
    </Stack>
  );
}
