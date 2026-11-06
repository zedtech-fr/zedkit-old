"use client";

import type { RefObject } from "react";
import { Stack, Text, cn, type IdentityTokens } from "@zedtech/zedkit-ui";

import { identityAssistantCopy as copy } from "@/components/i18n/identity-assistant-copy";
import { ConversationSiteApply, type ApplySiteHandlers, type ApplySiteTokenHandlers } from "@/components/identity-apply-site-row";
import { AssistantNoticeBubble, BriefForm, ProposalCard, Thread, UnavailableBanner, type View } from "@/components/identity-assistant-parts";
import { ChatLog, PendingAssistant } from "@/components/identity-chat-log";
import { IdentityMiniPreview } from "@/components/identity-mini-preview";
import { IdentityRefinementChips } from "@/components/identity-refinement-chips";
import { DetectedLinks } from "@/components/identity-detected-links";
import type { Unavailable } from "@/lib/identity-assistant";
import type { Proposal, SessionState } from "@/lib/identity-creator-session";
import { specimenDomainFromBrief, type SpecimenDomain } from "@/lib/brief-specimen-domain";

export type { View } from "@/components/identity-assistant-parts";

/** The assistant's first word, where the exchange will continue. Shown until the first exchange replaces it. */
function AssistantGreeting() {
  return (
    <ol className="m-0 flex list-none flex-col gap-2 p-0" data-assistant-greeting="">
      <li className="text-zk-type-body">
        <Text as="span" className="font-medium text-foreground">
          {copy.assistant}
        </Text>{" "}
        <Text as="span" className="text-muted-foreground">
          {copy.intro}
        </Text>
      </li>
    </ol>
  );
}

/** Messages, chips, and link detection — the scrollable part of the chat. */
type ConversationMessagesProps = {
  view: View;
  session: SessionState;
  brief: string;
  busy: boolean;
  compact?: boolean;
  /** When false (home dock), compact panes toggle at every width; when true (editor dock), split from `lg`. */
  narrowSplit?: boolean;
  onBrief: (brief: string) => void;
  onQuickRefine: (prompt: string) => void;
  off: Unavailable | null;
  /** When true, refusal copy lives in the dock footer only (one on-screen hook, below the pinned preview). */
  noticeInComposerFooter?: boolean;
  /** Apply to the whole site once a suggestion exists (Conversation tab; hidden on lg when Preview also shows it). */
  siteApply?: ApplySiteHandlers;
};

function ConversationHistory(props: {
  session: SessionState;
  messages: NonNullable<SessionState["messages"]>;
  surfaceNotice: boolean;
  noticeInComposerFooter?: boolean;
}) {
  const notice = props.session.notice;
  if (props.session.thread.length > 0) {
    return (
      <>
        <Thread turns={props.session.thread} />
        {props.session.pending ? <PendingAssistant pending={props.session.pending} /> : null}
        {props.surfaceNotice && notice && notice.kind !== "unavailable" ? <AssistantNoticeBubble notice={notice} /> : null}
      </>
    );
  }
  if (props.messages.length > 0) {
    return (
      <ChatLog
        messages={props.messages}
        pending={props.session.pending}
        noticeInComposerFooter={props.noticeInComposerFooter === true}
      />
    );
  }
  return (
    <>
      <AssistantGreeting />
      {props.surfaceNotice && notice && notice.kind !== "unavailable" ? <AssistantNoticeBubble notice={notice} /> : null}
    </>
  );
}

