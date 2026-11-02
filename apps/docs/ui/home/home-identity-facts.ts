/** Static identity facts, kept in step with `packages/ui/src/identities*.css`. */

export const IDENTITY_IDS = ["mist", "press", "tide", "volt", "maison", "glass"] as const;

export type IdentityId = (typeof IDENTITY_IDS)[number];

export const IDENTITY_PALETTE_TOKENS = [
  "background",
  "primary",
  "accent",
  "card",
  "border",
] as const;

export type IdentityPaletteToken = (typeof IDENTITY_PALETTE_TOKENS)[number];

export type IdentityPaletteSwatch = {
  token: IdentityPaletteToken;
  label: string;
  hsl: string;
};

export type IdentityFacts = {
  id: IdentityId;
  label: string;
  character: string;
  type: string;
  shape: string;
  density: string;
  spacing: string;
  borderWidth: string;
  radius: string;
  displayFont: string;
  bodyFont: string;
  palette: readonly IdentityPaletteSwatch[];
};

const PALETTE_LABELS: Record<IdentityPaletteToken, string> = {
  background: "Background",
  primary: "Primary",
  accent: "Accent",
  card: "Card",
  border: "Border",
};

function palette(
  values: Record<IdentityPaletteToken, string>,
): readonly IdentityPaletteSwatch[] {
  return IDENTITY_PALETTE_TOKENS.map((token) => ({
    token,
    label: PALETTE_LABELS[token],
    hsl: values[token],
  }));
}

export const HOME_IDENTITY_FACTS: Record<IdentityId, IdentityFacts> = {
  mist: {
    id: "mist",
    label: "Mist",
    character: "The stock shapes, depth and motion, set in Inter.",
    type: "Inter display and body",
    shape: "0.5rem radius scale, 1px border",
    density: "0.25rem spacing unit",
    spacing: "0.25rem",
    borderWidth: "1px",
    radius: "0.5rem",
    displayFont: "Inter",
    bodyFont: "Inter",
    palette: palette({
      background: "0 0% 100%",
      primary: "240 5.9% 10%",
      accent: "240 4.8% 59.9%",
      card: "0 0% 100%",
      border: "240 5.9% 60%",
    }),
  },
  press: {
    id: "press",
    label: "Press",
    character:
      "Editorial: paper and ink type, square corners, hairline tinted rules, serif display over a grotesque body.",
    type: "Newsreader display, Space Grotesk body",
    shape: "0px radius scale, 1px border",
    density: "0.2rem spacing unit",
    spacing: "0.2rem",
    borderWidth: "1px",
    radius: "0px",
    displayFont: "Newsreader",
    bodyFont: "Space Grotesk",
    palette: palette({
      background: "45 35% 94%",
      primary: "0 0% 5%",
      accent: "160 55% 39%",
      card: "0 0% 100%",
      border: "47 10% 50%",
    }),
  },
  tide: {
    id: "tide",
    label: "Tide",
    character: "Navy and coral, Inter at heavy weights, large radii, soft glows.",
    type: "Inter display and body",
    shape: "1rem radius scale (0.25rem–2.5rem), 1.5px border",
    density: "0.28rem spacing unit",
    spacing: "0.28rem",
    borderWidth: "1.5px",
    radius: "1rem",
    displayFont: "Inter",
    bodyFont: "Inter",
    palette: palette({
      background: "20 60% 99%",
      primary: "221 41% 21%",
      accent: "14 100% 58%",
      card: "0 0% 100%",
      border: "28 25% 56%",
    }),
  },
  volt: {
    id: "volt",
    label: "Volt",
    character: "Dense near-black, Geist at shared scale, hairline borders, one acid accent.",
    type: "Geist display and body",
    shape: "0.25rem radius scale (1px–10px), 1.25px border",
    density: "0.225rem spacing unit",
    spacing: "0.225rem",
    borderWidth: "1.25px",
    radius: "0.25rem",
    displayFont: "Geist",
    bodyFont: "Geist",
    palette: palette({
      background: "0 0% 96%",
      primary: "0 0% 4%",
      accent: "72 90% 31%",
      card: "0 0% 100%",
      border: "0 0% 55%",
    }),
  },
  maison: {
    id: "maison",
    label: "Maison",
    character:
      "Airy ivory, serif display type (Cormorant) over a geometric body (Jost), small radii, generous spacing.",
    type: "Cormorant display, Jost body",
    shape: "2px radius scale (0.5px–4px), 1px border",
    density: "0.3rem spacing unit",
    spacing: "0.3rem",
    borderWidth: "1px",
    radius: "2px",
    displayFont: "Cormorant",
    bodyFont: "Jost",
    palette: palette({
      background: "40 33% 98%",
      primary: "30 10% 12%",
      accent: "38 45% 48%",
      card: "0 0% 100%",
      border: "38 14% 55%",
    }),
  },
  glass: {
    id: "glass",
    label: "Glass",
    character:
      "Frosted, translucent surfaces over soft colour halos: backdrop blur, hairline light edges, generous radii.",
    type: "Space Grotesk display, Inter body",
    shape: "1.25rem radius scale (0.375rem–2.75rem), 0.5px border",
    density: "0.32rem spacing unit",
    spacing: "0.32rem",
    borderWidth: "0.5px",
    radius: "1.25rem",
    displayFont: "Space Grotesk",
    bodyFont: "Inter",
    palette: palette({
      background: "220 60% 97%",
      primary: "243 70% 46%",
      accent: "262 85% 70%",
      card: "0 0% 100%",
      border: "220 35% 60%",
    }),
  },
};

export function isIdentityId(value: string): value is IdentityId {
  return IDENTITY_IDS.includes(value as IdentityId);
}
