import { expect, test } from "@playwright/test";

import { assertA11yGate } from "./a11y-helpers";
import { probe, useIdentity } from "./identity-helpers";

// Relative path: the config baseURL decides the port.
const HOME = "/";

test.describe("volt identity", () => {
  test("sets the page in Geist with a metric-aligned fallback and a 12px xs label step", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("zk-docs-site-identity", "volt");
      localStorage.setItem("zk-docs-site-identity-opt-in", "1");
    });
    await page.goto(HOME, { waitUntil: "networkidle" });
    await useIdentity(page, "volt", "light");
    const body = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(body.startsWith('"Geist Variable"')).toBe(true);
    expect(body).toContain('"Geist Variable Fallback"');
    const heading = await page.evaluate(() => getComputedStyle(document.querySelector("h1")!).fontFamily);
    expect(heading).toBe(body);
    await expect.poll(() => page.evaluate(() => document.fonts.check('16px "Geist Variable"'))).toBe(true);
    expect(await probe(page, "font-size", "var(--text-xs)")).toBe("12px");
  });

  test("uses hairline radii and an acid accent in dark", async ({ page }) => {
    await page.goto(HOME, { waitUntil: "networkidle" });
    await useIdentity(page, "volt", "dark");
    expect(await probe(page, "border-top-left-radius", "var(--radius-xl)", "volt")).toBe("6px");
    expect(await probe(page, "color", "hsl(var(--primary))", "volt")).toBe(
      await probe(page, "color", "hsl(72 90% 58%)", "volt"),
    );
  });

  for (const theme of ["light", "dark"] as const) {
    test(`passes the a11y gate in ${theme}`, async ({ page }) => {
      await page.goto(HOME, { waitUntil: "networkidle" });
      await useIdentity(page, "volt", theme);
      await assertA11yGate(page);
    });
  }

  for (const width of [360, 390] as const) {
    test(`does not overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(HOME, { waitUntil: "networkidle" });
      await useIdentity(page, "volt", "light");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