export function ConversationMessages(props: ConversationMessagesProps) {
  const refining = props.session.thread.length > 0;
  const chipsVisible = refining && props.session.proposal === null && props.session.pending === null;
  const hidden = props.compact ? props.view !== "conversation" : props.view === "preview";
  const messages = props.session.messages ?? [];
  const surfaceNotice = props.noticeInComposerFooter !== true;
  return (
    <Stack
      gap={4}
      className={cn(
        "min-w-0",
        hidden && (props.compact && !props.narrowSplit ? "hidden" : "max-lg:hidden"),
      )}
      data-assistant-pane="conversation"
    >
      {props.off ? <UnavailableBanner reason={props.off} live={false} /> : null}
      <ConversationHistory
        session={props.session}
        messages={messages}
        surfaceNotice={surfaceNotice}
        {...(props.noticeInComposerFooter !== undefined ? { noticeInComposerFooter: props.noticeInComposerFooter } : {})}
      />
      <IdentityRefinementChips
        visible={chipsVisible}
        disabled={props.busy || props.off !== null}
        onSelect={props.onQuickRefine}
      />
      {props.siteApply && props.session.proposal ? (
        <ConversationSiteApply
          siteApply={props.siteApply}
          className={cn(props.narrowSplit || !props.compact ? "lg:hidden" : undefined)}
        />
      ) : null}
      <DetectedLinks text={props.brief} onText={props.onBrief} fieldId="identity-assistant-brief" disabled={props.busy} />
    </Stack>
  );
}

/** The chat composer only; the detailed editor link lives in the dock header. */
export function ConversationComposer(props: {
  session: SessionState;
  brief: string;
  busy: boolean;
  off: Unavailable | null;
  onBrief: (brief: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
}) {
  const refining = props.session.thread.length > 0;
  const resend =
    props.session.proposal?.prompt !== undefined && props.session.proposal.prompt !== ""
      ? { resendPrompt: props.session.proposal.prompt }
      : {};
  return (
    <Stack gap={2} className="min-w-0 shrink-0" data-assistant-composer="">
      <BriefForm
        value={props.brief}
        onValue={props.onBrief}
        refining={refining}
        busy={props.busy}
        blocked={props.off !== null}
        onSubmit={props.onSubmit}
        onCancel={props.onCancel}
        inputRef={props.inputRef}
        {...resend}
      />
    </Stack>
  );
}

/** The chat: the exchange so far, quick refinements, the links found, the composer, and a way to the full editor. */
export function ConversationPane(props: {
  view: View;
  session: SessionState;
  off: Unavailable | null;
  brief: string;
  busy: boolean;
  compact?: boolean;
  onBrief: (brief: string) => void;
  onSubmit: () => void;
  onQuickRefine: (prompt: string) => void;
  onCancel: () => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
}) {
  return (
    <Stack gap={4} className="min-w-0">
      <ConversationMessages
        view={props.view}
        session={props.session}
        brief={props.brief}
        busy={props.busy}
        {...(props.compact ? { compact: true } : {})}
        onBrief={props.onBrief}
        onQuickRefine={props.onQuickRefine}
        off={props.off}
      />
      <ConversationComposer
        session={props.session}
        brief={props.brief}
        busy={props.busy}
        off={props.off}
        onBrief={props.onBrief}
        onSubmit={props.onSubmit}
        onCancel={props.onCancel}
        inputRef={props.inputRef}
      />
    </Stack>
  );
}

/** The proposal to look at, or (on a phone, before there is one) the draft as it is. Wide screens show the draft elsewhere. */
export function PreviewPane(props: {
  view: View;
  proposal: Proposal | null;
  tokens: IdentityTokens;
  domainBrief: string;
  previewDomain?: SpecimenDomain;
  busy: boolean;
  compact?: boolean;
  narrowSplit?: boolean;
  onUse: (tokens: IdentityTokens) => void;
  onDiscard: () => void;
  siteApply?: ApplySiteTokenHandlers;
}) {
  const compact = props.compact ?? false;
  const hidden = compact ? props.view !== "preview" : props.view === "conversation";
  const className = cn(
    "min-w-0",
    hidden && (compact && !props.narrowSplit ? "hidden" : "max-lg:hidden"),
    !compact && !props.proposal && "lg:hidden",
  );
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
          {...(props.siteApply ? { siteApply: props.siteApply } : {})}
          {...(compact
            ? { className: "max-h-[min(52dvh,28rem)] overflow-y-auto overscroll-y-contain px-1", pinApply: true }
            : {})}
        />
      ) : (
        <Stack gap={3}>
          <Text variant="muted" typeRole="label">
            {copy.views.draftNow}
          </Text>
          <IdentityMiniPreview tokens={props.tokens} id="draft-now" domain={props.previewDomain ?? specimenDomainFromBrief(props.domainBrief)} />
        </Stack>
      )}
    </Stack>
  );
}
