import { expect, test } from "@playwright/test";

import { assertA11yGate } from "./a11y-helpers";

const BASE = "http://127.0.0.1:3100/docs/ui";
const IDENTITIES = ["mist", "press", "tide", "volt", "maison", "glass"] as const;
const OFFLINE = "flag-offline-state-with-a-live-note";
const THEME = "theme-an-admin-app-dark-light-included";

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

test.describe("offline note previews", () => {
  for (const identity of IDENTITIES) {
    for (const mode of ["light", "dark"] as const) {
      for (const [device, width, height] of [
        ["desktop", 1280, 1000],
        ["phone", 390, 844],
      ] as const) {
        test(`${device} ${identity} ${mode}`, async ({ page }) => {
          await page.setViewportSize({ width, height });
          await open(page, OFFLINE, identity, mode);
          const previews = page.locator("[data-component-preview]");
          await expect(previews).toHaveCount(3);

          const drafts = previews.nth(0);
          await drafts.scrollIntoViewIfNeeded();
          await expect(drafts.getByRole("alert")).toContainText("You're offline.");
          await expect(drafts.getByText("INV-2041")).toBeVisible();
          await expect(drafts.getByText("Waiting to sync").first()).toBeVisible();

          const wired = previews.nth(1);
          await wired.scrollIntoViewIfNeeded();
          await expect(wired.getByRole("alert")).toHaveCount(0);
          await wired.getByRole("button", { name: "Simulate losing the connection" }).click();
          await expect(wired.getByRole("alert")).toContainText("No connection");
          await expect(wired.getByRole("button", { name: "Save note" })).toBeDisabled();
          await wired.getByRole("button", { name: "Simulate coming back online" }).click();
          await expect(wired.getByRole("alert")).toHaveCount(0);
          await wired.getByRole("button", { name: "Save note" }).click();
          await expect(wired.getByText(/saved 1 time/)).toBeVisible();

          const wording = previews.nth(2);
          await wording.scrollIntoViewIfNeeded();
          await expect(wording.getByRole("alert")).toContainText("Your cart is saved on this device.");
          await expect(wording.getByRole("button", { name: "Pay now" })).toBeDisabled();

          await assertA11yGate(page, "[data-component-preview]");
          const sideways = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          );
          expect(sideways).toBeLessThanOrEqual(1);
          await drafts.screenshot({ path: `test-results/offline-note-drafts-${identity}-${mode}-${device}.png` });
          await wording.screenshot({ path: `test-results/offline-note-wording-${identity}-${mode}-${device}.png` });
        });
      }
    }
  }

  test("previews have no axe violations", async ({ page }) => {
    await open(page, OFFLINE, "mist", "light");
    await assertA11yGate(page, "[data-component-preview]");
  });

  test("previews have no axe violations in the offline state", async ({ page }) => {
    await open(page, OFFLINE, "mist", "dark");
    const wired = page.locator("[data-component-preview]").nth(1);
    await wired.getByRole("button", { name: "Simulate losing the connection" }).click();
    await expect(wired.getByRole("alert")).toBeVisible();
    await assertA11yGate(page, "[data-component-preview]");
  });
});

test("theme page shows a literal globals.css and names next-themes (#1068)", async ({ page }) => {
  await page.goto(`${BASE}/${THEME}`, { waitUntil: "networkidle" });
  await expect(page.getByText("Globals CSS", { exact: true })).toBeVisible();
  const cssBlock = page.locator("pre").filter({ hasText: '@import "tailwindcss"' }).first();
  await expect(cssBlock).toContainText('@import "@zedtech/zedkit-ui/styles.css"');
  await expect(page.locator("pre").filter({ hasText: "pnpm add next-themes" }).first()).toBeVisible();
});

test.describe("theme previews", () => {
  for (const identity of IDENTITIES) {
    for (const mode of ["light", "dark"] as const) {
      for (const [device, width, height] of [
        ["desktop", 1280, 1000],
        ["phone", 390, 844],
      ] as const) {
        test(`${device} ${identity} ${mode}`, async ({ page }) => {
          await page.setViewportSize({ width, height });
          await open(page, THEME, identity, mode);
          const previews = page.locator("[data-component-preview]");
          await expect(previews).toHaveCount(3);

          const sideBySide = previews.nth(0);
          await sideBySide.scrollIntoViewIfNeeded();
          const light = sideBySide.getByRole("region", { name: "Page theme" });
          const dark = sideBySide.getByRole("region", { name: "Dark scope" });
          await expect(light.getByText("1,284")).toBeVisible();
          await expect(dark.getByText("1,284")).toBeVisible();
          const background = (locator: typeof light) =>
            locator.evaluate((node) => getComputedStyle(node).backgroundColor);
          // A `dark` scope can only add the dark tokens: on a dark page both panels match.
          if (mode === "light") expect(await background(light)).not.toBe(await background(dark));
          else expect(await background(light)).toBe(await background(dark));

          const tokens = previews.nth(1);
          await tokens.scrollIntoViewIfNeeded();
          await expect(tokens.getByRole("list", { name: "Releases" })).toBeVisible();
          await expect(tokens.getByText("Rolled back")).toBeVisible();
          const panel = tokens.getByRole("list", { name: "Releases" });
          const before = await panel.evaluate((node) => getComputedStyle(node).backgroundColor);
          await tokens.getByRole("switch", { name: "Dark" }).click();
          const after = await panel.evaluate((node) => getComputedStyle(node).backgroundColor);
          if (mode === "light") expect(after).not.toBe(before);
          else expect(after).toBe(before);

          const toggle = previews.nth(2);
          await toggle.scrollIntoViewIfNeeded();
          const button = toggle.getByRole("button", { name: "Dark theme" });
          await expect(button).toHaveAttribute("aria-pressed", "false");
          await button.click();
          await expect(button).toHaveAttribute("aria-pressed", "true");

          await assertA11yGate(page, "[data-component-preview]");
          const sidewaysScroll = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          );
          expect(sidewaysScroll).toBeLessThanOrEqual(1);
          await sideBySide.screenshot({ path: `test-results/theme-sides-${identity}-${mode}-${device}.png` });
          await tokens.screenshot({ path: `test-results/theme-tokens-${identity}-${mode}-${device}.png` });
        });
      }
    }
  }

  test("previews have no axe violations", async ({ page }) => {
    await open(page, THEME, "mist", "light");
    await assertA11yGate(page, "[data-component-preview]");
  });

  test("previews have no axe violations with the dark scope on", async ({ page }) => {
    await open(page, THEME, "mist", "light");
    const previews = page.locator("[data-component-preview]");
    await previews.nth(1).getByRole("switch", { name: "Dark" }).click();
    await previews.nth(2).getByRole("button", { name: "Dark theme" }).click();
    await assertA11yGate(page, "[data-component-preview]");
  });
});
