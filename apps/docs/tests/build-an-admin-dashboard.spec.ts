import { expect, test } from "@playwright/test";

const PAGE = "/docs/build-an-admin-dashboard";

test("admin dashboard tutorial lists shell, table, drawer, and troubleshooting", async ({ page }) => {
  await page.goto(PAGE, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Build an admin dashboard", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Troubleshooting", level: 2 })).toBeVisible();
  await expect(page.getByText(/AppShell/).first()).toBeVisible();
  await expect(page.getByText(/DataTable/).first()).toBeVisible();
  await expect(page.getByText(/Hydration warnings/)).toBeVisible();
});
