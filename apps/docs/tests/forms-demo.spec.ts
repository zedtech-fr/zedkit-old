import { expect, test } from "@playwright/test";

const BASE = "http://127.0.0.1:3100";

test.describe("docs form previews show realistic forms", () => {
  test("field: validation shows after submit and clears once fixed", async ({ page }) => {
    await page.goto(`${BASE}/docs/ui/lay-out-fieldsets-fields-and-error-lists`, { waitUntil: "networkidle" });
    await expect(page.getByText("Use at least 3 characters.")).toBeHidden();
    await page.getByRole("button", { name: "Create project" }).first().click();
    await expect(page.getByText("Use at least 3 characters.")).toBeVisible();
    await page.getByLabel("Project name").first().fill("Harbor Studio");
    await page.getByRole("button", { name: "Create project" }).first().click();
    await expect(page.getByText("Use at least 3 characters.")).toBeHidden();
    await expect(page.getByText("Project “Harbor Studio” created.")).toBeVisible();
  });

  test("validated forms: props table lists the field props (#1061)", async ({ page }) => {
    await page.goto(`${BASE}/docs/ui/build-validated-forms-with-labels-errors-and-pending-state`, {
      waitUntil: "networkidle",
    });
    await expect(page.getByRole("heading", { name: "Props" })).toBeVisible();
    await expect(page.getByText("shouldUnregister?", { exact: true })).toBeVisible();
    await expect(page.getByText("render", { exact: true })).toBeVisible();
  });

  test("input: labelled fields with a disabled company", async ({ page }) => {
    await page.goto(`${BASE}/docs/ui/collect-text-input-with-a-label`, { waitUntil: "networkidle" });
    await expect(page.getByLabel("Full name").first()).toHaveValue("Camille Rousseau");
    await expect(page.getByLabel("Company").first()).toBeDisabled();
    await page.getByLabel("Email address").first().fill("camille@example.com");
  });

  test("label: required mark preview is hidden from assistive tech", async ({ page }) => {
    await page.goto(`${BASE}/docs/ui/label-a-form-control`, { waitUntil: "networkidle" });
    const preview = page.locator("[data-component-preview]").filter({ has: page.getByLabel("Work email") }).first();
    await expect(preview).toBeVisible();
    await expect(page.getByLabel("Work email")).toBeVisible();
    await expect(page.getByLabel("Work email")).toHaveAttribute("required", "");
  });

  test("textarea: the character counter follows typing", async ({ page }) => {
    await page.goto(`${BASE}/docs/ui/collect-multi-line-text-input`, { waitUntil: "networkidle" });
    const note = page.getByLabel("Delivery note").first();
    await note.fill("Ring twice");
    await expect(page.getByText("10 / 280 characters")).toBeVisible();
  });

  test("select: choosing a region updates the delivery estimate", async ({ page }) => {
    await page.goto(`${BASE}/docs/ui/pick-one-option-from-a-dropdown`, { waitUntil: "networkidle" });
    await expect(page.getByText("Shipping options depend on the region.")).toBeVisible();
    await page.getByRole("combobox", { name: "Pick a region" }).first().click();
    await page.getByRole("option", { name: "Americas" }).click();
    await expect(page.getByText("Delivery in 5 to 7 working days.")).toBeVisible();
  });

  test("toggle: checkbox and switch carry their labels", async ({ page }) => {
    await page.goto(`${BASE}/docs/ui/toggle-a-checkbox-or-a-switch`, { waitUntil: "networkidle" });
    const terms = page.getByLabel("I accept the terms of sale").first();
    await terms.check();
    await expect(terms).toBeChecked();
    await expect(page.getByLabel("Notify me when the order ships").first()).toBeChecked();
  });

  test("wizard: continue and back walk the store setup, composed steps and solo card render", async ({ page }) => {
    await page.goto(`${BASE}/docs/ui/guide-a-multi-step-flow-with-selectable-option-cards`, { waitUntil: "networkidle" });
    await expect(page.getByRole("group", { name: "What will you sell?" }).first()).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).first().click();
    await expect(page.getByRole("group", { name: "How will you deliver?" }).first()).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).first().click();
    await expect(page.getByText(/Ready to open: physical products/)).toBeVisible();
    await page.getByRole("button", { name: "Back" }).first().click();
    await expect(page.getByRole("group", { name: "How will you deliver?" }).first()).toBeVisible();
    await expect(page.getByText("Live preview: Composed steps")).toHaveCount(0);
    await expect(page.locator("[data-component-preview]").filter({ hasText: "Checkout: payment is the current step" })).toBeVisible();
    await expect(page.getByText("You will receive the digest.")).toBeVisible();
    await page.getByText("Weekly digest").click();
    await expect(page.getByText("No digest.")).toBeVisible();
  });
});
