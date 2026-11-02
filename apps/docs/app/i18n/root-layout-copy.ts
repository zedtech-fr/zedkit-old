/** English copy for the root document title. Keys only; no markup. */
export const rootLayoutCopy = {
  titleTemplate: (siteTitle: string) => `%s · ${siteTitle}`,
} as const;

export type RootLayoutCopy = typeof rootLayoutCopy;
