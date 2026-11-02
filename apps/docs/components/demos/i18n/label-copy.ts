/** English copy for the label demos. Keys only; no markup. */
export const labelCopy = {
  project: "Project name",
  projectPlaceholder: "Website relaunch",
  native: { city: "City", placeholder: "Lyon" },
  required: {
    email: "Work email",
    mark: "*",
    emailPlaceholder: "camille@example.com",
    company: "Company",
    companyPlaceholder: "Optional",
  },
} as const;

export type LabelCopy = typeof labelCopy;
