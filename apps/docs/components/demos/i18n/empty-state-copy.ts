export const emptyStateCopy = {
  title: "No invoices",
  description: "Create an invoice to send to a client.",
  newInvoice: "New invoice",
} as const;

export type EmptyStateCopy = typeof emptyStateCopy;
