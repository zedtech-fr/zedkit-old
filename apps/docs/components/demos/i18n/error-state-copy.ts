export const errorStateCopy = {
  title: "Could not load invoices",
  description: "Check your connection and try again.",
  tryAgain: "Try again",
} as const;

export type ErrorStateCopy = typeof errorStateCopy;
