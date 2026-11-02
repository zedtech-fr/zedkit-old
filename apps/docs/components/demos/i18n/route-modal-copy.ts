/** English copy for the route modal demos. Keys only; no markup. */
export const routeModalCopy = {
  drawer: {
    intro: "Clicking a row in a list opens its detail over the list; the address bar changes too.",
    open: "Open route modal",
    title: "Order #1042",
    description: "Same view as the full-page route /orders/1042, mounted from an intercept.",
    footnote: "Reloading this address, or sharing it, opens the full page instead.",
  },
  dialog: {
    intro: "Same intercept, centered instead of a side drawer.",
    open: "Open as dialog",
    title: "Invoice #1042",
    description: "Centered over the list. Escape or Close goes back.",
    footnote: "A long list scrolls inside the panel, not the page behind it.",
  },
  details: {
    customer: "Customer",
    customerName: "Camille Rousseau",
    total: "Total",
    totalValue: "€101.50",
    status: "Status",
    statusValue: "Awaiting shipment",
  },
} as const;

export type RouteModalCopy = typeof routeModalCopy;
