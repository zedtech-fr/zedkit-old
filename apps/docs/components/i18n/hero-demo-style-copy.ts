/** English copy for hero demo style controls. Keys only; no markup. */
export const heroDemoStyleCopy = {
  display: "Display",
  identityAriaLabel: "Identity for this demo",
  identityPlaceholder: "Identity",
  modeAriaLabel: "Color mode for this demo",
  previewAriaLabel: "Table preview mode",
  modes: {
    follow: "Site",
    light: "Light",
    dark: "Dark",
  },
  previewModes: {
    ready: "Ready",
    loading: "Loading",
    empty: "Empty",
    error: "Error",
  },
} as const;

export type HeroDemoStyleCopy = typeof heroDemoStyleCopy;
