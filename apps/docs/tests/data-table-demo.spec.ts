import { expect, test } from "@playwright/test";

import { DOCS_SHIPPED_IDENTITIES, pinDemoLook } from "./a11y-helpers";

const URL = "/docs/ui/show-a-sortable-filterable-paginated-data-table";

test.describe("data table page shows a live preview for each example", () => {
  for (const identity of DOCS_SHIPPED_IDENTITIES) {
    for (const mode of ["light", "dark"] as const) {
      for (const [device, width, height] of [
        ["desktop", 1280, 1000],
        ["phone", 390, 844],
      ] as const) {
        test(`${device} ${identity} ${mode}`, async ({ page }) => {
          await page.setViewportSize({ width, height });
          await page.goto(URL, { waitUntil: "networkidle" });

          const previews = page.locator("[data-component-preview]");
          await expect(previews).toHaveCount(4);

          // Store admin orders: page 1 of 3, sort by total, filter, then each state.
          const orders = previews.nth(0);
          await pinDemoLook(orders, identity, mode);
          await orders.scrollIntoViewIfNeeded();
          await expect(orders.getByText("Camille Rousseau")).toBeVisible();
          await expect(orders.getByText("Page 1 of 3")).toBeVisible();
          await orders.getByRole("button", { name: "Next" }).click();
          await expect(orders.getByText("Page 2 of 3")).toBeVisible();
          await orders.getByRole("button", { name: "Total" }).click();
          await expect(orders.getByRole("row").nth(1)).toContainText("#1037");
          await orders.getByPlaceholder("Filter orders").fill("refunded");
          await expect(orders.getByText("Sofia Garcia")).toBeVisible();
          await expect(orders.getByText("Camille Rousseau")).toBeHidden();
          await orders.getByPlaceholder("Filter orders").fill("zzz");
          await expect(orders.getByText("No results.")).toBeVisible();
          await expect(orders.getByRole("button", { name: "Clear filters" })).toBeVisible();
          await expect(orders.locator('[data-slot="table-container"] [role="alert"]')).toHaveCount(0);
          await orders.getByPlaceholder("Filter orders").fill("");
          await orders.getByRole("button", { name: "Error" }).click();
          await expect(orders.locator('[data-slot="error-state"]')).toContainText("Could not load orders");
          await expect(orders.locator('[data-slot="table-container"] [role="alert"]')).toHaveCount(0);
          await orders.getByRole("button", { name: "Loading" }).click();
          await expect(orders.getByRole("table")).toHaveAttribute("aria-busy", "true");
          await expect(orders.locator('[data-slot="data-table-loading"]')).toBeVisible();
          await orders.getByRole("button", { name: "Orders" }).click();
          await expect(orders.getByText("Camille Rousseau")).toBeVisible();

          // Server-style pagination: page 2 of 4 shows products 6 to 10.
          const paging = previews.nth(1);
          await paging.scrollIntoViewIfNeeded();
          await expect(paging.getByText("Page 2 of 4")).toBeVisible();
          await expect(paging.getByText("Cotton socks")).toBeVisible();
          await paging.getByRole("button", { name: "Next" }).click();
          await expect(paging.getByText("Silk tie")).toBeVisible();

          // Empty row inside your own table.
          const empty = previews.nth(2);
          await empty.scrollIntoViewIfNeeded();
          await expect(empty.getByText("No product matches “gift card”.")).toBeVisible();

          // Toolbar on its own.
          const toolbar = previews.nth(3);
          await pinDemoLook(toolbar, identity, mode);
          await toolbar.scrollIntoViewIfNeeded();
          await expect(toolbar.getByText("6 of 6 customers")).toBeVisible();
          await toolbar.getByRole("textbox", { name: "Search customers" }).fill("nantes");
          await expect(toolbar.getByText("2 of 6 customers")).toBeVisible();
          await expect(toolbar.getByText("Hugo Lambert")).toBeVisible();

          const sideways = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          );
          expect(sideways).toBeLessThanOrEqual(1);
          await orders.screenshot({ path: `test-results/dt-${identity}-${mode}-${device}.png` });
          await toolbar.screenshot({ path: `test-results/dt-toolbar-${identity}-${mode}-${device}.png` });
        });
      }
    }
  }
});
