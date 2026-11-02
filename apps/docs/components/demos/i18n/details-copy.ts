export const detailsCopy = {
  composed: {
    customer: "Camille Rousseau",
    labels: {
      customer: "Customer",
      plan: "Plan",
      lastSeen: "Last seen",
      renews: "Renews",
      customerId: "Customer ID",
    },
    planBadge: "Pro",
    lastSeen: "2 minutes ago",
    renews: "1 December 2026",
    copyId: "Copy cus_4821",
  },
  demo: {
    title: "Delivery D-2047",
    trackingLive: "Tracking live",
    items: [
      { label: "Carrier", value: "Colissimo" },
      { label: "Status", value: "In transit", badge: "secondary" as const },
      { label: "Destination", value: "14 rue des Lilas, 69003 Lyon" },
      { label: "Arrival", value: "Thursday 29 October, before 6 pm" },
      { label: "Weight", value: "1.8 kg" },
    ],
    trackingStoppedHint: "Shown once tracking stops, for example after delivery.",
  },
} as const;

export type DetailsCopy = typeof detailsCopy;
