/** English copy for the textarea demo. Keys only; no markup. */
export const textareaCopy = {
  label: "Delivery note",
  value: "Please leave the parcel with the concierge, flat 4B.",
  placeholder: "Anything the courier should know?",
  count: (length: number, limit: number) => `${length} / ${limit} characters`,
} as const;

export type TextareaCopy = typeof textareaCopy;
