"use client";

import { Stack, Text, tokensToCss, type IdentityTokens } from "@zedtech/zedkit-ui";

import { identityAssistantCopy } from "@/components/i18n/identity-assistant-copy";
import { identitySpecimenCompositions } from "@/components/i18n/identity-specimen-compositions";
import { IdentitySpecimenCard } from "@/components/identity-specimen-card";
import type { SpecimenDomain } from "@/lib/brief-specimen-domain";

const SCOPE = "[data-identity-proposal]";

const SPECIMEN_DOMAIN_ATTR: Record<SpecimenDomain, string> = {
  commerce: "commerce",
  "saas-dashboard": "saas-dashboard",
  editorial: "editorial",
  booking: "service-booking",
};

const HEADINGS = `${SCOPE} h3, ${SCOPE} h4 { font-family: var(--zk-font-display); letter-spacing: var(--zk-heading-tracking); line-height: var(--zk-heading-leading, 1.1); }`;

export function IdentityMiniPreview({
  tokens,
  id,
  domain = "commerce",
  compact = false,
}: {
  tokens: IdentityTokens;
  id: string;
  domain?: SpecimenDomain;
  /** One theme card — keeps phone proposal guards inside the viewport. */
  compact?: boolean;
}) {
  const copy = identitySpecimenCompositions[domain];
  return (
    <Stack gap={2} data-assistant-preview="" data-slot="brief-specimen" data-specimen-domain={SPECIMEN_DOMAIN_ATTR[domain]}>
      <style>{`${tokensToCss(tokens, SCOPE)}\n${HEADINGS}`}</style>
      <Text as="span" className="text-sm font-medium text-foreground">
        {identityAssistantCopy.proposal.preview}
      </Text>
      {compact ? (
        <IdentitySpecimenCard dark={false} label={identityAssistantCopy.proposal.lightLabel} id={`${id}-light`} copy={copy} />
      ) : (
        <Stack gap={3} className="sm:grid sm:grid-cols-2">
          <IdentitySpecimenCard dark={false} label={identityAssistantCopy.proposal.lightLabel} id={`${id}-light`} copy={copy} />
          <IdentitySpecimenCard dark label={identityAssistantCopy.proposal.darkLabel} id={`${id}-dark`} copy={copy} />
        </Stack>
      )}
    </Stack>
  );
}
