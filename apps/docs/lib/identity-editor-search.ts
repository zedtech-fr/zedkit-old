import {
  identityPresets,
  isNamedIdentityId,
  isPresetId,
  parseIdentityTokens,
  withIdentityDarkPair,
  type IdentityId,
  type IdentityTokens,
} from "@zedtech/zedkit-ui";

const SCALAR_KEYS = [
  "spacing",
  "borderWidth",
  "radius",
  "bodyLeading",
  "headingLeading",
  "headingTracking",
  "labelTracking",
  "shadowSm",
  "shadowMd",
] as const;

/** Font stacks travel with the recipe (JSON) and with the link, like every other scalar. */
const FONT_KEYS = ["fontSans", "fontDisplay"] as const;

/** Every single-value token the link carries, in link order. */
const VALUE_KEYS = [...SCALAR_KEYS, ...FONT_KEYS] as const;

const LIGHT_KEYS = [
  "background",
  "foreground",
  "primary",
  "primaryForeground",
  "accent",
  "border",
  "mutedForeground",
] as const;

function clonePreset(id: IdentityId): IdentityTokens {
  const preset = identityPresets[id];
  return { ...preset, light: { ...preset.light }, dark: { ...preset.dark } };
}

const LIGHT_KEY_SET = new Set<string>(LIGHT_KEYS);

type IdentityEditorSearch = {
  identity: string;
  tokens: IdentityTokens;
  darkPreview: boolean;
  darkKept: string[];
};

function parseDarkKept(raw: string | null): string[] {
  if (!raw) return [];
  const keys: string[] = [];
  for (const key of raw.split(",")) {
    if (!LIGHT_KEY_SET.has(key) || keys.includes(key)) continue;
    keys.push(key);
  }
  return keys;
}

/** Dark colours that differ from the pair generated from light: the ones an edit of light must not rewrite. */
function inferKeptDark(tokens: IdentityTokens): string[] {
  const generated = withIdentityDarkPair(tokens).dark;
  return LIGHT_KEYS.filter((key) => tokens.dark[key] !== generated[key]);
}

/** Keys in `dark-*` that are not the pair generated from light. Empty when `darkKept` is in the query. */
function inferDarkKept(params: URLSearchParams, tokens: IdentityTokens): string[] {
  const generated = withIdentityDarkPair(tokens).dark;
  return LIGHT_KEYS.filter((key) => {
    const raw = params.get(`dark-${key}`);
    return Boolean(raw) && tokens.dark[key] !== generated[key];
  });
}

function parseIdentityEditorSearch(search: string): IdentityEditorSearch {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const rawId = params.get("identity") ?? "mist";
  const identity = isPresetId(rawId) || isNamedIdentityId(rawId) ? rawId : "mist";
  const fallback = clonePreset(isPresetId(identity) ? identity : "mist");
  const draft: IdentityTokens = {
    ...fallback,
    light: { ...fallback.light },
    dark: { ...fallback.dark },
  };
  for (const key of VALUE_KEYS) {
    const value = params.get(key);
    if (value) draft[key] = value;
  }
  for (const key of LIGHT_KEYS) {
    const light = params.get(key);
    if (light) draft.light[key] = light;
    const dark = params.get(`dark-${key}`);
    if (dark) draft.dark[key] = dark;
  }
  const parsed = parseIdentityTokens(draft);
  const tokens = parsed.success ? parsed.data : fallback;
  const listed = parseDarkKept(params.get("darkKept"));
  return {
    identity,
    tokens,
    // `theme=dark` is the older name of the same preview switch.
    darkPreview: params.get("preview") === "dark" || params.get("theme") === "dark",
    darkKept: listed.length > 0 ? listed : parsed.success ? inferDarkKept(params, tokens) : [],
  };
}

function serializeIdentityEditorSearch(
  identity: string,
  tokens: IdentityTokens,
  darkPreview: boolean,
  darkKept: readonly string[] = [],
): string {
  const params = new URLSearchParams();
  params.set("identity", identity);
  if (darkPreview) params.set("preview", "dark");
  const base = identityPresets[isPresetId(identity) ? identity : "mist"];
  for (const key of VALUE_KEYS) {
    if (tokens[key] !== base[key]) params.set(key, tokens[key]);
  }
  for (const key of LIGHT_KEYS) {
    if (tokens.light[key] !== base.light[key]) params.set(key, tokens.light[key]);
    if (tokens.dark[key] !== base.dark[key]) params.set(`dark-${key}`, tokens.dark[key]);
  }
  const kept = LIGHT_KEYS.filter((key) => darkKept.includes(key) && tokens.dark[key] !== base.dark[key]);
  if (kept.length) params.set("darkKept", kept.join(","));
  return params.toString();
}

export { FONT_KEYS, LIGHT_KEYS, SCALAR_KEYS, VALUE_KEYS, inferKeptDark, parseIdentityEditorSearch, serializeIdentityEditorSearch };
