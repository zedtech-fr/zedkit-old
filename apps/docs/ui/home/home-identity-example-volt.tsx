"use client";

import { useId, useState } from "react";
import { Button, Heading, Input, Label, LivePulse, ProgressBar, Stack, StatusDot, Switch, Text } from "@zedtech/zedkit-ui";
import { homeIdentityExamplesCopy } from "@/ui/home/home-identity-examples-copy";

const copy = homeIdentityExamplesCopy.volt;

type Incident = (typeof copy.events)[number];

function IncidentRow({ incident, acked, onAck }: { incident: Incident; acked: boolean; onAck: () => void }) {
  return (
    <li className="flex min-w-0 items-center gap-2 border-b border-border/60 py-0.5 last:border-b-0">
      <span className="shrink-0 text-muted-foreground">{incident.time}</span>
      <StatusDot tone={acked ? "idle" : incident.tone} pulse={false} />
      <span className="hidden shrink-0 text-muted-foreground sm:inline">{incident.service}</span>
      <span className="min-w-0 flex-1 truncate">{incident.event}</span>
      {acked ? (
        <span className="shrink-0 text-muted-foreground">{copy.acked}</span>
      ) : (
        <Button type="button" variant="outline" className="hit-target h-auto! px-2 py-0 text-xs" aria-label={copy.ackAria(incident.event)} onClick={onAck}>
          {copy.ack}
        </Button>
      )}
    </li>
  );
}

export function HomeIdentityExampleVolt() {
  const filterId = useId();
  const openId = useId();
  const [query, setQuery] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [acked, setAcked] = useState<ReadonlySet<string>>(() => new Set(copy.events.filter((event) => event.acked).map((event) => event.id)));
  const needle = query.trim().toLowerCase();
  const visible = copy.events.filter(
    (event) =>
      (!openOnly || !acked.has(event.id)) && (needle === "" || `${event.service} ${event.event}`.toLowerCase().includes(needle)),
  );

  return (
    <Stack gap={3} className="min-w-0">
      <Stack direction="horizontal" gap={2} className="flex-wrap items-baseline justify-between">
        <Heading level={3} className="font-(family-name:--zk-font-display) text-lg text-balance">
          {copy.heading}
        </Heading>
        <LivePulse label={copy.live} />
      </Stack>
      <Text variant="muted">{copy.description}</Text>
      <Stack gap={2} className="min-w-0">
        <Text as="span" className="text-sm font-medium">
          {copy.budgetLabel}: {copy.budgetValue}%
        </Text>
        <ProgressBar value={copy.budgetValue} label={copy.budgetLabel} />
      </Stack>
      <Stack gap={3} className="min-w-0 sm:flex-row sm:items-end">
        <Stack gap={1} className="min-w-0 flex-1">
          <Label htmlFor={filterId}>{copy.filterLabel}</Label>
          <Input id={filterId} value={query} placeholder={copy.filterPlaceholder} onChange={(event) => setQuery(event.target.value)} />
        </Stack>
        <Stack direction="horizontal" gap={2} className="min-h-11 items-center">
          <Switch id={openId} checked={openOnly} onCheckedChange={setOpenOnly} />
          <Label htmlFor={openId}>{copy.openOnlyLabel}</Label>
        </Stack>
      </Stack>
      <Text variant="muted" role="status" data-home-identity-status="">
        {copy.openCount(copy.events.filter((event) => !acked.has(event.id)).length)}
      </Text>
      {visible.length === 0 ? (
        <Text variant="muted">{copy.empty}</Text>
      ) : (
        <ul aria-label={copy.listAriaLabel} className="m-0 grid list-none p-0 font-mono text-xs">
          {visible.map((incident) => (
            <IncidentRow
              key={incident.id}
              incident={incident}
              acked={acked.has(incident.id)}
              onAck={() => setAcked((previous) => new Set(previous).add(incident.id))}
            />
          ))}
        </ul>
      )}
    </Stack>
  );
}
