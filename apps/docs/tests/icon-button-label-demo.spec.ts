import { expect, test } from "@playwright/test";

import { assertA11yGate } from "./a11y-helpers";

const BASE = "http://127.0.0.1:3100/docs/ui";
const IDENTITIES = ["mist", "press", "tide", "volt", "maison", "glass"] as const;

async function open(page: import("@playwright/test").Page, path: string, identity: string, mode: string) {
  await page.addInitScript(
    ([i, m]) => {
      localStorage.setItem("zk-docs-site-identity", i!);
      localStorage.setItem("zk-docs-site-identity-opt-in", "1");
      localStorage.setItem("theme", m!);
    },
    [identity, mode],
  );
  await page.goto(`${BASE}/${path}`, { waitUntil: "networkidle" });
}

test.describe("icon-only actions with a visible name", () => {
  for (const identity of IDENTITIES) {
    for (const mode of ["light", "dark"] as const) {
      for (const [device, width, height] of [
        ["desktop", 1280, 1000],
        ["phone", 390, 844],
      ] as const) {
        test(`${device} ${identity} ${mode}`, async ({ page }) => {
          await page.setViewportSize({ width, height });
          await open(page, "icon-only-actions-with-a-visible-name", identity, mode);
          const previews = page.locator("[data-component-preview]");
          const toolbar = previews.first();
          await toolbar.scrollIntoViewIfNeeded();
          for (const name of ["Refresh tasks", "Share project", "Archive project"]) {
            const button = toolbar.getByRole("button", { name });
            await expect(button).toBeVisible();
            await expect(button).toHaveAttribute("title", name);
          }
          await toolbar.getByRole("button", { name: "Share project" }).click();
          await expect(toolbar.getByRole("status")).toHaveText("Link copied to the clipboard.");
          const rows = previews.nth(1);
          await rows.scrollIntoViewIfNeeded();
          await expect(rows.getByRole("button", { name: "Delete Pick the hero photo" })).toBeVisible();
          await rows.getByRole("button", { name: "Delete Pick the hero photo" }).click();
          await expect(rows.getByRole("button", { name: "Delete Pick the hero photo" })).toHaveCount(0);
          await rows.getByRole("button", { name: "Restore tasks" }).click();
          await expect(rows.getByRole("button", { name: "Delete Pick the hero photo" })).toBeVisible();
          const sideways = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          );
          expect(sideways).toBeLessThanOrEqual(1);
          await toolbar.screenshot({ path: `test-results/icon-button-toolbar-${identity}-${mode}-${device}.png` });
          await rows.screenshot({ path: `test-results/icon-button-rows-${identity}-${mode}-${device}.png` });
        });
      }
    }
  }

  test("preview has no axe violations", async ({ page }) => {
    await open(page, "icon-only-actions-with-a-visible-name", "mist", "light");
    await assertA11yGate(page, "[data-a11y-preview-root]");
  });
});

test.describe("quiet icon beside inline text", () => {
  for (const identity of IDENTITIES) {
    for (const mode of ["light", "dark"] as const) {
      for (const [device, width, height] of [
        ["desktop", 1280, 1000],
        ["phone", 390, 844],
      ] as const) {
        test(`${device} ${identity} ${mode}`, async ({ page }) => {
          await page.setViewportSize({ width, height });
          await open(page, "quiet-icon-beside-inline-text", identity, mode);
          const previews = page.locator("[data-component-preview]");
          const details = previews.first();
          await details.scrollIntoViewIfNeeded();
          await expect(details.getByText("Due Nov 14")).toBeVisible();
          // The icon is decorative: it never appears in the accessibility tree.
          await expect(details.getByRole("img")).toHaveCount(0);
          const orders = previews.nth(1);
          await orders.scrollIntoViewIfNeeded();
          await expect(orders.getByRole("list", { name: "Recent orders" }).getByRole("listitem")).toHaveCount(4);
          await expect(orders.getByText("Return requested")).toBeVisible();
          const areas = previews.nth(2);
          await areas.scrollIntoViewIfNeeded();
          await expect(areas.getByText("Build a UI")).toBeVisible();
          await expect(areas.getByText("Set up coding agents")).toBeVisible();
          await expect(areas.locator("svg[aria-hidden='true']")).toHaveCount(4);
          const sideways = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          );
          expect(sideways).toBeLessThanOrEqual(1);
          await details.screenshot({ path: `test-results/icon-label-details-${identity}-${mode}-${device}.png` });
          await orders.screenshot({ path: `test-results/icon-label-orders-${identity}-${mode}-${device}.png` });
        });
      }
    }
  }

  test("preview has no axe violations", async ({ page }) => {
    await open(page, "quiet-icon-beside-inline-text", "mist", "light");
    await assertA11yGate(page, "[data-a11y-preview-root]");
  });
});
