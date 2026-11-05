/** Which real composition the assistant preview uses (D4). */
export type SpecimenDomain = "commerce" | "saas-dashboard" | "editorial" | "booking";

const RULES: { domain: SpecimenDomain; pattern: RegExp }[] = [
  { domain: "saas-dashboard", pattern: /\b(saas|dashboard|admin|console|workspace|b2b|analytics|metrics)\b/i },
  { domain: "booking", pattern: /\b(booking|appointment|schedule|salon|clinic|reservation|calendar)\b/i },
  { domain: "editorial", pattern: /\b(editorial|magazine|newsroom|newspaper|journal|blog|publishing|newsletter)\b/i },
  { domain: "commerce", pattern: /\b(shop|store|commerce|product|cart|checkout|ceramic|handmade|retail)\b/i },
];

/** Keeps the first user brief when follow-ups are short refinements. */
export function specimenBriefFromThread(thread: readonly { role: string; text: string }[], fallback: string): string {
  const first = thread.find((turn) => turn.role === "user")?.text.trim();
  return first || fallback;
}

/** Picks the closest domain from plain text; commerce is the default. */
export function specimenDomainFromBrief(text: string): SpecimenDomain {
  const trimmed = text.trim();
  if (!trimmed) return "commerce";
  for (const { domain, pattern } of RULES) {
    if (pattern.test(trimmed)) return domain;
  }
  return "commerce";
}

const DOMAINS: readonly SpecimenDomain[] = ["commerce", "saas-dashboard", "editorial", "booking"];

/** True when a persisted or incoming value is one of the four specimen domains. */
export function isSpecimenDomain(value: unknown): value is SpecimenDomain {
  return typeof value === "string" && (DOMAINS as readonly string[]).includes(value);
}
