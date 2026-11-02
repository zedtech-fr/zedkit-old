import { expect, test, type Page } from "@playwright/test";

import { DEFAULT_IDENTITY } from "../lib/default-identity";
import { assertA11yGate } from "./a11y-helpers";

// Relative paths: the config baseURL decides the port.
const PAGE = "/docs/getting-started";
const DEFAULT = DEFAULT_IDENTITY;

type Seen = Array<string | null>;

/** Records every value `data-identity` takes on <html>, from the first script on. */
async function recordIdentity(page: Page) {
  await page.addInitScript(() => {
    const seen: Seen = [];
    (window as unknown as { __identitySeen: Seen }).__identitySeen = seen;
    const read = () => document.documentElement?.getAttribute("data-identity") ?? null;
    seen.push(read());
    new MutationObserver(() => seen.push(read())).observe(document, {
      attributes: true,
      subtree: true,
      attributeFilter: ["data-identity"],
    });
    document.addEventListener("DOMContentLoaded", () => seen.push(`dcl:${read()}`));
  });
}

const seenValues = (page: Page) =>
  page.evaluate(() => (window as unknown as { __identitySeen: Seen }).__identitySeen);

const identityValues = (seen: Seen) => seen.filter((value) => value !== null && !value.startsWith("dcl:"));

test("a first-time visitor gets Tide before the first paint, with no change after", async ({ page }) => {
  expect(DEFAULT).toBe("tide");
  await recordIdentity(page);
  await page.goto(PAGE, { waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("data-identity", DEFAULT);
  const seen = await seenValues(page);
  expect(identityValues(seen)).toEqual([DEFAULT]);
  expect(seen).toContain(`dcl:${DEFAULT}`);
});

test("legacy stored identity keys do not override the default site look", async ({ page }) => {
  await recordIdentity(page);
  await page.addInitScript(() => {
    localStorage.setItem("zk-identity", "mist");
    localStorage.setItem("zk-identity-custom", ":root{--spacing:0.5rem}");
  });
  await page.goto(PAGE, { waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("data-identity", DEFAULT);
  expect(identityValues(await seenValues(page))).toEqual([DEFAULT]);
});

test("site shell has no global identity chooser", async ({ page }) => {
  for (const width of [1280, 390] as const) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await expect(page.getByRole("combobox", { name: "Identity" })).toHaveCount(0);
    await expect(page.getByLabel("Try another identity")).toHaveCount(0);
  }
});

for (const theme of ["light", "dark"] as const) {
  test(`the default passes the a11y gate in ${theme}`, async ({ page }) => {
    await page.addInitScript((mode) => localStorage.setItem("theme", mode), theme);
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("data-identity", DEFAULT);
    await expect(page.locator("html")).toHaveClass(new RegExp(`\\b${theme}\\b`));
    await page.evaluate(() => document.fonts.ready);
    await assertA11yGate(page);
  });
}

test("reduced motion is respected under the default identity", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("data-identity", DEFAULT);
  const longest = await page.evaluate(() => {
    let max = 0;
    for (const el of document.querySelectorAll<HTMLElement>("body *")) {
      const style = getComputedStyle(el);
      for (const value of style.animationDuration.split(",")) {
        const ms = parseFloat(value) * (value.includes("ms") ? 1 : 1000);
        if (Number.isFinite(ms)) max = Math.max(max, ms);
      }
    }
    return max;
  });
  expect(longest).toBeLessThanOrEqual(10);
});
