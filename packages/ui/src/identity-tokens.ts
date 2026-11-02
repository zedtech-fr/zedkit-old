import { z } from "zod";

import { applyCustomIdentityCss } from "./identity-custom-sheet.js";
import { IDENTITY_STORAGE_KEY } from "./identity-data.js";

const hsl = z.string().regex(/^\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%$/);
/** An open bracket or quote swallows the rest of the stylesheet, so every one must be closed. */
function isBalanced(value: string): boolean {
  const closers: string[] = [];
  let quote: string | null = null;
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

/**
 * One declaration value, written verbatim into a stylesheet, and read back from pasted JSON and shared links.
 * It must not be able to end its declaration or rule, open a comment, or fetch anything. A control character is
 * refused too: a newline ends a quoted string in CSS, and the declaration after it would be lost.
 */
const cssValue = z
  .string()
  .min(1)
  .max(400)
  .refine((value) => !/[{};<>@\\]|\p{Cc}|\/\*|url\s*\(/iu.test(value) && isBalanced(value), {
    message: "Not a plain CSS value (no braces, semicolons, comments, control characters, at-rules, url(), or unbalanced brackets and quotes)",
  });
const leading = z.string().regex(/^\d+(\.\d+)?$/);
const tracking = z.string().regex(/^-?\d+(\.\d+)?em$/);

const colourPairInputSchema = z.object({
  background: hsl,
  foreground: hsl,
  primary: hsl,
  primaryForeground: hsl.optional(),
  accent: hsl,
  border: hsl,
  mutedForeground: hsl.optional(),
});

/** Old JSON exports omit foreground-on-surface pairs; default them to `foreground`. */
function normalizeColourPair(pair: z.infer<typeof colourPairInputSchema>) {
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

const colourPairSchema = colourPairInputSchema.transform(normalizeColourPair);

/** Compact identity: one value per family the live editor can write. */
const identityTokenSchema = z.object({
  spacing: cssValue,
  borderWidth: cssValue,
  radius: cssValue,
  bodyLeading: leading,
  headingLeading: leading,
  headingTracking: tracking,
  labelTracking: tracking,
  fontSans: cssValue,
  fontDisplay: cssValue,
  light: colourPairSchema,
  dark: colourPairSchema,
  shadowSm: cssValue,
  shadowMd: cssValue,
});

type ColourPair = z.infer<typeof colourPairSchema>;
type IdentityTokens = z.infer<typeof identityTokenSchema>;

const INTER = '"Inter Variable", Inter, "Inter Variable Fallback", ui-sans-serif, system-ui, sans-serif';
const GROTESK =
  '"Space Grotesk Variable", "Space Grotesk", "Space Grotesk Variable Fallback", ui-sans-serif, system-ui, sans-serif';
const NEWSREADER = '"Newsreader Variable", Newsreader, "Newsreader Variable Fallback", Georgia, serif';
const GEIST = '"Geist Variable", Geist, "Geist Variable Fallback", ui-sans-serif, system-ui, sans-serif';
const JOST = '"Jost Variable", Jost, "Jost Variable Fallback", ui-sans-serif, system-ui, sans-serif';
const CORMORANT = '"Cormorant Variable", Cormorant, "Cormorant Variable Fallback", Georgia, serif';

const identityPresets = {
  mist: {
    spacing: "0.25rem",
    borderWidth: "1px",
    radius: "0.5rem",
    bodyLeading: "1.55",
    headingLeading: "1.1",
    headingTracking: "-0.02em",
    labelTracking: "0.025em",
    fontSans: INTER,
    fontDisplay: INTER,
    light: {
      background: "0 0% 100%",
      foreground: "240 10% 3.9%",
      primary: "240 5.9% 10%",
      primaryForeground: "0 0% 98%",
      accent: "240 4.8% 59.9%",
      border: "240 5.9% 60%",
      mutedForeground: "240 5% 32%",
    },
    dark: {
      background: "240 10% 3.9%",
      foreground: "0 0% 98%",
      primary: "0 0% 98%",
      primaryForeground: "240 5.9% 10%",
      accent: "240 3.7% 37.9%",
      border: "240 3.7% 37.9%",
      mutedForeground: "240 5% 64.9%",
    },
    shadowSm: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    shadowMd: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  },
  press: {
    spacing: "0.2rem",
    borderWidth: "1px",
    radius: "0px",
    bodyLeading: "1.55",
    headingLeading: "1.1",
    headingTracking: "-0.015em",
    labelTracking: "0.08em",
    fontSans: GROTESK,
    fontDisplay: NEWSREADER,
    light: {
      background: "45 35% 94%",
      foreground: "0 0% 5%",
      primary: "0 0% 5%",
      primaryForeground: "45 35% 94%",
      accent: "160 55% 39%",
      border: "47 10% 50%",
      mutedForeground: "0 0% 25%",
    },
    dark: {
      background: "0 0% 6%",
      foreground: "45 35% 94%",
      primary: "164 62% 56%",
      primaryForeground: "0 0% 5%",
      accent: "164 40% 30%",
      border: "45 10% 38%",
      mutedForeground: "45 12% 72%",
    },
    shadowSm: "0 1px 2px hsl(0 0% 5% / 0.06)",
    shadowMd: "0 1px 2px hsl(0 0% 5% / 0.08)",
  },
  tide: {
    spacing: "0.28rem",
    borderWidth: "1.5px",
    radius: "1rem",
    bodyLeading: "1.55",
    headingLeading: "1.1",
    headingTracking: "-0.02em",
    labelTracking: "0.12em",
    fontSans: INTER,
    fontDisplay: INTER,
    light: {
      background: "20 60% 99%",
      foreground: "0 0% 10%",
      primary: "221 41% 21%",
      primaryForeground: "0 0% 100%",
      accent: "14 100% 58%",
      border: "28 25% 56%",
      mutedForeground: "218 17% 35%",
    },
    dark: {
      background: "222 47% 11%",
      foreground: "0 0% 98%",
      primary: "10 71% 69%",
      primaryForeground: "222 47% 11%",
      accent: "219 30% 43%",
      border: "217 25% 42%",
      mutedForeground: "215 20% 72%",
    },
    shadowSm: "0 3px 10px hsl(221 41% 21% / 0.12), 0 0 14px -4px hsl(10 71% 52% / 0.18)",
    shadowMd: "0 6px 16px hsl(221 41% 21% / 0.14), 0 16px 40px -8px hsl(221 41% 21% / 0.28)",
  },
  volt: {
    spacing: "0.225rem",
    borderWidth: "1.25px",
    radius: "0.25rem",
    bodyLeading: "1.55",
    headingLeading: "1.1",
    headingTracking: "-0.02em",
    labelTracking: "0.1em",
    fontSans: GEIST,
    fontDisplay: GEIST,
    light: {
      background: "0 0% 96%",
      foreground: "0 0% 4%",
      primary: "0 0% 4%",
      primaryForeground: "0 0% 98%",
      accent: "72 90% 31%",
      border: "0 0% 55%",
      mutedForeground: "0 0% 29%",
    },
    dark: {
      background: "0 0% 3%",
      foreground: "0 0% 96%",
      primary: "72 90% 58%",
      primaryForeground: "0 0% 4%",
      accent: "0 0% 37%",
      border: "0 0% 37%",
      mutedForeground: "0 0% 66%",
    },
    shadowSm: "0 1px 2px hsl(0 0% 0% / 0.12)",
    shadowMd: "0 8px 20px -8px hsl(0 0% 0% / 0.25), 0 0 0 1px hsl(0 0% 0% / 0.05)",
  },
  maison: {
    spacing: "0.3rem",
    borderWidth: "1px",
    radius: "2px",
    bodyLeading: "1.55",
    headingLeading: "1.1",
    headingTracking: "0.005em",
    labelTracking: "0.18em",
    fontSans: JOST,
    fontDisplay: CORMORANT,
    light: {
      background: "40 33% 98%",
      foreground: "30 10% 12%",
      primary: "30 10% 12%",
      primaryForeground: "40 33% 98%",
      accent: "38 45% 48%",
      border: "38 14% 55%",
      mutedForeground: "30 7% 33%",
    },
    dark: {
      background: "30 12% 7%",
      foreground: "40 30% 92%",
      primary: "38 45% 70%",
      primaryForeground: "30 12% 8%",
      accent: "30 10% 38%",
      border: "32 8% 38%",
      mutedForeground: "38 12% 68%",
    },
    shadowSm: "0 1px 1px hsl(30 10% 12% / 0.06)",
    shadowMd: "0 1px 2px hsl(30 10% 12% / 0.05), 0 4px 12px -8px hsl(30 10% 12% / 0.06)",
  },
  glass: {
    spacing: "0.32rem",
    borderWidth: "0.5px",
    radius: "1.25rem",
    bodyLeading: "1.55",
    headingLeading: "1.1",
    headingTracking: "-0.02em",
    labelTracking: "0.01em",
    fontSans: INTER,
    fontDisplay: GROTESK,
    light: {
      background: "220 60% 97%",
      foreground: "224 45% 12%",
      primary: "243 70% 46%",
      primaryForeground: "0 0% 100%",
      accent: "262 85% 70%",
      border: "220 35% 60%",
      mutedForeground: "222 18% 32%",
    },
    dark: {
      background: "232 38% 8%",
      foreground: "220 40% 94%",
      primary: "252 95% 78%",
      primaryForeground: "232 38% 8%",
      accent: "255 40% 51%",
      border: "230 25% 44%",
      mutedForeground: "225 20% 74%",
    },
    shadowSm: "0 2px 8px -2px hsl(232 40% 24% / 0.1)",
    shadowMd: "0 10px 30px -10px hsl(232 40% 24% / 0.2)",
  },
};

const RADIUS_STEPS = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl"] as const;
const IDENTITY_TOKEN_SHEET_SLOT = "identity-token-sheet";

function colourCssVars(pair: ColourPair): Record<string, string> {
  return {
    "--background": pair.background,
    "--foreground": pair.foreground,
    "--primary": pair.primary,
    "--primary-foreground": pair.primaryForeground,
    "--accent": pair.accent,
    "--border": pair.border,
    // shortcut: compact pair paints chrome, per-surface fields later
    "--card": pair.background,
    "--card-foreground": pair.foreground,
    "--popover": pair.background,
    "--popover-foreground": pair.foreground,
    "--secondary": pair.background,
    "--secondary-foreground": pair.foreground,
    "--muted": pair.background,
    "--muted-foreground": pair.mutedForeground,
    "--input": pair.border,
    "--ring": pair.accent,
    "--sidebar": pair.background,
    "--sidebar-foreground": pair.foreground,
    "--sidebar-border": pair.border,
    "--sidebar-accent": pair.accent,
  };
}

function cssDecls(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join("\n");
}

function tokensToCssVars(tokens: IdentityTokens): Record<string, string> {
  const vars: Record<string, string> = {
    "--spacing": tokens.spacing,
    "--zk-border-width": tokens.borderWidth,
    "--radius": tokens.radius,
    "--zk-body-leading": tokens.bodyLeading,
    "--zk-heading-leading": tokens.headingLeading,
    "--zk-heading-tracking": tokens.headingTracking,
    "--zk-label-tracking": tokens.labelTracking,
    "--zk-font-sans": tokens.fontSans,
    "--font-sans": tokens.fontSans,
    "--zk-font-display": tokens.fontDisplay,
    "--font-display": tokens.fontDisplay,
    ...colourCssVars(tokens.light),
    "--zk-shadow-sm": tokens.shadowSm,
    "--zk-shadow-md": tokens.shadowMd,
  };
  // shortcut: one radius for every step, expose per-step controls with the editor
  for (const step of RADIUS_STEPS) vars[`--radius-${step}`] = tokens.radius;
  return vars;
}

function tokensToCss(tokens: IdentityTokens, selector: string): string {
  const light = `${selector} {\n${cssDecls(tokensToCssVars(tokens))}\n}`;
  const dark = `${selector}.dark {\n${cssDecls(colourCssVars(tokens.dark))}\n}`;
  return `${light}\n${dark}`;
}

function parseIdentityTokens(input: unknown) {
  return identityTokenSchema.safeParse(input);
}

type IdentityId = keyof typeof identityPresets;

function isPresetId(id: string): id is IdentityId {
  return Object.hasOwn(identityPresets, id);
}

const SUGGEST_KEYS: { id: IdentityId; keys: string[] }[] = [
  { id: "press", keys: ["editorial", "serif", "ink", "paper", "news"] },
  { id: "maison", keys: ["warm", "ivory", "boutique", "airy", "maison"] },
  { id: "tide", keys: ["rounded", "navy", "coral", "lively", "tide"] },
  { id: "volt", keys: ["electric", "dense", "acid", "volt"] },
  { id: "glass", keys: ["glass", "frost", "translucent"] },
  { id: "mist", keys: ["calm", "soft", "mist"] },
];

/** Keyword map through the schema. The suggest HTTP service replaces this later. */
function suggestIdentityTokens(prompt: string): IdentityTokens {
  const hay = prompt.toLowerCase();
  let best: IdentityId = "mist";
  let score = 0;
  for (const rule of SUGGEST_KEYS) {
    const n = rule.keys.reduce((count, key) => count + (hay.includes(key) ? 1 : 0), 0);
    if (n > score) {
      score = n;
      best = rule.id;
    }
  }
  return identityTokenSchema.parse(identityPresets[best]);
}

function applyIdentityTokenSheet(
  tokens: IdentityTokens,
  selector: string,
  doc: Document = document,
): HTMLStyleElement {
  const existing = doc.querySelector(`style[data-slot="${IDENTITY_TOKEN_SHEET_SLOT}"]`);
  const sheet = existing instanceof HTMLStyleElement ? existing : doc.createElement("style");
  sheet.setAttribute("data-slot", IDENTITY_TOKEN_SHEET_SLOT);
  sheet.textContent = tokensToCss(tokens, selector);
  if (!sheet.parentNode) doc.head.append(sheet);
  return sheet;
}

/** Writes compact tokens onto `:root` / `:root.dark` and persists the CSS. */
function applyCustomIdentitySheet(
  tokens: IdentityTokens,
  storageKey: string = IDENTITY_STORAGE_KEY,
  doc: Document = document,
): HTMLStyleElement {
  return applyCustomIdentityCss(tokensToCss(tokens, ":root"), storageKey, doc);
}

type TokenHistory = {
  past: IdentityTokens[];
  present: IdentityTokens;
  future: IdentityTokens[];
};

function historyOf(present: IdentityTokens): TokenHistory {
  return { past: [], present, future: [] };
}

function historyPush(history: TokenHistory, next: IdentityTokens): TokenHistory {
  return { past: [...history.past, history.present], present: next, future: [] };
}

function historyUndo(history: TokenHistory): TokenHistory {
  const prev = history.past.at(-1);
  if (!prev) return history;
  return { past: history.past.slice(0, -1), present: prev, future: [history.present, ...history.future] };
}

function historyRedo(history: TokenHistory): TokenHistory {
  const [next, ...rest] = history.future;
  if (!next) return history;
  return { past: [...history.past, history.present], present: next, future: rest };
}

export {
  IDENTITY_TOKEN_SHEET_SLOT,
  applyCustomIdentitySheet,
  applyIdentityTokenSheet,
  historyOf,
  historyPush,
  historyRedo,
  historyUndo,
  identityPresets,
  identityTokenSchema,
  isPresetId,
  parseIdentityTokens,
  suggestIdentityTokens,
  tokensToCss,
  tokensToCssVars,
  type IdentityId,
  type IdentityTokens,
  type TokenHistory,
};
