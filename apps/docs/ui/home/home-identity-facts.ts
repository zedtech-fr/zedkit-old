/** The looks the home page shows, one product screen each. Kept in step with `packages/ui/src/identities*.css`. */

export const IDENTITY_IDS = ["mist", "press", "maison"] as const;

export type IdentityId = (typeof IDENTITY_IDS)[number];

export const IDENTITY_PALETTE_TOKENS = ["background", "primary", "accent", "card", "border"] as const;

export type IdentityPaletteToken = (typeof IDENTITY_PALETTE_TOKENS)[number];

export type IdentityFacts = {
  id: IdentityId;
  label: string;
  type: string;
  shape: string;
};

export const HOME_IDENTITY_FACTS: Record<IdentityId, IdentityFacts> = {
  mist: { id: "mist", label: "Mist", type: "Inter", shape: "0.5rem radius, 1px border" },
  press: { id: "press", label: "Press", type: "Newsreader over Space Grotesk", shape: "square corners, 1px rules" },
  maison: { id: "maison", label: "Maison", type: "Cormorant over Jost", shape: "2px radius, generous spacing" },
};

export function isIdentityId(value: string): value is IdentityId {
  return IDENTITY_IDS.includes(value as IdentityId);
}
