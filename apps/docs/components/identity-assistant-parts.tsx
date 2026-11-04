"use client";

import { useEffect, useMemo, useState, type FormEvent, type Ref, type RefObject } from "react";
import { Button, Stack, Text, Textarea, type IdentityTokens } from "@zedtech/zedkit-ui";

import { identityAssistantCopy as copy } from "@/components/i18n/identity-assistant-copy";
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

function BriefFormActions({
  refining,
  busy,
  blocked,
  value,
  onSubmit,
  onCancel,
}: {
  refining: boolean;
  busy: boolean;
  blocked: boolean;
  value: string;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <Stack direction="horizontal" gap={2} className="flex-wrap">
      <Button
        type="button"
        onClick={onSubmit}
        disabled={busy || blocked || value.trim() === ""}
        aria-busy={busy || undefined}
      >
        {refining ? copy.refine : copy.generate}
      </Button>
      {busy ? (
        <Button type="button" variant="outline" onClick={onCancel}>
          {copy.cancel}
        </Button>
      ) : null}
    </Stack>
  );
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

/** Enter in the composer sends through the same path as the send button, without reloading the page. */
function submitForm(event: FormEvent, onSubmit: () => void): void {
  event.preventDefault();
  onSubmit();
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
}: {
  value: string;
  onValue: (value: string) => void;
  refining: boolean;
  busy: boolean;
  blocked: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  inputRef: Ref<HTMLTextAreaElement>;
}) {
  const left = LIMITS.prompt - value.length;
  const placeholder = useRotatingPlaceholder(!refining);
  return (
    <Stack gap={2}>
      <form onSubmit={(event) => submitForm(event, onSubmit)}>
        <Stack gap={2}>
          <Textarea
            id="identity-assistant-brief"
            ref={inputRef}
            rows={1}
            autoComplete="off"
            placeholder={refining ? copy.refinePlaceholder : placeholder}
            maxLength={LIMITS.prompt}
            value={value}
            readOnly={busy}
            className="field-sizing-content max-h-40 min-h-textarea-min-height min-w-0 resize-none"
            aria-label={refining ? copy.followUpLabel : copy.briefLabel}
            aria-describedby={left < 100 ? "identity-assistant-brief-count" : undefined}
            onChange={(event) => onValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter" || event.shiftKey) return;
              event.preventDefault();
              onSubmit();
            }}
          />
          <BriefFormActions refining={refining} busy={busy} blocked={blocked} value={value} onSubmit={onSubmit} onCancel={onCancel} />
        </Stack>
      </form>
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
}: {
  busy: boolean;
  tokens: IdentityTokens;
  onUse: (tokens: IdentityTokens) => void;
  onDiscard: () => void;
}) {
  return (
    <Stack direction="horizontal" gap={2} className="flex-wrap">
      <Button type="button" onClick={() => onUse(tokens)} disabled={busy}>
        {copy.proposal.apply}
      </Button>
      <Button type="button" variant="outline" onClick={onDiscard} disabled={busy}>
        {copy.proposal.discard}
      </Button>
    </Stack>
  );
}

/** A proposal to look at, in light and dark, with what changed and why. Using it is the only thing that changes the draft. */
export function ProposalCard({
  proposal,
  current,
  domainBrief,
  busy,
  onUse,
  onDiscard,
}: {
  proposal: Proposal;
  current: IdentityTokens;
  domainBrief: string;
  busy: boolean;
  onUse: (tokens: IdentityTokens) => void;
  onDiscard: () => void;
}) {
  // Readable text is a promise of the kit, so a proposal that misses it is nudged by arithmetic, and the page says so.
  const repaired = useMemo(() => repairContrast(proposal.tokens), [proposal.tokens]);
  const rows = useMemo(() => tokenDiff(current, repaired.tokens), [current, repaired.tokens]);
  const domain = useMemo(() => specimenDomainFromBrief(domainBrief), [domainBrief]);
  return (
    <Stack gap={3} role="region" aria-label={copy.proposal.title} aria-busy={busy || undefined} data-assistant-proposal="" className={busy ? "opacity-60" : undefined}>
      <Text as="span" typeRole="label" className="text-foreground font-semibold">
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
      {rows.length > 0 ? (
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
      ) : null}
      <ProposalApplyRow busy={busy} tokens={repaired.tokens} onUse={onUse} onDiscard={onDiscard} />
      <Text variant="muted" typeRole="body">
        {copy.proposal.note}
      </Text>
    </Stack>
  );
}

export { ReferenceReportList };
