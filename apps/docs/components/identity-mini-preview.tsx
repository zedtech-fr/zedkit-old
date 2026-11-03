"use client";

import { useLayoutEffect, useRef } from "react";
import { Badge, Button, Field, FieldLabel, Heading, Input, Stack, Text, tokensToCss, type IdentityTokens } from "@zedtech/zedkit-ui";

import { identityAssistantCopy } from "@/components/i18n/identity-assistant-copy";
import { identitySpecimenCompositions } from "@/components/i18n/identity-specimen-compositions";
import type { SpecimenDomain } from "@/lib/brief-specimen-domain";
const SCOPE = "[data-identity-proposal]";

/** Headings take the proposal's display family, tracking and leading, the way the kit's own identities do. */
const HEADINGS = `${SCOPE} h3, ${SCOPE} h4 { font-family: var(--zk-font-display); letter-spacing: var(--zk-heading-tracking); line-height: var(--zk-heading-leading, 1.1); }`;

/** One small product screen. Everything reads the scope's tokens, so a change in type, colour, shape or density shows. */
function Specimen({
  dark,
  label,
  id,
  copy,
}: {
  dark: boolean;
  label: string;
  id: string;
  copy: (typeof identitySpecimenCompositions)[SpecimenDomain];
}) {
  const ref = useRef<HTMLDivElement>(null);
  // The kit's dark rules key on a `dark` class on the scope itself; set it where the draft card sets it.
  useLayoutEffect(() => {
    ref.current?.classList.toggle("dark", dark);
  }, [dark]);
  return (
    <Stack
      ref={ref}
      data-identity-scope=""
      data-identity-proposal=""
      data-identity="proposal"
      role="group"
      aria-label={label}
      gap={3}
      className="min-w-0 rounded-xl border border-border bg-background p-4 font-sans text-foreground shadow-sm"
    >
      {/* `inert`: a picture of a look, not a form to use. */}
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
    </Stack>
  );
}

/**
 * The proposal in light and dark, side by side from `sm`. The two scopes are isolated from the page and from the
 * editor's draft by their own sheet: the values were validated by the identity schema, so they cannot leave their
 * declaration. Nothing here writes to the page, to storage or to the saved looks.
 */
export function IdentityMiniPreview({
  tokens,
  id,
  domain = "commerce",
}: {
  tokens: IdentityTokens;
  id: string;
  domain?: SpecimenDomain;
}) {
  const copy = identitySpecimenCompositions[domain];
  return (
    <Stack gap={2} data-assistant-preview="">
      <style>{`${tokensToCss(tokens, SCOPE)}\n${HEADINGS}`}</style>
      <Text as="span" className="text-sm font-medium text-foreground">
        {identityAssistantCopy.proposal.preview}
      </Text>
      <Stack gap={3} className="sm:grid sm:grid-cols-2">
        <Specimen dark={false} label={identityAssistantCopy.proposal.lightLabel} id={`${id}-light`} copy={copy} />
        <Specimen dark label={identityAssistantCopy.proposal.darkLabel} id={`${id}-dark`} copy={copy} />
      </Stack>
    </Stack>
  );
}
