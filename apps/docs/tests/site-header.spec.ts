import { expect, test } from "@playwright/test";

const BASE = "http://127.0.0.1:3100";

test.describe("site header navigation (#1034)", () => {
  test("desktop header links to the catalog and the UI changelog", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE, { waitUntil: "networkidle" });

    const header = page.locator("#nd-nav");
    await expect(
      header.getByRole("link", { name: "Catalog", exact: true }),
    ).toHaveAttribute("href", "/catalog");
    await expect(header.getByRole("link", { name: "UI changelog" })).toBeVisible();
    await expect(page.getByLabel("Try another identity")).toHaveCount(0);
  });

  test("a deep docs page reaches the catalog from its chrome", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}/docs/getting-started`, { waitUntil: "networkidle" });

    await expect(
      page.getByRole("link", { name: "Catalog", exact: true }).first(),
    ).toHaveAttribute("href", "/catalog");
  });

  test("Guides menu entries are honest and none duplicates another URL", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE, { waitUntil: "networkidle" });

    const header = page.locator("#nd-nav");
    await header.getByRole("button", { name: "Guides" }).click();

    const guides = [
      ["Getting started", "/docs/getting-started"],
      ["Start without writing code", "/docs/start-without-writing-code"],
      ["Build an admin dashboard", "/docs/build-an-admin-dashboard"],
      ["Set up your coding agents", "/docs/set-up-your-coding-agents"],
      ["Add SEO to a Next.js app", "/docs/add-seo-to-nextjs"],
      ["zedkit and shadcn/ui", "/docs/zedkit-and-shadcn"],
      ["Maturity and compatibility", "/docs/maturity-and-compatibility"],
      ["Note list example", "/examples/note-list"],
    ] as const;
    for (const [name, href] of guides) {
      await expect(header.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
    }

    // "Documentation" is the only header entry that may point at /docs.
    await expect(header.locator('a[href="/docs"]')).toHaveCount(1);
    await expect(header.getByRole("link", { name: /Tutorials & catalog/ })).toHaveCount(0);
  });

  test("phone menu lists the catalog", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto(BASE, { waitUntil: "networkidle" });

    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("navigation", { name: "Menu" });
    await expect(
      menu.getByRole("link", { name: "Catalog", exact: true }),
    ).toHaveAttribute("href", "/catalog");
    await expect(menu.getByRole("link", { name: "UI changelog" })).toBeVisible();
    await expect(menu.getByText("Guides", { exact: true })).toBeVisible();
    await expect(menu.getByRole("link", { name: "Getting started", exact: true })).toBeVisible();
  });
});
