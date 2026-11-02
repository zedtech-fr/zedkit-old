import { expect, test } from "@playwright/test";

import { probe } from "./identity-helpers";

test.describe("site type hierarchy (P0)", () => {
  test("home hero and component families @1440", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/?identity=tide", { waitUntil: "networkidle" });

    const h1 = await page.locator("#home-page h1").first().evaluate((el) => {
      const s = getComputedStyle(el);
      return { size: Number.parseFloat(s.fontSize), weight: s.fontWeight };
    });
    expect(h1.size).toBeGreaterThanOrEqual(32);
    expect(h1.weight).toBe("600");

    const size = (selector: string) =>
      page.locator(selector).first().evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));
    const sectionTitle = await size("#components h2");
    // Example links are essential navigation, so they use the dense-UI size (13), not the 12px metadata size.
    const exampleLink = await size("#components [data-home-component-families] a");
    const cardBody = await size("#components .text-home-persuasion");
    expect(exampleLink).toBe(13);
    expect(cardBody).toBe(14);
    expect(exampleLink).toBeLessThan(cardBody);
    expect(cardBody).toBeLessThan(sectionTitle);
  });

  test("docs prose and labels use shared scale @390", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      localStorage.setItem("zk-docs-site-identity", "volt");
      localStorage.setItem("zk-docs-site-identity-opt-in", "1");
    });
    await page.goto("/docs/ui/trigger-actions-with-buttons", { waitUntil: "networkidle" });
    expect(await probe(page, "font-size", "var(--text-xs)")).toBe("12px");
    expect(await probe(page, "font-size", "var(--text-sm)")).toBe("13px");
    // Component pages are kit-composed: no `prose` wrapper, and the lead text keeps the shared scale.
    await expect(page.locator("#nd-page .prose")).toHaveCount(0);
    const lead = await page.locator("#nd-page p").first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(lead).toBeGreaterThanOrEqual(14);
  });
});
