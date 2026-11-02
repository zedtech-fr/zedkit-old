/** English copy for the motion demos. Keys only; no markup. */
export const motionCopy = {
  steps: {
    install: { title: "Install", description: "One package, one CSS import." },
    compose: { title: "Compose", description: "Kit components, tokens only." },
    ship: { title: "Ship", description: "Same code in light and dark." },
  },
  staggerNote: "Children of data-stagger enter one after another.",
  reducedMotion: "Reduced motion shows everything at once.",
  replayEntrance: "Replay entrance",
  hover: {
    title: "Website relaunch",
    description: "Lifts on hover (devices that hover).",
    press: "Presses down on click",
  },
  tasks: ["Write the launch email", "Review the product photos", "Publish the sale banner"],
  replay: "Replay",
} as const;

export type MotionCopy = typeof motionCopy;
