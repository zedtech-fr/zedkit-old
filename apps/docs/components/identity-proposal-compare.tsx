"use client";

import { Stack, Text, type IdentityTokens } from "@zedtech/zedkit-ui";

import { identityAssistantCopy as copy } from "@/components/i18n/identity-assistant-copy";
import { IdentityMiniPreview } from "@/components/identity-mini-preview";
import type { SpecimenDomain } from "@/lib/brief-specimen-domain";

function CompareBlock({
  label,
  tokens,
  id,
  domain,
  compact,
}: {
  label: string;
  tokens: IdentityTokens;
  id: string;
  domain: SpecimenDomain;
  compact?: boolean;
}) {
  return (
    <Stack gap={2}>
      <Text typeRole="label" className="text-foreground">
        {label}
      </Text>
      <IdentityMiniPreview tokens={tokens} id={id} domain={domain} compact={compact} />
    </Stack>
  );
}

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
      <Stack gap={3} className="max-lg:hidden">
        <CompareBlock label={copy.proposal.beforeLabel} tokens={current} id={`before-${requestId}`} domain={domain} />
        <CompareBlock label={copy.proposal.afterLabel} tokens={proposed} id={`proposal-${requestId}`} domain={domain} />
      </Stack>
      <Stack gap={3} className="lg:hidden">
        <CompareBlock label={copy.proposal.afterLabel} tokens={proposed} id={`proposal-${requestId}`} domain={domain} compact />
        <details className="text-sm">
          <summary className="flex min-h-11 cursor-pointer items-center focus-ring">{copy.proposal.beforeLabel}</summary>
          <CompareBlock label={copy.proposal.beforeLabel} tokens={current} id={`before-${requestId}`} domain={domain} compact />
        </details>
      </Stack>
    </Stack>
  );
}
