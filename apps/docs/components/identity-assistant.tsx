"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Stack, Text, type IdentityTokens } from "@zedtech/zedkit-ui";

import { identityAssistantCopy as copy } from "@/components/i18n/identity-assistant-copy";
import { ConversationPane, PreviewPane } from "@/components/identity-assistant-panes";
import { ReferenceReportList } from "@/components/identity-references";
import { AssistantHeading, UnavailableBanner, ViewSwitch, noticeText } from "@/components/identity-assistant-parts";
import { useAssistantView } from "@/components/use-assistant-view";
import { useIdentityAssistant } from "@/components/use-identity-assistant";
import { checkInput, type Unavailable } from "@/lib/identity-assistant";
import { useIdentityAssistantStore } from "@/lib/identity-assistant-store";
import type { SessionState } from "@/lib/identity-creator-session";
import { linksInText } from "@/lib/identity-links-in-text";

/**
 * The identity assistant inside the editor: describe, generate, inspect, refine, then use. A proposal changes
 * nothing until it is used, and using it changes the draft (and its preview) only: saving and applying to the site
 * stay the editor's own explicit steps. If the assistant is off, everything else in the editor works as before.
 *
 * It starts folded, so the editor keeps its own order (look, preview, first adjustment, keep); arriving with a brief
 * or with `#create` opens it. On a phone the conversation and the preview take turns.
 */
export function IdentityAssistant({ tokens, onUse }: { tokens: IdentityTokens; onUse: (tokens: IdentityTokens) => void }) {
  const [opened, setOpened] = useState(false);
  const { session, status, dispatch, submit, cancel } = useIdentityAssistant(tokens, opened);
  const { brief, setBrief } = useIdentityAssistantStore();
  const ui = useAssistantView({ proposalId: session.proposal?.requestId, onBrief: setBrief });
  useEffect(() => {
    if (ui.open) setOpened(true);
  }, [ui.open]);
  const busy = session.pending !== null;
  const off = status !== null && !status.available ? status.reason : null;

  function send() {
    // The links are the ones written in the brief; there is no other place to put one.
    const references = linksInText(brief).urls;
    if (checkInput({ prompt: brief, references }) !== "ok") return;
    submit(brief, references);
  }

  return (
    <Stack gap={4} id="create" role="region" aria-labelledby="identity-assistant-title" data-slot="identity-assistant" className="scroll-mt-24">
      <details open={ui.open} onToggle={(event) => ui.setOpen(event.currentTarget.open)} className="group min-w-0">
        <summary
          id="identity-assistant-title"
          className="flex min-h-control-height cursor-pointer list-none items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground shadow-sm focus-ring-control hover:bg-muted [&::-webkit-details-marker]:hidden"
        >
          {copy.open}
          <ChevronDown aria-hidden="true" className="size-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
        </summary>
        <Stack gap={4} className="pt-3">
          <AssistantHeading />
          <ViewSwitch view={ui.view} onView={ui.setView} waiting={session.proposal !== null} previewRef={ui.previewButton} />
          <ReferenceReportList report={session.references} />
          <ConversationPane view={ui.view} session={session} off={off} brief={brief} busy={busy} onBrief={setBrief} onSubmit={send} onCancel={cancel} textareaRef={ui.textarea} />
          <AssistantFeedback
            text={busy ? copy.working : session.notice && session.notice.kind !== "unavailable" ? noticeText(session.notice) : session.proposal ? copy.views.proposalReady : null}
            off={off}
            notice={session.notice}
          />
          <PreviewPane
            view={ui.view}
            proposal={session.proposal}
            tokens={tokens}
            busy={busy}
            onUse={(next) =>
              ui.backToConversation(() => {
                onUse(next);
                dispatch({ type: "accept" });
                setBrief("");
              })
            }
            onDiscard={() => ui.backToConversation(() => dispatch({ type: "discard" }))}
          />
        </Stack>
      </details>
    </Stack>
  );
}

/**
 * What happened to the last brief, placed right after the form that sent it. On a phone the draft preview is
 * pinned above the editor, so a message above the form ends up behind it; here it lands under the Generate button
 * the visitor just pressed, and an outcome (failure, cancel, proposal) is scrolled into view if it is off screen.
 */
function AssistantFeedback({ text, off, notice }: { text: string | null; off: Unavailable | null; notice: SessionState["notice"] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!notice || !ref.current) return;
    const reduce = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    ref.current.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [notice]);
  return (
    <Stack gap={2} ref={ref} className="-mb-4 has-[:not(:empty)]:mb-0" data-assistant-feedback="">
      {off ? <UnavailableBanner reason={off} /> : null}
      {/* Always mounted, so a screen reader hears what is put in it; when it holds nothing it takes no room. */}
      <Text role="status" className="text-sm text-muted-foreground empty:-mt-2" data-assistant-status="">
        {text}
      </Text>
    </Stack>
  );
}
