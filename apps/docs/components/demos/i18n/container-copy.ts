export const containerCopy = {
  narrow: "Narrow — forms and focused flows.",
  reading: "Reading — long-form text measure.",
  default: "Default — standard page shell.",
  wide: "Wide — landing sections on large viewports.",
  bleedTitle: "Bleed band",
  bleedDescription: "Background runs edge to edge; content stays capped.",
  bandContent: "Band content.",
} as const;

export type ContainerCopy = typeof containerCopy;
