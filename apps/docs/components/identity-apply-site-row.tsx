"use client";

import type { ReactNode } from "react";
import { Button, Stack, Text, type IdentityTokens } from "@zedtech/zedkit-ui";

import { identityEditorCopy } from "@/components/i18n/identity-editor-copy";

function Row({ children }: { children: ReactNode }) {
  return (
    <Stack direction="horizontal" gap={2} className="flex-wrap items-end">
      {children}
    </Stack>
  );
}

type ApplySiteHandlers = {
  appliedSite: boolean;
  onApplySite: () => void;
  onRemoveFromSite: () => void;
};

type ApplySiteTokenHandlers = {
  appliedSite: boolean;
  onApplySite: (tokens: IdentityTokens) => void;
  onRemoveFromSite: () => void;
};

/** Apply the current look to this site, or remove it. Shared by the editor KeepBar and the identity dock. */
function ApplySiteRow({
  appliedSite,
  onApplySite,
  onRemoveFromSite,
  hint = false,
}: ApplySiteHandlers & { hint?: boolean }) {
  return (
    <Stack gap={2} data-slot="identity-apply-site">
      <Row>
        <Button
          type="button"
          variant="outline"
          className="scroll-mt-28 scroll-mb-24 max-lg:[@media(min-height:48rem)]:scroll-mt-80"
          onClick={onApplySite}
        >
          {identityEditorCopy.toolbar.applySite}
        </Button>
        {appliedSite ? (
          <Button type="button" variant="outline" onClick={onRemoveFromSite}>
            {identityEditorCopy.library.removeFromSite}
          </Button>
        ) : null}
      </Row>
      {hint ? (
        <Text variant="muted" typeRole="label">
          {identityEditorCopy.toolbar.applyHint}
        </Text>
      ) : null}
    </Stack>
  );
}

/** Dock Preview: Apply under Use this look, driven by contrast-repaired proposal tokens. */
function ProposalSiteApply({
  siteApply,
  tokens,
}: {
  siteApply: ApplySiteTokenHandlers;
  tokens: IdentityTokens;
}) {
  return (
    <ApplySiteRow
      appliedSite={siteApply.appliedSite}
      onApplySite={() => siteApply.onApplySite(tokens)}
      onRemoveFromSite={siteApply.onRemoveFromSite}
    />
  );
}

/** Dock Conversation tab: same control, hidden on lg when Preview already shows it. */
function ConversationSiteApply({
  siteApply,
  className,
}: {
  siteApply: ApplySiteHandlers;
  className?: string;
}) {
  return (
    <Stack gap={2} className={className} data-slot="identity-apply-site-conversation">
      <ApplySiteRow
        appliedSite={siteApply.appliedSite}
        onApplySite={siteApply.onApplySite}
        onRemoveFromSite={siteApply.onRemoveFromSite}
      />
    </Stack>
  );
}

export { ApplySiteRow, ConversationSiteApply, ProposalSiteApply };
export type { ApplySiteHandlers, ApplySiteTokenHandlers };
