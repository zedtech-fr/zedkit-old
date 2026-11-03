import { expect, test, type Page } from "@playwright/test";

/*
 * Shell layout rhythm: the docs article keeps 20-24px mobile gutters from
 * the page-gutter token, and the catalog shell caps its band on a 1160px
 * marketing container with a section rhythm that drops to the 48-72px
 * mobile band (72-112px on desktop). Scoped to docs + catalog: the home
 * page keeps its own rhythm (other lanes pin it exactly). Relative paths:
 * the config baseURL decides the port.
 */

/** Computed px of a token expression, read inside the catalog shell. */
async function scopedToken(page: Page, property: string, value: string) {
  return page.evaluate(
    ([prop, val]) => {
      const el = document.createElement("span");
      el.style.setProperty(prop, val);
      document.querySelector("[data-catalog-shell]")!.appendChild(el);
      const out = getComputedStyle(el).getPropertyValue(prop);
      el.remove();
      return out;
    },
    [property, value] as const,
  );
}

test("docs article keeps token gutters on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/getting-started", { waitUntil: "networkidle" });
  const gutter = await page.locator("#nd-page").evaluate((el) => getComputedStyle(el).paddingLeft);
  const token = await page.evaluate(() => {
    const el = document.createElement("span");
    el.style.setProperty("padding-left", "var(--zk-page-gutter)");
    document.querySelector("main")!.appendChild(el);
    const out = getComputedStyle(el).paddingLeft;
    el.remove();
    return out;
  });
  expect(gutter).toBe(token);
  expect(Number.parseFloat(gutter)).toBeGreaterThanOrEqual(16);
});

test("catalog band sits on the 1160px container", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/catalog", { waitUntil: "networkidle" });
  const maxWidth = await page
    .locator('[data-catalog-shell] section[data-slot="section"] > [data-slot="container"]')
    .evaluate((el) => getComputedStyle(el).maxWidth);
  expect(maxWidth).toBe("1160px");
});

test("catalog section rhythm drops to the mobile band", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/catalog", { waitUntil: "networkidle" });
  const mobile = Number.parseFloat(await scopedToken(page, "padding-top", "var(--zk-section-lg)"));
  expect(mobile).toBeGreaterThanOrEqual(48);
  expect(mobile).toBeLessThanOrEqual(72);

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/catalog", { waitUntil: "networkidle" });
  const desktop = Number.parseFloat(await scopedToken(page, "padding-top", "var(--zk-section-lg)"));
  expect(desktop).toBeGreaterThan(72);
  expect(desktop).toBeLessThanOrEqual(112);
});
