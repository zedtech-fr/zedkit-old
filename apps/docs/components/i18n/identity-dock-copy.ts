import { homeYoursCopy } from "@/ui/home/i18n/home-yours-copy";

/** English copy for the floating identity dock. Keys only; no markup. */
export const identityDockCopy = {
  pillLabel: homeYoursCopy.title,
  panelTitle: "Make it yours",
  close: "Close",
  closeLabel: "Close identity assistant",
  newConversation: "Nouvelle conversation",
  newConversationLabel: "Start a new identity assistant conversation",
  shortcutHint: "Open the identity assistant (Ctrl+I or ⌘I)",
  detentGroupLabel: "Sheet height",
  detentLabels: {
    peek: "Peek height",
    half: "Half height",
    full: "Full height",
  },
} as const;
