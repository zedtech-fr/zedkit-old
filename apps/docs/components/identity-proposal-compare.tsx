"use client";

import { Stack, Text, type IdentityTokens } from "@zedtech/zedkit-ui";

import { identityAssistantCopy as copy } from "@/components/i18n/identity-assistant-copy";
import { IdentityMiniPreview } from "@/components/identity-mini-preview";
import type { SpecimenDomain } from "@/lib/brief-specimen-domain";

export function ProposalBeforeAfter({
  current,
  proposed,
  requestId,
  domain,
}: {
  current: IdentityTokens;
  proposed: IdentityTokens;
  requestId: string;
  domain: SpecimenDomain;
}) {
  return (
    <Stack gap={3} data-assistant-proposal-compare="">
      <Text variant="muted" className="text-sm">
        {copy.proposal.compare}
      </Text>
      <Stack gap={2}>
        <Text typeRole="label" className="text-foreground">
          {copy.proposal.beforeLabel}
        </Text>
        <IdentityMiniPreview tokens={current} id={`before-${requestId}`} domain={domain} />
      </Stack>
      <Stack gap={2}>
        <Text typeRole="label" className="text-foreground">
          {copy.proposal.afterLabel}
        </Text>
        <IdentityMiniPreview tokens={proposed} id={`proposal-${requestId}`} domain={domain} />
      </Stack>
    </Stack>
  );
}
