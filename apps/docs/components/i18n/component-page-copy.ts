/** English copy for catalog component pages. Keys only; no markup. */
export const componentPageCopy = {
  npmOnlyLead: "This component ships on npm only; there is no copy-source registry brick.",
  npmInstallLeadBeforeLink: "Install the published package, then import from it. Wire the kit CSS first — see",
  npmInstallLeadLink: "getting started",
  npmInstallLeadAfterLink: ".",
  packageVersionLine: (version: string) => `Package version ${version}.`,
  guidance: {
    who: "Who is it for?",
    useWhen: "When should I use it?",
    avoidWhen: "When should I pick something else?",
  },
  sections: {
    installOrCopy: "Install or copy",
    usageAndStates: "Usage and states",
    props: "Props",
    accessibility: "Accessibility",
    related: "Related",
    troubleshooting: "Troubleshooting",
  },
  /** `value` is an id fragment (no spaces: aria-controls would split it); `label` is what readers see. */
  adoptionTabs: [
    { value: "package", label: "Install" },
    { value: "registry", label: "Copy" },
  ] as const,
  /** Second choice under "Copy": a select, not a row of buttons. */
  copyMethods: [
    { value: "cli", label: "Add with CLI (like shadcn)" },
    { value: "manual", label: "Copy manually" },
  ] as const,
  /** Accessible names of the two selects and the headers of the code sections. */
  adoption: {
    copyMethodLabel: "Copy method",
    packageManagerLabel: "Package manager",
    terminalTitle: "Terminal",
    importTitle: "Import",
  },
  cliLead:
    "Run the shadcn CLI in your app. It writes the source into your components folder, then you import it from there. No package to install.",
  sourceLead:
    "Paste this file into your components folder yourself, then import it from there. It imports cn from @/lib/utils.",
  registryContinuation: "New to shadcn? Set up the CLI and theme tokens first.",
  registryContinuationLink: "Zedkit and shadcn",
  usageImportNote: (registry: string) =>
    `Examples import from the package. With copied source, import from @/components/ui/${registry} instead.`,
} as const;

export type ComponentPageCopy = typeof componentPageCopy;
