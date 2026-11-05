"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Stack, cn, signatureMotionClass, type IdentityTokens } from "@zedtech/zedkit-ui";

import { identityAssistantCopy as copy } from "@/components/i18n/identity-assistant-copy";
import { ConversationPane, PreviewPane } from "@/components/identity-assistant-panes";
import { ReferenceReportList } from "@/components/identity-references";
import { AssistantHeading, ViewSwitch } from "@/components/identity-assistant-parts";
import { useAssistantView } from "@/components/use-assistant-view";
import { useAssistantSubmitHandlers } from "@/components/use-assistant-submit";
import { useIdentityAssistant } from "@/components/use-identity-assistant";
import { writeCreatorSessionBrief } from "@/lib/creator-session-brief";
import { useIdentityAssistantStore } from "@/lib/identity-assistant-store";
import { specimenBriefFromThread } from "@/lib/brief-specimen-domain";

/**
 * The identity assistant inside the editor: describe, generate, inspect, refine, then use. A proposal changes
 * nothing until it is used, and using it changes the draft (and its preview) only: saving and applying to the site
 * stay the editor's own explicit steps. If the assistant is off, everything else in the editor works as before.
 *
 * It starts folded on pages that still embed it inline; arriving with a brief or `#create` opens it.
 * On a phone the conversation and the preview take turns.
 */
function usePersistCreatorBrief(brief: string) {
  const ready = useRef(false);
  useEffect(() => {
    if (!ready.current) {
      ready.current = true;
      return;
    }
    writeCreatorSessionBrief(window.sessionStorage, brief);
  }, [brief]);
}

function useInlineIdentityAssistant(tokens: IdentityTokens) {
  const [opened, setOpened] = useState(false);
  const { session, status, dispatch, submit, cancel } = useIdentityAssistant(tokens, opened);
  const { brief, setBrief } = useIdentityAssistantStore();
  const ui = useAssistantView({
    proposalId: session.proposal?.requestId,
    notice: session.notice,
    onBrief: setBrief,
  });
  usePersistCreatorBrief(brief);
  useEffect(() => {
    if (ui.open) setOpened(true);
  }, [ui.open]);
  const busy = session.pending !== null;
  const off = status !== null && !status.available ? status.reason : null;
  const { send, quickRefine } = useAssistantSubmitHandlers(
    brief,
    submit,
    busy,
    off !== null,
    () => setBrief(""),
    session.proposal?.prompt,
  );
  const domainBrief = specimenBriefFromThread(session.thread, session.proposal?.prompt ?? brief);
  return { ui, session, dispatch, brief, setBrief, busy, off, send, quickRefine, cancel, domainBrief };
}

function IdentityAssistantOpenBody(props: {
  ui: ReturnType<typeof useAssistantView>;
  session: ReturnType<typeof useIdentityAssistant>["session"];
  dispatch: ReturnType<typeof useIdentityAssistant>["dispatch"];
  tokens: IdentityTokens;
  off: ReturnType<typeof useInlineIdentityAssistant>["off"];
  brief: string;
  setBrief: (value: string) => void;
  busy: boolean;
  send: () => void;
  quickRefine: (prompt: string) => void;
  cancel: () => void;
  domainBrief: string;
  onUse: (tokens: IdentityTokens) => void;
}) {
  const { ui, session, dispatch, tokens, off, brief, setBrief, busy, send, quickRefine, cancel, domainBrief, onUse } = props;
  return (
    <Stack gap={4} className="pt-3">
      <AssistantHeading />
      <ViewSwitch view={ui.view} onView={ui.setView} waiting={session.proposal !== null} previewRef={ui.previewButton} />
      <ReferenceReportList report={session.references} />
      <ConversationPane view={ui.view} session={session} off={off} brief={brief} busy={busy} onBrief={setBrief} onSubmit={send} onQuickRefine={quickRefine} onCancel={cancel} inputRef={ui.field} />
      <PreviewPane
        view={ui.view}
        proposal={session.proposal}
        tokens={tokens}
        domainBrief={domainBrief}
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
  );
}

export function IdentityAssistant({ tokens, onUse }: { tokens: IdentityTokens; onUse: (tokens: IdentityTokens) => void }) {
  const state = useInlineIdentityAssistant(tokens);

  return (
    <Stack gap={4} id="create" role="region" aria-labelledby="identity-assistant-title" data-slot="identity-assistant" className="scroll-mt-24">
      <details open={state.ui.open} onToggle={(event) => state.ui.setOpen(event.currentTarget.open)} className="group min-w-0">
        <summary
          id="identity-assistant-title"
          className="flex min-h-control-height cursor-pointer list-none items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-zk-type-body font-medium text-foreground shadow-sm focus-ring-control hover:bg-muted [&::-webkit-details-marker]:hidden"
        >
          {copy.open}
          <ChevronDown
            aria-hidden="true"
            className={cn("size-4 shrink-0 group-open:rotate-180", signatureMotionClass.feedback)}
          />
        </summary>
        <IdentityAssistantOpenBody {...state} tokens={tokens} onUse={onUse} />
      </details>
    </Stack>
  );
}
