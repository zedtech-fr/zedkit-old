import type { Unavailable } from "@/lib/identity-assistant";
import { identityBriefCopy } from "./identity-brief-copy.ts";

/** English copy for the identity assistant, its references and its proposal. Keys only; no markup. */

const minutes = (seconds: number) => Math.max(1, Math.ceil(seconds / 60));
const MINUTE_MS = 60_000;

/** Round up to the next displayed minute so the clock is never earlier than Retry-After. */
function ceilToMinute(at: Date): Date {
  const ms = at.getTime();
  const extra = ms % MINUTE_MS;
  return extra === 0 ? at : new Date(ms + (MINUTE_MS - extra));
}

function clock(at: Date): string {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(at);
}

function calendarDay(at: Date): number {
  return Date.UTC(at.getFullYear(), at.getMonth(), at.getDate());
}

/** "in 5 minutes", "after 14:30" today, "tomorrow after 09:00", or an explicit date further out. */
export function retryText(seconds: number | undefined, now: Date = new Date()): string {
  if (!seconds) return "Try again a little later.";
  if (seconds < 3_600) return `Try again in ${minutes(seconds)} ${minutes(seconds) === 1 ? "minute" : "minutes"}.`;
  const at = ceilToMinute(new Date(now.getTime() + seconds * 1000));
  const time = clock(at);
  const dayDelta = (calendarDay(at) - calendarDay(now)) / 86_400_000;
  if (dayDelta <= 0) return `Try again after ${time}.`;
  if (dayDelta === 1) return `Try again tomorrow after ${time}.`;
  const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(at);
  return `Try again after ${date}, ${time}.`;
}

export const identityAssistantCopy = {
  title: "Create an identity",
  intro: "Describe your product in a few plain sentences. The assistant proposes a look; you review it before anything changes.",
  briefLabel: identityBriefCopy.briefLabel,
  followUpLabel: "What should change?",
  generate: "Generate",
  refine: "Refine",
  cancel: "Cancel",
  charsLeft: (left: number) => `${left} characters left`,
  open: "Create an identity from a description",
  detailedEditorLink: "Open the detailed editor",
  working: "Working on it. Your current look is unchanged.",
  /** On a phone the conversation and the preview take turns; from a wide screen both are shown. */
  views: {
    label: "Conversation or preview",
    conversation: "Conversation",
    preview: "Preview",
    proposalReady: "A proposed look is ready.",
    waitingSuffix: ", a proposal is ready",
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
    changes: (count: number) => (count === 0 ? "No value changed" : `${count} ${count === 1 ? "value" : "values"} changed`),
    lightLabel: "Light",
    darkLabel: "Dark",
    preview: "Preview of the proposal in light and dark",
    beforeLabel: "Before",
    afterLabel: "After",
    compare: "Your current look and the proposal side by side.",
    apply: "Use this look",
    discard: "Discard",
    contrastAdjusted: (count: number) => `${count} ${count === 1 ? "colour was" : "colours were"} adjusted so text stays readable.`,
    contrastOk: "Text and controls keep their contrast in light and dark.",
    contrastUnresolved: (count: number) =>
      `${count} ${count === 1 ? "pair still misses" : "pairs still miss"} the contrast target after adjustment; check them before applying.`,
    note: "Applies to demo specimens on this site only, not the docs chrome. Saved looks and the site default are not changed until you export or save elsewhere.",
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
  refineChips: {
    label: "Quick refinements",
    group: "Quick refinements",
    hint: "Or describe the change in your own words below.",
  },
  refinePlaceholder: "Calmer, more contrast, a serif for the headings\u2026",
  placeholder: identityBriefCopy.placeholder,
  /** Example prompts the chat composer rotates through, until reduced motion or a follow-up asks for stillness. */
  composerPlaceholders: [
    "A small online shop selling hand-thrown ceramics…",
    "A calm newsroom site, dense but readable…",
    "A SaaS dashboard for a team of ten…",
    "A booking page for a bike repair shop…",
  ],
  links: identityBriefCopy.links,
  references: {
    textOnly: "Read as text only. Pictures and layout are not analysed.",
    styles: (signals: string) => (signals ? `Styles and text read: ${signals}.` : "Styles and text read. No distinct colours or fonts found."),
    radius: (value: string) => `radius ${value}`,
    failed: (reason: string) => `Could not be used: ${referenceReason(reason)}.`,
    report: "What happened to your links",
    used: "Used",
    notUsed: "Not used",
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
    quota: (seconds?: number) => `The assistant limit has been reached. ${retryText(seconds)}`,
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
    protocol: "only http and https links are read, and https never back to http",
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
  if (reason && /^status-\d{3}$/.test(reason)) return `the page answered with ${reason.slice(7)}`;
  return (reason && Object.hasOwn(words, reason) && words[reason]) || "it could not be read";
}
