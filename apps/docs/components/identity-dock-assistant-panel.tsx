"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { Stack } from "@zedtech/zedkit-ui";

import { ViewSwitch, type View } from "@/components/identity-assistant-parts";
import { IdentityDockAssistantGrid } from "@/components/identity-dock-assistant-grid";
import { IdentityDockComposerFooter } from "@/components/identity-dock-composer-footer";
import { IdentityDockExportBlock } from "@/components/identity-dock-export-block";
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
  scrollRef: RefObject<HTMLDivElement | null>;
  viewSwitchAlways: boolean;
  view: View;
  setView: (view: View) => void;
  previewRef: RefObject<HTMLButtonElement | null>;
  session: SessionState;
  off: Unavailable | null;
  brief: string;
  busy: boolean;
  previewTokens: IdentityTokens;
  domainBrief: string;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  setBrief: (value: string) => void;
  send: () => void;
  quickRefine: (prompt: string) => void;
  cancel: () => void;
  backToConversation: (action: () => void) => void;
  dispatch: (action: { type: "accept" } | { type: "discard" }) => void;
  onPreviewTokens: (tokens: IdentityTokens) => void;
}) {
  return (
    <Stack ref={props.scrollRef} gap={3} className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 pt-3 pb-2">
      <ViewSwitch
        view={props.view}
        onView={props.setView}
        waiting={props.session.proposal !== null}
        previewRef={props.previewRef}
        always={props.viewSwitchAlways}
      />
      <IdentityDockAssistantGrid
        view={props.view}
        session={props.session}
        off={props.off}
        brief={props.brief}
        busy={props.busy}
        previewTokens={props.previewTokens}
        domainBrief={props.domainBrief}
        narrowSplit={!props.viewSwitchAlways}
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

/** The composer empties on send like any chat; a failed or cancelled request puts the words back, so a retry costs no retyping. */
function useKeepSentBrief(brief: string, session: SessionState, setBrief: (value: string) => void, sendBrief: () => void) {
  const sent = useRef<{ text: string; notice: SessionState["notice"] } | null>(null);
  const send = useCallback(() => {
    sent.current = { text: brief, notice: session.notice };
    sendBrief();
  }, [brief, session.notice, sendBrief]);
  useEffect(() => {
    const last = sent.current;
    if (!last || session.proposal !== null) return void (sent.current = null);
    if (session.notice === null || session.notice === last.notice) return;
    sent.current = null;
    if (brief === "") setBrief(last.text);
  }, [session.notice, session.proposal, brief, setBrief]);
  return send;
}

/** A proposal that arrives (or comes back into its pane) is brought into view inside the dock scroller. */
function useProposalInView(scrollRef: RefObject<HTMLDivElement | null>, requestId: string | undefined, view: View) {
  useLayoutEffect(() => {
    if (!requestId) return;
    scrollRef.current?.querySelector("[data-assistant-proposal]")?.scrollIntoView({ block: "nearest", behavior: "instant" });
  }, [scrollRef, requestId, view]);
}

function useIdentityDockBriefAutofocus(panelRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const field = panelRef.current?.querySelector<HTMLTextAreaElement>("#identity-assistant-brief:not([disabled])");
    if (field && field.offsetParent !== null) field.focus({ preventScroll: true });
  }, [panelRef]);
}

export function IdentityDockAssistantPanel({
  previewTokens,
  onPreviewTokens,
  viewSwitchAlways = true,
}: {
  previewTokens: IdentityTokens;
  onPreviewTokens: (tokens: IdentityTokens) => void;
  /** Home dock keeps the phone switch at every width; the editor page shows both panes from `lg`. */
  viewSwitchAlways?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { brief, setBrief, setExpanded, previewTokens: acceptedTokens } = useIdentityAssistantStore();
  const { session, status, dispatch, submit, cancel } = useIdentityAssistant(previewTokens, true);
  const ui = useAssistantView({ proposalId: session.proposal?.requestId, onBrief: setBrief, scrollAssistantOnProposal: false });
  const busy = session.pending !== null;
  const off = status !== null && !status.available ? status.reason : null;
  const { send: sendBrief, quickRefine } = useAssistantSubmitHandlers(brief, submit, busy, off !== null, () => setBrief(""));
  const send = useKeepSentBrief(brief, session, setBrief, sendBrief);

  useIdentityDockBriefAutofocus(panelRef);
  useProposalInView(scrollRef, session.proposal?.requestId, ui.view);

  return (
    <Stack ref={panelRef} className="min-h-0 flex-1 gap-0" data-slot="identity-dock-body">
      <IdentityDockPanelToolbar onClose={() => setExpanded(false)} />
      <IdentityDockPanelScroll
        scrollRef={scrollRef}
        viewSwitchAlways={viewSwitchAlways}
        view={ui.view}
        setView={ui.setView}
        previewRef={ui.previewButton}
        session={session}
        off={off}
        brief={brief}
        busy={busy}
        previewTokens={previewTokens}
        domainBrief={specimenBriefFromThread(session.thread, session.proposal?.prompt ?? brief)}
        inputRef={ui.field}
        setBrief={setBrief}
        send={send}
        quickRefine={quickRefine}
        cancel={cancel}
        backToConversation={ui.backToConversation}
        dispatch={dispatch}
        onPreviewTokens={onPreviewTokens}
      />
      {acceptedTokens !== null ? <IdentityDockExportBlock tokens={acceptedTokens} /> : null}
      <IdentityDockComposerFooter
        session={session}
        brief={brief}
        busy={busy}
        off={off}
        onBrief={setBrief}
        onSubmit={send}
        onCancel={cancel}
        inputRef={ui.field}
      />
    </Stack>
  );
}
