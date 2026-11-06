export const homeHeroCopy = {
  hero: {
    /** Product class before the promise (visual `label` role; see docs/design/signature.md). */
    titleCategory: "UI/AI kit ·",
    title: "Your AI agent, set up with one prompt. The UI, only what you need.",
    /** What the window is, and the first thing to look at in it. */
    sub: "This app is built from zedkit components. Watch the setup run, then click around.",
    facts: "What you see installs from npm or copies as source · MIT · React 19 · Tailwind 4",
  },
  /** The tour is the cursor that clicks through the example. It can be paused, and replayed on purpose. */
  heroTour: {
    pause: "Pause tour",
    play: "Play tour",
  },
  heroActions: {
    getStarted: "Get started",
    setupAi: "Set up AI",
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
    /** The agent panel: a scripted run of the one-prompt AI setup. Nothing is fetched; the note says so. */
    agent: {
      open: "Agent",
      close: "Close agent",
      title: "Agent",
      composerLabel: "Message to the agent",
      placeholder: "Ask the agent",
      sendLabel: "Send to the agent",
      note: "A scripted run: nothing leaves this page.",
      progressLabel: "Progress",
      phases: {
        read: { title: "Reading the code", detail: "3 subagents read routes, tasks and scripts in parallel" },
        rules: { title: "Business rules found", detail: "Collecting what the code enforces" },
        plan: { title: "Plan", detail: "AGENTS.md, a tasks domain note, repo skills" },
        validate: { title: "Validate", detail: "npx zedkit-ai validate" },
      },
      rules: [
        "A task moves from open to in review to done.",
        "Due dates are read as UTC midnight, so they never shift with the time zone.",
        "The daily digest is one mail each morning.",
      ],
      validateOk: "ok",
      finished: "Setup written to AGENTS.md and .agents/",
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
