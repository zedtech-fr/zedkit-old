/** English copy for the typography demo. Keys only; no markup. */
export const typographyCopy = {
  page: "Page title",
  section: "Section title",
  body: "Body copy.",
  secondary: "Secondary copy.",
  link: "Section title as a link",
} as const;

export type TypographyCopy = typeof typographyCopy;
