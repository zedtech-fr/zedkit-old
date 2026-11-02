/** English copy for the docs preview frame. Keys only; no markup. */
export const previewViewportCopy = {
  tabs: {
    preview: "preview",
    code: "code",
  },
  display: "Display",
  width: "Width",
  full: "Full",
  mobile: "Mobile",
  mode: "Mode",
  site: "Site",
  light: "Light",
  dark: "Dark",
} as const;

export type PreviewViewportCopy = typeof previewViewportCopy;
