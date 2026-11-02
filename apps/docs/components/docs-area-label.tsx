"use client";

import { IconLabel } from "@zedtech/zedkit-ui";
import { areaIconFor } from "@/lib/domain-icons";
import { docsAreaLabelCopy } from "@/components/i18n/docs-area-label-copy";

export function DocsAreaLabel({ area }: { area: keyof typeof docsAreaLabelCopy }) {
  return <IconLabel icon={areaIconFor(area)}>{docsAreaLabelCopy[area]}</IconLabel>;
}
