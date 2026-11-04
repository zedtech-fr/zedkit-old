/** The brief field's label and example, shared by the home invitation and the assistant (kept apart so the home does not load the full assistant copy). */
export const identityBriefCopy = {
  briefLabel: "Your product and brand",
  placeholder: "A small online shop selling hand-thrown ceramics. Calm and warm, a little editorial.\nIn the spirit of https://example.com/studio",
  links: {
    found: "Links the assistant will read",
    note: "It reads each page's styles (colours, fonts, radius, shadows, spacing) and its text, not the pictures.",
    remove: (host: string) => `Stop reading ${host}`,
    tooMany: "Only the first 3 links are read.",
    list: "Links found in your text",
  },
} as const;
