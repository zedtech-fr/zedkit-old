import { expect, test } from "@playwright/test";

import { readComputedContrast } from "./a11y-helpers";
import { DEFAULT_IDENTITY } from "../lib/default-identity";
import { homeCopy } from "../ui/home/i18n/home-copy";
import { persistDocsSiteLook, waitForAppliedLook } from "./identity-helpers";

const SHOTS = process.env.HOME_LINK_SHOTS;
const shotPath = (name: string) => (SHOTS ? `${SHOTS}/${name}` : `test-results/${name}`);

for (const theme of ["light", "dark"] as const) {
  for (const { width, name } of [
    { width: 390, name: "390" },
    { width: 1440, name: "1440" },
  ] as const) {
    test(`consistency after ${name}px ${theme}`, async ({ page }) => {
      await persistDocsSiteLook(page, DEFAULT_IDENTITY, theme);
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/", { waitUntil: "networkidle" });
      await waitForAppliedLook(page, DEFAULT_IDENTITY, theme);

      if (width >= 768) {
        const header = page.locator("#nd-nav");
        await header.screenshot({ path: shotPath(`consistency-after-${name}-${theme}.png`), animations: "disabled" });
        // fumadocs renders the slots twice (desktop bar + collapsed menu); assert the visible ones.
        const toggle = header.locator("[data-theme-toggle]").filter({ visible: true }).first();
        const search = header
          .locator('[data-search], [aria-label="Search documentation"]')
          .filter({ visible: true })
          .first();
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
      const fullSteps = page.locator("a[data-home-full-steps]");
      await expect(fullSteps).toBeVisible();
      await expect(fullSteps).toHaveAttribute("href", homeCopy.getStarted.quickStart.fullStepsHref);
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

      await fullSteps.screenshot({ path: shotPath(`consistency-after-full-steps-${name}-${theme}.png`) });

      await page.locator("#entry-points").scrollIntoViewIfNeeded();
      const entryCtas = [
        "Start with buttons",
        "Start with the Nest bootstrap",
        "Open SEO docs",
        "Open agent setup docs",
        "Read the AI setup guide",
      ] as const;
      for (const label of entryCtas) {
        const link = page.getByRole("link", { name: label });
        await expect(link).toBeVisible();
        const pad = await link.evaluate((el) => {
          const style = getComputedStyle(el);
          return {
            left: parseFloat(style.paddingLeft),
            right: parseFloat(style.paddingRight),
          };
        });
        expect(pad.left, label).toBeGreaterThan(0);
        expect(pad.right, label).toBeGreaterThan(0);
      }
      await page
        .locator("#entry-points [data-home-secondary-links]")
        .screenshot({ path: shotPath(`consistency-after-more-in-kit-${name}-${theme}.png`) });
    });
  }
}

test("shell version label is caption text, not a link", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
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

for (const theme of ["light", "dark"] as const) {
  test(`guides menu glass panel at 1440 ${theme}`, async ({ page }) => {
    await persistDocsSiteLook(page, DEFAULT_IDENTITY, theme);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    await waitForAppliedLook(page, DEFAULT_IDENTITY, theme);
    const header = page.locator("#nd-nav");
    await header.getByRole("button", { name: "Guides" }).hover();
    const panel = header.locator(".flex.w-full.justify-center > *");
    await expect(panel).toBeVisible();
    const link = header.getByRole("link", { name: "Getting started", exact: true });
    await expect(link).toBeVisible();
    const panelStyle = await panel.evaluate((el) => {
      const s = getComputedStyle(el);
      const bg = s.backgroundColor;
      const alpha = Number(/rgba\([^)]*,\s*([\d.]+)\)/.exec(bg)?.[1] ?? 1);
      return {
        alpha,
        filter: s.backdropFilter || s.getPropertyValue("-webkit-backdrop-filter"),
      };
    });
    expect(panelStyle.alpha).toBeGreaterThanOrEqual(0.6);
    expect(panelStyle.alpha).toBeLessThanOrEqual(0.8);
    expect(panelStyle.filter).toContain("blur(24px");
    const contrast = await readComputedContrast(page, link);
    expect(contrast).toBeGreaterThanOrEqual(4.5);
    await panel.screenshot({ path: shotPath(`guides-menu-after-1440-${theme}.png`) });
  });
}
