"use client";

import { useLayoutEffect, useRef } from "react";
import {
  Badge,
  Button,
  Field,
  FieldLabel,
  Heading,
  Input,
  Stack,
  Text,
} from "@zedtech/zedkit-ui";

import type { SpecimenDomain } from "@/lib/brief-specimen-domain";
import type { identitySpecimenCompositions } from "@/components/i18n/identity-specimen-compositions";

type SpecimenCopy = (typeof identitySpecimenCompositions)[SpecimenDomain];

function IdentitySpecimenCardBody({ id, copy }: { id: string; copy: SpecimenCopy }) {
  return (
    <Stack gap={3} inert>
      <Stack direction="horizontal" gap={3} className="items-center justify-between border-b border-border pb-2">
        <Heading level={4} as="h4" className="text-base">
          {copy.brand}
        </Heading>
        <Stack direction="horizontal" gap={3} className="text-sm text-muted-foreground">
          {copy.nav.map((item) => (
            <Text as="span" key={item}>
              {item}
            </Text>
          ))}
        </Stack>
      </Stack>
      <Heading level={3} as="h3" className="text-xl">
        {copy.headline}
      </Heading>
      <Text as="p" variant="muted" className="m-0">
        {copy.body}
      </Text>
      <Stack direction="horizontal" gap={2} className="items-center">
        <Badge variant="success">{copy.badge}</Badge>
        <Text as="span" className="text-sm font-medium">
          {copy.price}
        </Text>
      </Stack>
      <Field>
        <FieldLabel htmlFor={`${id}-email`}>{copy.emailLabel}</FieldLabel>
        <Input id={`${id}-email`} placeholder={copy.emailPlaceholder} tabIndex={-1} />
      </Field>
      <Stack direction="horizontal" gap={2} className="flex-wrap">
        <Button size="sm" tabIndex={-1}>
          {copy.primary}
        </Button>
        <Button size="sm" variant="outline" tabIndex={-1}>
          {copy.secondary}
        </Button>
      </Stack>
    </Stack>
  );
}

/** One small product screen for a proposal preview. */
export function IdentitySpecimenCard({
  dark,
  label,
  id,
  proposal,
  copy,
}: {
  dark: boolean;
  label: string;
  id: string;
  proposal: string;
  copy: SpecimenCopy;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    ref.current?.classList.toggle("dark", dark);
  }, [dark]);
  return (
    <Stack
      ref={ref}
      data-identity-scope=""
      data-identity-proposal={proposal}
      data-identity="proposal"
      role="group"
      aria-label={label}
      gap={3}
      className="min-w-0 rounded-xl border border-border bg-background p-4 font-sans text-foreground shadow-sm"
    >
      <IdentitySpecimenCardBody id={id} copy={copy} />
    </Stack>
  );
}
