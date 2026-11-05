"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject } from "react";

import { useAssistantSubmitHandlers } from "@/components/use-assistant-submit";
import { useAssistantView } from "@/components/use-assistant-view";
import { useEditorDockFeedbackScroll } from "@/components/use-editor-dock-feedback-scroll";
import { useIdentityAssistant } from "@/components/use-identity-assistant";
import { useIdentityAssistantStore } from "@/lib/identity-assistant-store";
import { specimenBriefFromThread } from "@/lib/brief-specimen-domain";
import type { SessionState } from "@/lib/identity-creator-session";
import type { IdentityTokens } from "@zedtech/zedkit-ui";

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

function useProposalInView(scrollRef: RefObject<HTMLDivElement | null>, requestId: string | undefined, view: "conversation" | "preview") {
  useLayoutEffect(() => {
    if (!requestId) return;
    const scroller = scrollRef.current;
    const proposal = scroller?.querySelector<HTMLElement>("[data-assistant-proposal]");
    if (!scroller || !proposal) return;
    const top = proposal.offsetTop - scroller.offsetTop;
    scroller.scrollTop = Math.max(0, top - 8);
  }, [scrollRef, requestId, view]);
}

function useIdentityDockBriefAutofocus(panelRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const field = panelRef.current?.querySelector<HTMLTextAreaElement>("#identity-assistant-brief:not([disabled])");
    if (field && field.offsetParent !== null) field.focus({ preventScroll: true });
  }, [panelRef]);
}

/** Session, view, send path, and scroll hooks for the dock assistant panel shell. */
export function useIdentityDockAssistantPanel(previewTokens: IdentityTokens) {
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { brief, setBrief, setExpanded, previewTokens: acceptedTokens, previewDomain, setPreviewDomain } = useIdentityAssistantStore();
  const { session, status, dispatch, submit, cancel } = useIdentityAssistant(previewTokens, true);
  const ui = useAssistantView({
    proposalId: session.proposal?.requestId,
    notice: session.notice,
    onBrief: setBrief,
    scrollAssistantOnProposal: false,
  });
  const busy = session.pending !== null;
  const off = status !== null && !status.available ? status.reason : null;
  const { send: sendBrief, quickRefine } = useAssistantSubmitHandlers(
    brief,
    submit,
    busy,
    off !== null,
    () => setBrief(""),
    session.proposal?.prompt,
  );
  const send = useKeepSentBrief(brief, session, setBrief, sendBrief);

  useIdentityDockBriefAutofocus(panelRef);
  useProposalInView(scrollRef, session.proposal?.requestId, ui.view);
  useEditorDockFeedbackScroll(
    panelRef,
    scrollRef,
    session.notice?.kind ?? off ?? session.messages?.length ?? 0,
  );

  return {
    panelRef,
    scrollRef,
    brief,
    setBrief,
    setExpanded,
    session,
    dispatch,
    ui,
    busy,
    off,
    send,
    quickRefine,
    cancel,
    acceptedTokens,
    previewDomain,
    setPreviewDomain,
    domainBrief: specimenBriefFromThread(session.thread, session.proposal?.prompt ?? brief),
  };
}
