import { expect, test } from "@playwright/test";

import { probe } from "./identity-helpers";

const MOBILE = { width: 390, height: 844 };

test.describe("typo P0 type floor @390", () => {
  test.use({ viewport: MOBILE });

  test("form controls including docs search compute at least 16px", async ({ page }) => {
    await page.goto("/docs/getting-started", { waitUntil: "networkidle" });

    await page.locator("#nd-mobile-nav").getByRole("button", { name: "Search the documentation" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const searchInput = dialog.locator("input").first();
    await expect(searchInput).toBeFocused();
    expect(Number.parseFloat(await searchInput.evaluate((el) => getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);

    await page.keyboard.press("Escape");
    await page.goto("/docs/ui/build-validated-forms-with-labels-errors-and-pending-state", { waitUntil: "networkidle" });
    const demoInput = page.locator('[data-slot="demo-frame"] input').first();
    if (await demoInput.count()) {
      expect(Number.parseFloat(await demoInput.evaluate((el) => getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
    }
  });

  test("shared --text-* tokens never resolve below 12px", async ({ page }) => {
    await page.goto("/?identity=tide", { waitUntil: "networkidle" });
    expect(await probe(page, "font-size", "var(--text-xs)")).toBe("12px");
    expect(await probe(page, "font-size", "var(--text-sm)")).toBe("13px");
    expect(await probe(page, "font-size", "var(--text-base)")).toBe("14px");
  });

  test("visible marketing copy on home is at least 12px", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const minSize = await page.evaluate(() => {
      const root = document.querySelector("#home-page");
      if (!root) return 99;
      let min = 99;
      for (const el of root.querySelectorAll("p, span, a, h1, h2, h3, li, button")) {
        const size = Number.parseFloat(getComputedStyle(el).fontSize);
        if (size > 0 && size < min) min = size;
      }
      return min;
    });
    expect(minSize).toBeGreaterThanOrEqual(12);
  });
});
