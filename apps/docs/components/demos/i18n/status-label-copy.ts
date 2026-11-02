/** English copy for the status label demos. Keys only; no markup. */
export const statusLabelCopy = {
  saving: "Saving report…",
  saved: "All changes saved",
  error: "Could not save",
  offline: "You are offline",
  sync: "Sync now",
  notes: "Project notes",
  invoice: "Invoice draft",
  retry: "Try again",
} as const;

export type StatusLabelCopy = typeof statusLabelCopy;
