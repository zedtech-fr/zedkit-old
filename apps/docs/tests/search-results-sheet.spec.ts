import { expect, test } from "@playwright/test";

const PHONES = [
  { name: "iPhone SE", width: 375, height: 667 },
  { name: "iPhone 13", width: 390, height: 844 },
] as const;

for (const phone of PHONES) {
  test(`search dialog stays on screen when the keyboard is open (${phone.name})`, async ({ page }) => {
    await page.setViewportSize({ width: phone.width, height: phone.height });
    await page.goto("/docs");
    await page.locator("#nd-mobile-nav").getByRole("button", { name: "Search the documentation" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const input = dialog.locator("input").first();
    await expect(input).toBeFocused();
    await input.fill("getting");
    await expect(input).toHaveValue("getting");
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(phone.height);
  });
}
