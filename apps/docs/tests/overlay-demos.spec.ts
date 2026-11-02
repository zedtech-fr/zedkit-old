import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { pinDemoLook } from "./a11y-helpers";

const DOC_PAGES = {
  badge: "/docs/ui/show-a-status-or-count-badge",
  dialog: "/docs/ui/open-modal-dialogs",
  drawer: "/docs/ui/slide-in-a-drawer-panel",
} as const;

async function expectNoAxeViolations(page: Page, selector: string): Promise<void> {
  const results = await new AxeBuilder({ page }).include(selector).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test.describe("docs live overlay demos", () => {
  test("badge preview passes axe", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (event) => errors.push(String(event)));
    await page.goto(DOC_PAGES.badge, { waitUntil: "networkidle" });
    const preview = page.locator("[data-component-preview]").first();
    await pinDemoLook(preview, "tide", "light");
    await expect(preview).toBeVisible();
    await expect(page.getByRole("tab", { name: "Preview" }).first()).toBeVisible();
    await expectNoAxeViolations(page, "[data-component-preview]");
    expect(errors).toEqual([]);
  });

  for (const [name, trigger, path] of [
    ["dialog", "Open dialog", DOC_PAGES.dialog],
    ["drawer", "Open drawer", DOC_PAGES.drawer],
  ] as const) {
    test(`${name}: open → axe → Escape closes`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (event) => errors.push(String(event)));
      await page.goto(path, { waitUntil: "networkidle" });
      const preview = page.locator("[data-component-preview]").first();
      await pinDemoLook(preview, "press", "dark");
      await page.getByRole("button", { name: trigger }).click();
      const overlay = page.getByRole("dialog");
      await expect(overlay).toBeVisible({ timeout: 10_000 });
      await expect(overlay.getByRole("heading", { name: "Details" })).toBeVisible();
      await expectNoAxeViolations(page, '[role="dialog"]');
      await page.keyboard.press("Escape");
      await expect(overlay).toBeHidden();
      expect(errors).toEqual([]);
    });
  }
});
