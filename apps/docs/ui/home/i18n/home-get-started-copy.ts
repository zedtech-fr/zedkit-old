export const homeGetStartedCopy = {
  section: {
    title: "Start your way",
    description: "Add it to your app or copy the source. Your agent or no code? See the other ways in.",
  },
  quickStart: {
    fullSteps: "Full install steps in the docs",
    fullStepsHref: "/docs/getting-started#install-or-copy",
  },
  /** The two ways in that are not the install panel. Each is one line and one link. */
  otherWays: {
    label: "Other ways in",
    agent: {
      title: "Let your agent do it",
      body: "One prompt, and the agent reads your repo and wires the kit.",
      link: "Set up AI",
      href: "#ai-setup",
    },
    noCode: {
      title: "No code",
      body: "Describe your product and get a look made for it.",
      link: "Start without writing code",
      href: "/docs/start-without-writing-code",
    },
  },
} as const;
