"use client";

import type { ReactNode } from "react";
import { Card, CardContent, Heading, Stack, StatusDot, Text } from "@zedtech/zedkit-ui";
import type { IdentityId } from "@/ui/home/home-identity-facts";
import { homeIdentityLooksCopy } from "@/ui/home/home-identity-looks-copy";

const copy = homeIdentityLooksCopy.expression;

/**
 * A second specimen under the shared task, for the three things the task cannot show: reading (Press,
 * Maison), density (Volt), depth (Glass). It has its own frame and its own sentence about what to look
 * at, so the settings form above stays the one fair comparison across all six looks.
 */
function Scene({ label, point, children }: { label: string; point: string; children: ReactNode }) {
  return (
    <Stack
      gap={3}
      className="min-w-0 rounded-xl border border-border bg-card p-4 text-card-foreground sm:p-5"
      data-home-identity-scene=""
    >
      <Stack gap={1}>
        <Text variant="muted" className="text-xs font-medium tracking-wide uppercase">
          {label}
        </Text>
        <Text variant="muted">{point}</Text>
      </Stack>
      {children}
    </Stack>
  );
}

/** Press and Maison: a page of reading. The headline carries the voice, the measure stays capped. */
function Editorial() {
  return (
    <Scene label={copy.editorial.label} point={copy.editorial.point}>
      <article className="max-w-prose min-w-0">
        <Heading level={3} className="font-(family-name:--zk-font-display) text-2xl text-balance">
          {copy.editorial.title}
        </Heading>
        <Text className="mt-3 text-lg text-pretty">{copy.editorial.lead}</Text>
        <Text variant="muted" className="mt-3 text-pretty">
          {copy.editorial.body}
        </Text>
        <blockquote className="mt-4 border-l-2 border-primary pl-4 font-(family-name:--zk-font-display) text-lg text-pretty">
          {copy.editorial.quote}
        </blockquote>
      </article>
    </Scene>
  );
}

/** Volt: many short rows at once. Density comes from tight rhythm, not from small type (13px is the floor). */
function Dense() {
  return (
    <Scene label={copy.dense.label} point={copy.dense.point}>
      <ul aria-label={copy.dense.ariaLabel} className="m-0 grid list-none gap-0 p-0 font-mono text-sm">
        {copy.dense.rows.map((row) => (
          <li key={row.time} className="flex min-w-0 items-center gap-2 border-b border-border/60 py-1 last:border-b-0">
            <span className="text-muted-foreground">{row.time}</span>
            <StatusDot tone={row.tone} pulse={false} />
            <span className="min-w-0 truncate">{row.event}</span>
          </li>
        ))}
      </ul>
    </Scene>
  );
}

/** Glass: three surfaces stacked over a coloured ground, each readable through the one above it. */
function Layered() {
  return (
    <Scene label={copy.layered.label} point={copy.layered.point}>
      <div className="relative min-w-0 overflow-hidden rounded-xl bg-linear-to-br from-primary/50 via-accent/40 to-background p-4">
        <Text className="font-medium">{copy.layered.back}</Text>
        <Card className="mt-4 ml-4 min-w-0">
          <CardContent className="pt-4">
            <Text>{copy.layered.card}</Text>
            <Card className="mt-3 ml-4 min-w-0 shadow-lg">
              <CardContent className="pt-4">
                <Text>{copy.layered.overlay}</Text>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </Scene>
  );
}

/** Beside the shared task, the one thing this look shows best. Mist and Tide have none: the task is their proof. */
export function HomeIdentityLooksExpression({ identity }: { identity: IdentityId }) {
  if (identity === "press" || identity === "maison") return <Editorial />;
  if (identity === "volt") return <Dense />;
  if (identity === "glass") return <Layered />;
  return null;
}
