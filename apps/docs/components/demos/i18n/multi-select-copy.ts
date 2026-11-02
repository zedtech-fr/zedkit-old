/** English copy for the multi-select demo. Keys only; no markup. */
export const multiSelectCopy = {
  design: "Design",
  docs: "Docs",
  infra: "Infra",
  release: "Release",
  label: "Filter tags",
  placeholder: "Add tags…",
  empty: "Pick one or more tags.",
  selected: (count: number) => `${count} tag(s) selected.`,
} as const;

export type MultiSelectCopy = typeof multiSelectCopy;
