export const adminDashboardGuideCopy = {
  edit: "Edit",
  editTitle: (name: string) => `Edit ${name}`,
  editDescription: "Update the display name. Focus returns here when you close the drawer.",
  nameLabel: "Name",
  save: "Save",
  close: "Close",
  columns: {
    name: "Name",
    status: "Status",
    actions: "Actions",
  },
  delete: "Delete",
  deleteTitle: (name: string) => `Delete ${name}?`,
  deleteDescription: "This removes the row from the table in this demo.",
  brand: "Harbor Studio",
  product: "Admin",
  navAria: "Main",
  nav: {
    projects: "Projects",
    services: "Services",
    settings: "Settings",
  },
  user: "Maya Chen",
  initials: "MC",
  pageTitle: "Projects",
  pageDescription: "Services in this workspace. Edit a row or remove it.",
  seed: [
    { name: "reports-api", status: "active" },
    { name: "billing-worker", status: "paused" },
    { name: "webhooks", status: "active" },
    { name: "search-index", status: "paused" },
  ],
} as const;

export type AdminDashboardGuideCopy = typeof adminDashboardGuideCopy;
