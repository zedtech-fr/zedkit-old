import type { Unavailable } from "@/lib/identity-assistant";

/** English copy for the identity assistant, its references and its proposal. Keys only; no markup. */

const minutes = (seconds: number) => Math.max(1, Math.ceil(seconds / 60));

/** "in 5 minutes", or "after 14:30" when it is further off. Only said when the service gave a retry time. */
export function retryText(seconds: number | undefined, now: Date = new Date()): string {
  if (!seconds) return "Try again a little later.";
  if (seconds < 3_600) return `Try again in ${minutes(seconds)} ${minutes(seconds) === 1 ? "minute" : "minutes"}.`;
  const at = new Date(now.getTime() + seconds * 1000);
  const time = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(at);
  const sameDay = at.toDateString() === now.toDateString();
  return `Try again ${sameDay ? "after" : "tomorrow after"} ${time}.`;
}

export const identityAssistantCopy = {
  title: "Create an identity",
  intro: "Describe your product in a few plain sentences. The assistant proposes a look; you review it before anything changes.",
  briefLabel: "Your product and brand",
  briefHint: "What it is, who it is for, the mood. Paste a link to a site you like if you want to; it stays in your text.",
  followUpLabel: "What should change?",
  followUpHint: "Type, density, hierarchy, colour, radius, contrast or mood. The rest stays as it is.",
  generate: "Generate",
  refine: "Refine",
  cancel: "Cancel",
  charsLeft: (left: number) => `${left} characters left`,
  open: "Create an identity from a description",
  working: "Working on it. Your current look is unchanged.",
  /** On a phone the conversation and the preview take turns; from a wide screen both are shown. */
  views: {
    label: "Conversation or preview",
    conversation: "Conversation",
    preview: "Preview",
    proposalReady: "A proposal is ready in Preview.",
    draftNow: "This is your draft as it is now. A proposal appears here, in light and dark.",
  },
  cancelled: "Cancelled. Nothing changed.",
  thread: "What you asked for so far",
  you: "You",
  assistant: "Assistant",
  proposal: {
    title: "Proposed look",
    summaryLabel: "What changed",
    showChanges: "Show every change",
    changes: (count: number) => (count === 0 ? "No token changed." : `${count} ${count === 1 ? "value" : "values"} changed`),
    lightLabel: "Light",
    darkLabel: "Dark",
    preview: "Preview of the proposal in light and dark",
    apply: "Use this look",
    discard: "Discard",
    contrastAdjusted: (count: number) => `${count} ${count === 1 ? "colour was" : "colours were"} adjusted so text stays readable.`,
    contrastOk: "Text and controls keep their contrast in light and dark.",
    note: "Nothing is applied until you use it. Your saved looks and this page are not touched.",
  },
  /** Sample content the proposal is shown in: a small shop, so type, colour, shape and density have something to act on. */
  preview: {
    brand: "Atelier Lune",
    nav: ["Shop", "Journal", "About"],
    headline: "Quiet pieces for slow mornings",
    body: "Hand-thrown stoneware, made in small batches and fired twice. Each piece is a little different.",
    badge: "In stock",
    price: "€48",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    primary: "Join the list",
    secondary: "Browse the shop",
  },
  /** Links are written in the brief itself; the page only shows which ones it found and lets a visitor drop one. */
  placeholder: "A small online shop selling hand-thrown ceramics. Calm and warm, a little editorial.\nIn the spirit of https://example.com/studio",
  links: {
    found: "Links the assistant will read",
    note: "It reads the text of each page, not the pictures.",
    remove: (host: string) => `Stop reading ${host}`,
    onlyHttps: "A link that does not start with https:// is not read.",
    tooMany: "Only the first 3 links are read.",
    list: "Links found in your text",
  },
  references: {
    textOnly: "Read as text only. Pictures and layout are not analysed.",
    failed: (reason: string) => `Could not be used: ${referenceReason(reason)}.`,
    report: "What happened to your links",
  },
  unavailable: (reason: Unavailable) =>
    ({
      disabled: "The assistant is off on this site. The looks and the fields below still work.",
      "not-configured": "The assistant is not set up here yet. The looks and the fields below still work.",
      unavailable: "The assistant cannot be reached right now. The looks and the fields below still work.",
      killed: "The assistant has been paused. The looks and the fields below still work.",
      unreachable: "The assistant is not available here. The looks and the fields below still work.",
    })[reason],
  failure: {
    quota: (seconds?: number) => `The daily limit for the assistant has been reached. ${retryText(seconds)}`,
    rate: (seconds?: number) => `That was a lot of requests in a short time. ${retryText(seconds)}`,
    busy: "The assistant is busy with another request. Try again in a few seconds.",
    duplicate: "That request was already sent. Wait for its answer.",
    tooLarge: "That request is too long. Shorten it and try again.",
    emptyBrief: "Write a few words about your product first.",
    tooLong: (max: number) => `Keep it under ${max} characters.`,
    tooManyReferences: "Use at most 3 links.",
    invalidOutput: "The assistant's answer could not be used, so nothing changed. Try again or rephrase.",
    upstream: "The assistant is temporarily unavailable, so nothing changed. Try again in a moment.",
    timeout: "The assistant took too long, so nothing changed. Try again, with a shorter request if you can.",
    network: "The assistant could not be reached. Check your connection and try again.",
    invalidInput: "That request could not be sent. Check the text and the links.",
  },
} as const;

export function referenceReason(reason: string | undefined): string {
  const words: Record<string, string> = {
    protocol: "only https links are read",
    credentials: "links with a login are not read",
    port: "only the standard port is read",
    "ip-literal": "links to an address are not read",
    hostname: "this kind of address is not read",
    "invalid-url": "this is not a valid link",
    "blocked-address": "this address is not allowed",
    "content-type": "it is not a web page",
    empty: "the page has no text to read",
    redirects: "it redirects too many times",
    timeout: "it took too long to answer",
    "not-found": "the address was not found",
    unreachable: "it could not be reached",
  };
  if (reason?.startsWith("status-")) return `the page answered with ${reason.slice(7)}`;
  return (reason && words[reason]) || "it could not be read";
}
