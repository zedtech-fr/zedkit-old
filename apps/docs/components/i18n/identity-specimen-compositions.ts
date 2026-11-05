import type { SpecimenDomain } from "@/lib/brief-specimen-domain";

/** Sample page copy per domain for proposal previews (D4). */
export const identitySpecimenCompositions: Record<
  SpecimenDomain,
  {
    brand: string;
    nav: readonly string[];
    headline: string;
    body: string;
    badge: string;
    price: string;
    emailLabel: string;
    emailPlaceholder: string;
    primary: string;
    secondary: string;
  }
> = {
  commerce: {
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
  "saas-dashboard": {
    brand: "Harbor Console",
    nav: ["Overview", "Projects", "Settings"],
    headline: "See what needs attention today",
    body: "Track launches, incidents, and team load in one workspace. Alerts stay actionable, not noisy.",
    badge: "Live",
    price: "62% on track",
    emailLabel: "Work email",
    emailPlaceholder: "you@team.example",
    primary: "Open dashboard",
    secondary: "Invite teammate",
  },
  editorial: {
    brand: "North Ledger",
    nav: ["Stories", "Topics", "About"],
    headline: "Independent reporting with room to breathe",
    body: "Long reads, clear hierarchy, and typography that carries the argument without shouting.",
    badge: "New issue",
    price: "12 min read",
    emailLabel: "Subscribe",
    emailPlaceholder: "you@example.com",
    primary: "Read the feature",
    secondary: "Browse topics",
  },
  booking: {
    brand: "Studio Vale",
    nav: ["Services", "Availability", "Contact"],
    headline: "Book the time that fits your week",
    body: "Pick a service, see open slots, and confirm in two steps. Reminders by email, changes in one tap.",
    badge: "Next slot Thu",
    price: "From €60",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    primary: "Choose a time",
    secondary: "View services",
  },
};
