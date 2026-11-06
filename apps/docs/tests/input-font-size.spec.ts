import { expect, test, type Page } from "@playwright/test";

/**
 * iOS Safari zooms the page when a focused field computes below 16px, and the
 * zoom stays. The kit sizes every field from `--zk-input-font-size`, which has a
 * 16px floor on touch and phone-width screens.
 */
const MIN_FONT_PX = 16;

/** Phone-sized touch device: `isMobile` + `hasTouch` give `(pointer: coarse)`. */
const PHONE = {
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
} as const;

const FIELD_SELECTOR = [
  'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="range"]):not([type="color"]):not([type="image"])',
  "textarea",
  'select:not([aria-hidden="true"])',
  '[contenteditable=""]',
  '[contenteditable="true"]',
  '[role="combobox"]',
  '[role="textbox"]',
  '[role="searchbox"]',
].join(", ");

/** One docs page per field type the kit ships. */
const FIELD_PAGES = [
  { kind: "Input", path: "/docs/ui/collect-text-input-with-a-label" },
  { kind: "Textarea", path: "/docs/ui/collect-multi-line-text-input" },
  { kind: "Select", path: "/docs/ui/pick-one-option-from-a-dropdown" },
  { kind: "SecretField", path: "/docs/ui/display-a-shown-once-secret-with-copy" },
  { kind: "DataTable filter", path: "/docs/ui/show-a-sortable-filterable-paginated-data-table" },
  { kind: "Validated form", path: "/docs/ui/build-validated-forms-with-labels-errors-and-pending-state" },
  { kind: "Catalog search", path: "/catalog" },
] as const;

interface FieldReading {
  descriptor: string;
  fontSize: number;
}

async function readFields(page: Page): Promise<FieldReading[]> {
  return page.evaluate((selector) => {
    return Array.from(document.querySelectorAll<HTMLElement>(selector)).map((el) => {
      const label = el.getAttribute("aria-label") ?? el.getAttribute("name") ?? el.id ?? "";
      const type = el.getAttribute("type") ?? el.getAttribute("role") ?? "";
      return {
        descriptor: `${el.tagName.toLowerCase()}[${type}] ${label}`.trim(),
        fontSize: Number.parseFloat(getComputedStyle(el).fontSize),
      };
    });
  }, FIELD_SELECTOR);
}

async function expectNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    scale: window.visualViewport?.scale ?? 1,
  }));
  expect(metrics.scrollWidth, JSON.stringify(metrics)).toBeLessThanOrEqual(metrics.clientWidth + 1);
  expect(metrics.scale, JSON.stringify(metrics)).toBe(1);
}

test.describe("fields keep a 16px floor on touch screens", () => {
  test.use(PHONE);

  for (const { kind, path } of FIELD_PAGES) {
    test(`${kind} (${path}) computes at least ${MIN_FONT_PX}px and does not overflow on focus`, async ({
      page,
    }) => {
      await page.goto(path, { waitUntil: "networkidle" });
      expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true);

      const fields = await readFields(page);
      expect(fields.length, `no field found on ${path}`).toBeGreaterThan(0);
      const tooSmall = fields.filter((field) => field.fontSize < MIN_FONT_PX);
      expect(tooSmall, JSON.stringify(tooSmall)).toEqual([]);

      // Focus each visible text-entry field: the page must not widen or zoom.
      const entries = page.locator(FIELD_SELECTOR).filter({ visible: true });
      const count = await entries.count();
      for (let index = 0; index < count; index += 1) {
        await entries.nth(index).focus();
        await expectNoHorizontalOverflow(page);
      }
    });
  }

  test("the search dialog input computes at least 16px and does not overflow on focus", async ({ page }) => {
    await page.goto("/docs", { waitUntil: "networkidle" });
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog");
    await dialog.waitFor({ timeout: 10000 });
    const input = dialog.locator("input").first();
    await input.focus();
    await input.fill("input");
    const fontSize = await input.evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));
    expect(fontSize).toBeGreaterThanOrEqual(MIN_FONT_PX);
    await expectNoHorizontalOverflow(page);
  });
});

test.describe("narrow window with a fine pointer", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("Input also gets the floor below 768px", async ({ page }) => {
    await page.goto("/docs/ui/collect-text-input-with-a-label", { waitUntil: "networkidle" });
    expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(false);
    const fields = await readFields(page);
    expect(fields.length).toBeGreaterThan(0);
    expect(fields.filter((field) => field.fontSize < MIN_FONT_PX)).toEqual([]);
  });
});

test.describe("page zoom stays available", () => {
  test.use(PHONE);

  test("the viewport meta never blocks user scaling", async ({ page }) => {
    await page.goto("/docs/ui/collect-text-input-with-a-label", { waitUntil: "networkidle" });
    const content = await page.locator('meta[name="viewport"]').getAttribute("content");
    expect(content).toContain("width=device-width");
    expect(content).not.toMatch(/maximum-scale/i);
    expect(content).not.toMatch(/minimum-scale/i);
    expect(content).not.toMatch(/user-scalable\s*=\s*(no|0)/i);
  });

  test("text-size-adjust is not disabled", async ({ page }) => {
    await page.goto("/docs/ui/collect-text-input-with-a-label", { waitUntil: "networkidle" });
    const adjust = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement) as CSSStyleDeclaration & {
        webkitTextSizeAdjust?: string;
      };
      return style.getPropertyValue("-webkit-text-size-adjust") || style.webkitTextSizeAdjust || "";
    });
    expect(adjust).not.toBe("none");
  });
});

test.describe("desktop keeps the design size", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("Input and Select trigger stay at 14px with a fine pointer", async ({ page }) => {
    await page.goto("/docs/ui/collect-text-input-with-a-label", { waitUntil: "networkidle" });
    expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(false);
    const input = page.locator("main input:not([type='hidden'])").first();
    expect(await input.evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize))).toBe(14);

    await page.goto("/docs/ui/pick-one-option-from-a-dropdown", { waitUntil: "networkidle" });
    const trigger = page.locator("main [role='combobox']").first();
    expect(await trigger.evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize))).toBe(14);
  });
});
