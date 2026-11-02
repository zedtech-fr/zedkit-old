import { expect, test } from "@playwright/test";

const URL = "http://127.0.0.1:3100/docs/ui/guide-a-multi-step-flow-with-selectable-option-cards";

test.describe("wizard steps at phone width", () => {
  test("390px shows compact step summary without orphan connectors", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(URL, { waitUntil: "networkidle" });

    const steps = page.locator('[data-slot="wizard-steps"]').first();
    await expect(steps.getByText("Step 1 of 3 · Products")).toBeVisible();
    await expect(steps.getByRole("progressbar", { name: "Progress" })).toBeVisible();
    await expect(steps.locator('[data-slot="wizard-step"]')).toHaveCount(0);

    await page.getByRole("button", { name: "Continue" }).first().click();
    await expect(steps.getByText("Step 2 of 3 · Shipping")).toBeVisible();

    const sideways = await steps.evaluate((node) => node.scrollWidth - node.clientWidth);
    expect(sideways).toBeLessThanOrEqual(1);
  });
});
