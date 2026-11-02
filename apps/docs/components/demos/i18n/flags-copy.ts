export const flagsCopy = {
  on: "Preview feature is on.",
  off: "Preview feature is off (registry default).",
  forceOn: "Force on",
  forceOff: "Force off",
  clearOverride: "Clear override",
  forcedOn: "Forced on via local override.",
  forcedOff: "Forced off via local override.",
  clearedOverride: "Cleared override; back to registry default.",
} as const;

export type FlagsCopy = typeof flagsCopy;
