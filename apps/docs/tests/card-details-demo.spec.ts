import { expect, test } from "@playwright/test";

import { DOCS_SHIPPED_IDENTITIES, pinDemoLook } from "./a11y-helpers";

const CARD_URL = "/docs/ui/group-content-in-a-card-section";
const DETAILS_URL = "/docs/ui/show-key-value-details-and-a-live-indicator";

test("card footer actions change the card state", async ({ page }) => {
  await page.goto(CARD_URL, { waitUntil: "networkidle" });
  const card = page.locator("[data-component-preview]").nth(1);
  await card.scrollIntoViewIfNeeded();
  await expect(card.getByRole("status")).toHaveText("Draft");
  await card.getByRole("button", { name: "Save as draft" }).click();
  await expect(card.getByRole("status")).toHaveText("Draft saved");
  await card.getByRole("button", { name: "Publish" }).click();
  await expect(card.getByRole("status")).toHaveText("Published");
  await expect(card.getByRole("button", { name: "Publish" })).toBeDisabled();
});

test.describe("card and details pages show a live preview for each example", () => {
  for (const identity of DOCS_SHIPPED_IDENTITIES) {
    for (const mode of ["light", "dark"] as const) {
      for (const [device, width, height] of [
        ["desktop", 1280, 1000],
        ["phone", 390, 844],
      ] as const) {
        test(`${device} ${identity} ${mode}`, async ({ page }) => {
          await page.setViewportSize({ width, height });

          await page.goto(CARD_URL, { waitUntil: "networkidle" });
          const cards = page.locator("[data-component-preview]");
          await expect(cards).toHaveCount(2);
          await pinDemoLook(cards.nth(0), identity, mode);
          await pinDemoLook(cards.nth(1), identity, mode);
          await cards.nth(0).scrollIntoViewIfNeeded();
          await expect(cards.nth(0).getByText("Order #1042")).toBeVisible();
          await expect(cards.nth(0).getByText("Total €101.50")).toBeVisible();
          await cards.nth(1).scrollIntoViewIfNeeded();
          await expect(cards.nth(1).getByText("Spring collection")).toBeVisible();
          await expect(cards.nth(1).getByRole("button", { name: "Publish" })).toBeVisible();
          await expect(cards.nth(1).getByRole("button", { name: "Save as draft" })).toBeVisible();
          let sideways = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          );
          expect(sideways).toBeLessThanOrEqual(1);
          await cards.nth(0).screenshot({ path: `test-results/cd-card-${identity}-${mode}-${device}.png` });
          await cards.nth(1).screenshot({ path: `test-results/cd-footer-${identity}-${mode}-${device}.png` });

          await page.goto(DETAILS_URL, { waitUntil: "networkidle" });
          const details = page.locator("[data-component-preview]");
          await expect(details).toHaveCount(2);
          await pinDemoLook(details.nth(0), identity, mode);
          await pinDemoLook(details.nth(1), identity, mode);
          await details.nth(0).scrollIntoViewIfNeeded();
          await expect(details.nth(0).getByText("Delivery D-2047")).toBeVisible();
          await expect(details.nth(0).getByText("In transit")).toBeVisible();
          await expect(details.nth(0).getByRole("status", { name: "Tracking live" })).toBeVisible();
          await expect(details.nth(0).getByRole("status", { name: "Idle" })).toBeVisible();
          await details.nth(1).scrollIntoViewIfNeeded();
          await expect(details.nth(1).getByText("Camille Rousseau")).toBeVisible();
          await expect(details.nth(1).getByRole("button", { name: "Copy cus_4821" })).toBeVisible();
          sideways = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          );
          expect(sideways).toBeLessThanOrEqual(1);
          await details.nth(0).screenshot({ path: `test-results/cd-details-${identity}-${mode}-${device}.png` });
          await details.nth(1).screenshot({ path: `test-results/cd-composed-${identity}-${mode}-${device}.png` });
        });
      }
    }
  }
});
