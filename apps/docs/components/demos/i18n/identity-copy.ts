/** English copy for the identity demos. Keys only; no markup. */
export const identityCopy = {
  studio: "Harbor Studio",
  look: "Look",
  switcher: {
    currentLook: "Current look: ",
    note: "This control restyles the whole page, like in your app. Your choice is kept in this demo only and the page goes back to its own look when you leave.",
  },
  scope: {
    note: "Each card wears its own look. Save and Cancel work inside the card; the page keeps its look.",
    badge: "New",
    savedBadge: "Saved",
    save: "Save",
    cancel: "Cancel",
  },
  picker: {
    description: "The page behind this sheet updates as you choose.",
    chosen: (id: string) => `Chosen: ${id}`,
    nothing: "Nothing chosen yet.",
  },
} as const;

export type IdentityCopy = typeof identityCopy;
