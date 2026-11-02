/** English copy for the validated form demo. Keys only; no markup. */
export const validatedFormCopy = {
  nameMin: "Use at least 2 characters.",
  label: "Display name",
  description: "Shown to other members of the workspace.",
  pending: "Saving…",
  save: "Save",
  saved: (name: string) => `Saved: ${name}`,
} as const;

export type ValidatedFormCopy = typeof validatedFormCopy;
