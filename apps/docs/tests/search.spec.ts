import { expect, test } from "@playwright/test";

const BASE = process.env.DOCS_E2E_BASE_URL ?? "http://127.0.0.1:3100";

test("search finds grouped results and navigates", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (event) => errors.push(String(event)));
  await page.goto(`${BASE}/docs`, { waitUntil: "networkidle" });
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ timeout: 10000 });
  await dialog.locator("input").fill("dialog");
  // Scope to the listbox: the dialog also contains the ESC close button.
  const results = dialog.locator('[role="listbox"] [role="option"]');
  await expect(results.first()).toBeVisible({ timeout: 20000 });
  // Grouped context: section crumb next to the result title.
  await expect(results.first().getByText("Docs")).toBeVisible();
  await results.first().click();
  await page.waitForURL("**/docs/**", { timeout: 10000 });
  expect(errors).toEqual([]);
});

test("button query ranks the Button doc page first", async ({ page }) => {
  await page.goto(`${BASE}/docs`, { waitUntil: "networkidle" });
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ timeout: 10000 });
  await dialog.locator("input").fill("button");
  const first = dialog.locator('[role="listbox"] [role="option"]').first();
  await expect(first).toBeVisible({ timeout: 10000 });
  await expect(first).toContainText("Button");
});

test("tab focus stays inside the search dialog", async ({ page }) => {
  await page.goto(`${BASE}/docs`, { waitUntil: "networkidle" });
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ timeout: 10000 });
  await dialog.locator("input").fill("button");
  await expect(dialog.locator('[role="listbox"] [role="option"]').first()).toBeVisible({ timeout: 10000 });
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    const activeInDialog = await page.evaluate(() => {
      const node = document.activeElement;
      const shell = document.querySelector('[role="dialog"]');
      return Boolean(node && shell?.contains(node));
    });
    expect(activeInDialog).toBe(true);
  }
});

test("unknown query shows the empty state", async ({ page }) => {
  await page.goto(`${BASE}/docs`, { waitUntil: "networkidle" });
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ timeout: 10000 });
  await dialog.locator("input").fill("zzzqqqwry");
  await expect(dialog.getByText("No results found")).toBeVisible({
    timeout: 10000,
  });
});

test("keyboard navigates to a result", async ({ page }) => {
  await page.goto(`${BASE}/docs`, { waitUntil: "networkidle" });
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ timeout: 10000 });
  await dialog.locator("input").fill("button");
  const results = dialog.locator('[role="listbox"] [role="option"]');
  await expect(results.first()).toBeVisible({ timeout: 10000 });
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await page.waitForURL("**/docs/**", { timeout: 10000 });
});

test("escape closes the search dialog", async ({ page }) => {
  await page.goto(`${BASE}/docs`, { waitUntil: "networkidle" });
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ timeout: 10000 });
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});
