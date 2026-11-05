/** Copy for dock export rows after an accepted look. */
export const identityDockExportCopy = {
  heading: "Take it with you",
  install: "Install command",
  css: "CSS tokens",
  aiPrompt: "AI setup prompt",
  copied: (what: string) => `${what} copied to clipboard`,
  copyFailed: "Copy failed",
  copyInstall: "Copy Install command",
  copyCss: "Copy this CSS tokens",
  copyAiPrompt: "Copy AI setup prompt",
} as const;
