/** English copy for the not-found page. Keys only; no markup. */
export const notFoundCopy = {
  title: "Page not found",
  body: "The page you asked for does not exist or was moved.",
  backLink: "Back to zedkit",
} as const;

export type NotFoundCopy = typeof notFoundCopy;
