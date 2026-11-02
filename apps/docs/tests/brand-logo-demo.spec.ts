import { expect, test } from "@playwright/test";

import { DOCS_SHIPPED_IDENTITIES, pinDemoLook } from "./a11y-helpers";

const URL = "/docs/ui/show-your-brand-logo";

test.describe("brand logo preview shows a fictional brand in header, footer and share image", () => {
  for (const identity of DOCS_SHIPPED_IDENTITIES) {
    for (const mode of ["light", "dark"] as const) {
      for (const [device, width, height] of [
        ["desktop", 1280, 1000],
        ["phone", 390, 844],
      ] as const) {
        test(`${device} ${identity} ${mode}`, async ({ page }) => {
          await page.setViewportSize({ width, height });
          await page.goto(URL, { waitUntil: "networkidle" });
          const preview = page.locator("[data-component-preview]").first();
          await pinDemoLook(preview, identity, mode);
          const home = preview.getByRole("link", { name: "Harbor Studio" });
          await expect(home).toBeVisible();
          await expect(home.getByRole("img")).toHaveCount(0);
          await expect(preview.getByRole("img", { name: "Harbor Studio" }).first()).toBeVisible();
          await expect(preview.getByRole("img", { name: /Share image preview/ })).toBeVisible();
          await expect(preview.getByText("© 2026 Harbor Studio")).toBeVisible();
          const sideways = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          );
          expect(sideways).toBeLessThanOrEqual(1);
          await preview.screenshot({ path: `test-results/brand-logo-${identity}-${mode}-${device}.png` });
        });
      }
    }
  }
});
