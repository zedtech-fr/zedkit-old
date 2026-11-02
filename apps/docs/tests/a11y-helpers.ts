import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page } from "@playwright/test";

import { A11Y_AXE_EXCLUDES } from "./a11y-exceptions.mjs";

export { A11Y_AXE_EXCLUDES };

/** Built-in kit identities exercised in docs visual/a11y matrices (ZK-15). */
export const DOCS_SHIPPED_IDENTITIES = ["mist", "press", "tide", "volt", "maison", "glass"] as const;
export type DocsShippedIdentity = (typeof DOCS_SHIPPED_IDENTITIES)[number];

const IDENTITY_SANS_SNIPPET: Record<DocsShippedIdentity, string> = {
  mist: "Inter Variable",
  press: "Space Grotesk",
  tide: "Inter Variable",
  volt: "Geist",
  maison: "Jost Variable",
  glass: "Inter Variable",
};

/** On a phone the preview's Display tools sit behind a toggle; open it when it is shown. */
export async function revealPreviewDisplay(preview: Locator): Promise<void> {
  const toggle = preview.getByRole("button", { name: "Display", exact: true });
  if ((await toggle.isVisible()) && (await toggle.getAttribute("aria-expanded")) === "false") await toggle.click();
}

/** Preview toolbar: pin identity + local light/dark, then assert scope tokens. */
export async function pinDemoLook(
  preview: Locator,
  identity: DocsShippedIdentity,
  mode: "light" | "dark",
): Promise<Locator> {
  await preview.scrollIntoViewIfNeeded();
  await revealPreviewDisplay(preview);
  await preview.getByLabel("Style of this demo").selectOption(identity);
  await preview.getByRole("button", { name: mode === "light" ? "Light" : "Dark", exact: true }).click();
  const surface = preview.locator("[data-preview-surface]");
  await expect(surface).toHaveAttribute("data-identity", identity);
  await expect(surface).toHaveAttribute("data-identity-scope", "");
  await expect.poll(() => surface.evaluate((node) => node.classList.contains("dark"))).toBe(mode === "dark");
  await expect
    .poll(() =>
      surface.evaluate((node) => {
        const style = getComputedStyle(node);
        return (
          style.getPropertyValue("--primary").trim().length > 0 &&
          style.getPropertyValue("--background").trim().length > 0
        );
      }),
    )
    .toBe(true);
  await expect
    .poll(() =>
      surface.evaluate((node) => {
        const sans = getComputedStyle(node).getPropertyValue("--font-sans");
        const probe = document.createElement("span");
        probe.style.fontFamily = sans;
        node.appendChild(probe);
        const family = getComputedStyle(probe).fontFamily;
        probe.remove();
        return family;
      }),
    )
    .toContain(IDENTITY_SANS_SNIPPET[identity]);
  return surface;
}

/** Lands focus on `control` through Tab navigation, so the browser treats it as keyboard focus. */
export async function focusWithKeyboard(control: Locator): Promise<void> {
  const page = control.page();
  await control.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(control).toBeFocused();
}

/** What the browser actually paints around a control while it has keyboard focus. */
export interface FocusIndicator {
  kind: "outline" | "ring" | "none";
  /** Painted width in CSS px (outline width, or ring spread). */
  width: number;
  /** Indicator colour composited over the nearest opaque background, as `[r, g, b]`. */
  color: [number, number, number] | null;
  /** Nearest opaque background behind the control, as `[r, g, b]`. */
  background: [number, number, number];
}

/**
 * Reads the focus indicator of a focused control from its computed style.
 * The indicator is what focus adds: an outline, or a box-shadow ring layer
 * that the same control does not paint when blurred (a resting drop shadow
 * is not a focus state). Nothing is drawn or assumed on the control's behalf.
 */
