/** Copy for dock export rows after an accepted look. */
export const identityDockExportCopy = {
  heading: "Take it with you",
  install: "Install command",
  css: "CSS tokens",
  aiPrompt: "AI setup prompt",
  copied: (what: string) => `${what} copied to clipboard`,
  copyFailed: "Copy failed",
  copyLabel: (what: string) => `Copy ${what}`,
} as const;
