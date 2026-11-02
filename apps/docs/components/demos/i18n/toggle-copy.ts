/** English copy for the toggle demo. Keys only; no markup. */
export const toggleCopy = {
  terms: "I accept the terms of sale",
  notify: "Notify me when the order ships",
  hint: "One email with the tracking link.",
} as const;

export type ToggleCopy = typeof toggleCopy;
