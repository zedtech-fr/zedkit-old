import type { IdentityTokens } from "@zedtech/zedkit-ui";

export type TokenDiff = { path: string; from: string; to: string };

const SCALARS = ["spacing", "borderWidth", "radius", "bodyLeading", "headingLeading", "headingTracking", "labelTracking", "fontSans", "fontDisplay", "shadowSm", "shadowMd"] as const;
const COLOURS = ["background", "foreground", "primary", "primaryForeground", "accent", "border", "mutedForeground"] as const;

/** Every token that differs, in the order the editor shows them: shape and type first, then light, then dark. */
export function tokenDiff(before: IdentityTokens, after: IdentityTokens): TokenDiff[] {
  const rows: TokenDiff[] = [];
  for (const key of SCALARS) if (before[key] !== after[key]) rows.push({ path: key, from: before[key], to: after[key] });
  for (const scheme of ["light", "dark"] as const) {
    for (const key of COLOURS) {
      if (before[scheme][key] !== after[scheme][key]) rows.push({ path: `${scheme}.${key}`, from: before[scheme][key], to: after[scheme][key] });
    }
  }
  return rows;
}
