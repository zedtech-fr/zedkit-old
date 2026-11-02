import { expect, test } from "@playwright/test";

/*
 * D5: site/docs nav chrome keeps a hairline edge only — drop shadow reserved
 * for overlays. Desktop docs has no top bar (D3); assert on the phone docs header.
 */
test("docs nav has no drop shadow at a mid desktop width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/getting-started", { waitUntil: "networkidle" });
  const boxShadow = await page.locator("#nd-mobile-nav").evaluate((el) => getComputedStyle(el).boxShadow);
  expect(boxShadow).toBe("none");
});
