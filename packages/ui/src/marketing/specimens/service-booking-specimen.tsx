"use client";

import { useState } from "react";
import { Button, Heading, Stack, Text } from "../specimen-primitives.js";
import { specimenMessagesEn } from "./specimens-messages.js";

export type ServiceBookingSpecimenProps = {
  className?: string;
  messages?: typeof specimenMessagesEn.serviceBooking;
};

type ServiceMessages = typeof specimenMessagesEn.serviceBooking;

function BookingServiceChoices({
  messages,
  serviceId,
  onSelect,
}: {
  messages: ServiceMessages;
  serviceId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <Stack gap={2} role="group" aria-label={messages.servicesAriaLabel}>
      {messages.services.map((item) => (
        <Button
          key={item.id}
          type="button"
          variant={item.id === serviceId ? "default" : "outline"}
          aria-pressed={item.id === serviceId}
          className="h-auto! min-h-11 w-full justify-between px-4 py-3 font-normal"
          onClick={() => onSelect(item.id)}
        >
          <Text as="span">{item.label}</Text>
          <Text as="span" variant="muted">
            {item.duration}
          </Text>
        </Button>
      ))}
    </Stack>
  );
}

function BookingSlotChoices({
  messages,
  slot,
  onSelect,
}: {
  messages: ServiceMessages;
  slot: string | null;
  onSelect: (time: string) => void;
}) {
  return (
    <Stack gap={2} role="group" aria-label={messages.slotsAriaLabel}>
      <Text variant="muted" className="text-xs font-medium">
        {messages.slotsAriaLabel}
      </Text>
      <Stack direction="horizontal" gap={2} className="flex-wrap">
        {messages.slots.map((time) => (
          <Button
            key={time}
            type="button"
            size="sm"
            variant={slot === time ? "default" : "outline"}
            aria-pressed={slot === time}
            onClick={() => onSelect(time)}
          >
            {time}
          </Button>
        ))}
      </Stack>
    </Stack>
  );
}

export function ServiceBookingSpecimen({ className, messages = specimenMessagesEn.serviceBooking }: ServiceBookingSpecimenProps) {
  const [serviceId, setServiceId] = useState<string>(messages.services[0]!.id);
  const [slot, setSlot] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const service = messages.services.find((item) => item.id === serviceId) ?? messages.services[0]!;

  return (
    <Stack gap={4} className={`min-w-0 ${className ?? ""}`} data-slot="service-booking-specimen" data-specimen-domain="service-booking">
      <Stack gap={1}>
        <Heading level={3}>{messages.heading}</Heading>
        <Text variant="muted">{messages.description}</Text>
      </Stack>
      <BookingServiceChoices
        messages={messages}
        serviceId={serviceId}
        onSelect={(id) => {
          setServiceId(id);
          setSlot(null);
          setStatus("");
        }}
      />
      <BookingSlotChoices messages={messages} slot={slot} onSelect={setSlot} />
      <Button
        type="button"
        className="w-fit"
        disabled={!slot}
        onClick={() => slot && setStatus(messages.booked(service.label, slot))}
      >
        {messages.book}
      </Button>
      <Text variant="muted" role="status" className="min-h-6">
        {status}
      </Text>
    </Stack>
  );
}
