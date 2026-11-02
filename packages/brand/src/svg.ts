import {
  BRAND_INK,
  BRAND_NAME,
  BRAND_PAPER,
  logoGeometry,
  type LogoGeometry,
  type LogoShape,
  type LogoVariant,
} from "./geometry.js";

/**
 * Which colour the artwork wears:
 * - `on-light`: dark ink, for light surfaces.
 * - `on-dark`: light paper, for dark surfaces.
 * - `current`: `currentColor`, the logo follows the text colour around it.
 * - `auto`: ink on light, paper on dark, switching with `prefers-color-scheme`
 *   (what a favicon needs, since it has no page around it).
 */
export type LogoTheme = "on-light" | "on-dark" | "current" | "auto";

export interface LogoSvgOptions {
  /** `lockup` by default: mark and wordmark side by side. */
  variant?: LogoVariant;
  /** `current` by default. */
  theme?: LogoTheme;
  /** Accessible name. Defaults to "zedkit". An empty string marks the SVG decorative. */
  title?: string;
}

export type LogoAssetKind = "favicon" | "apple-touch" | "og";

export interface LogoAsset {
  svg: string;
  /** Pixel size to rasterise at (the SVG itself scales freely). */
  width: number;
  height: number;
}

const round = (n: number) => Math.round(n * 100) / 100;

function escapeXml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function paint(theme: LogoTheme): string {
  if (theme === "on-light") return BRAND_INK;
  if (theme === "on-dark") return BRAND_PAPER;
  return "currentColor";
}

function pathElement(shape: LogoShape): string {
  const outline = shape.strokeWidth > 0 ? ' stroke-linejoin="round"' : "";
  const transform = shape.transform ? ` transform="${shape.transform}"` : "";
  return `<path stroke-width="${shape.strokeWidth}"${outline}${transform} d="${shape.d}"/>`;
}

function shapesMarkup(shapes: readonly LogoShape[]): string {
  return shapes.map(pathElement).join("");
}

/**
 * Light/dark switch for a context with no page around it (favicon). The rule is
 * scoped to a class so the style cannot reach other SVGs if the file is inlined.
 */
const AUTO_STYLE = `<style>.zedkit-logo{fill:${BRAND_INK};stroke:${BRAND_INK}}@media (prefers-color-scheme:dark){.zedkit-logo{fill:${BRAND_PAPER};stroke:${BRAND_PAPER}}}</style>`;

function accessibleAttributes(title: string): { attrs: string; node: string } {
  if (title === "") return { attrs: ' aria-hidden="true"', node: "" };
  const safe = escapeXml(title);
  return { attrs: ` role="img" aria-label="${safe}"`, node: `<title>${safe}</title>` };
}

function artwork(geometry: LogoGeometry, theme: LogoTheme): string {
  const shapes = shapesMarkup(geometry.shapes);
  if (theme === "auto") return `${AUTO_STYLE}<g class="zedkit-logo">${shapes}</g>`;
  const color = paint(theme);
  return `<g fill="${color}" stroke="${color}">${shapes}</g>`;
}

/**
 * A standalone SVG document string for one logo variant and theme. Pure and
 * deterministic: the same input gives the same bytes, so it can feed a build
 * step, a route handler, an email, or an image pipeline.
 */
export function logoSvg({
  variant = "lockup",
  theme = "current",
  title = BRAND_NAME,
}: LogoSvgOptions = {}): string {
  const geometry = logoGeometry(variant);
  const { attrs, node } = accessibleAttributes(title);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${geometry.viewBox}"${attrs}>${node}${artwork(geometry, theme)}</svg>`;
}

interface Canvas {
  width: number;
  height: number;
  /** Share of the canvas width the artwork may fill. */
  fill: number;
  variant: LogoVariant;
  /** Solid background, or `null` for a transparent canvas. */
  background: string | null;
  theme: LogoTheme;
}

const CANVASES: Record<LogoAssetKind, Canvas> = {
  // Same frame as a hand-drawn favicon: transparent, switches with the browser theme.
  favicon: { width: 640, height: 480, fill: 1, variant: "mark", background: null, theme: "auto" },
  // iOS masks the corners itself and rejects transparency: opaque ink, paper mark.
  "apple-touch": { width: 180, height: 180, fill: 0.6, variant: "mark", background: BRAND_INK, theme: "on-dark" },
  // 1.91:1 social card. Name and tagline are for the page to add on top.
  og: { width: 1200, height: 630, fill: 0.55, variant: "lockup", background: BRAND_INK, theme: "on-dark" },
};

function placed(geometry: LogoGeometry, canvas: Canvas): string {
  const [vx = 0, vy = 0] = geometry.viewBox.split(" ").map(Number);
  const scale = (canvas.width * canvas.fill) / geometry.width;
  const x = (canvas.width - geometry.width * scale) / 2 - vx * scale;
  const y = (canvas.height - geometry.height * scale) / 2 - vy * scale;
  return `<g transform="translate(${round(x)} ${round(y)}) scale(${round(scale * 10000) / 10000})">${artwork(geometry, canvas.theme)}</g>`;
}

/**
 * Ready-to-rasterise sources for the icons every site needs. The favicon is
 * the same frame the web expects from an `icon.svg`. Rasterise the others at
 * the returned `width` x `height` (180 px apple-touch icon, 1200x630 social card).
 */
export function logoAsset(kind: LogoAssetKind): LogoAsset {
  const canvas = CANVASES[kind];
  const geometry = logoGeometry(canvas.variant);
  const background =
    canvas.background === null
      ? ""
      : `<rect width="${canvas.width}" height="${canvas.height}" fill="${canvas.background}"/>`;
  // The favicon keeps the mark's own coordinates: they already sit inside the 640x480 frame.
  const content = kind === "favicon" ? artwork(geometry, canvas.theme) : placed(geometry, canvas);
  const { attrs, node } = accessibleAttributes(BRAND_NAME);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvas.width} ${canvas.height}" width="${canvas.width}" height="${canvas.height}"${attrs}>${node}${background}${content}</svg>`;
  return { svg, width: canvas.width, height: canvas.height };
}
