/** English copy for the home identity examples (section chrome only). Keys only; no markup. */

export const homeIdentityLooksCopy = {
  title: "Looks like your product",
  body: "A console, a newsroom and a shop, built from the same components. Each look sets type, shape, density and color together.",
  liveNote: "Live components, not screenshots.",
  tabsAriaLabel: "Examples",
  /** One line under the example: what the look is made of. */
  caption: (label: string, type: string, shape: string) => `${label}: ${type}; ${shape}.`,
  /** What each example is, by identity id. The tab leads with this; the identity name follows. */
  products: {
    mist: "Dev console",
    press: "Newsroom",
    maison: "Bag shop",
  },
  openEditor: "Try the demo editor",
  startWithoutCode: "Start without writing code",
  seeInComponents: "See identities in components",
} as const;
