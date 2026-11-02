/** English copy for the theme demos. Keys only; no markup. */
export const themeCopy = {
  page: "Page theme",
  darkScope: "Dark scope",
  orders: "Orders this week",
  total: "1,284",
  up: "+8%",
  late: "3 late",
  range: "Oct 20–26",
  open: "Open report",
  export: "Export CSV",
  releases: "Releases",
  releasesLabel: "Releases",
  dark: "Dark",
  updated: "Updated 4 minutes ago",
  storefront: { name: "Storefront 4.12", state: "Deployed" },
  checkout: { name: "Checkout 2.3", state: "Rolled back" },
  search: { name: "Search index", state: "Deployed" },
  appearance: "Appearance",
  appearanceHint: "Choose how the dashboard looks on this device.",
  darkTheme: "Dark theme",
} as const;

export type ThemeCopy = typeof themeCopy;
