import { expect, test } from "@playwright/test";

import { DEFAULT_IDENTITY } from "../lib/default-identity";
import { featuredPackageVersion } from "../content/gallery";

const BASE = "http://127.0.0.1:3100";

for (const viewport of [
  { width: 390, height: 844, name: "390" },
  { width: 1024, height: 800, name: "1024" },
  { width: 1280, height: 800, name: "1280" },
] as const) {
  test.describe(`hero calm (${viewport.name}px)`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("hero has one visible version badge link (header only)", async ({ page }) => {
      await page.goto(BASE, { waitUntil: "networkidle" });
      const shell = viewport.width < 768 ? page.locator("#nd-mobile-nav") : page.locator("#nd-nav");
      const badges = shell.getByRole("link", { name: new RegExp(`v${featuredPackageVersion}`) }).filter({ visible: true });
      await expect(badges).toHaveCount(1);
    });

    test("hero has no stray markup line and demo style stays scoped", async ({ page }) => {
      await page.goto(BASE, { waitUntil: "networkidle" });
      const mainText = await page.locator("main").innerText();
      expect(mainText).not.toMatch(/<div data-identity=/);

      const shellBefore = await page.locator("html").getAttribute("data-identity");
      const proof = page.locator("[data-home-hero-proof]");
      await expect(proof.getByText("Display", { exact: true })).toBeVisible();
      await proof.getByRole("combobox", { name: "Identity for this demo" }).click();
      await page.getByRole("option", { name: "Glass" }).click();
      await expect(proof.locator("[data-identity-scope]")).toHaveAttribute("data-identity", "glass");
      expect(await page.locator("html").getAttribute("data-identity")).toBe(shellBefore ?? DEFAULT_IDENTITY);
    });
  });
}
