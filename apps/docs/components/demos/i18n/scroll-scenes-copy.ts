/** English copy for the scroll scenes demos. Keys only; no markup. */
export const scrollScenesCopy = {
  status: {
    todo: "To do",
    doing: "Doing",
    done: "Done",
  },
  tour: {
    plan: {
      step: "Step 1 of 3",
      title: "Plan the week",
      body: "Harbor Studio starts with one list: what has to ship, and who owns it.",
      rows: [
        { name: "Landing page copy", owner: "Inès", status: "To do" },
        { name: "Pricing table", owner: "Malo", status: "To do" },
        { name: "Launch checklist", owner: "Inès", status: "To do" },
      ],
    },
    track: {
      step: "Step 2 of 3",
      title: "Track the work",
      body: "Progress updates as people tick tasks, so nobody asks for a status report.",
      progress: "Week 43 progress",
      rows: [
        { name: "Landing page copy", owner: "Inès", status: "Done" },
        { name: "Pricing table", owner: "Malo", status: "Doing" },
      ],
    },
    ship: {
      step: "Step 3 of 3",
      title: "Ship with confidence",
      body: "Everything is green, the checklist is done: publish in one click.",
      progress: "Week 43 progress",
      rows: [
        { name: "Landing page copy", owner: "Inès", status: "Done" },
        { name: "Pricing table", owner: "Malo", status: "Done" },
      ],
    },
  },
  compare: {
    before: {
      step: "Before",
      title: "One long form",
      body: "Twelve fields on one screen: people left before the end.",
      progress: "Completed sign-ups",
      result: "18% of visitors finished the form.",
    },
    after: {
      step: "After",
      title: "Three short steps",
      body: "The same questions, split in three steps with a progress bar.",
      progress: "Completed sign-ups",
      result: "64% of visitors finished the steps.",
    },
  },
  looks: {
    product: "Harbor Studio",
    tagline: "Project tracker",
    save: "Save",
    cancel: "Cancel",
    scenes: [
      {
        id: "mist",
        step: "Look 1 of 3",
        title: "Mist",
        body: "The stock look: quiet chrome and Inter. Good when the product should stay out of the way.",
        badge: "Default",
      },
      {
        id: "press",
        step: "Look 2 of 3",
        title: "Press",
        body: "Editorial type. Same buttons and fields, a reading product.",
        badge: "Editorial",
      },
      {
        id: "tide",
        step: "Look 3 of 3",
        title: "Tide",
        body: "Warm colour and a bit more space. Same screen, a different shop.",
        badge: "Warm",
      },
    ],
  },
  pricing: {
    period: "per month",
    plans: [
      {
        id: "solo",
        step: "Plan 1 of 3",
        title: "Solo",
        body: "One person, one project. Enough to try the tracker on real work.",
        price: "$0",
        features: ["One project", "Email support", "Export to CSV"],
      },
      {
        id: "crew",
        step: "Plan 2 of 3",
        title: "Crew",
        body: "A small team, one workspace. Shared list, no extra tools.",
        price: "$29",
        features: ["Five seats", "One workspace", "Shared inbox"],
      },
      {
        id: "studio",
        step: "Plan 3 of 3",
        title: "Studio",
        body: "Every workspace, with SSO. For a studio that already has clients.",
        price: "$99",
        features: ["Unlimited seats", "Every workspace", "SSO"],
      },
    ],
  },
} as const;

export type ScrollScenesCopy = typeof scrollScenesCopy;
