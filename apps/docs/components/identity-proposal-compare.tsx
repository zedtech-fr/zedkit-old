"use client";

import { useSyncExternalStore } from "react";
import { Stack, Text, cn, type IdentityTokens } from "@zedtech/zedkit-ui";

import { identityAssistantCopy as copy } from "@/components/i18n/identity-assistant-copy";
import { IdentityMiniPreview } from "@/components/identity-mini-preview";
import type { SpecimenDomain } from "@/lib/brief-specimen-domain";

function useNarrowCompare(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mql = window.matchMedia("(max-width: 1023px)");
      mql.addEventListener("change", onStoreChange);
      return () => mql.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia("(max-width: 1023px)").matches,
    () => true,
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
  const narrow = useNarrowCompare();
  return (
    <Stack gap={3} data-assistant-proposal-compare="">
      <Text variant="muted" typeRole="body">
        {copy.proposal.compare}
      </Text>
      <Stack gap={3} className={cn("flex flex-col", narrow ? "flex-col-reverse" : undefined)}>
        <Stack gap={2} className="min-w-0">
          <Text typeRole="label" className="text-foreground">
            {copy.proposal.afterLabel}
          </Text>
          <IdentityMiniPreview tokens={proposed} id={`proposal-${requestId}`} domain={domain} compact={narrow} />
        </Stack>
        <details open={!narrow} className="min-w-0 text-zk-type-body">
          <summary className="flex min-h-11 cursor-pointer items-center focus-ring lg:hidden">{copy.proposal.beforeLabel}</summary>
          <Stack gap={2} className="pt-2 lg:pt-0">
            <Text typeRole="label" className="hidden text-foreground lg:block">
              {copy.proposal.beforeLabel}
            </Text>
            <IdentityMiniPreview tokens={current} id={`before-${requestId}`} domain={domain} compact={narrow} />
          </Stack>
        </details>
      </Stack>
    </Stack>
  );
}
