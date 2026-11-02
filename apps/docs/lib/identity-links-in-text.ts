import { LIMITS } from "./identity-assistant-limits.ts";

/**
 * Links written in the brief itself. A visitor pastes a link into the one text box; nothing else is filled in.
 * Only https links count (the service reads nothing else), at most three, each once.
 */
const URL_IN_TEXT = /https?:\/\/[^\s<>"'()[\]{}]+/gi;
const TRAILING = /[.,;:!?…]+$/;

export type LinksInText = {
  /** The links the assistant will read: https, unique, in the order written, at most three. */
  urls: string[];
  /** Links in the text that will not be read, and why. */
  skipped: { url: string; why: "http" | "too-many" | "invalid" }[];
};

export function linksInText(text: string): LinksInText {
  const urls: string[] = [];
  const skipped: LinksInText["skipped"] = [];
  for (const match of text.matchAll(URL_IN_TEXT)) {
    const raw = match[0].replace(TRAILING, "");
    if (!URL.canParse(raw)) {
      skipped.push({ url: raw, why: "invalid" });
      continue;
    }
    const url = new URL(raw);
    if (url.protocol !== "https:") {
      skipped.push({ url: raw, why: "http" });
      continue;
    }
    const href = url.href;
    if (urls.includes(href)) continue;
    if (urls.length >= LIMITS.references) skipped.push({ url: raw, why: "too-many" });
    else urls.push(href);
  }
  return { urls, skipped };
}

/** Takes one link out of the text, wherever it was written, and tidies the space it leaves. */
export function removeLink(text: string, url: string): string {
  return text
    .replace(URL_IN_TEXT, (found) => {
      const raw = found.replace(TRAILING, "");
      return URL.canParse(raw) && new URL(raw).href === url ? found.slice(raw.length) : found;
    })
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+([.,;:!?])/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}
