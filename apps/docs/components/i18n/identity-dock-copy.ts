import { homeYoursCopy } from "@/ui/home/i18n/home-yours-copy";

/** English copy for the floating identity dock. Keys only; no markup. */
export const identityDockCopy = {
  pillLabel: homeYoursCopy.title,
  panelTitle: "Make it yours",
  close: "Close",
  closeLabel: "Close identity assistant",
  newConversationEn: "New conversation",
  newConversationFr: "Nouvelle conversation",
  newConversationLabel: "Start a new identity assistant conversation",
  shortcutHint: "Open the identity assistant (Ctrl+I or ⌘I)",
  detentGroupLabel: "Sheet height",
  detentLabels: {
    peek: "Peek height",
    half: "Half height",
    full: "Full height",
  },
  export: {
    lead: "Leave with install steps, the CSS from your preview, and the AI setup commands.",
    copyAll: "Copy install, CSS, and AI setup",
    copied: "Copied install, CSS, and AI setup.",
  },
} as const;
