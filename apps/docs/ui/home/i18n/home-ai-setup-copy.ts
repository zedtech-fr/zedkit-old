/** English copy for the home AI setup band. Counts and file names come from the kit manifest, not from here. */
export const homeAiSetupCopy = {
  section: {
    title: "One prompt gets you a top-notch AI setup",
    description:
      "Paste it in a new Cursor chat at your repo root. The agent installs the kit, reads your code, docs and CI, asks up to eight questions, then writes rules that match your repo.",
  },
  prompt: {
    label: "Your prompt",
    ariaLabel: "AI setup prompt",
    copyLabel: "Copy AI setup prompt",
    hintBefore: "Another agent? Run",
    hintCommand: "npx @zedtech/zedkit-ai setup",
    hintMiddle: ", then",
    hintSlash: "/setup-ai",
    hintAfter: "in it. About 15 to 45 minutes for a typical app repo.",
  },
  cta: {
    guide: "Read the AI setup guide",
  },
  whatYouGet: {
    title: "What you get",
    summary: (skills: number, agents: number, commands: number) =>
      `${skills} skills, ${agents} subagents and ${commands} commands, then a setup written for your repo.`,
    items: {
      review: {
        title: "Reviews with the right lenses",
        body: "/review pins the diff, runs the lenses it triggers in parallel subagents and returns one verdict.",
      },
      done: {
        title: "A definition of done",
        body: "Gates run on the final state, every changed file has a test, and a cold second review passes before work is called done.",
      },
      roles: {
        title: "Subagents with one job each",
        body: "An orchestrator splits the work, an explorer reads the code, a verifier checks the result.",
      },
      repo: {
        title: "Rules that fit your repo",
        body: "/setup-ai fills AGENTS.md with commands it ran and facts it checked, then adds product, domain and design notes.",
      },
    },
    providers: "Cursor, Claude Code, Codex and Muse read the same .agents folder. npx zedkit-ai validate checks it.",
  },
  terminal: {
    regionLabel: "Files the AI setup creates",
    title: "your-repo",
    installCommand: "npx zedkit-ai setup --provider cursor",
    writtenComment: "then /setup-ai writes",
    validateCommand: "npx zedkit-ai validate",
    validateResult: "ok",
  },
} as const;
