import { expect, test, type Page } from "@playwright/test";

import { persistDocsSiteLook } from "./identity-helpers";

/**
 * Touch targets: on narrow or coarse-pointer screens, interactive controls
 * reach a 44px tap size. The visible size of small controls (checkbox,
 * switch) stays the same; an invisible pseudo-element carries the target.
 */

const TAP = 44;
const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 900 };

async function open(page: Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle" });
}

test.describe("touch targets on mobile", () => {
  test.use({ viewport: MOBILE });

  test("text inputs and selects reach the tap height", async ({ page }) => {
    await open(page, "/docs/ui/collect-text-input-with-a-label");
    const input = page.locator("main input.h-control-height").first();
    await expect(input).toBeVisible();
    const box = await input.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(TAP - 0.5);

    await open(page, "/docs/ui/pick-one-option-from-a-dropdown");
    const trigger = page.locator('main button[role="combobox"]').first();
    await expect(trigger).toBeVisible();
    const triggerBox = await trigger.boundingBox();
    expect(triggerBox?.height ?? 0).toBeGreaterThanOrEqual(TAP - 0.5);
  });

  test("checkbox and switch keep their size but carry a tap-size hit area", async ({
    page,
  }) => {
    await open(page, "/docs/ui/toggle-a-checkbox-or-a-switch");
    for (const role of ["checkbox", "switch"]) {
      const control = page.locator(`main button[role="${role}"]`).first();
      await expect(control).toBeVisible();
      const box = await control.boundingBox();
      expect(box?.height ?? 0).toBeLessThan(TAP);
      const hit = await control.evaluate((el) => {
        const before = getComputedStyle(el, "::before");
        return { w: parseFloat(before.width), h: parseFloat(before.height) };
      });
      expect(hit.w).toBeGreaterThanOrEqual(TAP - 0.5);
      expect(hit.h).toBeGreaterThanOrEqual(TAP - 0.5);
    }
  });

  test("dialogs keep a gutter on both sides", async ({ page }) => {
    await open(page, "/docs/ui/open-modal-dialogs");
    await page
      .locator("main button", { hasText: /open|edit|show/i })
      .first()
      .click();
    const dialog = page.getByRole("dialog").first();
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(15);
    expect(MOBILE.width - (box!.x + box!.width)).toBeGreaterThanOrEqual(15);
  });
});

test.describe("touch targets on desktop", () => {
  test.use({ viewport: DESKTOP });

  test("mouse users keep compact control heights", async ({ page }) => {
    // Compact identities only: Glass (the site default) sizes controls from its roomier unit.
    await persistDocsSiteLook(page, "tide", "light");
    await open(page, "/docs/ui/collect-text-input-with-a-label");
    const input = page.locator("main input.h-control-height").first();
    await expect(input).toBeVisible();
    const box = await input.boundingBox();
    expect(box?.height ?? 0).toBeLessThan(TAP);
  });
});
