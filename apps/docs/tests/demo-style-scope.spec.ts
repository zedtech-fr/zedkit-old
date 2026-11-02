import { expect, test } from "@playwright/test";

import { DEFAULT_IDENTITY } from "../lib/default-identity";

const PAGE = "/docs/ui/trigger-actions-with-buttons";

test("Style of this demo restyles the preview only", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(PAGE, { waitUntil: "networkidle" });

  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-identity", DEFAULT_IDENTITY);
  const preview = page.locator("[data-component-preview]").first();
  await preview.scrollIntoViewIfNeeded();
  const rootSans = () =>
    html.evaluate((node) => getComputedStyle(node).getPropertyValue("--font-sans"));
  const before = await rootSans();

  await preview.getByRole("combobox", { name: "Style of this demo" }).selectOption("press");

  await expect(html).toHaveAttribute("data-identity", DEFAULT_IDENTITY);
  expect(await page.evaluate(() => localStorage.getItem("zk-identity"))).not.toBe("press");
  expect(await rootSans()).toBe(before);
  const scope = preview.locator("[data-identity-scope]");
  await expect(scope).toHaveAttribute("data-identity", "press");
  await expect
    .poll(() => scope.evaluate((node) => getComputedStyle(node).getPropertyValue("--font-sans")))
    .toContain("Space Grotesk");
});

test("site reading mode does not restyle a specimen Light/Dark choice", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(PAGE, { waitUntil: "networkidle" });
  const preview = page.locator("[data-component-preview]").first();
  await preview.scrollIntoViewIfNeeded();
  await preview.getByRole("button", { name: "Light", exact: true }).click();
  const canvas = preview.locator("[data-preview-surface]");
  await expect.poll(() => canvas.evaluate((node) => node.classList.contains("dark"))).toBe(false);

  await page.getByRole("button", { name: /toggle theme/i }).first().click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  expect(await canvas.evaluate((node) => node.classList.contains("dark"))).toBe(false);

  await preview.getByRole("button", { name: "Dark", exact: true }).click();
  await expect.poll(() => canvas.evaluate((node) => node.classList.contains("dark"))).toBe(true);
  await page.getByRole("button", { name: /toggle theme/i }).first().click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  expect(await canvas.evaluate((node) => node.classList.contains("dark"))).toBe(true);
});
