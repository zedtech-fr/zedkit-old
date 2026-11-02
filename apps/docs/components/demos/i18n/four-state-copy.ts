export const fourStateCopy = {
  loading: {
    spinnerLabel: "Loading invoices",
    text: "Loading invoices",
  },
  success: {
    columns: { name: "Name", age: "Age" },
    rows: [
      { name: "Ada", age: 36 },
      { name: "Bob", age: 30 },
    ],
  },
} as const;

export type FourStateCopy = typeof fourStateCopy;
