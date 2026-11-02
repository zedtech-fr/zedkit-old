/** English copy for the label demos. Keys only; no markup. */
export const labelCopy = {
  project: "Project name",
  projectPlaceholder: "Website relaunch",
  required: {
    email: "Work email",
    mark: "*",
    emailPlaceholder: "camille@example.com",
    company: "Company",
    companyPlaceholder: "Optional",
  },
} as const;

export type LabelCopy = typeof labelCopy;
