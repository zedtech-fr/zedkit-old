export const badgeCopy = {
  demo: {
    beta: "beta",
    events: "12 events",
    stable: "stable",
    deprecated: "deprecated",
  },
  link: {
    platform: "Harbor Studio platform",
    status: "all systems go",
  },
  tableRow: {
    caption: "Background jobs",
    columns: {
      job: "Job",
      target: "Target",
      state: "State",
    },
    jobs: [
      { name: "sync", target: "Product catalogue", state: "queued" },
      { name: "export", target: "Orders, October", state: "running" },
      { name: "backup", target: "Customer files", state: "done" },
    ],
  },
  variants: {
    subtitle: "Pipeline runs for Harbor Studio, last 24 hours",
    runs: [
      { name: "Deploy to staging", badge: "3 retries", variant: "outline" as const },
      { name: "Nightly orders export", badge: "failed", variant: "destructive" as const },
      { name: "Image optimisation", badge: "queued", variant: "secondary" as const },
      { name: "Storefront build", badge: "passed", variant: "default" as const },
    ],
  },
} as const;

export type BadgeCopy = typeof badgeCopy;
