import { identityBriefCopy } from "@/components/i18n/identity-brief-copy";

/** English copy for the closing scene of the identities band. Keys only; no markup. */
export const homeYoursCopy = {
  title: "And yours?",
  body: "That was a console, a newsroom, a shop. Describe your own product and try a look made for it, in light and dark, before you decide anything.",
  briefLabel: identityBriefCopy.briefLabel,
  briefHint: "A few sentences. Paste a link to a site you like if you want to: the assistant reads its styles and words, not its pictures.",
  start: "Start creating",
  startHint: "This opens the identity assistant with your text in place. Nothing is sent until you press Generate there.",
} as const;
