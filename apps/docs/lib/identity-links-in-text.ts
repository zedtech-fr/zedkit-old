import { LIMITS } from "./identity-assistant-limits.ts";

/**
 * Links written in the brief itself. A visitor pastes a link into the one text box; nothing else is filled in.
 * A full http(s) link counts, and so does a bare name such as `linear.app` or `www.stripe.com` (read as https).
 * At most three, each once, in the order written.
 */
const TLDS = "com|app|io|dev|co|org|net|fr|de|uk|eu|design|so|ai|xyz|studio|me|tech|site|shop|store|art|page|cc|be|ch|nl|es|it|ca|us|digital|agency|works|tools|cloud|online|space|world|blog|media|studio|team|codes|ink|fm|tv|ly|to|sh|gg|is|pt|se|no|dk|fi|pl|at|ie|lu|jp|au|nz|in|br|mx|info|biz|pro|work|one|live|today|systems|solutions|consulting|company|network|zone|plus|fun|life|email|link|click|website|tech";
const URL_IN_TEXT = new RegExp(
  `https?:\\/\\/[^\\s<>"'()[\\]{}]+|(?<![@\\w./-])(?:www\\.)?(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.){1,4}(?:${TLDS})(?![\\w-])(?:\\/[^\\s<>"'()[\\]{}]*)?`,
  "gi",
);
const TRAILING = /[.,;:!?…]+$/;

export type LinksInText = {
  /** The links the assistant will read: absolute, unique, in the order written, at most three. */
  urls: string[];
  /** Links in the text that will not be read, and why. */
  skipped: { url: string; why: "too-many" | "invalid" }[];
};

/** The absolute URL a written link stands for, or null. A bare name becomes https. */
function absolute(raw: string): string | null {
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  if (!URL.canParse(candidate)) return null;
  const url = new URL(candidate);
  return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
}

export function linksInText(text: string): LinksInText {
  const urls: string[] = [];
  const skipped: LinksInText["skipped"] = [];
  for (const match of text.matchAll(URL_IN_TEXT)) {
    const raw = match[0].replace(TRAILING, "");
    const href = absolute(raw);
    if (!href) {
      skipped.push({ url: raw, why: "invalid" });
      continue;
    }
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
      return absolute(raw) === url ? found.slice(raw.length) : found;
    })
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+([.,;:!?])/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}
