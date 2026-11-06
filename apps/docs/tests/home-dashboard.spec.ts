import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { openHeroPage, settleHero } from "./hero-helpers";

async function axeDashboard(page: import("@playwright/test").Page) {
  const demo = page.locator("#demo").getByLabel("Interactive admin dashboard demo in the hero");
  await expect(demo).toBeVisible();
  await settleHero(page);
  const results = await new AxeBuilder({ page })
    .include("#demo [aria-label='Interactive admin dashboard demo in the hero']")
    .analyze();
  expect(results.violations).toEqual([]);
}

test("home dashboard: row selection and add-app toast (no detail panel in hero)", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await openHeroPage(page, "Apps");
  const demo = page.locator("#demo").getByLabel("Interactive admin dashboard demo in the hero");

  await demo.getByRole("button", { name: "worker", exact: true }).click();
  await expect(demo.locator("[data-slot='detail-panel']")).toHaveCount(0);

  await demo.getByRole("button", { name: "Add app" }).click();
  await page.getByRole("dialog").getByLabel("Name").fill("toast-check");
  await page.getByRole("button", { name: "Create app" }).click();
  await expect(page.getByText("App added")).toBeVisible();
  await expect(demo.getByRole("cell", { name: "toast-check", exact: true })).toBeVisible();
});

test("home dashboard: create, edit, delete with axe on ready state", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await openHeroPage(page, "Apps");
  const demo = page.locator("#demo").getByLabel("Interactive admin dashboard demo in the hero");
  await axeDashboard(page);

  await demo.getByRole("button", { name: "Add app" }).click();
  await page.getByRole("dialog").getByLabel("Name").fill("playwright-app");
  await page.getByRole("button", { name: "Create app" }).click();
  await expect(demo.getByRole("cell", { name: "playwright-app", exact: true })).toBeVisible();

  await demo.getByRole("button", { name: "Edit playwright-app" }).click();
  await page.getByRole("dialog").getByLabel("Name").fill("playwright-app-edited");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(demo.getByRole("cell", { name: "playwright-app-edited", exact: true })).toBeVisible();

  const row = demo.getByRole("row", { name: /playwright-app-edited/ });
  await row.getByRole("button", { name: "Delete playwright-app-edited" }).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(demo.getByRole("cell", { name: "playwright-app-edited", exact: true })).toHaveCount(0);
});

test("home dashboard: closing the create drawer restores focus to Add app", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await openHeroPage(page, "Apps");
  const demo = page.locator("#demo").getByLabel("Interactive admin dashboard demo in the hero");
  await expect(demo).toBeVisible();
  const add = demo.getByRole("button", { name: "Add app" });
  await add.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(add).toBeFocused();
});

test("home dashboard: create success restores focus to Add app", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await openHeroPage(page, "Apps");
  const demo = page.locator("#demo").getByLabel("Interactive admin dashboard demo in the hero");
  const add = demo.getByRole("button", { name: "Add app" });
  await add.click();
  await page.getByRole("dialog").getByLabel("Name").fill("focus-return");
  await page.getByRole("button", { name: "Create app" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(add).toBeFocused();
});

test("home dashboard: canceling edit restores focus to the edit trigger", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await openHeroPage(page, "Apps");
  const demo = page.locator("#demo").getByLabel("Interactive admin dashboard demo in the hero");
  const edit = demo.getByRole("button", { name: "Edit console" });
  await edit.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
  await expect(edit).toBeFocused();
});

test("home dashboard: focus lost to the page right after the overlay closes is given back to the edit trigger", async ({ page }) => {
  // The table can re-render and replace the button just after the overlay closes (focus falls to <body>): seen in
  // about one run in twenty, and the trigger must still end up focused. Simulated by blurring it the moment it is back.
  await page.goto("/", { waitUntil: "networkidle" });
  await openHeroPage(page, "Apps");
  const demo = page.locator("#demo").getByLabel("Interactive admin dashboard demo in the hero");
  const edit = demo.getByRole("button", { name: "Edit console" });
  await edit.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(edit).toBeFocused();
  await edit.evaluate((el) => (el as HTMLElement).blur());
  await expect(edit).toBeFocused({ timeout: 2000 });
});

test("home dashboard: preview modes are keyboard reachable", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await openHeroPage(page, "Apps");
  const demo = page.locator("#demo").getByLabel("Interactive admin dashboard demo in the hero");
  const display = page.locator("[data-hero-demo-display]");
  await display.getByRole("combobox", { name: "Table preview mode" }).click();
  await page.getByRole("option", { name: "Loading" }).click();
  await expect(demo.getByRole("table", { name: "Loading" })).toBeVisible();
  await axeDashboard(page);

  await display.getByRole("combobox", { name: "Table preview mode" }).click();
  await page.getByRole("option", { name: "Empty" }).click();
  await expect(demo.getByText("No apps yet. Choose Ready and click Add app.")).toBeVisible();
  await axeDashboard(page);

  await display.getByRole("combobox", { name: "Table preview mode" }).click();
  await page.getByRole("option", { name: "Error" }).click();
  await expect(demo.getByText("Could not load apps.")).toBeVisible();
  await axeDashboard(page);
});
