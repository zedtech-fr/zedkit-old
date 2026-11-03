export const marketingCopy = {
  surface: {
    plain: { title: "Live stock", body: "Counts follow every sale, without a refresh." },
    raised: { title: "Personal offers", body: "Each visitor sees the offer that fits them." },
    tinted: { title: "Fast launches", body: "Try a new page next to the shop you already run." },
  },
  hero: {
    eyebrow: "Harbor Studio",
    title: "Keep your shop. Add live updates.",
    description: "Stock, orders and offers change on the page without a refresh.",
    primary: "Create an account",
    secondary: "Read the docs",
  },
  cta: {
    title: "Try it on a staging key",
    description: "Sign up, create a key and see your first event in minutes.",
    action: "Create an account",
  },
  features: {
    title: "Built for the shop you already run",
    description: "Add live features next to it, without replatforming.",
    items: [
      { title: "Live stock", description: "Counts follow every sale." },
      { title: "Personal offers", description: "Each visitor sees what fits." },
      { title: "Shopping assistant", description: "Answers from your catalog." },
    ],
  },
  steps: {
    title: "Live in three steps",
    items: [
      { title: "Create an account", description: "No card needed." },
      { title: "Create a key", description: "A staging key takes a minute." },
      { title: "See your first event", description: "It shows up in the console." },
    ],
  },
  chrome: {
    brand: "Harbor Studio",
    links: { docs: "Docs", pricing: "Pricing" },
    signIn: "Sign in",
    signUp: "Create an account",
    tagline: "Live features for the shop you already run.",
    product: "Product",
    company: "Company",
    about: "About",
    legal: "© 2026 Harbor Studio",
    locales: [
      { code: "en", label: "English" },
      { code: "fr", label: "Français" },
    ],
  },
  media: {
    title: "An assistant that knows your catalog",
    description: "Visitors ask in plain words and get answers from your products.",
    points: ["Reads your products and stock", "Never changes an order"],
    caption: "Demo goes here",
  },
} as const;
