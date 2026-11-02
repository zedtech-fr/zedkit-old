import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { contrastRatio, revealPreviewDisplay } from "./a11y-helpers";
import { useIdentity } from "./identity-helpers";

// Relative paths: the config baseURL decides the port.
const DRAWER_PAGE = "/docs/ui/slide-in-a-drawer-panel";
const DIALOG_PAGE = "/docs/ui/open-modal-dialogs";
const SELECT_PAGE = "/docs/ui/pick-one-option-from-a-dropdown";

type Rgba = [number, number, number, number];

function parseColor(css: string): Rgba {
  // Computed colours may be rgb(), oklab(), color(srgb ...): normalised in the page by `rgbaOf`.
  const m = css.match(/^rgba?\(([^)]+)\)$/);
  if (!m) throw new Error(`call rgbaOf first: ${css}`);
  const parts = m[1]!.split(/[,/\s]+/).filter(Boolean).map(Number);
  return [parts[0]!, parts[1]!, parts[2]!, parts[3] ?? 1];
}

/** Rewrite any CSS colour as rgba(r, g, b, a) through a canvas (keeps alpha, handles oklab). */
async function rgbaOf(page: Page, css: string): Promise<string> {
  return page.evaluate((value) => {
    const c = document.createElement("canvas");
    c.width = c.height = 1;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    // Draw over transparent so alpha survives, then read it back un-premultiplied.
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return `rgba(${r}, ${g}, ${b}, ${(a! / 255).toFixed(3)})`;
  }, css);
}

/** The panel colour over a backdrop of one flat colour (the blur averages what is behind). */
function over(fg: Rgba, backdrop: [number, number, number]): [number, number, number] {
  const a = fg[3];
  return [0, 1, 2].map((i) => fg[i]! * a + backdrop[i]! * (1 - a)) as [number, number, number];
}

async function openOverlay(page: Page, path: string, trigger: string, identity: string | null, theme: "light" | "dark") {
  await page.goto(path, { waitUntil: "networkidle" });
  await useIdentity(page, identity, theme);
  // Overlays mount in the nearest ThemeScope, so pin the look on the specimen itself.
  const preview = page.locator("[data-component-preview]").first();
  await revealPreviewDisplay(preview);
  if (identity) await preview.getByRole("combobox", { name: "Style of this demo" }).selectOption(identity);
  await preview.getByRole("button", { name: theme === "light" ? "Light" : "Dark", exact: true }).click();
  await page.getByRole("button", { name: trigger }).click();
  const panel = page.getByRole("dialog");
  await expect(panel).toBeVisible({ timeout: 10_000 });
  // Let the open animation settle before reading styles.
  await page.waitForTimeout(450);
  return panel;
}

const readSurface = async (page: Page, slot: string) => {
  const raw = await readRawSurface(page, slot);
  return {
    ...raw,
    background: await rgbaOf(page, raw.background),
    borderColor: await rgbaOf(page, raw.borderColor),
    scrim: await rgbaOf(page, raw.scrim),
  };
};

const readRawSurface = (page: Page, slot: string) =>
  page.evaluate((name) => {
    const panel = document.querySelector(`[data-slot="${name}-content"]`)!;
    const scrim = document.querySelector(`[data-slot="${name}-overlay"]`)!;
    const style = getComputedStyle(panel);
    return {
      background: style.backgroundColor,
      filter: style.backdropFilter || style.getPropertyValue("-webkit-backdrop-filter") || "none",
      borderColor: style.borderTopColor,
      shadow: style.boxShadow,
      scrim: getComputedStyle(scrim).backgroundColor,
    };
  }, slot);

const TARGETS = [
  { name: "drawer", path: DRAWER_PAGE, trigger: "Open drawer" },
  { name: "dialog", path: DIALOG_PAGE, trigger: "Open dialog" },
] as const;

