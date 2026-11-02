/** English copy for the identity demo editor page. Keys only; no markup. */
export const identityEditorCopy = {
  metadata: {
    title: "Identity demo editor",
    description:
      "Try spacing, colour, and type tokens in the browser. Demo only — not a shipped docs feature.",
  },
  back: "← Back to the examples",
  heading: "Try looks in the demo editor",
  body: "Tune tokens and preview them on a card. The link keeps your draft, so you can reopen it.",
} as const;

export type IdentityEditorCopy = typeof identityEditorCopy;
