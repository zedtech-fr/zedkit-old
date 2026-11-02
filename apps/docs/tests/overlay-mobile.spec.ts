import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator } from "@playwright/test";

const DIALOG_PAGE = "/docs/ui/open-modal-dialogs";
const CONFIRM_PAGE = "/docs/ui/confirm-destructive-actions";
const ROUTE_PAGE = "/docs/ui/render-a-route-as-a-modal-over-the-list";
const MOBILE = { width: 390, height: 844 };

async function expectCloseTarget(dialog: Locator) {
  const close = dialog.getByRole("button", { name: "Close" });
  const box = await close.boundingBox();
  expect(box).not.toBeNull();
  if (box) {
    expect(box.width).toBeGreaterThanOrEqual(44 - 0.5);
    expect(box.height).toBeGreaterThanOrEqual(44 - 0.5);
  }
}

test.describe("overlay mobile (refs #425)", () => {
  test.use({ viewport: MOBILE, hasTouch: true, isMobile: true });

  test("tall dialog caps height, contains overscroll, and keeps a 44px close", async ({ page }) => {
    await page.goto(DIALOG_PAGE, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Open long dialog" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await expect(dialog.getByRole("heading", { name: "Order activity" })).toBeVisible();

    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    if (box && viewport) {
      expect(box.height).toBeLessThanOrEqual(viewport.height * 0.9 + 1);
    }

    const css = await dialog.evaluate((el) => {
      const style = getComputedStyle(el);
      return { maxHeight: style.maxHeight, overflowY: style.overflowY, overscroll: style.overscrollBehaviorY };
    });
    expect(parseFloat(css.maxHeight)).toBeLessThanOrEqual(MOBILE.height * 0.9 + 1);
    expect(css.overflowY).toBe("auto");
    expect(css.overscroll).toMatch(/contain/);

    await expectCloseTarget(dialog);
    const axe = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
    expect(axe.violations, JSON.stringify(axe.violations, null, 2)).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("Done closes the long dialog", async ({ page }) => {
    await page.goto(DIALOG_PAGE, { waitUntil: "networkidle" });
    const trigger = page.getByRole("button", { name: "Open long dialog" });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await expect(dialog.getByRole("heading", { name: "Order activity" })).toBeVisible();
    await dialog.getByRole("button", { name: "Done" }).click();
    await expect(dialog).toBeHidden();
  });

  test("confirm stays compact with a 44px close", async ({ page }) => {
    await page.goto(CONFIRM_PAGE, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Delete item" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    const viewport = page.viewportSize();
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    if (box && viewport) {
      expect(box.height).toBeLessThan(viewport.height * 0.5);
    }
    await expectCloseTarget(dialog);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("route modal drawer close is 44px", async ({ page }) => {
    await page.goto(ROUTE_PAGE, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Open route modal" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(300);
    await expect(dialog).toHaveAttribute("data-vaul-drawer-direction", "bottom");
    await expectCloseTarget(dialog);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("route modal dialog variant is centered with a 44px close", async ({ page }) => {
    await page.goto(ROUTE_PAGE, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Open as dialog" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await expect(dialog.getByRole("heading", { name: "Invoice #1042" })).toBeVisible();
    await expect(dialog).not.toHaveAttribute("data-vaul-drawer-direction");
    const css = await dialog.evaluate((el) => getComputedStyle(el).maxHeight);
    expect(parseFloat(css)).toBeLessThanOrEqual(MOBILE.height * 0.9 + 1);
    await expectCloseTarget(dialog);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});
