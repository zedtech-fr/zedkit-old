import type * as React from "react";

import { cn } from "@/lib/utils";

export interface DetailItem {
  label: React.ReactNode;
  value: React.ReactNode;
}

export interface DetailPanelProps {
  items: DetailItem[];
  className?: string;
}

export interface DetailPanelRowProps {
  label: React.ReactNode;
  value: React.ReactNode;
  className?: string;
}

/**
 * One label/value row. Compose custom panels with these inside a
 * `<dl>`; `DetailPanel` covers the plain `items[]` case.
 */
export function DetailPanelRow({ label, value, className }: DetailPanelRowProps) {
  return (
    <div data-slot="detail-panel-row" className={cn("grid grid-cols-3 gap-4 px-4 py-3 text-sm", className)}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="col-span-2 min-w-0 font-medium break-words">{value}</dd>
    </div>
  );
}

export function DetailPanel({ items, className }: DetailPanelProps) {
  return (
    <dl data-slot="detail-panel" className={cn("divide-y divide-border rounded-lg border", className)}>
      {items.map((item, index) => (
        <DetailPanelRow key={index} label={item.label} value={item.value} />
      ))}
    </dl>
  );
}
