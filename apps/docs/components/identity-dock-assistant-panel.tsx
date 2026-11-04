"use client";

import { useEffect, useRef, type RefObject } from "react";
import { Stack } from "@zedtech/zedkit-ui";

import { identityAssistantCopy as copy } from "@/components/i18n/identity-assistant-copy";
import { ViewSwitch, noticeText, type View } from "@/components/identity-assistant-parts";
import { ConversationComposer } from "@/components/identity-assistant-panes";
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
import type { Unavailable } from "@/lib/identity-assistant";
import type { SessionState } from "@/lib/identity-creator-session";
import type { IdentityTokens } from "@zedtech/zedkit-ui";

function assistantFeedbackText(session: SessionState, busy: boolean): string | null {
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

function IdentityDockPanelScroll(props: {
  view: View;
  setView: (view: View) => void;
  previewRef: RefObject<HTMLButtonElement | null>;
  session: SessionState;
  off: Unavailable | null;
  brief: string;
  busy: boolean;
  previewTokens: IdentityTokens;
  domainBrief: string;
  inputRef: RefObject<HTMLInputElement | null>;
  setBrief: (value: string) => void;
  send: () => void;
  quickRefine: (prompt: string) => void;
  cancel: () => void;
  backToConversation: (action: () => void) => void;
  dispatch: (action: { type: "accept" } | { type: "discard" }) => void;
  onPreviewTokens: (tokens: IdentityTokens) => void;
}) {
  return (
    <Stack gap={3} className="min-h-0 flex-1 overflow-y-auto px-3 pt-3">
      <ViewSwitch
        view={props.view}
        onView={props.setView}
        waiting={props.session.proposal !== null}
        previewRef={props.previewRef}
        always
      />
      <IdentityDockAssistantGrid
        view={props.view}
        session={props.session}
        off={props.off}
        brief={props.brief}
        busy={props.busy}
        previewTokens={props.previewTokens}
        domainBrief={props.domainBrief}
        inputRef={props.inputRef}
        onBrief={props.setBrief}
        onSubmit={props.send}
        onQuickRefine={props.quickRefine}
        onCancel={props.cancel}
        onUse={(next) => acceptProposal(props.backToConversation, props.onPreviewTokens, props.dispatch, props.setBrief, next)}
        onDiscard={() => props.backToConversation(() => props.dispatch({ type: "discard" }))}
        hideComposer
      />
    </Stack>
  );
}

export function IdentityDockAssistantPanel({
  previewTokens,
  onPreviewTokens,
}: {
  previewTokens: IdentityTokens;
  onPreviewTokens: (tokens: IdentityTokens) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { brief, setBrief, setExpanded } = useIdentityAssistantStore();
  const { session, status, dispatch, submit, cancel } = useIdentityAssistant(previewTokens, true);
  const ui = useAssistantView({ proposalId: session.proposal?.requestId, onBrief: setBrief });
  const busy = session.pending !== null;
  const off = status !== null && !status.available ? status.reason : null;
  const { send, quickRefine } = useAssistantSubmitHandlers(brief, submit, busy, off !== null);
  const domainBrief = specimenBriefFromThread(session.thread, brief);

  useEffect(() => {
    const field = panelRef.current?.querySelector<HTMLInputElement>("#identity-assistant-brief:not([disabled])");
    if (field && field.offsetParent !== null) field.focus({ preventScroll: true });
  }, []);

  return (
    <Stack ref={panelRef} className="min-h-0 flex-1 gap-0 overflow-hidden" data-slot="identity-dock-body">
      <IdentityDockPanelToolbar onClose={() => setExpanded(false)} />
      <IdentityDockPanelScroll
        view={ui.view}
        setView={ui.setView}
        previewRef={ui.previewButton}
        session={session}
        off={off}
        brief={brief}
        busy={busy}
        previewTokens={previewTokens}
        domainBrief={domainBrief}
        inputRef={ui.field}
        setBrief={setBrief}
        send={send}
        quickRefine={quickRefine}
        cancel={cancel}
        backToConversation={ui.backToConversation}
        dispatch={dispatch}
        onPreviewTokens={onPreviewTokens}
      />
      <Stack gap={2} className="shrink-0 border-t border-border bg-background px-3 py-3">
        <ConversationComposer
          session={session}
          brief={brief}
          busy={busy}
          off={off}
          onBrief={setBrief}
          onSubmit={send}
          onCancel={cancel}
          inputRef={ui.field}
        />
        <DockFeedback text={assistantFeedbackText(session, busy)} off={off} busy={busy} />
      </Stack>
    </Stack>
  );
}
