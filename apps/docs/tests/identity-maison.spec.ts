import { expect, test, type Page } from "@playwright/test";

import { assertA11yGate } from "./a11y-helpers";
import { probe, useIdentity } from "./identity-helpers";

// Relative path: the config baseURL decides the port.
const HOME = "/";
const BUTTON_PAGE = "/docs/ui/trigger-actions-with-buttons";

const ms = (value: string) => Number.parseFloat(value) * (value.trim().endsWith("ms") ? 1 : 1000);

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

test.describe("maison identity", () => {
  test("sets Cormorant headings over a Jost body, with fallback faces", async ({ page }) => {
    await page.goto(HOME, { waitUntil: "networkidle" });
    const stock = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(stock).not.toContain("Jost");

    await useIdentity(page, "maison", "light");
    const body = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(body.startsWith('"Jost Variable"')).toBe(true);
    expect(body).toContain('"Jost Variable Fallback"');
    const heading = await page.evaluate(() => getComputedStyle(document.querySelector("h1")!).fontFamily);
    expect(heading.startsWith('"Cormorant Variable"')).toBe(true);
    expect(heading).toContain('"Cormorant Variable Fallback"');
    await expect.poll(() => page.evaluate(() => document.fonts.check('16px "Jost Variable"'))).toBe(true);
    await expect.poll(() => page.evaluate(() => document.fonts.check('16px "Cormorant Variable"'))).toBe(true);
    expect(await probe(page, "border-top-left-radius", "var(--radius-xl)", "maison")).toBe("2px");
  });

  test("keeps interactions within the caps and saves the slow motion for reveals", async ({ page }) => {
    await page.goto(HOME, { waitUntil: "networkidle" });
    await useIdentity(page, "maison", "light");
    expect(ms(await probe(page, "transition-duration", "var(--motion-fast)"))).toBeLessThanOrEqual(200);
    expect(ms(await probe(page, "transition-duration", "var(--motion-base)"))).toBeLessThanOrEqual(200);
    expect(ms(await probe(page, "transition-duration", "var(--motion-slow)"))).toBeLessThanOrEqual(300);
    expect(ms(await probe(page, "transition-duration", "var(--zk-lift-duration)"))).toBeLessThanOrEqual(200);
    expect(ms(await probe(page, "transition-duration", "var(--zk-reveal-duration)"))).toBeGreaterThan(300);
  });

  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }] as const) {
    test(`home cards and outline controls stay hairline at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await openAsIdentity(page, HOME, "maison", "light");
      expect(await probe(page, "border-top-width", "var(--zk-border-width)")).toBe("1px");
      if (viewport.width >= 768) {
        const card = page.locator('#home-page #identities:not(.sr-only) [data-slot="card"]').first();
        await expect(card).toBeVisible({ timeout: 20_000 });
        const cardBorder = await card.evaluate((el) => Number.parseFloat(getComputedStyle(el).borderTopWidth));
        expect(cardBorder).toBeLessThanOrEqual(1.01);
      }
      await openAsIdentity(page, BUTTON_PAGE, "maison", "light");
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
      await openAsIdentity(page, BUTTON_PAGE, "maison", theme);
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
      await useIdentity(page, "maison", theme);
      await assertA11yGate(page);
    });
  }

  for (const width of [360, 390] as const) {
    test(`does not overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(HOME, { waitUntil: "networkidle" });
      await useIdentity(page, "maison", "light");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
