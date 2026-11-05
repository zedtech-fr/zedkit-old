export const PARALLAX_DEPTH_NAMES = ["far", "back", "mid", "near", "0"] as const;
export type ParallaxDepthName = (typeof PARALLAX_DEPTH_NAMES)[number];
export type ParallaxDepth = ParallaxDepthName | number;

export const PARALLAX_AXES = ["y", "x"] as const;
export type ParallaxAxis = (typeof PARALLAX_AXES)[number];

export const PARALLAX_RANGES = ["cover", "entry", "exit", "page"] as const;
export type ParallaxRange = (typeof PARALLAX_RANGES)[number];

export const PARALLAX_OFF = ["below-md", "below-lg"] as const;
export type ParallaxOff = (typeof PARALLAX_OFF)[number];

export const PARALLAX_FADES = ["entry", "exit"] as const;
export type ParallaxFade = (typeof PARALLAX_FADES)[number];

export const PARALLAX_SECTION_TAGS = ["section", "div", "article", "header"] as const;
export type ParallaxSectionTag = (typeof PARALLAX_SECTION_TAGS)[number];

// Linear-time number + optional unit (avoids \d*\.?\d+ backtracking / ReDoS).
const SAFE_CSS_VALUE = /^-?(?:\d+(?:\.\d+)?|\.\d+)(?:[a-z%]{1,16})?$/i;

export function isMovingDepth(depth: ParallaxDepth | undefined): depth is ParallaxDepth {
  return depth != null && depth !== 0 && depth !== "0";
}

export function namedDepth(depth: ParallaxDepth): ParallaxDepthName | undefined {
  if (depth === 0 || depth === "0") return "0";
  if (typeof depth === "string") return depth;
  return undefined;
}

export function motionVarClass(
  name: `--${string}`,
  value: string | number | undefined,
  clamp?: boolean,
): string | undefined {
  if (value == null || value === "") return undefined;
  if (typeof value === "number") {
    const raw = formatNumber(value, clamp === true);
    return raw ? `[${name}:${raw}]` : undefined;
  }
  const raw = value.trim();
  if (!raw || !SAFE_CSS_VALUE.test(raw)) return undefined;
  return `[${name}:${raw}]`;
}

function formatNumber(value: number, clamp: boolean): string | undefined {
  if (!Number.isFinite(value)) return undefined;
  const n = clamp ? Math.min(1, Math.max(-1, value)) : value;
  return String(Number(n.toFixed(4)));
}
