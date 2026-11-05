import { Button, Heading, Stack, Text } from "@zedtech/zedkit-ui";

import type { BookingComposition } from "@/components/i18n/identity-specimen-compositions";

/** Booking: the service and price first, then times with one preselected, then one action. */
export function BookingScreen({ copy }: { copy: BookingComposition }) {
  return (
    <Stack gap={3}>
      <Heading level={4} typeRole="cardTitle" className="border-b border-border pb-2">
        {copy.brand}
      </Heading>
      <Stack direction="horizontal" gap={3} className="items-baseline justify-between">
        <Stack gap={1}>
          <Heading level={3} typeRole="band">
            {copy.service}
          </Heading>
          <Text as="span" typeRole="small" className="text-muted-foreground">
            {copy.detail}
          </Text>
        </Stack>
        <Text as="span" typeRole="body" className="font-semibold tabular-nums">
          {copy.price}
        </Text>
      </Stack>
      <Stack gap={2}>
        <Text as="span" typeRole="label" className="text-muted-foreground">
          {copy.dayLabel}
        </Text>
        <ul className="m-0 grid list-none grid-cols-4 gap-2 p-0">
          {copy.slots.map((slot) => (
            <li key={slot}>
              <Button
                size="sm"
                variant={slot === copy.selectedSlot ? "default" : "outline"}
                tabIndex={-1}
                className="w-full px-0 tabular-nums"
              >
                {slot}
              </Button>
            </li>
          ))}
        </ul>
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
