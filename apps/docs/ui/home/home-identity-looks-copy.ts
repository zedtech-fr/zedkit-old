/** English copy for the home identity examples (section chrome only). Keys only; no markup. */

export const homeIdentityLooksCopy = {
  title: "Same components, different products",
  body: "A bag shop, a newsroom, a SaaS app: each example is built from the same zedkit components, composed for its product. The identity sets type, shape, density and color together. To see one task in every identity, use Display under the app above.",
  liveNote: "Live components, not screenshots.",
  scrollHint: "Keep scrolling to change the example, or pick one.",
  tabsAriaLabel: "Examples",
  factsSummary: (label: string) => `${label} identity`,
  factsEyebrow: "Identity",
  factLabels: {
    character: "Character",
    type: "Type",
    shape: "Shape",
    density: "Density",
    palette: "Palette",
  },
  /** What each example is, by identity id. The tab leads with this; the identity name follows. */
  products: {
    mist: "Dev console",
    press: "Newsroom",
    tide: "Invoicing",
    volt: "Incidents",
    maison: "Bag shop",
    glass: "SaaS app",
  },
  openEditor: "Try the demo editor",
  startWithoutCode: "Start without writing code",
  seeInComponents: "See identities in components",
} as const;
