/** One-click refinement prompts (discovery moment, L1/L2). */

export type RefinementChip = { id: string; label: string; prompt: string };

export const identityRefinementChips: readonly RefinementChip[] = [
  { id: "calmer", label: "Calmer", prompt: "Make it calmer: softer contrast, more breathing room, quieter colours." },
  { id: "contrast", label: "More contrast", prompt: "Increase contrast so text and controls read more clearly in light and dark." },
  { id: "type-swap", label: "Serif headings", prompt: "Use a serif for headings and a clean sans for body text." },
  { id: "accent", label: "Stronger accent", prompt: "Give primary actions and highlights a clearer accent colour." },
] as const;
