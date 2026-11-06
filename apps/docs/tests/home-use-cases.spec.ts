import { expect, test } from "@playwright/test";

import { DEFAULT_IDENTITY } from "../lib/default-identity";
import { openHeroPage } from "./hero-helpers";

/**
 * Home: hero Display row scopes the specimen; identities are linked from the secondary band.
 */

test.use({ storageState: { cookies: [], origins: [] } });

test("the hero keeps the page identity: nothing cycles, nothing is written", async ({ page }) => {
  await page.goto("/");
  const before = await page.locator("html").getAttribute("data-identity");
  await page.waitForTimeout(2500);
  await expect(page.locator("[data-identity-cycle], [data-identity-cycle-layer]")).toHaveCount(0);
  expect(await page.locator("html").getAttribute("data-identity")).toBe(before);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("the hero demo follows get started, before component families", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const order = await page.evaluate(() => {
    const top = (selector: string) => document.querySelector(selector)?.getBoundingClientRect().top ?? Number.NaN;
    const precedes = (earlier: string, later: string) => {
      const a = document.querySelector(earlier);
      const b = document.querySelector(later);
      if (!a || !b) return false;
      return (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    };
    return {
      h1BeforeDemo: precedes("#home-page h1", "#demo"),
      demo: top("#demo"),
      getStarted: top("#get-started"),
      components: top("#components"),
    };
  });
  expect(order.h1BeforeDemo).toBe(true);
  expect(order.getStarted).toBeLessThan(order.components);
  expect(order.demo).toBeLessThan(order.getStarted);
});

test("Display scopes identity without touching the site shell", async ({ page }) => {
  await page.goto("/");
  const shellBefore = await page.locator("html").getAttribute("data-identity");
  const proof = page.locator("[data-home-hero-proof]");
  await expect(proof.getByText("Display", { exact: true })).toBeVisible();
  await proof.getByRole("combobox", { name: "Identity for this demo" }).click();
  await page.getByRole("option", { name: "Glass" }).click();
  await expect(proof.locator("[data-identity-scope]")).toHaveAttribute("data-identity", "glass");
  expect(await page.locator("html").getAttribute("data-identity")).toBe(shellBefore ?? DEFAULT_IDENTITY);
});

test("the identities band links to the demo editor and no-code route (#1092)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const section = page.locator("#identities");
  await section.scrollIntoViewIfNeeded();
  const identities = section.locator("#use-cases");
  await identities.scrollIntoViewIfNeeded();
  await expect(section.getByRole("link", { name: "Try the demo editor" })).toHaveAttribute(
    "href",
    "/features/identity-editor#create",
  );
  await expect(section.getByRole("link", { name: "Start without writing code" })).toHaveAttribute(
    "href",
    "/docs/start-without-writing-code",
  );
});

test("Display preview mode reaches the table without a toolbar select", async ({ page }) => {
  await page.goto("/");
  await openHeroPage(page, "Apps");
  const card = page.locator("[data-home-dashboard-card]");
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator("[data-demo-toolbar] [role=combobox]")).toHaveCount(0);
  await page.locator("[data-hero-demo-display]").getByRole("combobox", { name: "Table preview mode" }).click();
  await page.getByRole("option", { name: "Empty" }).click();
  await expect(card.getByText(/No apps yet/)).toBeVisible();
});

test("identity looks has one example tab per product screen", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const looks = page.locator("[data-home-identity-looks]");
  await looks.scrollIntoViewIfNeeded();
  await expect(looks.getByRole("tab")).toHaveCount(3);
});
