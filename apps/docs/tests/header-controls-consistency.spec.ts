import { expect, test } from "@playwright/test";

import { DEFAULT_IDENTITY } from "../lib/default-identity";
import { homeCopy } from "../ui/home/i18n/home-copy";
import { persistDocsSiteLook, waitForAppliedLook } from "./identity-helpers";

const BASE = "http://127.0.0.1:3100";
const SHOTS = "/data/zk-work/home-link-shots";

for (const theme of ["light", "dark"] as const) {
  for (const { width, name } of [
    { width: 390, name: "390" },
    { width: 1440, name: "1440" },
  ] as const) {
    test(`consistency after ${name}px ${theme}`, async ({ page }) => {
      await persistDocsSiteLook(page, DEFAULT_IDENTITY, theme);
      await page.setViewportSize({ width, height: 900 });
      await page.goto(BASE, { waitUntil: "networkidle" });
      await waitForAppliedLook(page, DEFAULT_IDENTITY, theme);

      if (width >= 768) {
        const header = page.locator("#nd-nav");
        await header.screenshot({ path: `${SHOTS}/consistency-after-${name}-${theme}.png`, animations: "disabled" });
        const toggle = header.locator("[data-theme-toggle]");
        const search = header.locator("[data-search]").first();
        const github = header.locator('a[aria-label*="GitHub"]').first();
        await expect(toggle).toBeVisible();
        await expect(search).toBeVisible();
        await expect(github).toBeVisible();
        const heights = await page.evaluate(() => {
          const measure = (el: Element | null) => (el ? el.getBoundingClientRect().height : 0);
          const nav = document.querySelector("#nd-nav nav");
          return {
            toggle: measure(nav?.querySelector("[data-theme-toggle]") ?? null),
            search: measure(nav?.querySelector("[data-search]") ?? null),
            github: measure(nav?.querySelector('a[aria-label*="GitHub"]') ?? null),
          };
        });
        expect(Math.max(heights.toggle, heights.search, heights.github)).toBeLessThanOrEqual(
          Math.min(heights.toggle, heights.search, heights.github) + 2,
        );
      }

      await page.locator("#get-started").scrollIntoViewIfNeeded();
      const fullSteps = page.locator("[data-home-full-steps]");
      await expect(fullSteps.getByRole("link", { name: homeCopy.getStarted.quickStart.fullSteps })).toBeVisible();
      const padding = await fullSteps.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          left: parseFloat(style.paddingLeft),
          right: parseFloat(style.paddingRight),
          top: parseFloat(style.paddingTop),
          bottom: parseFloat(style.paddingBottom),
          cursor: style.cursor,
        };
      });
      expect(padding.left).toBeGreaterThanOrEqual(10);
      expect(padding.right).toBeGreaterThanOrEqual(10);
      expect(padding.top).toBeGreaterThanOrEqual(4);
      expect(padding.bottom).toBeGreaterThanOrEqual(4);
      expect(padding.cursor).not.toBe("default");

      await fullSteps.screenshot({ path: `${SHOTS}/consistency-after-full-steps-${name}-${theme}.png` });
    });
  }
}

test("shell version label is caption text, not a link", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  const version = page.locator("#nd-nav [data-kit-version]");
  await expect(version).toBeVisible();
  const style = await version.evaluate((el) => {
    const s = getComputedStyle(el);
    return { fontSize: s.fontSize, cursor: s.cursor, tag: el.tagName };
  });
  expect(style.tag).toBe("SPAN");
  expect(parseFloat(style.fontSize)).toBeLessThanOrEqual(13);
  expect(style.cursor).not.toBe("pointer");
});
