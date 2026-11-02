/** English copy for the inherited HTML props disclosure. Keys only; no markup. */
export const inheritedPropsCopy = {
  summary: "inherited HTML attributes",
  noKitProps: "No props of its own. It accepts the native attributes below.",
  show: (summary: string) => `Show ${summary}`,
  hide: (summary: string) => `Hide ${summary}`,
  referenceLead: "Standard attributes from the underlying element. See ",
  referenceLink: "MDN",
  referenceTail: ".",
} as const;

export type InheritedPropsCopy = typeof inheritedPropsCopy;
