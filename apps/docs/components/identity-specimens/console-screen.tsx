import { Badge, Button, Heading, Stack, Text } from "@zedtech/zedkit-ui";

import type { ConsoleComposition } from "@/components/i18n/identity-specimen-compositions";

/** Console: figures first, then the rows that need a person; no headline or intro. */
export function ConsoleScreen({ copy }: { copy: ConsoleComposition }) {
  return (
    <Stack gap={3}>
      <Stack direction="horizontal" gap={3} className="justify-between border-b border-border pb-2">
        <Heading level={4} typeRole="cardTitle">
          {copy.brand}
        </Heading>
        <Text as="span" typeRole="label" className="text-muted-foreground">
          {copy.section}
        </Text>
      </Stack>
      <Stack direction="horizontal" gap={6} className="items-end">
        {copy.figures.map((figure) => (
          <Stack key={figure.label} gap={1}>
            <Heading level={3} typeRole="section" className="tabular-nums">
              {figure.value}
            </Heading>
            <Text as="span" typeRole="small" className="text-muted-foreground">
              {figure.label}
            </Text>
          </Stack>
        ))}
      </Stack>
      <ul aria-label={copy.listLabel} className="m-0 flex list-none flex-col p-0">
        {copy.rows.map((row) => (
          <li
            key={row.name}
            className="flex items-center justify-between gap-2 border-t border-border py-2"
          >
            <Stack gap={1} className="min-w-0">
              <Text as="span" typeRole="small" className="truncate font-medium">
                {row.name}
              </Text>
              <Text as="span" typeRole="label" className="text-muted-foreground">
                {row.owner}
              </Text>
            </Stack>
            <Badge variant={row.tone} className="shrink-0">
              {row.status}
            </Badge>
          </li>
        ))}
      </ul>
      <Button size="sm" tabIndex={-1} className="w-fit">
        {copy.primary}
      </Button>
    </Stack>
  );
}
