import { expect, type Locator, test } from "@playwright/test";

async function expectCursor(locator: Locator, cursor: string) {
  await expect(locator).toHaveCSS("cursor", cursor);
}

test.describe("interactive cursors on docs previews", () => {
  test("button pointer and disabled not-allowed", async ({ page }) => {
    await page.goto("/docs/ui/trigger-actions-with-buttons", { waitUntil: "networkidle" });
    const preview = page.locator("[data-component-preview]").first();
    await preview.scrollIntoViewIfNeeded();
    await expectCursor(preview.getByRole("button", { name: "Create app" }), "pointer");
    await expectCursor(preview.getByRole("button", { name: "Disabled" }), "not-allowed");
  });

  test("text field uses text cursor", async ({ page }) => {
    await page.goto("/docs/ui/collect-text-input-with-a-label", { waitUntil: "networkidle" });
    const field = page.getByLabel("Full name").first();
    await field.scrollIntoViewIfNeeded();
    await expectCursor(field, "text");
  });

  test("tab and switch use pointer", async ({ page }) => {
    await page.goto("/docs/ui/switch-between-tabbed-panels", { waitUntil: "networkidle" });
    const preview = page.locator("[data-component-preview]").first();
    await preview.scrollIntoViewIfNeeded();
    await expectCursor(preview.getByRole("tab", { name: "Overview" }), "pointer");

    await page.goto("/docs/ui/toggle-a-checkbox-or-a-switch", { waitUntil: "networkidle" });
    const togglePreview = page.locator("[data-component-preview]").first();
    await togglePreview.scrollIntoViewIfNeeded();
    await expectCursor(togglePreview.getByRole("switch").first(), "pointer");
  });

  test("menu item uses pointer", async ({ page }) => {
    await page.goto("/docs/ui/open-a-menu-of-actions-from-a-button", { waitUntil: "networkidle" });
    const preview = page.locator("[data-component-preview]").first();
    await preview.scrollIntoViewIfNeeded();
    await preview.getByRole("button", { name: "Actions" }).click();
    const item = page.getByRole("menuitem").first();
    await expect(item).toBeVisible();
    await expectCursor(item, "pointer");
  });
});
