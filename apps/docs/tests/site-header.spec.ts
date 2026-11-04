import { expect, test } from "@playwright/test";

import { readComputedContrast } from "./a11y-helpers";
import { useIdentity } from "./identity-helpers";

test.describe("site header navigation (#1034)", () => {
  test("desktop header links to the catalog and the UI changelog", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });

    const header = page.locator("#nd-nav");
    await expect(
      header.getByRole("link", { name: "Catalog", exact: true }),
    ).toHaveAttribute("href", "/catalog");
    await expect(header.getByRole("link", { name: "UI changelog" })).toBeVisible();
    await expect(page.getByLabel("Try another identity")).toHaveCount(0);
  });

  test("a deep docs page reaches the catalog from its chrome", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/docs/getting-started", { waitUntil: "networkidle" });

    await expect(
      page.getByRole("link", { name: "Catalog", exact: true }).first(),
    ).toHaveAttribute("href", "/catalog");
  });

  test("Guides menu entries are honest and none duplicates another URL", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });

    const header = page.locator("#nd-nav");
    await header.getByRole("button", { name: "Guides" }).click();

    const guides = [
      ["Getting started", "/docs/getting-started"],
      ["Start without writing code", "/docs/start-without-writing-code"],
      ["Build an admin dashboard", "/docs/build-an-admin-dashboard"],
      ["Set up your coding agents", "/docs/set-up-your-coding-agents"],
      ["Add SEO to a Next.js app", "/docs/add-seo-to-nextjs"],
      ["zedkit and shadcn/ui", "/docs/zedkit-and-shadcn"],
      ["Maturity and compatibility", "/docs/maturity-and-compatibility"],
      ["Note list example", "/examples/note-list"],
    ] as const;
    for (const [name, href] of guides) {
      await expect(header.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
    }

    // "Documentation" is the only header entry that may point at /docs.
    await expect(header.locator('a[href="/docs"]')).toHaveCount(1);
    await expect(header.getByRole("link", { name: /Tutorials & catalog/ })).toHaveCount(0);
  });

  test("Guides menu panel is a real surface at 1440 (glass and solid looks)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    const header = page.locator("#nd-nav");
    await header.getByRole("button", { name: "Guides" }).hover();
    await expect(header.getByRole("link", { name: "Getting started", exact: true })).toBeVisible();
    const panel = header.locator(".flex.w-full.justify-center > *");
    await expect(panel).toBeVisible();
    await header.getByRole("link", { name: "Getting started", exact: true }).hover();

    const glass = await panel.evaluate((el) => {
      const s = getComputedStyle(el);
      const bg = s.backgroundColor;
      const alpha = Number(/rgba\([^)]*,\s*([\d.]+)\)/.exec(bg)?.[1] ?? 1);
      return {
        bg,
        alpha,
        filter: s.backdropFilter || s.getPropertyValue("-webkit-backdrop-filter"),
        headerFilter: getComputedStyle(document.querySelector("#nd-nav")!).backdropFilter,
      };
    });
    expect(glass.bg === "transparent" || glass.bg === "rgba(0, 0, 0, 0)").toBe(false);
    expect(glass.alpha).toBeGreaterThanOrEqual(0.75);
    expect(glass.filter).toContain("blur(");
    expect(glass.headerFilter === "none" || glass.headerFilter === "").toBe(true);
    const glassContrast = await readComputedContrast(
      page,
      header.getByRole("link", { name: "Getting started", exact: true }),
    );
    expect(glassContrast).toBeGreaterThanOrEqual(4.5);

    await page.keyboard.press("Escape");
    const guideLink = header.getByRole("link", { name: "Getting started", exact: true });
    await expect(guideLink).toBeHidden();
    await useIdentity(page, "mist", "light");
    // Click, not hover: the mouse is already over Guides, so a second hover
    // dispatches no pointerenter and the menu stays shut.
    const guides = header.getByRole("button", { name: "Guides" });
    await guides.click();
    await expect(guides).toHaveAttribute("aria-expanded", "true");
    await expect(guideLink).toBeVisible();
    await guideLink.hover();
    await expect(panel).toBeVisible();
    const mist = await panel.evaluate((el) => {
      const s = getComputedStyle(el);
      const bg = s.backgroundColor;
      const alpha = Number(/rgba\([^)]*,\s*([\d.]+)\)/.exec(bg)?.[1] ?? 1);
      return { alpha, filter: s.backdropFilter || s.getPropertyValue("-webkit-backdrop-filter") };
    });
    expect(mist.alpha).toBeGreaterThanOrEqual(0.95);
    expect(mist.filter === "none" || mist.filter === "").toBe(true);
    const mistContrast = await readComputedContrast(
      page,
      header.getByRole("link", { name: "Getting started", exact: true }),
    );
    expect(mistContrast).toBeGreaterThanOrEqual(4.5);
  });

  test("Guides menu panel keeps AA contrast in dark at 1440", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    await useIdentity(page, "glass", "dark");
    const header = page.locator("#nd-nav");
    await header.getByRole("button", { name: "Guides" }).hover();
    await expect(header.getByRole("link", { name: "Getting started", exact: true })).toBeVisible();
    await header.getByRole("link", { name: "Getting started", exact: true }).hover();
    const contrast = await readComputedContrast(
      page,
      header.getByRole("link", { name: "Getting started", exact: true }),
    );
    expect(contrast).toBeGreaterThanOrEqual(4.5);
  });

  test("phone menu lists the catalog", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/", { waitUntil: "networkidle" });

    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("navigation", { name: "Menu" });
    await expect(
      menu.getByRole("link", { name: "Catalog", exact: true }),
    ).toHaveAttribute("href", "/catalog");
    await expect(menu.getByRole("link", { name: "UI changelog" })).toBeVisible();
    await expect(menu.getByText("Guides", { exact: true })).toBeVisible();
    await expect(menu.getByRole("link", { name: "Getting started", exact: true })).toBeVisible();
  });
});
