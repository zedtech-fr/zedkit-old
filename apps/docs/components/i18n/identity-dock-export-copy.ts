/** Copy for dock export rows after an accepted look. */
export const identityDockExportCopy = {
  heading: "Take it with you",
  install: "Install command",
  fonts: "Font imports",
  styles: "Kit styles",
  css: "CSS tokens",
  aiPrompt: "AI setup prompt",
  copied: (what: string) => `${what} copied to clipboard`,
  copyFailed: "Copy failed",
  copyInstall: "Copy Install command",
  copyFonts: "Copy Font imports",
  copyStyles: "Copy Kit styles",
  copyCss: "Copy this CSS tokens",
  copyAiPrompt: "Copy AI setup prompt",
} as const;
