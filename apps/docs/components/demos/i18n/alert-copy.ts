export const alertCopy = {
  demo: {
    headsUpTitle: "Heads up",
    headsUpDescription: "Something worth knowing.",
    failedTitle: "Failed",
    failedDescription: "Something went wrong.",
    maintenanceAriaLabel: "Maintenance notice",
    maintenanceTitle: "Scheduled maintenance",
    maintenanceDescription: "Sunday 02:00–03:00 UTC.",
  },
  section: {
    maintenanceAriaLabel: "Maintenance notice",
    maintenanceTitle: "Scheduled maintenance",
    maintenanceDescription: "Sunday 02:00–03:00 UTC. Checkout stays available; exports pause.",
  },
} as const;

export type AlertCopy = typeof alertCopy;
