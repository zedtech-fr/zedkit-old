// shortcut: copy of packages/ui identityTokenSchema so the alpine service has
// no workspace deps. Re-run deploy/suggest tests if that schema changes.
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
const COLOUR = ["background", "foreground", "primary", "accent", "border"];

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
    !/[{};<>@\\]|\/\*|url\s*\(/i.test(value) &&
    isBalanced(value)
  );
}

function colourPair(pair) {
  if (!pair || typeof pair !== "object") return null;
  const next = {};
  for (const key of COLOUR) {
    if (!HSL.test(pair[key] ?? "")) return null;
    next[key] = pair[key];
  }
  return next;
}

function pickTokens(tokens) {
  const light = colourPair(tokens.light);
  const dark = colourPair(tokens.dark);
  if (!light || !dark) return null;
  if (!isCss(tokens.spacing) || !isCss(tokens.borderWidth) || !isCss(tokens.radius)) return null;
  if (!LEADING.test(tokens.bodyLeading ?? "") || !LEADING.test(tokens.headingLeading ?? "")) return null;
  if (!TRACKING.test(tokens.headingTracking ?? "") || !TRACKING.test(tokens.labelTracking ?? "")) return null;
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

function mergePatch(current, patch) {
  if (!current || typeof current !== "object") return null;
  const next = {
    ...current,
    light: { ...(current.light ?? {}) },
    dark: { ...(current.dark ?? {}) },
  };
  if (!patch || typeof patch !== "object") return pickTokens(next);
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
  return pickTokens(next);
}

export { mergePatch };
