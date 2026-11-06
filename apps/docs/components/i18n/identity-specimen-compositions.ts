import type { SpecimenDomain } from "@/lib/brief-specimen-domain";

/**
 * Sample screens for proposal previews (D4). One brand per métier, and each screen is composed for
 * the customers of that brand, not for the person previewing the look. Persona chain per domain:
 *
 * - commerce, Atelier Lune. Métier: a small studio selling hand-thrown tableware in batches.
 *   Client: the potter-owner, who updates stock between firings. Customers: people buying a gift
 *   or replacing a set. Persona: a shopper on a phone in the evening who wants one piece, its
 *   price, whether it is in stock, and to buy without an account.
 *   UI: one product as the focal point; price and stock beside the name; one primary action.
 * - saas-dashboard, Harbor Console. Métier: a hosted release tracker for small product teams.
 *   Client: the founder-developer. Customers: team members who check status daily. Persona: an
 *   operator scanning at a desk between meetings who wants the number, what is blocked, and who.
 *   UI: dense, figures first, rows with status; no marketing headline.
 * - editorial, North Ledger. Métier: an independent local newsroom funded by subscriptions.
 *   Client: the editor-in-chief and one developer. Customers: readers. Persona: a hurried reader
 *   on a commute who wants the lead story and what else is new, and may subscribe later.
 *   UI: kicker and display headline lead, byline with read time, a compact list of other
 *   stories; subscribing stays quiet.
 * - booking, Studio Vale. Métier: an independent hair salon. Client: the owner-stylist.
 *   Customers: clients booking between meetings. Persona: busy, on a phone, wants the earliest
 *   slot, the price and the duration, and fears booking the wrong thing.
 *   UI: service summary, time slots with one preselected, one action, a reassurance line.
 */
export type StatusTone = "success" | "warning" | "secondary";

export type CommerceComposition = {
  kind: "commerce";
  brand: string;
  basket: string;
  /** Short product description shown on the image placeholder; decorative. */
  imageNote: string;
  product: string;
  detail: string;
  price: string;
  badge: string;
  primary: string;
  reassurance: string;
};

export type ConsoleComposition = {
  kind: "saas-dashboard";
  brand: string;
  section: string;
  figures: readonly { value: string; label: string }[];
  listLabel: string;
  rows: readonly { name: string; owner: string; status: string; tone: StatusTone }[];
  primary: string;
};

export type EditorialComposition = {
  kind: "editorial";
  brand: string;
  subscribe: string;
  kicker: string;
  headline: string;
  standfirst: string;
  byline: string;
  moreLabel: string;
  more: readonly { headline: string; meta: string }[];
};

export type BookingComposition = {
  kind: "booking";
  brand: string;
  service: string;
  detail: string;
  price: string;
  dayLabel: string;
  slots: readonly string[];
  selectedSlot: string;
  primary: string;
  reassurance: string;
};

export type SpecimenComposition =
  | CommerceComposition
  | ConsoleComposition
  | EditorialComposition
  | BookingComposition;

export const identitySpecimenCompositions: Record<SpecimenDomain, SpecimenComposition> = {
  commerce: {
    kind: "commerce",
    brand: "Atelier Lune",
    basket: "Basket (2)",
    imageNote: "Speckled white glaze",
    product: "Stoneware bowl",
    detail: "Hand-thrown, fired twice. Each one is a little different.",
    price: "€48",
    badge: "In stock",
    primary: "Add to basket",
    reassurance: "Ships in 3 days. Free returns for 30 days.",
  },
  "saas-dashboard": {
    kind: "saas-dashboard",
    brand: "Harbor Console",
    section: "This week",
    figures: [
      { value: "62%", label: "on track" },
      { value: "3", label: "need attention" },
    ],
    listLabel: "Needs attention",
    rows: [
      { name: "Redirect old URLs", owner: "Priya", status: "Blocked", tone: "warning" },
      { name: "Contact form to email", owner: "Tom", status: "In review", tone: "secondary" },
      { name: "Homepage copy", owner: "Mina", status: "Live", tone: "success" },
    ],
    primary: "Open dashboard",
  },
  editorial: {
    kind: "editorial",
    brand: "North Ledger",
    subscribe: "Subscribe",
    kicker: "Investigation",
    headline: "Who pays for the new harbour road",
    standfirst: "Council papers show the bill has doubled since 2022. We read all of them.",
    byline: "By Mara Quill · 12 min read",
    moreLabel: "Also today",
    more: [
      { headline: "Night market returns for winter", meta: "4 min" },
      { headline: "The library that never closed", meta: "6 min" },
    ],
  },
  booking: {
    kind: "booking",
    brand: "Studio Vale",
    service: "Cut and finish",
    detail: "45 min with Ana",
    price: "From €60",
    dayLabel: "Thursday 14",
    slots: ["09:00", "11:30", "14:00", "16:30"],
    selectedSlot: "11:30",
    primary: "Confirm 11:30",
    reassurance: "Reminder by email. Change it in one tap.",
  },
};
