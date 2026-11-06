import { expect, test, type Locator, type Page } from "@playwright/test";

async function expectFocusContained(page: Page, container: Locator, cycles: number): Promise<void> {
  for (let i = 0; i < cycles; i++) {
    await page.keyboard.press("Tab");
    await expect
      .poll(async () => container.evaluate((el) => el.contains(document.activeElement)))
      .toBe(true);
  }
  for (let i = 0; i < cycles; i++) {
    await page.keyboard.press("Shift+Tab");
    await expect
      .poll(async () => container.evaluate((el) => el.contains(document.activeElement)))
      .toBe(true);
  }
}

test.describe("modal overlay focus trap", () => {
  test("admin dashboard Edit drawer keeps Tab inside and restores the trigger on Escape", async ({ page }) => {
    await page.goto("/docs/build-an-admin-dashboard", { waitUntil: "networkidle" });
    const row = page.getByRole("row", { name: /reports-api/ });
    const edit = row.getByRole("button", { name: "Edit" });
    await edit.click();
    const dialog = page.getByRole("dialog", { name: "Edit reports-api" });
    await expect(dialog).toBeVisible();
    const deleteBehind = row.getByRole("button", { name: "Delete" });
    await expect(deleteBehind).toBeHidden();
    await expectFocusContained(page, dialog, 12);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(edit).toBeFocused();
  });

  test("drawer docs demo keeps Tab inside the panel", async ({ page }) => {
    await page.goto("/docs/ui/slide-in-a-drawer-panel", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Open drawer" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expectFocusContained(page, dialog, 10);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("dialog docs demo keeps Tab inside the panel", async ({ page }) => {
    await page.goto("/docs/ui/open-modal-dialogs", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Open dialog" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expectFocusContained(page, dialog, 10);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});