export async function readFocusIndicator(control: Locator): Promise<FocusIndicator> {
  await expect(control).toBeFocused();
  // A script or pointer focus does not match :focus-visible, so it would show no ring by design.
  expect(
    await control.evaluate((el) => el.matches(":focus-visible")),
    "the control must be focused as a keyboard user would (see focusWithKeyboard)",
  ).toBe(true);
  return control.evaluate((el) => {
    // Colour and shadow transitions start from the resting style; read the settled one.
    const settle = () => el.getAnimations().forEach((a) => a instanceof CSSTransition && a.finish());
    settle();
    type Rgba = [number, number, number, number];
    const parse = (css: string): Rgba | null => {
      const m = css.match(/rgba?\(([^)]+)\)/) ?? css.match(/color\(srgb ([^)]+)\)/);
      if (!m) return null;
      const parts = m[1]!.split(/[\s,/]+/).filter(Boolean).map(Number);
      const scale = css.startsWith("color(") ? 255 : 1;
      return [parts[0]! * scale, parts[1]! * scale, parts[2]! * scale, parts[3] ?? 1];
    };
    const over = (top: Rgba, base: [number, number, number]): [number, number, number] => [
      Math.round(top[0] * top[3] + base[0] * (1 - top[3])),
      Math.round(top[1] * top[3] + base[1] * (1 - top[3])),
      Math.round(top[2] * top[3] + base[2] * (1 - top[3])),
    ];
    let background: [number, number, number] = [255, 255, 255];
    for (let node: Element | null = el.parentElement; node; node = node.parentElement) {
      const bg = parse(getComputedStyle(node).backgroundColor);
      if (bg && bg[3] === 1) {
        background = [bg[0], bg[1], bg[2]];
        break;
      }
    }
    const layers = (shadow: string): string[] => {
      const out: string[] = [];
      let depth = 0;
      let start = 0;
      for (let i = 0; i < shadow.length; i++) {
        if (shadow[i] === "(") depth++;
        else if (shadow[i] === ")") depth--;
        else if (shadow[i] === "," && depth === 0) {
          out.push(shadow.slice(start, i).trim());
          start = i + 1;
        }
      }
      out.push(shadow.slice(start).trim());
      return out.filter((layer) => layer && layer !== "none");
    };
    const focusedStyle = getComputedStyle(el);
    const outlineWidth = Number.parseFloat(focusedStyle.outlineWidth);
    const outlineColor = parse(focusedStyle.outlineColor);
    const focusedLayers = layers(focusedStyle.boxShadow);
    const focusedOutline = `${focusedStyle.outlineWidth}|${focusedStyle.outlineStyle}|${focusedStyle.outlineColor}|${focusedStyle.outlineOffset}`;
    const drawsOutline =
      outlineWidth > 0 && !["none", "hidden"].includes(focusedStyle.outlineStyle) && outlineColor && outlineColor[3] > 0;

    (el as HTMLElement).blur();
    settle();
    const restingStyle = getComputedStyle(el);
    const restingLayers = layers(restingStyle.boxShadow);
    const restingOutline = `${restingStyle.outlineWidth}|${restingStyle.outlineStyle}|${restingStyle.outlineColor}|${restingStyle.outlineOffset}`;
    (el as HTMLElement).focus();
    settle();

    // Like a shadow, an outline only counts when focus is what draws it: a permanent one is decoration.
    const outline =
      drawsOutline && outlineColor && focusedOutline !== restingOutline
        ? { width: outlineWidth, color: over(outlineColor, background) }
        : null;

    const ring = focusedLayers
      .filter((layer) => !restingLayers.includes(layer) && !layer.includes("inset"))
      .map((layer) => {
        const color = parse(layer);
        const lengths = layer.replace(/rgba?\([^)]*\)|color\([^)]*\)/g, "").trim().split(/\s+/).map(Number.parseFloat);
        return { color, spread: lengths[3] ?? 0, blur: lengths[2] ?? 0 };
      })
      .filter((layer) => layer.color && layer.color[3] > 0 && layer.spread > 0 && layer.blur === 0)
      // The outermost painted ring is the indicator; inner layers are the gap against the background.
      .sort((a, b) => b.spread - a.spread)[0];

    if (outline) return { kind: "outline", width: outline.width, color: outline.color, background };
    if (ring?.color) return { kind: "ring", width: ring.spread, color: over(ring.color, background), background };
    return { kind: "none", width: 0, color: null, background };
  });
}

/**
 * Asserts the focused control paints a keyboard focus indicator that WCAG 1.4.11
 * would accept: drawn by focus itself (not a resting shadow), at least 2px, and
 * 3:1 against what is behind it.
 */
export async function assertFocusVisibleRing(control: Locator): Promise<void> {
  const indicator = await readFocusIndicator(control);
  expect(indicator.kind, "focus paints an outline or a ring that blur does not").not.toBe("none");
  expect(indicator.width).toBeGreaterThanOrEqual(2);
  expect(contrastRatio(indicator.color!, indicator.background)).toBeGreaterThanOrEqual(3);
}

/**
 * Asserts nothing clips the focus indicator of the focused control: the area it paints
 * (outline + offset, or the outermost ring spread) must stay inside every ancestor that
 * clips its overflow. Separate from visibility on purpose: a ring can be present and cut off.
 */
