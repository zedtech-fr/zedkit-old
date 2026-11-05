"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import type { View } from "@/components/identity-assistant-parts";
import { useCreatorHandoff } from "@/components/use-creator-handoff";
import type { Notice } from "@/lib/identity-creator-session";

type FocusRequest = { n: number; scroll: boolean };

/** Focus may jump to the preview switch when a proposal lands; not while editing token fields below. */
function focusMayMoveToProposalPreview(active: Element | null): boolean {
  if (!active || active === document.body) return true;
  if (active.closest("[data-slot='identity-assistant']")) return true;
  if (active.closest("[data-testid='identity-dock'], [data-slot='drawer-content']")) return true;
  return false;
}

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
export function useAssistantView({
  proposalId,
  notice,
  onBrief,
  scrollAssistantOnProposal = true,
}: {
  proposalId: string | undefined;
  /** When a refine fails but the last proposal stays, the visitor must see the word in the conversation pane. */
  notice?: Notice | null;
  onBrief: (brief: string) => void;
  /** Inline `#create` assistant scrolls the page when a proposal lands; the dock keeps the page still. */
  scrollAssistantOnProposal?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("conversation");
  const [focus, setFocus] = useState<FocusRequest | null>(null);
  const field = useRef<HTMLTextAreaElement>(null);
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
    field.current?.focus({ preventScroll: focus.scroll });
  }, [focus]);

  useLayoutEffect(() => {
    if (!proposalId) {
      seenProposal.current = undefined;
      return;
    }
    const arrived = proposalId !== seenProposal.current;
    seenProposal.current = proposalId;
    if (arrived) {
      setView("preview");
      if (scrollAssistantOnProposal) scrollToAssistant();
    }
    if (!arrived && view !== "preview") return;
    const focusPreview = () => {
      if (!focusMayMoveToProposalPreview(document.activeElement)) return;
      const btn = previewButton.current;
      if (btn && btn.offsetParent !== null) btn.focus({ preventScroll: true });
    };
    focusPreview();
    const frame = requestAnimationFrame(focusPreview);
    return () => cancelAnimationFrame(frame);
  }, [proposalId, view]);

  useLayoutEffect(() => {
    if (!proposalId || !notice || notice.kind === "cancelled") return;
    setView("conversation");
  }, [notice, proposalId]);

  return {
    open,
    setOpen,
    view,
    setView,
    field,
    previewButton,
    /** Runs an action that ends the proposal, then returns to the form with focus in it. */
    backToConversation(action: () => void) {
      action();
      setView("conversation");
      setFocus((last) => ({ n: (last?.n ?? 0) + 1, scroll: false }));
    },
  };
}
