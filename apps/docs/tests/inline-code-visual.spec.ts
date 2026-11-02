import { expect, test } from "@playwright/test";

const BASE = "http://127.0.0.1:3100";
const MOBILE = { width: 390, height: 844 };
const BUTTON = `${BASE}/docs/ui/trigger-actions-with-buttons`;
const MOTION_PAGE = `${BASE}/docs/ui/animate-entrances-and-hover-feedback-with-css-utilities`;

test.describe("docs tables on mobile (#zk-chips ext 2)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("zk-docs-site-identity", "tide");
      localStorage.setItem("zk-docs-site-identity-opt-in", "1");
    });
  });

  test("motion token table stacks without mid-token breaks at 390px", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto(MOTION_PAGE, { waitUntil: "networkidle" });
    const host = page.locator("[data-docs-table]").first();
    await host.scrollIntoViewIfNeeded();
    await expect(host).toBeVisible();
    const tokenRow = host.locator("tbody tr").first();
    await expect(tokenRow.getByText("--zk-reveal-duration", { exact: true })).toBeVisible();
    const tokenBox = await tokenRow.getByText("--zk-reveal-duration", { exact: true }).evaluate((el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const rects = range.getClientRects();
      return rects.length <= 1;
    });
    expect(tokenBox).toBe(true);
    const pillBorder = await host.locator("tbody code").first().evaluate((el) => parseFloat(getComputedStyle(el).borderTopWidth));
    expect(pillBorder).toBe(0);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    );
    expect(overflow).toBe(true);
    await host.screenshot({ path: "test-results/motion-tokens-table-390-tide.png" });
  });
});

test.describe("quiet inline code (#zk-chips)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("zk-docs-site-identity", "tide");
      localStorage.setItem("zk-docs-site-identity-opt-in", "1");
    });
  });

  test("button page props and prose at 390px", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto(BUTTON, { waitUntil: "networkidle" });
    const propCode = page.locator('[id^="type-table"] code').first();
    await expect(propCode).toBeVisible();
    const chipBorder = await propCode.evaluate((el) => parseFloat(getComputedStyle(el).borderTopWidth));
    expect(chipBorder).toBe(0);
    const proseCode = page.locator("#nd-page :not(pre, [id^='type-table']) > code").first();
    await expect(proseCode).toBeVisible();
    const proseBorder = await proseCode.evaluate((el) => parseFloat(getComputedStyle(el).borderTopWidth));
    expect(proseBorder).toBe(0);
    await page.locator("main").screenshot({ path: "test-results/button-page-390-tide.png" });
  });

  test("button page desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(BUTTON, { waitUntil: "networkidle" });
    await page.locator('[id^="type-table"]').first().scrollIntoViewIfNeeded();
    await page.locator("main").screenshot({ path: "test-results/button-page-desktop-tide.png" });
  });
});
