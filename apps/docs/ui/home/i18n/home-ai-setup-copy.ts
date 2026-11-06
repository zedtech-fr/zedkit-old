/** English copy for the home AI setup band. Counts and file names come from the kit manifest, not from here. */
export const homeAiSetupCopy = {
  section: {
    title: "One prompt, and your agent knows your repo",
    description:
      "Paste it in a new chat at your repo root (Cursor, Muse, Claude Code, or similar). The agent installs the kit, reads your code, docs and CI, asks up to eight questions, then writes rules that match your repo.",
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
    summary: "A setup written for your repo, not a generic prompt pack.",
    items: {
      orchestration: {
        title: "Thin orchestration",
        body: "One coordinator frames the task, briefs specialists in parallel and reports once. It never edits files itself.",
      },
      roles: {
        title: "Clear roles",
        body: "Planning, reading, building and checking stay separate: an explorer reads the code, specialists do the work, a verifier checks the result.",
      },
      rules: {
        title: "Business rules from your code",
        body: "/setup-ai reads your code, docs and CI, then writes down the rules your product runs on, so agents stop guessing.",
      },
      skills: {
        title: "Skills tailored to your repo",
        body: "AGENTS.md holds the commands it ran and the facts it checked. Workflows your repo repeats become repo skills.",
      },
      checks: {
        title: "Checks before it says done",
        body: "/review runs the right lenses in parallel. A definition of done asks for gates run, tests for changed files and a cold second review.",
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
