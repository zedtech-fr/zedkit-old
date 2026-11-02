/** English copy for the status dot demos. Keys only; no markup. */
export const statusDotCopy = {
  syncing: "Syncing…",
  idle: "Idle",
  saved: "Saved",
  retrying: "Retrying…",
  failed: "Failed",
  live: "Live sync (pulses)",
  liveStatic: "Live sync, static (printed report or dense table)",
  line: (name: string, label: string) => `${name}: ${label}`,
  services: {
    checkout: { name: "Checkout", label: "Operational" },
    search: { name: "Search", label: "Retrying…" },
    payments: { name: "Payments", label: "Failed" },
    images: { name: "Image resizing", label: "Idle" },
    export: { name: "Order export", label: "Running" },
  },
} as const;

export type StatusDotCopy = typeof statusDotCopy;
