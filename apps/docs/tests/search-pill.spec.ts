import { expect, test } from "@playwright/test";

const PAGES = ["/", "/docs/getting-started"] as const;
const SIZES = [
  { width: 360, height: 640 },
  { width: 390, height: 844 },
] as const;

for (const size of SIZES) {
  for (const path of PAGES) {
    test(`phone header search opens the dialog (${size.width}px, ${path})`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto(path);
      const header = page.locator("#nd-mobile-nav");
      const headerSearch = header.getByRole("button", { name: "Search the documentation" });
      await expect(headerSearch).toBeVisible();
      await expect(page.locator("[data-search-pill]")).toHaveCount(0);
      await headerSearch.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog.locator("input").first()).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(headerSearch).toBeFocused();
    });
  }
}

test("Tab stays inside the phone search dialog", async ({ page }) => {
  await page.setViewportSize(SIZES[1]);
  await page.goto("/docs/getting-started");
  const headerSearch = page.locator("#nd-mobile-nav").getByRole("button", { name: "Search the documentation" });
  await headerSearch.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("input").first()).toBeFocused();
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  }
});

test("Shift+Tab stays inside the phone search dialog", async ({ page }) => {
  await page.setViewportSize(SIZES[1]);
  await page.goto("/docs/getting-started");
  await page.locator("#nd-mobile-nav").getByRole("button", { name: "Search the documentation" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.locator("input").first().focus();
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Shift+Tab");
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  }
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
  test("search dialog opens without travel animations", async ({ page }) => {
    await page.goto("/");
    await page.locator("#nd-mobile-nav").getByRole("button", { name: "Search the documentation" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(await page.evaluate(() => document.querySelector("[data-search-bar]")?.getAnimations().length ?? 0)).toBe(0);
    await page.keyboard.press("Escape");
  });
});
