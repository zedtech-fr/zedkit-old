import { identityContrastWarnings, parseIdentityTokens } from "@zedtech/zedkit-ui";
import type { IdentityTokens } from "@zedtech/zedkit-ui";

/**
 * Nudges a generated identity's colours until text and controls meet WCAG AA, in light and dark.
 * Deterministic and bounded (three passes, one nudge per failing colour per pass): this is arithmetic on
 * lightness, not another request to the model. Returns how many colours moved and how many pairs still miss
 * the target (`remaining`), so the page never claims success it did not reach.
 */
export function repairContrast(tokens: IdentityTokens): { tokens: IdentityTokens; adjusted: number; remaining: number } {
  let current = tokens;
  let adjusted = 0;
  for (let pass = 0; pass < 3; pass += 1) {
    const warnings = identityContrastWarnings(current);
    if (warnings.length === 0) break;
    const next = { ...current, light: { ...current.light }, dark: { ...current.dark } };
    for (const warning of warnings) next[warning.scheme][warning.token] = warning.suggestedForeground;
    const parsed = parseIdentityTokens(next);
    if (!parsed.success) break;
    adjusted += warnings.length;
    current = parsed.data;
  }
  return { tokens: current, adjusted, remaining: identityContrastWarnings(current).length };
}
