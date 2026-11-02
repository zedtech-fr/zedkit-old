"use client";

import { useState } from "react";
import { Badge, Button, Card, CardContent, Heading, Stack, Text } from "@zedtech/zedkit-ui";
import { formatEur, homeIdentityExamplesCopy } from "@/ui/home/home-identity-examples-copy";

const copy = homeIdentityExamplesCopy.tide;

type Invoice = (typeof copy.invoices)[number];
type FilterId = keyof typeof copy.filters;

const sum = (list: readonly Invoice[]) => list.reduce((total, invoice) => total + invoice.amount, 0);
const paid = copy.invoices.filter((invoice) => invoice.status === "paid");
const owed = copy.invoices.filter((invoice) => invoice.status !== "paid");
const overdue = copy.invoices.filter((invoice) => invoice.status === "overdue");

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="min-w-0">
      <CardContent className="pt-4">
        <Text variant="muted">{label}</Text>
        <Text className="mt-1 font-(family-name:--zk-font-display) text-2xl font-semibold tabular-nums">{value}</Text>
      </CardContent>
    </Card>
  );
}

function Filters({ value, onChange }: { value: FilterId; onChange: (value: FilterId) => void }) {
  return (
    <div role="group" aria-label={copy.filtersAriaLabel} className="flex flex-wrap gap-2">
      {(Object.keys(copy.filters) as FilterId[]).map((id) => (
        <Button key={id} type="button" size="sm" variant="outline" aria-pressed={value === id} onClick={() => onChange(id)}>
          {copy.filters[id]}
        </Button>
      ))}
    </div>
  );
}

function InvoiceRow({ invoice, reminded, onRemind }: { invoice: Invoice; reminded: boolean; onRemind: () => void }) {
  const status = copy.statuses[invoice.status];
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border py-3 last:border-b-0">
      <div className="min-w-0">
        <Text className="font-medium">{invoice.client}</Text>
        <Text variant="muted">{invoice.status === "paid" ? copy.paidOn(invoice.date) : copy.dueOn(invoice.date)}</Text>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Text as="span" className="font-semibold tabular-nums">
          {formatEur(invoice.amount)}
        </Text>
        <Badge variant={status.tone}>{status.label}</Badge>
        {invoice.status === "paid" ? null : reminded ? (
          <Text as="span" variant="muted">
            {copy.reminded}
          </Text>
        ) : (
          <Button type="button" size="sm" variant="outline" aria-label={copy.remindAria(invoice.client)} onClick={onRemind}>
            {copy.remind}
          </Button>
        )}
      </div>
    </li>
  );
}

export function HomeIdentityExampleTide() {
  const [filter, setFilter] = useState<FilterId>("all");
  const [reminded, setReminded] = useState<ReadonlySet<string>>(new Set());
  const [message, setMessage] = useState("");
  const visible = copy.invoices.filter((invoice) => filter === "all" || invoice.status === filter);

  return (
    <Stack gap={4} className="min-w-0">
      <Stack gap={1}>
        <Heading level={3} className="font-(family-name:--zk-font-display) text-lg text-balance">
          {copy.heading}
        </Heading>
        <Text variant="muted">{copy.description}</Text>
      </Stack>
      <div className="grid min-w-0 gap-3 sm:grid-cols-3">
        <Stat label={copy.stats.outstanding} value={formatEur(sum(owed))} />
        <Stat label={copy.stats.paid} value={formatEur(sum(paid))} />
        <Stat label={copy.stats.overdue} value={copy.overdueCount(overdue.length)} />
      </div>
      <Filters value={filter} onChange={setFilter} />
      <Card className="min-w-0">
        <CardContent className="pt-4">
          <ul aria-label={copy.listAriaLabel} className="m-0 list-none p-0">
            {visible.map((invoice) => (
              <InvoiceRow
                key={invoice.id}
                invoice={invoice}
                reminded={reminded.has(invoice.id)}
                onRemind={() => {
                  setReminded((previous) => new Set(previous).add(invoice.id));
                  setMessage(copy.remindedMessage(invoice.client));
                }}
              />
            ))}
          </ul>
        </CardContent>
      </Card>
      <Text variant="muted" role="status" data-home-identity-status="">
        {message}
      </Text>
    </Stack>
  );
}
