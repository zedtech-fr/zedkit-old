export const dialogCopy = {
  demo: {
    triggerContext: "Opens a modal with a title, a description and two actions.",
    open: "Open dialog",
    title: "Order details",
    description: "Order #1042, placed on 26 October by Camille Rousseau.",
    items: [
      { label: "Items", value: "3 (Linen shirt, Canvas tote, Wool socks)" },
      { label: "Shipping", value: "Express, 2 working days" },
      { label: "Total", value: "€101.50" },
      { label: "Status", value: "Awaiting shipment", badge: "warning" as const },
    ],
    downloadInvoice: "Download invoice",
    markShipped: "Mark as shipped",
  },
  tall: {
    open: "Open long dialog",
    title: "Order activity",
    description: "Twelve events. The title stays put; the list and note scroll.",
    events: [
      "Order placed by Camille Rousseau.",
      "Payment captured for €101.50.",
      "Picking started in the warehouse.",
      "Linen shirt packed.",
      "Canvas tote packed.",
      "Wool socks packed.",
      "Label printed for Express shipping.",
      "Handover to the courier.",
      "Out for delivery, 2 working days.",
      "First delivery attempt missed.",
      "Second attempt scheduled.",
      "Delivered and signed.",
    ],
    noteAriaLabel: "Note",
    notePlaceholder: "Add a note for the team",
    done: "Done",
  },
} as const;

export type DialogCopy = typeof dialogCopy;
