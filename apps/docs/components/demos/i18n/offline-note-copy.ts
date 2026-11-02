/** English copy for the offline note demos. Keys only; no markup. */
export const offlineNoteCopy = {
  drafts: {
    title: "Invoice drafts",
    label: "Invoice drafts",
    waiting: "Waiting to sync",
    harbor: { id: "INV-2041", client: "Harbor Studio", amount: "€1,280.00" },
    northwind: { id: "INV-2042", client: "Northwind Bakery", amount: "€346.50" },
  },
  wired: {
    title: "No connection",
    body: "Try again when you are back.",
    heading: "Delivery note",
    summary: (saved: number) =>
      `Order #1043 · Canvas tote bag · ${saved === 0 ? "not saved yet" : `saved ${saved} time${saved > 1 ? "s" : ""}`}`,
    save: "Save note",
    simulateOffline: "Simulate losing the connection",
    simulateOnline: "Simulate coming back online",
  },
  wording: {
    title: "No connection",
    body: "Your cart is saved on this device. Reconnect to pay.",
    heading: "Your cart",
    summary: "2 items · €58.00",
    pay: "Pay now",
  },
} as const;

export type OfflineNoteCopy = typeof offlineNoteCopy;
