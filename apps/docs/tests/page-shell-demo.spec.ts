import { expect, test } from "@playwright/test";

const URL = "http://127.0.0.1:3100/docs/ui/lay-out-an-admin-page-sidebar-topbar-header";
const IDENTITIES = ["mist", "press", "tide", "volt", "maison", "glass"] as const;

test.describe("page shell preview is a complete screen", () => {
  for (const identity of IDENTITIES) {
    for (const mode of ["light", "dark"] as const) {
      test(`desktop ${identity} ${mode}`, async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 1000 });
        await page.addInitScript(
          ([i, m]) => {
            localStorage.setItem("zk-docs-site-identity", i!);
            localStorage.setItem("zk-docs-site-identity-opt-in", "1");
            localStorage.setItem("theme", m!);
          },
          [identity, mode],
        );
        await page.goto(URL, { waitUntil: "networkidle" });
        const preview = page.locator("[data-component-preview]").first();
        await preview.scrollIntoViewIfNeeded();
        await expect(preview.getByRole("navigation", { name: "Main" })).toBeVisible();
        await expect(preview.getByRole("heading", { name: "Tasks" })).toBeVisible();
        await expect(preview.getByRole("table")).toBeVisible();
        await preview.screenshot({ path: `test-results/page-shell-${identity}-${mode}-desktop.png` });
      });

      test(`phone ${identity} ${mode}`, async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.addInitScript(
          ([i, m]) => {
            localStorage.setItem("zk-docs-site-identity", i!);
            localStorage.setItem("zk-docs-site-identity-opt-in", "1");
            localStorage.setItem("theme", m!);
          },
          [identity, mode],
        );
        await page.goto(URL, { waitUntil: "networkidle" });
        const preview = page.locator("[data-component-preview]").first();
        await preview.scrollIntoViewIfNeeded();
        await expect(preview.getByRole("heading", { name: "Tasks" })).toBeVisible();
        await expect(preview.getByRole("navigation", { name: "Main" })).toBeHidden();
        const sideways = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(sideways).toBeLessThanOrEqual(1);
        await preview.screenshot({ path: `test-results/page-shell-${identity}-${mode}-phone.png` });
      });
    }
  }
});
