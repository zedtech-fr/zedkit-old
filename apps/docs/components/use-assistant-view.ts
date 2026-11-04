"use client";

import { useEffect, useRef, useState } from "react";

import type { View } from "@/components/identity-assistant-parts";
import { useCreatorHandoff } from "@/components/use-creator-handoff";

type FocusRequest = { n: number; scroll: boolean };

/**
 * Brings the assistant to the top of the page, just under whatever is pinned there. On a phone the draft card is
 * pinned, and `scrollIntoView` would slide the start of the assistant (its switch, its intro) beneath it.
 */
function scrollToAssistant() {
  const region = document.getElementById("create");
  if (!region) return;
  const card = document.querySelector<HTMLElement>('[data-slot="identity-editor-preview"]');
  const pinned = card && getComputedStyle(card).position === "sticky" ? Number.parseFloat(getComputedStyle(card).top) + card.offsetHeight : 0;
  const header = Number.parseFloat(getComputedStyle(region).scrollMarginTop) || 0;
  window.scrollTo({ top: window.scrollY + region.getBoundingClientRect().top - Math.max(pinned, header) - 8 });
}

/**
 * Where the visitor is in the assistant: folded or open, looking at the conversation or the preview, and where focus
 * goes next. Arriving to create opens it and puts focus in the form; a new proposal takes a phone to the preview and
 * focus with it (the button that had it is hidden by then); using or discarding it brings the visitor back.
 */
export function useAssistantView({ proposalId, onBrief }: { proposalId: string | undefined; onBrief: (brief: string) => void }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("conversation");
  const [focus, setFocus] = useState<FocusRequest | null>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const previewButton = useRef<HTMLButtonElement>(null);
  const seenProposal = useRef<string | undefined>(undefined);

  useCreatorHandoff((brief) => {
    if (brief) onBrief(brief);
    setOpen(true);
    setFocus({ n: 1, scroll: true });
  });

  useEffect(() => {
    if (!focus) return;
    if (focus.scroll) scrollToAssistant();
    textarea.current?.focus({ preventScroll: focus.scroll });
  }, [focus]);

  useEffect(() => {
    if (!proposalId) {
      seenProposal.current = undefined;
      return;
    }
    const arrived = proposalId !== seenProposal.current;
    seenProposal.current = proposalId;
    if (arrived) {
      setView("preview");
      scrollToAssistant();
      return;
    }
    if (view !== "preview") return;
    // A visitor typing in an editor field keeps it; otherwise the phone follows the proposal.
    const active = document.activeElement;
    if (active?.closest("[data-slot='identity-editor-preview'], #identity-editor-name")) return;
    const id = requestAnimationFrame(() => previewButton.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(id);
  }, [proposalId, view]);

  return {
    open,
    setOpen,
    view,
    setView,
    textarea,
    previewButton,
    /** Runs an action that ends the proposal, then returns to the form with focus in it. */
    backToConversation(action: () => void) {
      action();
      setView("conversation");
      setFocus((last) => ({ n: (last?.n ?? 0) + 1, scroll: false }));
    },
  };
}
