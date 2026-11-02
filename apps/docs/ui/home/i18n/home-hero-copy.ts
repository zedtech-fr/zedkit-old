export const homeHeroCopy = {
  hero: {
    label: "zedkit",
    title: "Build the parts you need. Keep the rest of your app.",
    sub: "React components you add to the app you already have.",
    facts: "MIT · React 19 · Tailwind 4 · npm or source",
  },
  heroActions: {
    getStarted: "Get started",
    browseCatalog: "Browse catalog",
  },
  /** The hero is one small product. Its pages are the examples; the sidebar is how a visitor moves between them. */
  heroApp: {
    label: "Interactive project tracker built with zedkit components",
    appsLabel: "Interactive admin dashboard demo in the hero",
    navAriaLabel: "Pages of the example app",
    pages: {
      overview: "Overview",
      apps: "Apps",
      calendar: "Calendar",
      team: "Team",
      settings: "Settings",
    },
    overview: {
      title: "Website relaunch",
      description: "Launch on 25 November. Here is where the team stands today.",
      stats: {
        open: "Open tasks",
        review: "In review",
        done: "Done",
      },
      activity: "Tasks closed this week",
      activityDays: ["M", "T", "W", "T", "F", "S", "S"],
      activityValues: [3, 5, 2, 6, 4, 1, 2],
      upNext: "Up next",
    },
    calendar: {
      title: "Calendar",
      description: "Due dates for the next weeks.",
      nothingDue: "Nothing due this day.",
      dueOn: (day: string) => `Due on ${day}`,
    },
    team: {
      title: "Team",
      description: "Pick someone to see what is on their plate.",
      online: "Online",
      away: "Away",
      openTasks: "Open tasks",
      nextDue: "Next due",
      nothingOpen: "Nothing open",
      role: "Role",
      roles: {
        priya: "Content",
        luca: "Engineering",
        tom: "Design",
        aiko: "Quality",
        maya: "Project manager",
      },
    },
    settings: {
      title: "Settings",
      description: "Workspace name, region and who gets the daily mail.",
      workspace: "Workspace",
      workspaceValue: "Harbor Studio",
      region: "Region",
      regions: { eu: "Europe", us: "United States" },
      digest: "Daily digest",
      digestHelp: "One mail each morning with what changed.",
      save: "Save changes",
      saved: "Saved",
    },
    /** Floating cards around the window. Decorative, so they restate what the window already shows. */
    satellites: {
      mergedTitle: "Checkout review",
      mergedBody: "Maya moved it to Done",
      online: (count: number) => `${count} online`,
    },
  },
} as const;

export type HeroPageId = keyof typeof homeHeroCopy.heroApp.pages;
