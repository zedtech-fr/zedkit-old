import { expect, test } from "@playwright/test";

import { waitForAppliedLook } from "./identity-helpers";

const IDENTITIES = ["mist", "press", "tide", "volt", "maison", "glass"] as const;

async function isAccentFill(
  page: import("@playwright/test").Page,
  locator: import("@playwright/test").Locator,
) {
  return locator.evaluate((el) => {
    const style = getComputedStyle(el);
    const bg = style.backgroundColor;
    if (bg === "rgba(0, 0, 0, 0)" || bg === "transparent") return false;
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
    if (!accent) return false;
    const probe = document.createElement("div");
    probe.style.backgroundColor = `hsl(${accent} / 1)`;
    probe.style.position = "fixed";
    probe.style.left = "-9999px";
    document.body.appendChild(probe);
    const accentBg = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return bg === accentBg;
  });
}

test("Link-variant button stays underline-only on hover (no accent block)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.locator("#use-cases").scrollIntoViewIfNeeded();
  const link = page.locator("#use-cases").getByRole("link", { name: "Start without writing code" });
  await expect(link).toBeVisible();
  await link.hover();
  expect(await isAccentFill(page, link)).toBe(false);
  await expect(link).toHaveCSS("text-decoration-line", /underline/);
});

test("selected identity tab avoids primary fill when active", async ({ page }) => {
  await page.goto("/");
  const mist = page.locator("#use-cases").getByRole("tab", { name: "Mist" });
  await mist.click();
  await expect(mist).toHaveAttribute("aria-selected", "true");
  const primaryBg = await page.evaluate(() => {
    const probe = document.createElement("button");
    probe.className = "bg-primary text-primary-foreground";
    probe.style.position = "fixed";
    probe.style.left = "-9999px";
    document.body.appendChild(probe);
    const color = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return color;
  });
  const tabBg = await mist.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(tabBg).not.toEqual(primaryBg);
});

for (const identity of IDENTITIES) {
  for (const theme of ["light", "dark"] as const) {
    test(`button demo controls avoid accent fill on hover (${identity}, ${theme})`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.addInitScript(
        ([id, mode]) => {
          localStorage.setItem("zk-docs-site-identity", id);
          localStorage.setItem("zk-docs-site-identity-opt-in", "1");
          localStorage.setItem("theme", mode);
        },
        [identity, theme],
      );
      await page.goto("/docs/ui/trigger-actions-with-buttons");
      await waitForAppliedLook(page, identity, theme);
      const preview = page.locator("[data-component-preview]").first();
      await preview.scrollIntoViewIfNeeded();
      for (const name of ["Create app", "Cancel", "Details", "Delete"] as const) {
        const button = preview.getByRole("button", { name });
        await button.hover();
        expect(await isAccentFill(page, button)).toBe(false);
      }
      await preview.getByRole("button", { name: "Create app" }).focus();
      await expect(preview.getByRole("button", { name: "Create app" })).toBeFocused();
    });
  }
}

test("docs anchor scroll leaves the target h2 below the sticky header", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/docs/getting-started#prerequisites");
  await page.waitForLoadState("networkidle");
  const headerBottom = await page.evaluate(() => {
    const nav = document.querySelector("#nd-nav");
    const mobile = document.querySelector("#nd-mobile-nav");
    const rects = [nav, mobile]
      .filter(Boolean)
      .map((el) => el!.getBoundingClientRect().bottom);
    return rects.length > 0 ? Math.max(...rects) : 0;
  });
  const headingTop = await page.locator("#prerequisites").evaluate((el) => el.getBoundingClientRect().top);
  expect(headingTop).toBeGreaterThanOrEqual(headerBottom - 2);
});
