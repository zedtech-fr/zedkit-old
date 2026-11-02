import { expect, test, type Page } from "@playwright/test";

import { assertA11yGate } from "./a11y-helpers";
import { probe, useIdentity } from "./identity-helpers";

// Relative path: the config baseURL decides the port.
const HOME = "/";
const BUTTON_PAGE = "/docs/ui/trigger-actions-with-buttons";

async function openAsIdentity(page: Page, url: string, identity: string, theme: "light" | "dark") {
  await page.addInitScript(({ id, mode }) => {
    localStorage.removeItem("zk-docs-site-identity-custom");
    localStorage.setItem("zk-docs-site-identity", id);
    localStorage.setItem("zk-docs-site-identity-opt-in", "1");
    localStorage.setItem("theme", mode);
  }, { id: identity, mode: theme });
  await page.goto(url, { waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("data-identity", identity);
  await expect(page.locator("html")).toHaveClass(new RegExp(`\\b${theme}\\b`));
}

test.describe("press identity", () => {
  test("sets a serif display over a grotesque body, with metric-aligned fallbacks", async ({ page }) => {
    await page.goto(HOME, { waitUntil: "networkidle" });
    const stock = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(stock).not.toContain("Space Grotesk");

    await useIdentity(page, "press", "light");
    const body = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(body.startsWith('"Space Grotesk Variable"')).toBe(true);
    expect(body).toContain('"Space Grotesk Variable Fallback"');
    const heading = await page.evaluate(() => getComputedStyle(document.querySelector("h1")!).fontFamily);
    expect(heading.startsWith('"Newsreader Variable"')).toBe(true);
    expect(heading).toContain('"Newsreader Variable Fallback"');
    await expect
      .poll(() => page.evaluate(() => document.fonts.check('16px "Space Grotesk Variable"')))
      .toBe(true);
    await expect.poll(() => page.evaluate(() => document.fonts.check('16px "Newsreader Variable"'))).toBe(true);
  });

  test("has square corners, soft shadows and a hairline rule", async ({ page }) => {
    await openAsIdentity(page, HOME, "press", "light");
    expect(await probe(page, "border-top-left-radius", "var(--radius-xl)", "press")).toBe("0px");
    const shadowMd = await probe(page, "box-shadow", "var(--zk-shadow-md)", "press");
    expect(shadowMd).not.toMatch(/^0px 0px 0px 0px/);
    expect(await probe(page, "box-shadow", "var(--zk-shadow-overlay)", "press")).not.toMatch(/0px 0px 0px 1px/);
    expect(await probe(page, "border-top-width", "var(--zk-border-width)")).toBe("1px");
  });

  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }] as const) {
    test(`home cards and outline controls stay hairline at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await openAsIdentity(page, HOME, "press", "light");
      if (viewport.width >= 768) {
        const card = page.locator('#home-page #identities:not(.sr-only) [data-slot="card"]').first();
        await expect(card).toBeVisible({ timeout: 20_000 });
        const cardBorder = await card.evaluate((el) => Number.parseFloat(getComputedStyle(el).borderTopWidth));
        expect(cardBorder).toBeLessThanOrEqual(1.01);
      }
      await openAsIdentity(page, BUTTON_PAGE, "press", "light");
      const outline = page
        .locator("[data-component-preview]")
        .first()
        .getByRole("button", { name: "Cancel" });
      await outline.scrollIntoViewIfNeeded();
      const width = await outline.evaluate((el) => Number.parseFloat(getComputedStyle(el).borderTopWidth));
      expect(width).toBeLessThanOrEqual(1.01);
    });
  }

  for (const theme of ["light", "dark"] as const) {
    test(`button demo outline stays hairline in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await openAsIdentity(page, BUTTON_PAGE, "press", theme);
      const outline = page
        .locator("[data-component-preview]")
        .first()
        .getByRole("button", { name: "Cancel" });
      await outline.scrollIntoViewIfNeeded();
      const width = await outline.evaluate((el) => Number.parseFloat(getComputedStyle(el).borderTopWidth));
      expect(width).toBeLessThanOrEqual(1.01);
    });
  }

  for (const theme of ["light", "dark"] as const) {
    test(`passes the a11y gate in ${theme}`, async ({ page }) => {
      await page.goto(HOME, { waitUntil: "networkidle" });
      await useIdentity(page, "press", theme);
      await assertA11yGate(page);
    });
  }

  for (const width of [360, 390] as const) {
    test(`does not overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(HOME, { waitUntil: "networkidle" });
      await useIdentity(page, "press", "light");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
