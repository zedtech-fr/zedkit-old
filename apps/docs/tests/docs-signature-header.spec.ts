import { expect, test } from "@playwright/test";

/** Persona proof for docs signature slice: raised header on /docs/* at mobile and desktop. */
test.describe("docs signature header elevation", () => {
  test("390px docs nav chrome", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/docs/getting-started");
    await expect(page.locator("#nd-docs-layout")).toBeVisible();
    await page.locator("#nd-nav").screenshot({
      path: "test-results/docs-signature-nav-390.png",
      animations: "disabled",
    });
  });

  test("1440px docs nav chrome", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/docs/getting-started");
    await expect(page.locator("#nd-docs-layout")).toBeVisible();
    await page.locator("#nd-nav").screenshot({
      path: "test-results/docs-signature-nav-1440.png",
      animations: "disabled",
    });
  });
});
