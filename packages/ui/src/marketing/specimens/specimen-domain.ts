/** Brief keyword routing for identity preview compositions (L2). */
export type SpecimenDomain = "commerce" | "saas-dashboard" | "editorial" | "service-booking";

const DOMAIN_KEYWORDS: Readonly<Record<SpecimenDomain, readonly string[]>> = {
  commerce: [
    "shop",
    "store",
    "commerce",
    "ecommerce",
    "e-commerce",
    "product",
    "cart",
    "retail",
    "inventory",
    "checkout",
    "catalog",
    "ceramic",
    "ceramics",
  ],
  "saas-dashboard": [
    "saas",
    "dashboard",
    "admin",
    "analytics",
    "metric",
    "quota",
    "team",
    "b2b",
    "api",
    "workspace",
    "subscription",
    "usage",
  ],
  editorial: [
    "editorial",
    "news",
    "newsroom",
    "magazine",
    "press",
    "story",
    "publish",
    "cms",
    "article",
    "headline",
    "journal",
  ],
  "service-booking": [
    "booking",
    "book",
    "appointment",
    "schedule",
    "calendar",
    "reservation",
    "salon",
    "spa",
    "clinic",
    "service",
    "slot",
  ],
};

const DEFAULT_DOMAIN: SpecimenDomain = "saas-dashboard";

function scoreDomain(tokens: readonly string[], keywords: readonly string[]): number {
  let score = 0;
  for (const keyword of keywords) {
    for (const token of tokens) {
      if (token === keyword || token === `${keyword}s`) {
        score += keyword.length >= 7 ? 2 : 1;
        break;
      }
    }
  }
  return score;
}

/** Pick the specimen domain that best matches a free-text brief (case-insensitive). */
export function selectSpecimenDomain(brief: string): SpecimenDomain {
  const text = brief.trim().toLowerCase();
  if (text.length === 0) return DEFAULT_DOMAIN;

  const tokens = text.split(/[^a-z0-9]+/);
  let best = DEFAULT_DOMAIN;
  let bestScore = 0;
  for (const domain of Object.keys(DOMAIN_KEYWORDS) as SpecimenDomain[]) {
    const score = scoreDomain(tokens, DOMAIN_KEYWORDS[domain]);
    if (score > bestScore) {
      bestScore = score;
      best = domain;
    }
  }
  return best;
}

export { DOMAIN_KEYWORDS, DEFAULT_DOMAIN };
