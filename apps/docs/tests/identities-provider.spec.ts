import { expect, test, type Page } from "@playwright/test";

import { DEFAULT_IDENTITY } from "../lib/default-identity";

// Relative paths: the config baseURL decides the port.
const PAGE = "/docs/ui/trigger-actions-with-buttons";

function themeColors(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')].map((meta) => meta.content),
  );
}

function background(page: Page) {
  return page.evaluate(() => getComputedStyle(document.body).backgroundColor);
}

/** Compare colours as the browser resolves them (hsl() and #hex both become rgb()). */
function resolve(page: Page, color: string) {
  return page.evaluate((value) => {
    const probe = document.createElement("div");
    probe.style.color = value;
    document.body.appendChild(probe);
    const rgb = getComputedStyle(probe).color;
    probe.remove();
    return rgb;
  }, color);
}

test("an unknown stored id is ignored: the site default applies", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("zk-identity", "anything"));
  await page.goto(PAGE, { waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("data-identity", DEFAULT_IDENTITY);
});

test("a stored built-in id is applied before first paint when the visitor opted in", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("zk-docs-site-identity", "press");
    localStorage.setItem("zk-docs-site-identity-opt-in", "1");
  });
  await page.goto(PAGE, { waitUntil: "commit" });
  await expect(page.locator("html")).toHaveAttribute("data-identity", "press");
});

for (const mode of ["light", "dark"] as const) {
  test(`theme-color follows the ${mode} page background`, async ({ page }) => {
    await page.addInitScript((theme) => localStorage.setItem("theme", theme), mode);
    await page.goto(PAGE, { waitUntil: "networkidle" });
    const colors = await themeColors(page);
    expect(colors.length).toBeGreaterThan(0);
    const expected = await background(page);
    for (const color of colors) expect(await resolve(page, color)).toBe(expected);
  });
}

test("theme-color updates when the theme is toggled", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("theme", "light"));
  await page.goto(PAGE, { waitUntil: "networkidle" });
  const before = await resolve(page, (await themeColors(page))[0]!);
  await page.evaluate(() => {
    document.documentElement.classList.add("dark");
  });
  await expect
    .poll(async () => resolve(page, (await themeColors(page))[0]!))
    .not.toBe(before);
  expect(await resolve(page, (await themeColors(page))[0]!)).toBe(await background(page));
});
