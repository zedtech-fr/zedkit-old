/** English copy for the component exports panel. Keys only; no markup. */
export const componentExportsPanelCopy = {
  hideSymbols: "Hide export symbols",
  showSymbols: "Show export symbols",
  table: {
    symbol: "Symbol",
    role: "Role",
  },
  symbolCountLine: (count: number) => `${count} symbols from this import.`,
} as const;

export type ComponentExportsPanelCopy = typeof componentExportsPanelCopy;
