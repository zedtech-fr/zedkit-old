import { expect, test } from "@playwright/test";

const MOBILE = { width: 390, height: 844 };

function ratio(fontSize: number, lineHeight: number) {
  return lineHeight / fontSize;
}

test.describe("home mobile marketing body type (L2 + P0)", () => {
  test.use({ viewport: MOBILE });

  test("hero and band copy use shared P0 type roles", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.locator("#components").scrollIntoViewIfNeeded();

    const readings = await page.evaluate(() => {
      const read = (el: Element | null | undefined) => {
        if (!el) return null;
        const style = getComputedStyle(el);
        const fontSize = Number.parseFloat(style.fontSize);
        const lineHeight = Number.parseFloat(style.lineHeight);
        return { fontSize, lineHeight };
      };

      const getStarted = document.querySelector("#get-started");
      const startCopy = getStarted?.querySelector("#install-or-copy .text-home-persuasion");

      const components = document.querySelector("#components");
      const componentsCopy = components?.querySelector(
        "[data-home-component-families] .text-home-persuasion",
      );

      const useCases = document.querySelector("#use-cases");
      const useCaseWhy = useCases?.querySelector(".text-home-persuasion");

      return {
        heroLead: read(document.querySelector("[data-home-hero-sub]")),
        heroProof: read(document.querySelector("[data-home-hero-lead] .home-metadata-copy")),
        startCopy: read(startCopy),
        componentsCopy: read(componentsCopy),
        useCaseWhy: read(useCaseWhy),
      };
    });

    expect(readings.heroLead).not.toBeNull();
    expect(readings.heroLead!.fontSize).toBeGreaterThanOrEqual(14);
    expect(readings.heroLead!.fontSize).toBeLessThanOrEqual(16);
    expect(ratio(readings.heroLead!.fontSize, readings.heroLead!.lineHeight)).toBeGreaterThanOrEqual(1.45);

    expect(readings.heroProof).not.toBeNull();
    expect(readings.heroProof!.fontSize).toBeGreaterThanOrEqual(12);
    expect(readings.heroProof!.fontSize).toBeLessThanOrEqual(14);

    for (const [label, value] of Object.entries({
      startCopy: readings.startCopy,
      componentsCopy: readings.componentsCopy,
      useCaseWhy: readings.useCaseWhy,
    })) {
      expect(value, label).not.toBeNull();
      if (!value) continue;
      expect(value.fontSize, `${label} font-size`).toBeGreaterThanOrEqual(14);
      expect(value.fontSize, `${label} font-size`).toBeLessThanOrEqual(15);
      expect(ratio(value.fontSize, value.lineHeight), `${label} line-height ratio`).toBeGreaterThanOrEqual(1.45);
      expect(ratio(value.fontSize, value.lineHeight), `${label} line-height ratio`).toBeLessThanOrEqual(1.61);
    }
  });
});
