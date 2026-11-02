import { expect, test } from "@playwright/test";

import { DEFAULT_IDENTITY } from "../lib/default-identity";
import { assertA11yGate, readComputedContrast } from "./a11y-helpers";

const BASE = "http://127.0.0.1:3100";

const A11Y_ROUTES = [
  { path: "/", label: "home" },
  { path: "/docs", label: "docs-index" },
  { path: "/docs/getting-started", label: "getting-started" },
  { path: "/docs/ui/stamp-data-with-its-age", label: "component-alpha" },
  { path: "/docs/set-up-your-coding-agents", label: "tutorial-agents" },
  {
    path: "/docs/ai/set-up-ai-agent-instructions-skills-subagents-and-commands-in-a-repo",
    label: "ai-guide",
  },
  { path: "/docs/ui/pick-one-option-from-a-dropdown", label: "component-select" },
  { path: "/docs/ui/call-out-a-notice-or-an-error-state", label: "component-alert" },
  { path: "/docs/maturity-and-compatibility", label: "maturity-table" },
  { path: "/catalog", label: "catalog" },
] as const;

const VIEWPORTS = [
  { width: 390, height: 844, name: "mobile" },
  { width: 1280, height: 900, name: "desktop" },
] as const;

async function openWithTheme(
  page: import("@playwright/test").Page,
  path: string,
  theme: "light" | "dark",
) {
  await page.addInitScript((mode) => {
    localStorage.setItem("theme", mode);
  }, theme);
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await page.evaluate((mode) => {
    document.documentElement.classList.toggle("dark", mode === "dark");
    document.documentElement.style.colorScheme = mode;
  }, theme);
  if (theme === "light") {
    await page.waitForFunction(({ id }) => {
      const root = document.documentElement;
      if (root.getAttribute("data-identity") !== id) return false;
      const muted = getComputedStyle(root).getPropertyValue("--muted-foreground").trim();
      return muted.length > 0;
    }, { id: DEFAULT_IDENTITY });
  }
}

test.describe("a11y gate (#396)", () => {
  for (const route of A11Y_ROUTES) {
    for (const viewport of VIEWPORTS) {
      for (const theme of ["light", "dark"] as const) {
        test(`${route.label} ${viewport.name} ${theme}: axe gate rules`, async ({ page }) => {
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await openWithTheme(page, route.path, theme);
          const scope = route.label.startsWith("component-") ? "[data-component-preview]" : "body";
          await assertA11yGate(page, scope);
        });
      }
    }
  }

  const maturitySamples: { path: string; name: string }[] = [
    { path: "/docs/ui/pin-a-stage-and-change-scene-as-the-page-scrolls", name: "alpha" },
    { path: "/catalog", name: "beta" },
  ];

  for (const theme of ["light", "dark"] as const) {
    for (const sample of maturitySamples) {
      test(`maturity ${sample.name} badge ${theme}: contrast >= 4.5:1`, async ({ page }) => {
        await openWithTheme(page, sample.path, theme);
        const badge = page
          .locator("main a[data-badge-link]")
          .filter({ hasText: new RegExp(`^${sample.name}$`, "i") })
          .first();
        await expect(badge).toBeVisible();
        const ratio = await readComputedContrast(page, badge);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  test("docs sidebar trigger name matches native tooltip (#396)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/docs/getting-started`, { waitUntil: "networkidle" });
    const trigger = page.locator("#nd-mobile-nav").getByRole("button", { name: "Open navigation" });
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute("title", "Open navigation");
    await expect(trigger).toHaveAttribute("aria-label", "Open navigation");
  });
});
