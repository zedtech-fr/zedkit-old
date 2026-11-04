"use client";

import type { RefObject } from "react";
import { Stack, Text, cn, type IdentityTokens } from "@zedtech/zedkit-ui";

import { identityAssistantCopy as copy } from "@/components/i18n/identity-assistant-copy";
import { BriefForm, ProposalCard, Thread, type View } from "@/components/identity-assistant-parts";
import { IdentityMiniPreview } from "@/components/identity-mini-preview";
import { IdentityRefinementChips } from "@/components/identity-refinement-chips";
import { DetectedLinks } from "@/components/identity-references";
import type { Unavailable } from "@/lib/identity-assistant";
import type { Proposal, SessionState } from "@/lib/identity-creator-session";

/** What was said, where to say more, and what happened to the links: the half that takes the visitor's words. */
export function ConversationPane(props: {
  view: View;
  session: SessionState;
  off: Unavailable | null;
  brief: string;
  busy: boolean;
  onBrief: (brief: string) => void;
  onSubmit: () => void;
  onQuickRefine: (prompt: string) => void;
  onCancel: () => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}) {
  const refining = props.session.thread.length > 0;
  const chipsVisible = refining && props.session.proposal === null && props.session.pending === null;
  return (
    <Stack gap={4} className={cn("min-w-0", props.view === "preview" && "max-lg:hidden")} data-assistant-pane="conversation">
      <Thread turns={props.session.thread} />
      <IdentityRefinementChips
        visible={chipsVisible}
        disabled={props.busy || props.off !== null}
        onSelect={props.onQuickRefine}
      />
      <BriefForm
        value={props.brief}
        onValue={props.onBrief}
        refining={refining}
        busy={props.busy}
        blocked={props.off !== null}
        onSubmit={props.onSubmit}
        onCancel={props.onCancel}
        textareaRef={props.textareaRef}
      />
      <DetectedLinks text={props.brief} onText={props.onBrief} fieldId="identity-assistant-brief" disabled={props.busy} />
    </Stack>
  );
}

/** The proposal to look at, or (on a phone, before there is one) the draft as it is. Wide screens show the draft elsewhere. */
export function PreviewPane(props: {
  view: View;
  proposal: Proposal | null;
  tokens: IdentityTokens;
  domainBrief: string;
  busy: boolean;
  onUse: (tokens: IdentityTokens) => void;
  onDiscard: () => void;
}) {
  const className = cn("min-w-0", props.view === "conversation" && "max-lg:hidden", !props.proposal && "lg:hidden");
  return (
    <Stack gap={4} className={className} data-assistant-pane="preview">
      {props.proposal ? (
        <ProposalCard
          proposal={props.proposal}
          current={props.tokens}
          domainBrief={props.domainBrief}
          busy={props.busy}
          onUse={props.onUse}
          onDiscard={props.onDiscard}
        />
      ) : (
        <Stack gap={3}>
          <Text variant="muted" typeRole="label">
            {copy.views.draftNow}
          </Text>
          <IdentityMiniPreview tokens={props.tokens} id="draft-now" />
        </Stack>
      )}
    </Stack>
  );
}
