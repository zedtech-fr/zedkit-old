import { expect, test } from "@playwright/test";

const PAGES = ["/", "/docs/getting-started"];

for (const path of PAGES) {
  test.describe(`phone header on ${path}`, () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("name left, actions right, no overflow, 44px targets", async ({ page }) => {
      await page.goto(path);
      const header = page.locator("#nd-mobile-nav");
      await expect(header).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
      const home = header.getByRole("link", { name: "zedkit home" });
      await expect(home).toBeVisible();
      expect((await home.boundingBox())?.x ?? 99).toBeLessThan(24);
      await expect(header.getByRole("button", { name: /Open (menu|navigation)/ })).toBeVisible();
      for (const button of await header.locator("a, button").all()) {
        const box = await button.boundingBox();
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(43.5);
        expect(box?.width ?? 0).toBeGreaterThanOrEqual(43.5);
      }
    });

    test("the home link shows the logo mark next to the name", async ({ page }) => {
      await page.goto(path);
      const home = page.locator("#nd-mobile-nav").getByRole("link", { name: "zedkit home" });
      const mark = home.locator("svg");
      await expect(mark).toHaveCount(1);
      await expect(mark).toBeVisible();
      await expect(mark).toHaveAttribute("aria-hidden", "true");
      await expect(home).toContainText("zedkit");
      const box = await mark.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThan(0);
    });

    test("search lives in the header and opens the dialog without a floating button", async ({ page }) => {
      await page.goto(path);
      const header = page.locator("#nd-mobile-nav");
      const headerSearch = header.getByRole("button", { name: "Search the documentation" });
      await expect(headerSearch).toBeVisible();
      const headerBox = await headerSearch.boundingBox();
      expect(headerBox?.height ?? 0).toBeGreaterThanOrEqual(43.5);
      expect((headerBox?.y ?? 0) + (headerBox?.height ?? 0)).toBeLessThan(80);
      await expect(page.locator("[data-search-pill]")).toHaveCount(0);
      await headerSearch.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog.locator("input")).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(headerSearch).toBeFocused();
    });
  });
}

test("desktop keeps the stock header", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await expect(page.locator("#nd-mobile-nav")).toBeHidden();
  await expect(page.locator("#nd-nav")).toBeVisible();
});
