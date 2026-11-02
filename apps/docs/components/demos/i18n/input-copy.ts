/** English copy for the input demo. Keys only; no markup. */
export const inputCopy = {
  name: "Full name",
  nameValue: "Camille Rousseau",
  email: "Email address",
  emailPlaceholder: "camille@example.com",
  emailHint: "We only use it to send the order receipt.",
  company: "Company",
  companyValue: "Harbor Studio",
} as const;

export type InputCopy = typeof inputCopy;
