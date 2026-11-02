export const cardCopy = {
  demo: {
    title: "Order #1042",
    description: "Placed 26 October by Camille Rousseau",
    tableAriaLabel: "Order lines",
    columns: { item: "Item", qty: "Qty", price: "Price" },
    rows: [
      { item: "Linen shirt", qty: "1", price: "€49.00" },
      { item: "Canvas tote", qty: "2", price: "€48.00" },
      { item: "Shipping", qty: "1", price: "€4.50" },
    ],
    total: "Total €101.50",
  },
  footer: {
    title: "Spring collection",
    description: "12 products, last edited 2 hours ago",
    status: { draft: "Draft", saved: "Draft saved", published: "Published" },
    body: "This page is still a draft. Publishing makes it visible to every customer.",
    publish: "Publish",
    saveDraft: "Save as draft",
  },
  skeleton: {
    loadingLabel: "Loading report",
    title: "October report",
    description: "148 orders, €12,430 revenue",
    content: "Best week: 14 to 20 October.",
    showReport: "Show the report",
    showSkeleton: "Show the skeleton",
  },
} as const;

export type CardCopy = typeof cardCopy;
