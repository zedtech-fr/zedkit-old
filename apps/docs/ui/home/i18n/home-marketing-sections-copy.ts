export const homeSecondaryCopy = {
  section: {
    title: "More in the kit",
    description: "Backend, SEO and coding agents, when you need them.",
  },
  entryNeedsLine: (needCount: number, summaryLead: string) => `${needCount} needs · ${summaryLead}.`,
  identitySpecimen: {
    heading: "Visual example",
    sampleNameLabel: "Name",
    sampleNameValue: "console",
    sampleRegionLabel: "Region",
    sampleRegionValue: "eu",
  },
} as const;
