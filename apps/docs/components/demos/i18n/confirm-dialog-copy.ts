export const confirmDialogCopy = {
  demo: {
    projectName: "Website relaunch",
    deleted: "Deleted",
    active: "Active",
    deletedMessage: "The project and its 14 tasks were deleted.",
    restoreDemo: "Restore the demo",
    deleteItem: "Delete item",
    title: "Delete “Website relaunch”?",
    description: "The project and its 14 tasks are removed for everyone on the team. This cannot be undone.",
    confirmLabel: "Delete project",
  },
  labels: {
    keySummary: "Production key, created 12 March",
    revoked: "Revoked",
    inUse: "In use",
    restoreDemo: "Restore the demo",
    revoke: "Revoke",
    title: "Revoke this API key?",
    description: "Every integration that uses it stops working immediately.",
    confirmLabel: "Revoke",
    cancelLabel: "Keep access",
  },
} as const;

export type ConfirmDialogCopy = typeof confirmDialogCopy;
