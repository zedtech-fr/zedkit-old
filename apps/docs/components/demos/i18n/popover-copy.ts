/** English copy for the popover demo. Keys only; no markup. */
export const popoverCopy = {
  trigger: "Filters",
  label: "Filters",
  title: "Filters",
  status: "Status: open invoices only.",
} as const;

export type PopoverCopy = typeof popoverCopy;
