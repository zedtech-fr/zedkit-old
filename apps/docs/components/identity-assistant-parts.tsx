"use client";

import { useMemo, type Ref, type RefObject } from "react";
import { Button, Field, FieldLabel, Stack, Text, Textarea, type IdentityTokens } from "@zedtech/zedkit-ui";

import { identityAssistantCopy as copy } from "@/components/i18n/identity-assistant-copy";
import { IdentityMiniPreview } from "@/components/identity-mini-preview";
import { ReferenceReportList } from "@/components/identity-references";
import type { Unavailable, Turn } from "@/lib/identity-assistant";
import { LIMITS } from "@/lib/identity-assistant";
import { repairContrast } from "@/lib/identity-contrast-repair";
import type { Notice, Proposal } from "@/lib/identity-creator-session";
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

/** The one place a brief is written and sent. Typing here costs nothing; only pressing the button asks the assistant. */
export function BriefForm({
  value,
  onValue,
  refining,
  busy,
  blocked,
  onSubmit,
  onCancel,
  textareaRef,
}: {
  value: string;
  onValue: (value: string) => void;
  refining: boolean;
  busy: boolean;
  blocked: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  textareaRef: Ref<HTMLTextAreaElement>;
}) {
  const left = LIMITS.prompt - value.length;
  return (
    <Stack gap={2}>
      <Field>
        <FieldLabel htmlFor="identity-assistant-brief">{refining ? copy.followUpLabel : copy.briefLabel}</FieldLabel>
        <Textarea
          id="identity-assistant-brief"
          ref={textareaRef}
          rows={4}
          placeholder={refining ? copy.refinePlaceholder : copy.placeholder}
          maxLength={LIMITS.prompt}
          value={value}
          readOnly={busy}
          className="scroll-mt-28 max-lg:[@media(min-height:48rem)]:scroll-mt-80"
          aria-describedby="identity-assistant-brief-hint"
          onChange={(event) => onValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              onSubmit();
            }
          }}
        />
      </Field>
      <Text variant="muted" id="identity-assistant-brief-hint" className="text-sm">
        {refining ? copy.followUpHint : copy.briefHint} {left < 100 ? copy.charsLeft(left) : null}
      </Text>
      <Stack direction="horizontal" gap={2} className="flex-wrap">
        <Button type="button" onClick={onSubmit} disabled={busy || blocked || value.trim() === ""} aria-busy={busy || undefined}>
          {refining ? copy.refine : copy.generate}
        </Button>
        {busy ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            {copy.cancel}
          </Button>
        ) : null}
      </Stack>
    </Stack>
  );
}

export function AssistantHeading() {
  return (
    <Text variant="muted" className="text-sm">
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
}: {
  view: View;
  onView: (view: View) => void;
  waiting: boolean;
  previewRef: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <Stack direction="horizontal" gap={2} role="group" aria-label={copy.views.label} data-assistant-views="" className="lg:hidden">
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
        <li key={`${index}-${turn.role}`} className="text-sm">
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

export function UnavailableBanner({ reason }: { reason: Unavailable }) {
  return (
    <Text role="status" className="rounded-md border border-border bg-muted px-3 py-2 text-sm" data-assistant-unavailable="">
      {copy.unavailable(reason)}
    </Text>
  );
}

/** A proposal to look at, in light and dark, with what changed and why. Using it is the only thing that changes the draft. */
export function ProposalCard({
  proposal,
  current,
  busy,
  onUse,
  onDiscard,
}: {
  proposal: Proposal;
  current: IdentityTokens;
  busy: boolean;
  onUse: (tokens: IdentityTokens) => void;
  onDiscard: () => void;
}) {
  // Readable text is a promise of the kit, so a proposal that misses it is nudged by arithmetic, and the page says so.
  const repaired = useMemo(() => repairContrast(proposal.tokens), [proposal.tokens]);
  const rows = useMemo(() => tokenDiff(current, repaired.tokens), [current, repaired.tokens]);
  return (
    <Stack gap={3} role="region" aria-label={copy.proposal.title} aria-busy={busy || undefined} data-assistant-proposal="" className={busy ? "opacity-60" : undefined}>
      <Text as="span" className="text-base font-semibold text-foreground">
        {copy.proposal.title}
      </Text>
      {proposal.summary ? (
        <Text className="m-0 text-sm">
          <Text as="span" className="font-medium">
            {copy.proposal.summaryLabel}:
          </Text>{" "}
          {proposal.summary}
        </Text>
      ) : null}
      <Text variant="muted" className="text-sm">
        {copy.proposal.changes(rows.length)}. {repaired.adjusted > 0 ? copy.proposal.contrastAdjusted(repaired.adjusted) : copy.proposal.contrastOk}
      </Text>
      <IdentityMiniPreview tokens={repaired.tokens} id={`proposal-${proposal.requestId}`} />
      {rows.length > 0 ? (
        <details className="text-sm">
          <summary className="flex min-h-11 cursor-pointer items-center focus-ring">{copy.proposal.showChanges}</summary>
          <ul className="m-0 flex list-none flex-col gap-1 p-0 font-mono text-xs">
            {rows.map((row) => (
              <li key={row.path} className="break-words">
                {row.path}: {row.from} → {row.to}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      <Stack direction="horizontal" gap={2} className="flex-wrap">
        <Button type="button" onClick={() => onUse(repaired.tokens)} disabled={busy}>
          {copy.proposal.apply}
        </Button>
        <Button type="button" variant="outline" onClick={onDiscard} disabled={busy}>
          {copy.proposal.discard}
        </Button>
      </Stack>
      <Text variant="muted" className="text-sm">
        {copy.proposal.note}
      </Text>
    </Stack>
  );
}

export { ReferenceReportList };
