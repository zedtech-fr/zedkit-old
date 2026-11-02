export const checkmarkCopy = {
  demo: {
    savedLabel: "Saved",
  },
  decorative: {
    title: "Order #4821 confirmed",
    subtitle: "A receipt is on its way to camille@example.com.",
  },
} as const;

export type CheckmarkCopy = typeof checkmarkCopy;
