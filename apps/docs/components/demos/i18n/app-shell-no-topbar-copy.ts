export const appShellNoTopbarCopy = {
  brand: "Harbor Studio",
  navAriaLabel: "Main",
  nav: ["Projects", "Tasks", "Team", "Settings"],
  pageTitle: "Projects",
  pageDescription: "Four active projects, two due this week.",
} as const;

export type AppShellNoTopbarCopy = typeof appShellNoTopbarCopy;
