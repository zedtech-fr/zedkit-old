/** English copy for the admin dashboard demo. Keys only; no markup. */
export const adminDashboardDemoCopy = {
  defaultAriaLabel: "Interactive admin dashboard demo",
  heading: "Project apps",
  homeHint: "Select a row, then add, edit, or delete.",
  defaultHint:
    "Select a row for details. Add, edit, or delete apps; switch preview for loading, empty, and error.",
  previewModeAriaLabel: "Table preview mode",
  previewModes: {
    ready: "Ready",
    loading: "Loading",
    empty: "Empty",
    error: "Error",
  },
  addApp: "Add app",
  toast: {
    updated: "App updated",
    added: "App added",
    removed: "App removed",
  },
  loadError: "Could not load apps. Switch preview to Ready and try again.",
  emptyMessage: "No apps yet. Choose Ready and click Add app.",
  detail: {
    name: "Name",
    region: "Region",
    id: "ID",
    selectRow: "Select an app row to see its details.",
  },
  columns: {
    name: "Name",
    region: "Region",
    actions: "Actions",
    editAriaLabel: (name: string) => `Edit ${name}`,
    deleteAriaLabel: (name: string) => `Delete ${name}`,
    deleteTitle: "Delete app?",
    deleteDescription: (name: string) => `Remove “${name}” from the list.`,
    deleteConfirm: "Delete",
  },
  drawer: {
    editTitle: "Edit app",
    addTitle: "Add app",
    description: "Name and region are stored in local state only.",
    saveChanges: "Save changes",
    createApp: "Create app",
    cancel: "Cancel",
    fieldName: "Name",
    fieldRegion: "Region",
    regionPlaceholder: "Pick a region",
    regionEu: "eu",
    regionUs: "us",
  },
} as const;

export type AdminDashboardDemoCopy = typeof adminDashboardDemoCopy;
