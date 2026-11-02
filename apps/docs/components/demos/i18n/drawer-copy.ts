export const drawerCopy = {
  bottomSheet: {
    filters: "Filters",
    description: "Narrow the orders list by status.",
    statuses: ["Paid", "Awaiting shipment", "Shipped", "Refunded"] as const,
    allOrdersShown: "All orders are shown.",
    statusSelected: (count: number) => `${count} status selected.`,
    reset: "Reset",
  },
  demo: {
    directionLabel: "Direction",
    directions: [
      { value: "auto" as const, label: "Auto", hint: "Right panel on wide screens, bottom sheet on phones (the default)." },
      { value: "bottom" as const, label: "Bottom", hint: "Bottom sheet: the page stays visible above. Swipe down to close." },
      { value: "left" as const, label: "Left", hint: "Side panel, full height, up to 90% of a phone. Swipe left to close." },
      { value: "right" as const, label: "Right", hint: "Side panel, full height, up to 90% of a phone. Swipe right to close." },
      { value: "top" as const, label: "Top", hint: "Top panel: the handle sits at the bottom edge. Swipe up to close." },
    ],
    open: "Open drawer",
    title: "Task details",
    description: (edge: string) => `Website relaunch · opened from the ${edge} edge.`,
    taskTitle: "Review the homepage mockups",
    detailItems: [
      { label: "Assignee", value: "Camille Rousseau" },
      { label: "Due", value: "30 October" },
      { label: "Status", value: "In review", badge: "warning" as const },
    ],
    activityHeading: "Activity",
    activity: [
      "Camille moved the task to In review.",
      "Hugo attached the homepage mockups (v3).",
      "Inès commented: the hero image is too heavy on mobile.",
      "Camille changed the due date to 30 October.",
      "Hugo replied: compressed to 180 KB, ready for another look.",
      "Inès approved the copy on the pricing section.",
    ],
    noteAriaLabel: "Note",
    notePlaceholder: "Add a note for the team",
    save: "Save",
    savedToast: "Saved",
    edgeDefault: "default",
  },
  sideMenu: {
    menu: "Menu",
    links: ["Dashboard", "Projects", "Team", "Billing", "Settings"] as const,
  },
} as const;

export type DrawerCopy = typeof drawerCopy;
