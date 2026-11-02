export const fieldCopy = {
  legend: "New project",
  projectNameLabel: "Project name",
  projectNameHelp: "Public, shown to the whole team.",
  nameTooShort: "Use at least 3 characters.",
  summaryLabel: "Summary (optional)",
  summaryPlaceholder: "What is this project for?",
  submit: "Create project",
  created: (name: string) => `Project “${name}” created.`,
  initialName: "Ho",
} as const;

export type FieldCopy = typeof fieldCopy;
