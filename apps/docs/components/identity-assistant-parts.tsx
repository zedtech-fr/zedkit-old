"use client";

import { useEffect, useMemo, useState, type Ref, type RefObject } from "react";
import { Button, PromptInput, Stack, Text, cn, type IdentityTokens } from "@zedtech/zedkit-ui";

import { identityAssistantCopy as copy } from "@/components/i18n/identity-assistant-copy";
import { ProposalSiteApply, type ApplySiteTokenHandlers } from "@/components/identity-apply-site-row";
import { ProposalBeforeAfter } from "@/components/identity-proposal-compare";
import { ReferenceReportList } from "@/components/identity-references";
import type { Unavailable, Turn } from "@/lib/identity-assistant";
import { LIMITS } from "@/lib/identity-assistant";
import { repairContrast } from "@/lib/identity-contrast-repair";
import type { Notice, Proposal } from "@/lib/identity-creator-session";
import { specimenDomainFromBrief } from "@/lib/brief-specimen-domain";
import { tokenDiff } from "@/lib/identity-token-diff";

/** The wording of a refusal, a failure or a cancellation. Never claims an allowance it cannot know. */
export function noticeText(notice: Notice): string {
  switch (notice.kind) {
    case "cancelled":
      return copy.cancelled;
    case "unavailable":
      return copy.unavailable(notice.reason);
    case "quota":
      return copy.failure.quota(notice.retryAfterSec);
    case "rate":
      return copy.failure.rate(notice.retryAfterSec);
    case "busy":
      return copy.failure.busy;
    case "duplicate":
      return copy.failure.duplicate;
    case "too-large":
      return copy.failure.tooLarge;
    case "invalid-input":
      return notice.field === "prompt" ? copy.failure.emptyBrief : copy.failure.invalidInput;
    case "invalid-output":
      return copy.failure.invalidOutput;
    case "upstream":
      return copy.failure.upstream;
    case "timeout":
      return copy.failure.timeout;
    default:
      return copy.failure.network;
  }
}

const PLACEHOLDER_ROTATE_MS = 4000;

/** Cycles the example prompts while the composer is empty, unless the visitor asked for reduced motion. */
function useRotatingPlaceholder(active: boolean): string {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!active || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((n) => (n + 1) % copy.composerPlaceholders.length), PLACEHOLDER_ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [active]);
  const current = copy.composerPlaceholders[index];
  return current === undefined ? copy.placeholder : current;
}

/** Failures and refusals read as an assistant turn, not a status strip under the composer. */
export function AssistantNoticeBubble({ notice }: { notice: Notice }) {
  if (notice.kind === "unavailable") return null;
  return (
    <Stack
      gap={1}
      className="max-w-[95%] rounded-2xl rounded-tl-sm border border-border bg-muted px-3 py-2 text-sm"
      data-assistant-notice=""
      role="status"
    >
      <Text as="span" className="font-medium text-foreground">
        {copy.assistant}
      </Text>
      <Text as="span" className="text-muted-foreground">
        {noticeText(notice)}
      </Text>
    </Stack>
  );
}

