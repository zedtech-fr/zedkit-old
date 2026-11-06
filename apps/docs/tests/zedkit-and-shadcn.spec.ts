import { expect, test } from "@playwright/test";

const PAGE = "/docs/zedkit-and-shadcn";

test("zedkit and shadcn guide links to catalog and package.json", async ({ page }) => {
  await page.goto(PAGE, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "npm install vs registry" })).toBeVisible();
  await expect(page.getByRole("link", { name: "packages/ui/package.json" })).toBeVisible();
  await expect(
    page.getByRole("main").getByRole("link", { name: "Getting started", exact: true }),
  ).toBeVisible();
});

test("zedkit and shadcn FAQ ships FAQPage JSON-LD", async ({ page }) => {
  await page.goto(PAGE, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "FAQ", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "How is zedkit different from shadcn/ui?" })).toBeVisible();
  const jsonLd = page.locator('script[type="application/ld+json"]');
  await expect(jsonLd).toHaveCount(2);
  const bodies = await jsonLd.allTextContents();
  const faq = bodies.find((text) => text.includes('"FAQPage"'));
  expect(faq).toBeDefined();
  expect(faq).toContain("Can I copy zedkit components like shadcn/ui?");
});