test.describe("glass overlay surfaces", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  for (const target of TARGETS) {
    for (const theme of ["light", "dark"] as const) {
      test(`${target.name}: translucent, blurred, light scrim (${theme})`, async ({ page }) => {
        const panel = await openOverlay(page, target.path, target.trigger, "glass", theme);
        const s = await readSurface(page, target.name);
        const bg = parseColor(s.background);
        expect(bg[3]).toBeGreaterThan(0.4);
        expect(bg[3]).toBeLessThan(0.9);
        expect(s.filter).toContain("blur(");
        expect(s.filter).toContain("saturate(");
        expect(parseColor(s.borderColor)[3]).toBeLessThan(1);
        expect(s.shadow).not.toBe("none");
        // A lighter scrim than the stock 50%, so the blurred page shows through.
        expect(parseColor(s.scrim)[3]).toBeLessThanOrEqual(0.45);

        // Contrast holds over the lightest and darkest content that can sit behind the glass.
        const colors = await panel.evaluate((el) => {
          const pick = (selector: string) => {
            const node = el.querySelector(selector);
            return node ? getComputedStyle(node).color : null;
          };
          return { title: pick("h2"), body: pick("p") ?? pick("[id*=description]") };
        });
        // Backdrop range the page can realistically put behind the panel in each theme.
        const backdrops = theme === "light" ? [[255, 255, 255], [150, 150, 160]] : [[0, 0, 0], [90, 90, 100]];
        for (const raw of Object.values(colors)) {
          if (!raw) continue;
          const css = await rgbaOf(page, raw);
          const fg = parseColor(css);
          for (const backdrop of backdrops) {
            const ratio = contrastRatio([fg[0], fg[1], fg[2]], over(bg, backdrop as [number, number, number]));
            expect(ratio, `${theme} text ${css} over ${backdrop}`).toBeGreaterThanOrEqual(4.5);
          }
        }
      });

      test(`${target.name}: passes axe (${theme})`, async ({ page }) => {
        await openOverlay(page, target.path, target.trigger, "glass", theme);
        const results = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
        expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
      });
    }
  }

  test("other identities and the stock look keep opaque panels and the 50% frosted scrim", async ({ page }) => {
    for (const identity of [null, "mist", "press", "tide", "volt", "maison"]) {
      const panel = await openOverlay(page, DRAWER_PAGE, "Open drawer", identity, "light");
      const s = await readSurface(page, "drawer");
      expect(parseColor(s.background)[3], `${identity} panel`).toBe(1);
      expect(s.filter === "none" || s.filter === "", `${identity} filter`).toBe(true);
      expect(parseColor(s.scrim)[3], `${identity} scrim`).toBeGreaterThanOrEqual(0.49);
      await page.keyboard.press("Escape");
      await expect(panel).toBeHidden();
    }
  });

  test("select list is glass too", async ({ page }) => {
    await page.goto(SELECT_PAGE, { waitUntil: "networkidle" });
    await useIdentity(page, "glass", "light");
    const preview = page.locator("[data-component-preview]").first();
    await revealPreviewDisplay(preview);
    await preview.getByRole("combobox", { name: "Style of this demo" }).selectOption("glass");
    await page.getByRole("combobox", { name: "Pick a region" }).first().click();
    const list = page.getByRole("listbox");
    await expect(list).toBeVisible();
    const s = await list.evaluate((el) => {
      const style = getComputedStyle(el);
      return { background: style.backgroundColor, filter: style.backdropFilter || "none" };
    });
    expect(parseColor(s.background)[3]).toBeLessThan(1);
    expect(s.filter).toContain("blur(");
  });

  test("forced colors drop the blur and the tint", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await openOverlay(page, DRAWER_PAGE, "Open drawer", "glass", "light");
    const s = await readSurface(page, "drawer");
    expect(s.filter === "none" || s.filter === "").toBe(true);
  });
});

test.describe("glass overlay fallbacks (source)", () => {
  const css = readFileSync(resolve(process.cwd(), "../../packages/ui/src/identities/glass.css"), "utf8");

  test("reduced transparency, missing backdrop-filter and forced colors fall back to opaque", () => {
    const reduced = css.slice(css.indexOf("@media (prefers-reduced-transparency"));
    expect(reduced).toMatch(/--zk-glass-overlay-alpha: 0\.9\d;[\s\S]*?--zk-glass-overlay-blur: 0px/);
    const supports = css.slice(css.indexOf("@supports not"));
    expect(supports).toMatch(/--zk-glass-overlay-alpha: 0\.9\d/);
    expect(css).toMatch(/@media \(forced-colors: active\)[\s\S]*?backdrop-filter: none/);
  });

  test("overlay blur is declared with the -webkit- prefix", () => {
    expect(css).toMatch(/-webkit-backdrop-filter: var\(--zk-glass-overlay-filter\)/);
  });
});