/** The one place a brief is written and sent: a chat composer. Typing here costs nothing; only sending asks the assistant. */
export function BriefForm({
  value,
  onValue,
  refining,
  busy,
  blocked,
  onSubmit,
  onCancel,
  inputRef,
  resendPrompt,
}: {
  value: string;
  onValue: (value: string) => void;
  refining: boolean;
  busy: boolean;
  blocked: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  inputRef: Ref<HTMLTextAreaElement>;
  /** After a proposal is on screen the composer may be empty; send still reuses this prompt. */
  resendPrompt?: string;
}) {
  const left = LIMITS.prompt - value.length;
  const placeholder = useRotatingPlaceholder(!refining);
  return (
    <Stack gap={2}>
      <PromptInput
        id="identity-assistant-brief"
        ref={inputRef}
        rows={1}
        autoComplete="off"
        placeholder={refining ? copy.refinePlaceholder : placeholder}
        maxLength={LIMITS.prompt}
        value={value}
        busy={busy}
        sendDisabled={blocked}
        allowEmptySubmit={Boolean(resendPrompt?.trim())}
        sendLabel={refining ? copy.refine : copy.generate}
        {...(busy ? { onCancel, cancelLabel: copy.cancel } : {})}
        aria-label={refining ? copy.followUpLabel : copy.briefLabel}
        aria-describedby={left < 100 ? "identity-assistant-brief-count" : undefined}
        onChange={(event) => onValue(event.target.value)}
        onSubmit={() => {
          if (busy || blocked) return;
          if (value.trim() !== "" || Boolean(resendPrompt?.trim())) onSubmit();
        }}
      />
      {left < 100 ? (
        <Text variant="muted" id="identity-assistant-brief-count" typeRole="label">
          {copy.charsLeft(left)}
        </Text>
      ) : null}
    </Stack>
  );
}

export function AssistantHeading() {
  return (
    <Text variant="muted" typeRole="body">
      {copy.intro}
    </Text>
  );
}

export type View = "conversation" | "preview";

/**
 * Below a wide screen the conversation and the preview take turns, so neither is pushed off the page by the other.
 * Two toggle buttons, not a menu: both are always visible and one tap away, and the dot says a proposal is waiting.
 */
export function ViewSwitch({
  view,
  onView,
  waiting,
  previewRef,
  always = false,
}: {
  view: View;
  onView: (view: View) => void;
  waiting: boolean;
  previewRef: RefObject<HTMLButtonElement | null>;
  always?: boolean;
}) {
  return (
    <Stack
      direction="horizontal"
      gap={2}
      role="group"
      aria-label={copy.views.label}
      data-assistant-views=""
      className={always ? undefined : "lg:hidden"}
    >
      <Button type="button" variant="outline" aria-pressed={view === "conversation"} className="flex-1" onClick={() => onView("conversation")}>
        {copy.views.conversation}
      </Button>
      <Button ref={previewRef} type="button" variant="outline" aria-pressed={view === "preview"} className="flex-1" onClick={() => onView("preview")}>
        {copy.views.preview}
        {waiting && view !== "preview" ? (
          <>
            <Text as="span" aria-hidden="true" className="inline-block size-2 rounded-full bg-primary" />
            <Text as="span" className="sr-only">
              {copy.views.waitingSuffix}
            </Text>
          </>
        ) : null}
      </Button>
    </Stack>
  );
}

export function Thread({ turns }: { turns: readonly Turn[] }) {
  if (turns.length === 0) return null;
  return (
    <ol aria-label={copy.thread} className="m-0 flex list-none flex-col gap-2 p-0" data-assistant-thread="">
      {turns.map((turn, index) => (
        <li key={`${index}-${turn.role}`} className="text-zk-type-body">
          <Text as="span" className="font-medium text-foreground">
            {turn.role === "user" ? copy.you : copy.assistant}
          </Text>{" "}
          <Text as="span" className="text-muted-foreground">
            {turn.text}
          </Text>
        </li>
      ))}
    </ol>
  );
}

export function UnavailableBanner({ reason, live = true }: { reason: Unavailable; live?: boolean }) {
  return (
    <Text
      role={live ? "status" : undefined}
      className="rounded-md border border-border bg-muted px-3 py-2 text-zk-type-body"
      data-assistant-unavailable=""
    >
      {copy.unavailable(reason)}
    </Text>
  );
}

/** Says what the repair did, and never claims success while a pair still misses its target. */
function contrastNote(repaired: { adjusted: number; remaining: number }): string {
  if (repaired.remaining > 0) return copy.proposal.contrastUnresolved(repaired.remaining);
  return repaired.adjusted > 0 ? copy.proposal.contrastAdjusted(repaired.adjusted) : copy.proposal.contrastOk;
}

