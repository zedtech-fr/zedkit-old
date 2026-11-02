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
  /** The three examples the hero specimen switches between (a real tablist: pointer and keyboard). */
  heroExamples: [
    { id: "table", label: "Data table" },
    { id: "panel", label: "Detail panel" },
    { id: "calendar", label: "Date picker" },
  ],
  heroPreview: {
    demoLabel: "Interactive admin dashboard demo in the hero",
    examplesAriaLabel: "Kit examples",
  },
  heroScenes: {
    drawerTitle: "Task details",
    drawerSub: "Opened from a row.",
    drawerTask: "Review the homepage mockups",
    assignee: "Assignee",
    assigneeValue: "Camille Rousseau",
    due: "Due",
    dueValue: "30 October",
    status: "Status",
    statusValue: "In review",
    calendarCaption: "Pick a day",
    calendarChosen: (label: string) => `Chosen: ${label}`,
  },
} as const;

export type HeroExampleId = (typeof homeHeroCopy.heroExamples)[number]["id"];
