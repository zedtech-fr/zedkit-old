import { expect, test } from "@playwright/test";

import { DEFAULT_IDENTITY } from "../lib/default-identity";

// Relative paths: the config baseURL decides the port.
const PAGES = ["/", "/docs/getting-started"] as const;

test("site shell has no global identity chooser on desktop or phone", async ({ page }) => {
  for (const width of [1280, 390] as const) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/docs/getting-started", { waitUntil: "networkidle" });
    await expect(page.getByRole("combobox", { name: "Identity" })).toHaveCount(0);
    await expect(page.getByLabel("Try another identity")).toHaveCount(0);
    await expect(page.locator("#nd-nav select, #nd-mobile-nav select")).toHaveCount(0);
  }
});

test("shell keeps the default identity across pages and reload", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  for (const path of PAGES) {
    await page.goto(path, { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("data-identity", DEFAULT_IDENTITY);
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("data-identity", DEFAULT_IDENTITY);
  }
});

for (const width of [360, 390] as const) {
  test(`phone shell does not overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    for (const path of PAGES) {
      await page.goto(path, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    }
  });
}
