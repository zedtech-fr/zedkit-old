import { expect, test, type Page } from "@playwright/test";

const BASE = "http://127.0.0.1:3100";

const footerLink = (page: Page, name: string) =>
  page.locator("footer").getByRole("link", { name, exact: true });

test.describe("site shell", () => {
  test("home footer and header links", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    await expect(page.getByText("Maintained by ZED TECH")).toBeVisible();
    await expect(footerLink(page, "MIT License")).toBeVisible();
    await expect(page.locator("header").getByRole("link", { name: "Documentation", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Guides" })).toBeVisible();
  });

  test("founder door: footer entry opens the honest no-code-first guide (#1078)", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    await expect(footerLink(page, "Start without writing code")).toBeVisible();
    await page.goto(`${BASE}/docs/start-without-writing-code`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Start without writing code" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "What zedkit is not" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Try the demo editor" }).first()).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("note list example explains itself and links back to the pattern doc (#1094)", async ({ page }) => {
    await page.goto(`${BASE}/examples/note-list`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Notes" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "how the pattern is enforced" }),
    ).toHaveAttribute("href", "/docs/quality/enforce-feature-folder-ports-and-adapters");
    await expect(page.getByRole("button", { name: "Add note" })).toBeVisible();
  });

  test("footer offers Documentation and Catalog next steps (#1098)", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: "Documentation", exact: true })).toHaveAttribute("href", "/docs");
    await expect(footer.getByRole("link", { name: "Catalog", exact: true })).toHaveAttribute("href", "/catalog");
  });

  test("docs and 404 share the footer", async ({ page }) => {
    await page.goto(`${BASE}/docs/getting-started`, { waitUntil: "networkidle" });
    await expect(page.getByText("Maintained by ZED TECH")).toBeVisible();
    await page.goto(`${BASE}/missing-page`, { waitUntil: "networkidle" });
    await expect(page.getByText("Maintained by ZED TECH")).toBeVisible();
    await expect(footerLink(page, "Report a bug")).toBeVisible();
  });
});
