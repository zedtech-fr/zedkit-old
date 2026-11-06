import { expect, test } from "@playwright/test";

const PAGE = "/docs/set-up-your-coding-agents";

test("coding agents guide lists what gets installed", async ({ page }) => {
  await page.goto(PAGE, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "What gets installed", level: 2 })).toBeVisible();
});

test("coding agents tutorial documents validate output", async ({ page }) => {
  await page.goto(PAGE, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Validate", level: 3 })).toBeVisible();
  await expect(page.getByRole("main").locator("pre").getByText("ok", { exact: true })).toBeVisible();
  await expect(page.getByText(/does not run your coding agent/)).toBeVisible();
});
