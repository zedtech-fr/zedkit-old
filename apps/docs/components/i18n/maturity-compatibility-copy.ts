/** English copy for the maturity and compatibility page. Keys only; no markup. */
export const maturityCompatibilityCopy = {
  sections: {
    badgeMeaning: "What a badge means",
    counts: "Current catalog counts",
    toolchain: "Workspace toolchain",
    compatibility: "Package compatibility",
  },
  noBadge: "No badge",
  badges: {
    beta: "beta",
    alpha: "alpha",
    planned: "planned",
    deprecated: "deprecated",
  },
  limits: {
    stable:
      "No badge = stable: semver-protected. Tested through the public API, accessible for UI, documented, API frozen under semver.",
    beta: "Beta: tested, documented, accessible; the API may still change in a minor, with a migration note; not covered by the semver guarantee.",
    alpha: "Alpha: works, but the API can change in any release; not covered by the semver guarantee.",
    planned: "Documented, not built yet. No code and no tests.",
    deprecated: "Do not start a new use. The entry names its replacement and will be removed later.",
  },
  semverNote:
    "Packages at 1.0.0 carry stable catalog entries under real semver. Alpha and beta entries in the same package are excluded from that guarantee — check each need's badge (or lack of one) before you ship.",
  countsTable: {
    status: "Status",
    needs: "Catalog needs",
  },
  compatibilityTable: {
    package: "Package",
    version: "Version",
    node: "Node",
    peers: "Peer dependencies",
  },
  toolchain: (node: string, packageManager: string) =>
    `Node ${node}, ${packageManager}. UI work expects React 19 and Tailwind CSS v4 (see `,
  themeDoc: "theme doc",
  toolchainTail: ").",
  generatedLead: "Generated from each package ",
  generatedTail: " on every docs build.",
} as const;

export type MaturityCompatibilityCopy = typeof maturityCompatibilityCopy;
