/** English copy for the Animate demos. Keys only; no markup. */
export const animateCopy = {
  cardTitle: "Invoice",
  cardBody: "Appears on scroll, presses down.",
  band: "Hold to pulse. Scroll to shift.",
  tasks: ["Write the launch email", "Review the product photos", "Publish the sale banner"],
} as const;

export type AnimateCopy = typeof animateCopy;
