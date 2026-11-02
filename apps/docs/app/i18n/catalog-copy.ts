/** English copy for the catalog page. Keys only; no markup. */
export const catalogCopy = {
  metadata: {
    title: (siteTitle: string) => `Catalog · ${siteTitle}`,
    description: "Browse and filter every zedkit catalog need by area, maturity, and search text.",
  },
  jsonLd: {
    title: "Catalog",
    description: "Filterable index of zedkit catalog needs.",
  },
  loading: "Loading catalog…",
} as const;

export type CatalogCopy = typeof catalogCopy;
