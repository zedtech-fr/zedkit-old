import { Button, Heading, Stack, Text } from "@zedtech/zedkit-ui";

import type { EditorialComposition } from "@/components/i18n/identity-specimen-compositions";

/** Newsroom: the lead story owns the screen; other stories are a compact list; subscribing is quiet. */
export function EditorialScreen({ copy }: { copy: EditorialComposition }) {
  return (
    <Stack gap={3}>
      <Stack direction="horizontal" gap={3} className="justify-between border-b border-border pb-2">
        <Heading level={4} typeRole="cardTitle">
          {copy.brand}
        </Heading>
        <Button size="sm" variant="ghost" tabIndex={-1}>
          {copy.subscribe}
        </Button>
      </Stack>
      <Stack gap={2}>
        <Text as="span" typeRole="label" className="font-semibold tracking-[var(--zk-label-tracking,0.08em)] text-primary uppercase">
          {copy.kicker}
        </Text>
        <Heading level={3} typeRole="section" className="text-balance">
          {copy.headline}
        </Heading>
        <Text typeRole="body" className="m-0 text-muted-foreground">
          {copy.standfirst}
        </Text>
        <Text as="span" typeRole="small" className="text-muted-foreground">
          {copy.byline}
        </Text>
      </Stack>
      <Stack gap={1} className="border-t border-border pt-2">
        <Text as="span" typeRole="label" className="text-muted-foreground">
          {copy.moreLabel}
        </Text>
        <ul className="m-0 flex list-none flex-col p-0">
          {copy.more.map((item) => (
            <li key={item.headline} className="flex items-baseline justify-between gap-3 py-1">
              <Text as="span" typeRole="small" className="font-medium">
                {item.headline}
              </Text>
              <Text as="span" typeRole="label" className="shrink-0 text-muted-foreground tabular-nums">
                {item.meta}
              </Text>
            </li>
          ))}
        </ul>
      </Stack>
    </Stack>
  );
}
