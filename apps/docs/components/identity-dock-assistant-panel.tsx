"use client";

import { useEffect, useRef } from "react";
import { Stack } from "@zedtech/zedkit-ui";

import { identityAssistantCopy as copy } from "@/components/i18n/identity-assistant-copy";
import { AssistantHeading, ViewSwitch, noticeText } from "@/components/identity-assistant-parts";
import { IdentityDockAssistantGrid } from "@/components/identity-dock-assistant-grid";
import { DockFeedback } from "@/components/identity-dock-feedback";
import { IdentityDockPanelToolbar } from "@/components/identity-dock-panel-toolbar";
import { useAssistantSubmitHandlers } from "@/components/use-assistant-submit";
import { useAssistantView } from "@/components/use-assistant-view";
import { useIdentityAssistant } from "@/components/use-identity-assistant";
import { useIdentityAssistantStore } from "@/lib/identity-assistant-store";
import { applyWidgetSpecimenPreview } from "@/lib/identity-widget-specimen-preview";
import { dispatchIdentityEditorDraftApply } from "@/lib/identity-editor-draft-apply";
import { specimenBriefFromThread } from "@/lib/brief-specimen-domain";
import { IDENTITY_EDITOR_HREF } from "@/lib/site-links.mjs";
import type { IdentityTokens } from "@zedtech/zedkit-ui";

function assistantFeedbackText(session: ReturnType<typeof useIdentityAssistant>["session"], busy: boolean): string | null {
  if (busy) return copy.working;
  if (session.notice && session.notice.kind !== "unavailable") return noticeText(session.notice);
  if (session.proposal) return copy.views.proposalReady;
  return null;
}

function acceptProposal(
  backToConversation: (action: () => void) => void,
  onPreviewTokens: (tokens: IdentityTokens) => void,
  dispatch: (action: { type: "accept" }) => void,
  setBrief: (value: string) => void,
  next: IdentityTokens,
) {
  backToConversation(() => {
    onPreviewTokens(next);
    applyWidgetSpecimenPreview(next);
    if (typeof window !== "undefined" && window.location.pathname === IDENTITY_EDITOR_HREF) {
      dispatchIdentityEditorDraftApply(next);
    }
    dispatch({ type: "accept" });
    setBrief("");
  });
}

export function IdentityDockAssistantPanel({
  previewTokens,
  onPreviewTokens,
}: {
  previewTokens: IdentityTokens;
  onPreviewTokens: (tokens: IdentityTokens) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { brief, setBrief, setExpanded, startNewConversation } = useIdentityAssistantStore();
  const { session, status, dispatch, submit, cancel } = useIdentityAssistant(previewTokens, true);
  const ui = useAssistantView({ proposalId: session.proposal?.requestId, onBrief: setBrief });
  const busy = session.pending !== null;
  const off = status !== null && !status.available ? status.reason : null;
  const { send, quickRefine } = useAssistantSubmitHandlers(brief, submit, busy, off !== null);
  const domainBrief = specimenBriefFromThread(session.thread, brief);

  useEffect(() => {
    const field = panelRef.current?.querySelector<HTMLTextAreaElement>("textarea:not([disabled])");
    if (field && field.offsetParent !== null) field.focus({ preventScroll: true });
  }, []);

  return (
    <Stack ref={panelRef} className="min-h-0 flex-1 gap-0 overflow-hidden" data-slot="identity-dock-body">
      <IdentityDockPanelToolbar onNewConversation={startNewConversation} onClose={() => setExpanded(false)} />
      <Stack gap={4} className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <AssistantHeading />
        <ViewSwitch view={ui.view} onView={ui.setView} waiting={session.proposal !== null} previewRef={ui.previewButton} />
        <IdentityDockAssistantGrid
          view={ui.view}
          session={session}
          off={off}
          brief={brief}
          busy={busy}
          previewTokens={previewTokens}
          domainBrief={domainBrief}
          textareaRef={ui.textarea}
          onBrief={setBrief}
          onSubmit={send}
          onQuickRefine={quickRefine}
          onCancel={cancel}
          onUse={(next) => acceptProposal(ui.backToConversation, onPreviewTokens, dispatch, setBrief, next)}
          onDiscard={() => ui.backToConversation(() => dispatch({ type: "discard" }))}
        />
        <DockFeedback text={assistantFeedbackText(session, busy)} off={off} busy={busy} />
      </Stack>
    </Stack>
  );
}