function ProposalApplyRow({
  busy,
  tokens,
  onUse,
  onDiscard,
  pinned,
}: {
  busy: boolean;
  tokens: IdentityTokens;
  onUse: (tokens: IdentityTokens) => void;
  onDiscard: () => void;
  /** Inside a capped, scrolling card the actions stay at its bottom edge, so the primary one is never below the fold. */
  pinned?: boolean;
}) {
  return (
    <Stack
      direction="horizontal"
      gap={2}
      className={cn("flex-wrap overflow-visible", pinned && "sticky bottom-0 z-10 bg-background/95 py-2 backdrop-blur")}
    >
      <Button type="button" onClick={() => onUse(tokens)} disabled={busy}>
        {copy.proposal.apply}
      </Button>
      <Button type="button" variant="outline" onClick={onDiscard} disabled={busy}>
        {copy.proposal.discard}
      </Button>
    </Stack>
  );
}


function ProposalChangeList({ rows }: { rows: readonly { path: string; from: string; to: string }[] }) {
  if (rows.length === 0) return null;
  return (
    <details className="text-zk-type-body">
      <summary className="flex min-h-11 cursor-pointer items-center focus-ring">{copy.proposal.showChanges}</summary>
      <ul className="m-0 flex list-none flex-col gap-1 p-0 font-mono text-zk-type-small">
        {rows.map((row) => (
          <li key={row.path} className="break-words">
            {row.path}: {row.from} → {row.to}
          </li>
        ))}
      </ul>
    </details>
  );
}

type ProposalCardProps = {
  proposal: Proposal;
  current: IdentityTokens;
  domainBrief: string;
  busy: boolean;
  onUse: (tokens: IdentityTokens) => void;
  onDiscard: () => void;
  className?: string;
  /** Pin the apply row to the bottom of the card; set when the card scrolls inside a height cap. */
  pinApply?: boolean;
  /** When set, show Apply to the whole site under Use this look (dock Preview tab). */
  siteApply?: ApplySiteTokenHandlers;
};

/** A proposal to look at, in light and dark, with what changed and why. Using it is the only thing that changes the draft. */
export function ProposalCard({
  proposal,
  current,
  domainBrief,
  busy,
  onUse,
  onDiscard,
  className,
  pinApply,
  siteApply,
}: ProposalCardProps) {
  // Readable text is a promise of the kit, so a proposal that misses it is nudged by arithmetic, and the page says so.
  const repaired = useMemo(() => repairContrast(proposal.tokens), [proposal.tokens]);
  const rows = useMemo(() => tokenDiff(current, repaired.tokens), [current, repaired.tokens]);
  const domain = useMemo(() => specimenDomainFromBrief(domainBrief), [domainBrief]);
  return (
    <Stack gap={3} role="region" aria-label={copy.proposal.title} aria-busy={busy || undefined} data-assistant-proposal="" className={cn("overflow-visible", busy && "opacity-60", className)}>
      <Text as="span" typeRole="label" className="font-semibold text-foreground">
        {copy.proposal.title}
      </Text>
      {proposal.summary ? (
        <Text typeRole="body" className="m-0">
          <Text as="span" className="font-medium">
            {copy.proposal.summaryLabel}:
          </Text>{" "}
          {proposal.summary}
        </Text>
      ) : null}
      <Text variant="muted" typeRole="body">
        {copy.proposal.changes(rows.length)}. {contrastNote(repaired)}
      </Text>
      <ProposalBeforeAfter current={current} proposed={repaired.tokens} requestId={proposal.requestId} domain={domain} />
      <ProposalChangeList rows={rows} />
      <ProposalApplyRow busy={busy} tokens={repaired.tokens} onUse={onUse} onDiscard={onDiscard} pinned={pinApply === true} />
      {siteApply ? <ProposalSiteApply siteApply={siteApply} tokens={repaired.tokens} /> : null}
      <Text variant="muted" typeRole="body">
        {copy.proposal.note}
      </Text>
    </Stack>
  );
}

export { ReferenceReportList };