export async function assertFocusUnclipped(control: Locator): Promise<void> {
  await expect(control).toBeFocused();
  const clipped = await control.evaluate((el) => {
    const style = getComputedStyle(el);
    const outline =
      !["none", "hidden"].includes(style.outlineStyle) && Number.parseFloat(style.outlineWidth) > 0
        ? // How far the stroke ends beyond the box: a negative offset pulls it back inside (offset + width can be <= 0).
          Math.max(0, (Number.parseFloat(style.outlineOffset) || 0) + Number.parseFloat(style.outlineWidth))
        : 0;
    const spread = style.boxShadow
      .split(/,(?![^(]*\))/)
      .filter((layer) => layer.trim() && layer.trim() !== "none" && !layer.includes("inset"))
      .map((layer) => {
        const lengths = layer.replace(/rgba?\([^)]*\)|color\([^)]*\)|hsla?\([^)]*\)/g, "").trim().split(/\s+/).map(Number.parseFloat);
        return Math.max(0, lengths[3] ?? 0);
      })
      .reduce((max, value) => Math.max(max, value), 0);
    const reach = Math.max(outline, spread);
    if (reach === 0) return [];
    const box = el.getBoundingClientRect();
    const painted = { left: box.left - reach, top: box.top - reach, right: box.right + reach, bottom: box.bottom + reach };
    const cuts: string[] = [];
    for (let node = el.parentElement; node; node = node.parentElement) {
      const clip = getComputedStyle(node);
      const clipsX = clip.overflowX !== "visible";
      const clipsY = clip.overflowY !== "visible";
      if (!clipsX && !clipsY) continue;
      const rect = node.getBoundingClientRect();
      const inner = {
        left: rect.left + Number.parseFloat(clip.borderLeftWidth),
        top: rect.top + Number.parseFloat(clip.borderTopWidth),
        right: rect.right - Number.parseFloat(clip.borderRightWidth),
        bottom: rect.bottom - Number.parseFloat(clip.borderBottomWidth),
      };
      const sides = [
        clipsX && painted.left < inner.left - 0.5 ? "left" : "",
        clipsX && painted.right > inner.right + 0.5 ? "right" : "",
        clipsY && painted.top < inner.top - 0.5 ? "top" : "",
        clipsY && painted.bottom > inner.bottom + 0.5 ? "bottom" : "",
      ].filter(Boolean);
      if (sides.length) cuts.push(`${node.tagName.toLowerCase()}${node.className ? `.${String(node.className).split(" ")[0]}` : ""} (${sides.join(", ")})`);
    }
    return cuts;
  });
  expect(clipped, `the focus indicator is clipped by: ${clipped.join("; ")}`).toEqual([]);
}

export const A11Y_GATE_RULES = [
  "button-name",
  "link-name",
  "color-contrast",
  "aria-progressbar-name",
  "aria-valid-attr",
  "scrollable-region-focusable",
  "heading-order",
  "document-title",
  "html-has-lang",
] as const;

export async function assertA11yGate(page: Page, selector = "body"): Promise<void> {
  // Colour transitions (identity/mode switches) leave blended mid-frames that axe would sample.
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) {
      if (animation instanceof CSSTransition) animation.finish();
    }
  });
  const results = await new AxeBuilder({ page })
    .include(selector)
    .exclude(A11Y_AXE_EXCLUDES)
    .withRules([...A11Y_GATE_RULES])
    .analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(fg: [number, number, number], bg: [number, number, number]): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export async function readComputedContrast(
  page: Page,
  locator: ReturnType<Page["locator"]>,
): Promise<number> {
  return locator.evaluate((el) => {
    const parse = (css: string): [number, number, number] | null => {
      const m = css.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!m) return null;
      return [Number(m[1]), Number(m[2]), Number(m[3])];
    };
    const isTransparent = (css: string) => css === "transparent" || css === "rgba(0, 0, 0, 0)";
    const fgRgb = parse(getComputedStyle(el).color);
    let bgRgb: [number, number, number] | null = null;
    for (let node: Element | null = el; node; node = node.parentElement) {
      const bg = getComputedStyle(node).backgroundColor;
      if (!isTransparent(bg)) {
        bgRgb = parse(bg);
        if (bgRgb) break;
      }
    }
    if (!fgRgb || !bgRgb) {
      return 0;
    }
    const lum = (rgb: [number, number, number]) => {
      const channel = (c: number) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
    };
    const l1 = lum(fgRgb);
    const l2 = lum(bgRgb);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  });
}
