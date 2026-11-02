/** English copy for the identity kit demos page. Keys only; no markup. */
export const identityKitDemosCopy = {
  metadata: {
    title: "Identities in components",
    description: "The identity switcher, a scoped specimen and the touch picker, live in each look.",
  },
  heading: "Identities in components",
  body: "Three live pieces: the identity switcher, a specimen scoped to one look inside a page in another, and the touch picker.",
  scrollGuide: "Pin a stage and change scene as the page scrolls",
  afterScrollGuide: "is the technique behind the home page hero.",
} as const;

export type IdentityKitDemosCopy = typeof identityKitDemosCopy;
