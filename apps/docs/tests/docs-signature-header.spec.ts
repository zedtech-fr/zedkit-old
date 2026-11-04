import { expect, test } from "@playwright/test";

/** Persona proof for docs signature slice: the mobile docs header and the desktop docs sidebar (desktop /docs/* has no top header). */
test.describe("docs signature header elevation", () => {
  test("390px docs mobile header", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/docs/getting-started");
    await expect(page.locator("#nd-docs-layout")).toBeVisible();
    await page.locator("#nd-mobile-nav").screenshot({
      path: "test-results/docs-signature-nav-390.png",
      animations: "disabled",
    });
  });

  test("1440px docs sidebar chrome", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/docs/getting-started");
    await expect(page.locator("#nd-docs-layout")).toBeVisible();
    await page.locator("#nd-sidebar").screenshot({
      path: "test-results/docs-signature-nav-1440.png",
      animations: "disabled",
    });
  });
});
