import { expect, test } from "@playwright/test";

test("docs index uses UI and Core & server area headings (#417)", async ({ page }) => {
  await page.goto("/docs", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Four areas", level: 2 })).toBeVisible();
  // Accessible names strip the MDX code ticks; Fumadocs appends a
  // "Copy Anchor Link" button inside each heading, so match by substring.
  await expect(page.getByRole("heading", { name: "UI (@zedtech/zedkit-ui)" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Core & server (core, server, nest)" }),
  ).toBeVisible();
  await expect(page.getByText("### Admin UI", { exact: false })).toHaveCount(0);
});
