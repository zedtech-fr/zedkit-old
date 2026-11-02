import { expect, test } from "@playwright/test";

const BASE = "http://127.0.0.1:3100";

test.describe("docs dialog and drawer previews show realistic screens", () => {
  test("dialog: an order sheet with a status, not a stub", async ({ page }) => {
    await page.goto(`${BASE}/docs/ui/open-modal-dialogs`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Open dialog" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Order details" })).toBeVisible();
    await expect(dialog.getByText("Camille Rousseau")).toBeVisible();
    await expect(dialog.getByText("€101.50")).toBeVisible();
    await expect(dialog.getByText("Awaiting shipment")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Mark as shipped" })).toBeVisible();
  });

  test("dialog: props table lists the root props (#1061)", async ({ page }) => {
    await page.goto(`${BASE}/docs/ui/open-modal-dialogs`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Props" })).toBeVisible();
    await expect(page.getByText("onOpenChange?", { exact: true })).toBeVisible();
    await expect(page.getByText("modal?", { exact: true })).toBeVisible();
  });

  test("confirm: the delete flow ends in a visible result", async ({ page }) => {
    await page.goto(`${BASE}/docs/ui/confirm-destructive-actions`, { waitUntil: "networkidle" });
    await expect(page.getByText("Website relaunch").first()).toBeVisible();
    await page.getByRole("button", { name: "Delete item" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: /Delete .Website relaunch.\?/ })).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText("Active").first()).toBeVisible();
    await page.getByRole("button", { name: "Delete item" }).click();
    await dialog.getByRole("button", { name: "Delete project" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText("The project and its 14 tasks were deleted.")).toBeVisible();
  });

  test("confirm: custom labels preview keeps access when cancelled, revokes when confirmed", async ({ page }) => {
    await page.goto(`${BASE}/docs/ui/confirm-destructive-actions`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Custom button labels", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Revoke", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Revoke this API key?" })).toBeVisible();
    await dialog.getByRole("button", { name: "Keep access" }).click();
    await expect(page.getByText("In use")).toBeVisible();
    await page.getByRole("button", { name: "Revoke", exact: true }).click();
    await dialog.getByRole("button", { name: "Revoke", exact: true }).click();
    await expect(page.getByText("Revoked", { exact: true })).toBeVisible();
  });

  test("drawer: a task sheet with details and activity", async ({ page }) => {
    await page.goto(`${BASE}/docs/ui/slide-in-a-drawer-panel`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Open drawer" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Task details" })).toBeVisible();
    await expect(dialog.getByText("Review the homepage mockups")).toBeVisible();
    await expect(dialog.getByText("Camille Rousseau")).toBeVisible();
    await expect(dialog.getByText("Activity")).toBeVisible();
    await expect(dialog.getByLabel("Note")).toBeVisible();
  });

  test("drawer: filters bottom sheet and side menu previews open", async ({ page }) => {
    await page.goto(`${BASE}/docs/ui/slide-in-a-drawer-panel`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Filters", exact: true }).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet.getByRole("heading", { name: "Filters" })).toBeVisible();
    await sheet.getByLabel("Awaiting shipment").click();
    await expect(sheet.getByText("2 status selected.")).toBeVisible();
    await sheet.getByRole("button", { name: "Reset" }).click();
    await expect(sheet.getByText("All orders are shown.")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    const menu = page.getByRole("dialog");
    await expect(menu.getByRole("heading", { name: "Menu" })).toBeVisible();
    await expect(menu.getByRole("button", { name: "Billing" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
  });

  test("route modal: an order detail opens over the list and closes", async ({ page }) => {
    await page.goto(`${BASE}/docs/ui/render-a-route-as-a-modal-over-the-list`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Open route modal" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Order #1042" })).toBeVisible();
    await expect(dialog.getByText("Camille Rousseau")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});
