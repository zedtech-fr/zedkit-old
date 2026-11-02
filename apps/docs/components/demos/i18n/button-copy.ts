export const buttonCopy = {
  hint: "Click an action — a toast confirms it. Sizes and disabled stay for comparison.",
  createApp: "Create app",
  cancel: "Cancel",
  details: "Details",
  delete: "Delete",
  docsLink: "Docs link",
  small: "Small",
  default: "Default",
  large: "Large",
  addItemAriaLabel: "Add item",
  disabled: "Disabled",
  saving: "Saving…",
  created: "App created",
  cancelled: "Cancelled",
  openedDetails: "Details opened",
  deleted: "App deleted",
  added: "Item added",
} as const;

export type ButtonCopy = typeof buttonCopy;
