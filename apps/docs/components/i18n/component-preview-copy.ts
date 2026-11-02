/** English copy for component live previews. Keys only; no markup. */
export const componentPreviewCopy = {
  unknownDemo: (demo: string) => `Unknown demo “${demo}”.`,
  viewPropsTable: "View props table",
} as const;

export type ComponentPreviewCopy = typeof componentPreviewCopy;
