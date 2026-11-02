/** English copy for the wizard demos. Keys only; no markup. */
export const wizardCopy = {
  composed: {
    cart: "Cart",
    delivery: "Delivery",
    payment: "Payment",
    confirmation: "Confirmation",
    note: "Checkout: payment is the current step; the confirmation comes after.",
  },
  steps: {
    products: "Products",
    shipping: "Shipping",
    launch: "Launch",
  },
  productsLabel: "What will you sell?",
  products: {
    physical: { title: "Physical products", description: "Clothes, home goods, anything you ship." },
    digital: { title: "Digital downloads", description: "E-books, templates, presets." },
    services: { title: "Services", description: "Bookings and one-off sessions." },
    gift: { title: "Gift cards", description: "Let customers gift your store." },
  },
  shippingLabel: "How will you deliver?",
  shipping: {
    standard: { title: "Standard", description: "3 to 5 working days, €4.90." },
    express: { title: "Express", description: "Next working day, €9.90." },
    pickup: { title: "Store pickup", description: "Free, ready in 2 hours." },
  },
  ready: (products: readonly string[], delivery: readonly string[]) =>
    `Ready to open: ${products.join(", ") || "no products yet"}; delivery by ${delivery.join(", ") || "none yet"}.`,
  back: "Back",
  continue: "Continue",
  solo: {
    title: "Weekly digest",
    description: "Every Monday: new projects, open tasks and what is due this week.",
    on: "You will receive the digest.",
    off: "No digest.",
  },
} as const;

export type WizardCopy = typeof wizardCopy;
