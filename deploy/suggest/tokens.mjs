// The identity token schema, for the service. It must accept and reject exactly what packages/ui does.
//
// shortcut: this is a port of identityTokenSchema in packages/ui/src/identity-tokens.ts, because the alpine
// service has no workspace dependencies. `tokens.parity.test.mjs` runs both on the same inputs (every preset, and a
// seeded fuzz of hostile values) and fails when they disagree, so drift shows up in CI instead of in a result.
const HSL = /^\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%$/;
const LEADING = /^\d+(\.\d+)?$/;
const TRACKING = /^-?\d+(\.\d+)?em$/;
const SCALAR = [
  "spacing",
  "borderWidth",
  "radius",
  "bodyLeading",
  "headingLeading",
  "headingTracking",
  "labelTracking",
  "fontSans",
  "fontDisplay",
  "shadowSm",
  "shadowMd",
];
const COLOUR = ["background", "foreground", "primary", "primaryForeground", "accent", "border", "mutedForeground"];

/** The font stacks the kit loads, and plain system stacks. A generated identity may use nothing else. */
export const FONT_STACKS = Object.freeze([
  '"Inter Variable", Inter, "Inter Variable Fallback", ui-sans-serif, system-ui, sans-serif',
  '"Space Grotesk Variable", "Space Grotesk", "Space Grotesk Variable Fallback", ui-sans-serif, system-ui, sans-serif',
  '"Newsreader Variable", Newsreader, "Newsreader Variable Fallback", Georgia, serif',
  '"Geist Variable", Geist, "Geist Variable Fallback", ui-sans-serif, system-ui, sans-serif',
  '"Jost Variable", Jost, "Jost Variable Fallback", ui-sans-serif, system-ui, sans-serif',
  '"Cormorant Variable", Cormorant, "Cormorant Variable Fallback", Georgia, serif',
  'ui-serif, Georgia, "Times New Roman", serif',
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
  'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
]);

// Mirrors cssValue in packages/ui/src/identity-tokens.ts: a plain value that cannot leave its declaration.
function isBalanced(value) {
  const closers = [];
  let quote = null;
  for (const char of value) {
    if (quote) {
      if (char === quote) quote = null;
    } else if (char === '"' || char === "'") quote = char;
    else if (char === "(") closers.push(")");
    else if (char === "[") closers.push("]");
    else if (char === ")" || char === "]") {
      if (closers.pop() !== char) return false;
    }
  }
  return quote === null && closers.length === 0;
}

function isCss(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 400 &&
    !/[{};<>@\\]|\p{Cc}|\/\*|url\s*\(/iu.test(value) &&
    isBalanced(value)
  );
}

/** Colours the UI schema leaves optional default to `foreground`, as `normalizeColourPair` does there. */
function colourPair(pair) {
  if (!pair || typeof pair !== "object") return null;
  for (const key of COLOUR) {
    const optional = key === "primaryForeground" || key === "mutedForeground";
    if (optional && pair[key] === undefined) continue;
    if (typeof pair[key] !== "string" || !HSL.test(pair[key])) return null;
  }
  return {
    background: pair.background,
    foreground: pair.foreground,
    primary: pair.primary,
    primaryForeground: pair.primaryForeground ?? pair.foreground,
    accent: pair.accent,
    border: pair.border,
    mutedForeground: pair.mutedForeground ?? pair.foreground,
  };
}

/** The tokens as the UI would parse them, or null. */
export function validateTokens(tokens) {
  if (!tokens || typeof tokens !== "object") return null;
  const light = colourPair(tokens.light);
  const dark = colourPair(tokens.dark);
  if (!light || !dark) return null;
  if (!isCss(tokens.spacing) || !isCss(tokens.borderWidth) || !isCss(tokens.radius)) return null;
  if (typeof tokens.bodyLeading !== "string" || !LEADING.test(tokens.bodyLeading)) return null;
  if (typeof tokens.headingLeading !== "string" || !LEADING.test(tokens.headingLeading)) return null;
  if (typeof tokens.headingTracking !== "string" || !TRACKING.test(tokens.headingTracking)) return null;
  if (typeof tokens.labelTracking !== "string" || !TRACKING.test(tokens.labelTracking)) return null;
  if (!isCss(tokens.fontSans) || !isCss(tokens.fontDisplay)) return null;
  if (!isCss(tokens.shadowSm) || !isCss(tokens.shadowMd)) return null;
  return {
    spacing: tokens.spacing,
    borderWidth: tokens.borderWidth,
    radius: tokens.radius,
    bodyLeading: tokens.bodyLeading,
    headingLeading: tokens.headingLeading,
    headingTracking: tokens.headingTracking,
    labelTracking: tokens.labelTracking,
    fontSans: tokens.fontSans,
    fontDisplay: tokens.fontDisplay,
    light,
    dark,
    shadowSm: tokens.shadowSm,
    shadowMd: tokens.shadowMd,
  };
}

/** Applies a partial patch over the current tokens, then validates the whole. Null when the result is not valid. */
export function mergePatch(current, patch) {
  if (!current || typeof current !== "object") return null;
  const next = {
    ...current,
    light: { ...(current.light ?? {}) },
    dark: { ...(current.dark ?? {}) },
  };
  if (!patch || typeof patch !== "object") return validateTokens(next);
  for (const key of SCALAR) {
    if (key in patch) next[key] = patch[key];
  }
  for (const scheme of ["light", "dark"]) {
    const src = patch[scheme];
    if (!src || typeof src !== "object") continue;
    for (const key of COLOUR) {
      if (key in src) next[scheme][key] = src[key];
    }
  }
  return validateTokens(next);
}

/** A generated identity may only pick a font stack from the list, or keep the one it already has. */
export function fontsAllowed(next, current) {
  return ["fontSans", "fontDisplay"].every((key) => next[key] === current[key] || FONT_STACKS.includes(next[key]));
}
