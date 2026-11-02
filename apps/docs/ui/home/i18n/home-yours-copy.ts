import { identityAssistantCopy } from "@/components/i18n/identity-assistant-copy";

/** English copy for the closing scene of the identities band. Keys only; no markup. */
export const homeYoursCopy = {
  title: "And yours?",
  body: "That was a bag shop, a newsroom, a SaaS app. Describe your own product and try a look made for it, in light and dark, before you decide anything.",
  briefLabel: identityAssistantCopy.briefLabel,
  briefHint: "A few sentences. Paste a link to a site you like if you want to; it stays in your text.",
  start: "Start creating",
  startHint: "This opens the identity editor with your text in place. Nothing is sent until you press Generate there.",
} as const;
