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
  logos: {
    title: "Works with the shops you know",
    names: ["Harbor", "North", "Linen"],
  },
  testimonials: {
    title: "What shops say",
    items: [
      { quote: "We launched a new offer in a day.", name: "Ada Lovelace", role: "Head of e-commerce, Harbor Studio", avatar: "AL" },
      { quote: "Stock on the page is always right.", name: "Grace Hopper", role: "Founder, North Shop", avatar: "GH" },
    ],
  },
  pricing: {
    title: "Simple pricing",
    description: "Start on a staging key. Pay when you go live.",
    period: "per month",
    badge: "Most popular",
    plans: [
      { name: "Starter", price: "€0", features: ["1 staging key", "Community support"], action: "Start free" },
      { name: "Growth", price: "€29", features: ["5 keys", "Email support"], action: "Choose Growth" },
    ],
  },
  faq: {
    title: "Questions",
    items: [
      { question: "Do I need to change my shop?", answer: "No. It runs next to the shop you already have." },
      { question: "How long does a key take?", answer: "About a minute on staging." },
    ],
  },
} as const;
