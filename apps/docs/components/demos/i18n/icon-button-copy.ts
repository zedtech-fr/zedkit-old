export const iconButtonCopy = {
  demo: {
    title: "Spring campaign",
    subtitle: "Harbor Studio · 12 tasks",
    refreshLabel: "Refresh tasks",
    shareLabel: "Share project",
    archiveLabel: "Archive project",
    initialMessage: "Nothing changed yet.",
    refreshed: "Task list refreshed.",
    linkCopied: "Link copied to the clipboard.",
    archived: "Project archived.",
    hint: "Hover or long-press a button to read its name. Screen readers announce the same text.",
  },
  rows: {
    tasksAriaLabel: "Tasks",
    editLabel: (title: string) => `Edit ${title}`,
    duplicateLabel: (title: string) => `Duplicate ${title}`,
    deleteLabel: (title: string) => `Delete ${title}`,
    noTasksLeft: "No tasks left.",
    restoreTasks: "Restore tasks",
    noDuplicates: "No task duplicated.",
    duplicatesRequested: (count: number) =>
      `${count} duplicate${count > 1 ? "s" : ""} requested.`,
    tasks: [
      { id: 1, title: "Write the launch announcement", owner: "Inès", due: "Nov 4" },
      { id: 2, title: "Pick the hero photo", owner: "Malo", due: "Nov 6" },
      { id: 3, title: "Review the pricing page copy", owner: "Sam", due: "Nov 12" },
    ],
    dueLine: (owner: string, due: string) => `${owner} · due ${due}`,
  },
} as const;

export type IconButtonCopy = typeof iconButtonCopy;
