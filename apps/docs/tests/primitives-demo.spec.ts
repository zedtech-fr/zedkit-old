import { expect, test } from "@playwright/test";

import { DOCS_SHIPPED_IDENTITIES, pinDemoLook } from "./a11y-helpers";

const BASE = "/docs/ui/";

// page slug, expected preview count, then per-preview visible text checks.
const PAGES: Array<{ slug: string; previews: number; checks: Array<[number, string | RegExp | { status: string }]> }> = [
  {
    slug: "show-a-status-or-count-badge",
    previews: 4,
    checks: [
      [1, "Nightly orders export"],
      [1, "3 retries"],
      [2, "Product catalogue"],
      [2, "running"],
      [3, "all systems go"],
    ],
  },
  { slug: "separate-content-horizontally-or-vertically", previews: 2, checks: [[1, "Customers"]] },
  { slug: "show-loading-placeholder-blocks", previews: 2, checks: [[1, { status: "Loading article" }]] },
  {
    slug: "indicate-status-with-a-dot",
    previews: 3,
    checks: [
      [1, "Payments: Failed"],
      [2, "Live sync, static (printed report or dense table)"],
    ],
  },
  { slug: "show-determinate-progress", previews: 2, checks: [[1, "october-orders.csv, 2.4 MB"]] },
  { slug: "celebrate-completion-with-a-checkmark", previews: 2, checks: [[1, "Order #4821 confirmed"]] },
  { slug: "load-each-zone-with-a-faithful-skeleton", previews: 2, checks: [[1, { status: "Loading report" }]] },
  {
    slug: "name-an-operation-in-progress",
    previews: 3,
    checks: [
      [1, "Invoice draft"],
      [2, "You are offline"],
    ],
  },
  { slug: "stamp-data-with-its-age", previews: 2, checks: [[1, /Synced 4 minutes ago/]] },
  { slug: "call-out-a-notice-or-an-error-state", previews: 2, checks: [[1, "Scheduled maintenance"]] },
  {
    slug: "render-headings-and-body-text-without-raw-tags",
    previews: 2,
    checks: [[1, "Section title as a link"]],
  },
  { slug: "lay-out-an-admin-page-sidebar-topbar-header", previews: 2, checks: [[1, "Four active projects, two due this week."]] },
];

test.describe("primitive pages show a live preview for each example", () => {
  for (const identity of DOCS_SHIPPED_IDENTITIES) {
    for (const mode of ["light", "dark"] as const) {
      test(`${identity} ${mode}`, async ({ page }) => {
        for (const spec of PAGES) {
          await page.goto(BASE + spec.slug, { waitUntil: "networkidle" });
          const previews = page.locator("[data-component-preview]");
          await expect(previews, spec.slug).toHaveCount(spec.previews);
          for (const [index, text] of spec.checks) {
            await pinDemoLook(previews.nth(index), identity, mode);
            await previews.nth(index).scrollIntoViewIfNeeded();
            const target =
              typeof text === "object" && "status" in text
                ? previews.nth(index).getByRole("status", { name: text.status })
                : previews.nth(index).getByText(text).first();
            await expect(target, `${spec.slug} #${index}`).toBeVisible();
          }
        }
      });
    }
  }

  test("interactive demos respond", async ({ page }) => {
    await page.goto(BASE + "load-each-zone-with-a-faithful-skeleton", { waitUntil: "networkidle" });
    const standalone = page.locator("[data-component-preview]").nth(1);
    await standalone.getByRole("button", { name: "Show the report" }).click();
    await expect(standalone.getByText("148 orders, €12,430 revenue")).toBeVisible();

    await page.goto(BASE + "name-an-operation-in-progress", { waitUntil: "networkidle" });
    const saved = page.locator("[data-component-preview]").nth(1);
    await expect(saved.getByText("Could not save")).toBeVisible();
    await saved.getByRole("button", { name: "Try again" }).click();
    await expect(saved.getByText("Could not save")).toHaveCount(0);
  });
});
