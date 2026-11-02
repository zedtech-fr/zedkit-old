/** English copy for the toaster demo. Keys only; no markup. */
export const toasterCopy = {
  saved: "Saved",
  show: "Show toast",
  failed: "Upload failed",
  showError: "Show error",
} as const;

export type ToasterCopy = typeof toasterCopy;
