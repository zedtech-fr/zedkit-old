/** English copy for the catalog page. Keys only; no markup. */
export const catalogCopy = {
  header: {
    title: "Catalog",
    lead: "Filter by area, maturity, or search — share or reload keeps filters in the URL.",
    loadingResults: "Loading results…",
  },
  filters: {
    toolbarAriaLabel: "Catalog filters",
    searchLabel: "Catalog search",
    searchPlaceholder: "Title or need",
    areaLabel: "Area",
    areaAriaLabel: "Area",
    areaPlaceholder: "All areas",
    maturityLabel: "Maturity",
    maturityAriaLabel: "Maturity",
    maturityPlaceholder: "All",
    maturityAll: "All",
    clearFilters: "Clear filters",
    searchChip: (query: string) => `“${query}”`,
  },
  results: {
    entry: "entry",
    entries: "entries",
    statusLine: (count: number) => `${count} ${count === 1 ? "entry" : "entries"}`,
    heading: "Results",
    sectionAriaLabel: "Results",
    empty: "No catalog entries match these filters.",
    clearFiltersLink: "Clear filters",
    jumpNavAriaLabel: "Jump to category",
    groupJumpLink: (label: string, count: number) => `${label} (${count})`,
    groupHeading: (label: string, count: number) => `${label} · ${count}`,
  },
} as const;

export type CatalogCopy = typeof catalogCopy;
