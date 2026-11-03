"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { Stack, Text, type IdentityTokens } from "@zedtech/zedkit-ui";

import { identityAssistantCopy as copy } from "@/components/i18n/identity-assistant-copy";
import { ConversationPane, PreviewPane } from "@/components/identity-assistant-panes";
import { AssistantHeading, ViewSwitch, noticeText } from "@/components/identity-assistant-parts";
import { useAssistantView } from "@/components/use-assistant-view";
import { useIdentityAssistant } from "@/components/use-identity-assistant";
import { checkInput } from "@/lib/identity-assistant";
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
  const [brief, setBrief] = useState("");
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
          <Text role="status" className="min-h-5 text-sm text-muted-foreground" data-assistant-status="">
            {busy ? copy.working : session.notice && session.notice.kind !== "unavailable" ? noticeText(session.notice) : session.proposal ? copy.views.proposalReady : null}
          </Text>
          <ConversationPane view={ui.view} session={session} off={off} brief={brief} busy={busy} onBrief={setBrief} onSubmit={send} onCancel={cancel} textareaRef={ui.textarea} />
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
