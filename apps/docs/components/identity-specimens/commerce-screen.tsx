import { Badge, Button, Heading, Stack, Text } from "@zedtech/zedkit-ui";

import type { CommerceComposition } from "@/components/i18n/identity-specimen-compositions";

/** Shop: one product leads; price and stock sit beside its name; one action. */
export function CommerceScreen({ copy }: { copy: CommerceComposition }) {
  return (
    <Stack gap={3}>
      <Stack direction="horizontal" gap={3} className="justify-between">
        <Heading level={4} typeRole="cardTitle">
          {copy.brand}
        </Heading>
        <Text as="span" typeRole="small" className="text-muted-foreground">
          {copy.basket}
        </Text>
      </Stack>
      <Stack
        aria-hidden="true"
        className="aspect-[3/1] justify-end rounded-md bg-primary/10 p-3"
      >
        <Text as="span" typeRole="label" className="text-foreground">
          {copy.imageNote}
        </Text>
      </Stack>
      <Stack direction="horizontal" gap={3} className="items-baseline justify-between">
        <Heading level={3} typeRole="band">
          {copy.product}
        </Heading>
        <Text as="span" typeRole="body" className="font-semibold tabular-nums">
          {copy.price}
        </Text>
      </Stack>
      <Stack gap={2} className="items-start">
        <Badge variant="success" className="whitespace-nowrap">
          {copy.badge}
        </Badge>
        <Text typeRole="small" className="m-0 text-muted-foreground">
          {copy.detail}
        </Text>
      </Stack>
      <Button size="sm" tabIndex={-1} className="w-full">
        {copy.primary}
      </Button>
      <Text typeRole="small" className="m-0 text-muted-foreground">
        {copy.reassurance}
      </Text>
    </Stack>
  );
}
