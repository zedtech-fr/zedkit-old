import { expect, test, type Locator, type Page } from "@playwright/test";

import { DOCS_SHIPPED_IDENTITIES, readComputedContrast, type DocsShippedIdentity } from "./a11y-helpers";
import { persistDocsSiteLook } from "./identity-helpers";

const TABLE_PAGE = "/docs/ui/show-a-sortable-filterable-paginated-data-table";
const OVERLAY_PAGES = [
  {
    name: "dialog",
    path: "/docs/ui/open-modal-dialogs",
    open: (preview: Locator) => preview.getByRole("button", { name: "Open dialog" }).click(),
    locate: (page: Page) => page.locator("[data-slot='dialog-content']"),
  },
  {
    name: "select",
    path: "/docs/ui/pick-one-option-from-a-dropdown",
    open: (preview: Locator) => preview.getByRole("combobox", { name: "Pick a region" }).click(),
    locate: (page: Page) => page.locator("[data-slot='select-content']"),
  },
  {
    name: "popover",
    path: "/docs/ui/float-extra-content-next-to-a-control",
    open: (preview: Locator) => preview.getByRole("button", { name: "Filters" }).click(),
    locate: (page: Page) => page.locator("[data-slot='popover-content']"),
  },
  {
    name: "menu",
    path: "/docs/ui/open-a-menu-of-actions-from-a-button",
    open: (preview: Locator) => preview.getByRole("button", { name: "Actions" }).click(),
    locate: (page: Page) => page.locator("[data-slot='dropdown-menu-content']"),
  },
  {
    name: "tooltip",
    path: "/docs/ui/name-a-control-on-hover",
    open: (preview: Locator) => preview.getByRole("button", { name: "Save" }).hover(),
    locate: (page: Page) => page.locator("[data-slot='tooltip-content']"),
  },
  {
    name: "toast",
    path: "/docs/ui/show-toast-notifications",
    open: (preview: Locator) => preview.getByRole("button", { name: "Show toast" }).click(),
    locate: (page: Page) => page.locator("[data-sonner-toast]"),
  },
] as const;

const IDENTITY_SANS: Record<DocsShippedIdentity, string> = {
  mist: "Inter Variable",
  press: "Space Grotesk",
  tide: "Inter Variable",
  volt: "Geist",
  maison: "Jost Variable",
  glass: "Inter Variable",
};

async function pinSpecimen(preview: Locator, identity: DocsShippedIdentity, mode: "light" | "dark") {
  await preview.scrollIntoViewIfNeeded();
  await preview.getByRole("combobox", { name: "Style of this demo" }).selectOption(identity);
  await preview.getByRole("button", { name: mode === "light" ? "Light" : "Dark", exact: true }).click();
  const surface = preview.locator("[data-preview-surface]");
  await expect(surface).toHaveAttribute("data-identity", identity);
  await expect.poll(() => surface.evaluate((node) => node.classList.contains("dark"))).toBe(mode === "dark");
  return surface;
}

function readScopeTokens(surface: Locator) {
  return surface.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      identity: node.getAttribute("data-identity"),
      dark: node.classList.contains("dark"),
      foreground: style.getPropertyValue("--foreground").trim(),
      background: style.getPropertyValue("--background").trim(),
      fontSans: style.getPropertyValue("--zk-font-sans").trim(),
      color: style.color,
      fontFamily: style.fontFamily,
      colorCard: style.getPropertyValue("--color-card").trim(),
      colorFdCard: style.getPropertyValue("--color-fd-card").trim(),
    };
  });
}

function readOverlayTokens(overlay: Locator) {
  return overlay.evaluate((node) => {
    const style = getComputedStyle(node);
    const scope = node.closest("[data-slot='theme-scope']");
    return {
      inScope: Boolean(scope),
      identity: scope?.getAttribute("data-identity") ?? null,
      dark: scope?.classList.contains("dark") ?? false,
      foreground: style.getPropertyValue("--foreground").trim(),
      background: style.getPropertyValue("--background").trim(),
      font: style.getPropertyValue("--zk-font-sans").trim(),
    };
  });
}

test.describe("identity+mode nearest-scope contract", () => {
  test("on a phone the example comes first and Display tools open on demand", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/docs/ui/trigger-actions-with-buttons", { waitUntil: "networkidle" });
    const preview = page.locator("[data-component-preview]").first();
    await preview.scrollIntoViewIfNeeded();
    await expect(preview.getByRole("button", { name: "Create app" })).toBeInViewport();
    await expect(preview.getByRole("combobox", { name: "Style of this demo" })).toBeHidden();
    await preview.getByRole("button", { name: "Display", exact: true }).click();
    await expect(preview.getByRole("combobox", { name: "Style of this demo" })).toBeVisible();
    await expect(preview.getByRole("button", { name: "Site", exact: true })).toBeVisible();
    await expect(preview.getByRole("button", { name: "Light", exact: true })).toBeVisible();
    await expect(preview.getByRole("button", { name: "Dark", exact: true })).toBeVisible();
  });

  for (const identity of DOCS_SHIPPED_IDENTITIES) {
    for (const local of ["light", "dark"] as const) {
      for (const shell of ["light", "dark"] as const) {
        test(`DataTable ${identity} local-${local} shell-${shell}`, async ({ page }) => {
          await persistDocsSiteLook(page, "tide", shell);
          await page.setViewportSize({ width: 1280, height: 900 });
          await page.goto(TABLE_PAGE, { waitUntil: "networkidle" });
          const preview = page.locator("[data-component-preview]").first();
          const surface = await pinSpecimen(preview, identity, local);
          const tokens = await readScopeTokens(surface);
          expect(tokens.identity).toBe(identity);
          expect(tokens.dark).toBe(local === "dark");
          expect(tokens.foreground.length).toBeGreaterThan(0);
          expect(tokens.background.length).toBeGreaterThan(0);
          expect(tokens.fontSans).toContain(IDENTITY_SANS[identity]);
          expect(tokens.fontFamily).toContain(IDENTITY_SANS[identity]);
          expect(tokens.colorFdCard).toBe(tokens.colorCard);
          const cell = surface.getByText("Camille Rousseau").first();
          await expect(cell).toBeVisible();
          expect(await readComputedContrast(page, cell)).toBeGreaterThanOrEqual(4.5);
        });
      }
    }
  }

  test("pinned specimen tokens stay put when the shell mode changes", async ({ page }) => {
    await persistDocsSiteLook(page, "tide", "light");
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(TABLE_PAGE, { waitUntil: "networkidle" });
    const preview = page.locator("[data-component-preview]").first();
    const surface = await pinSpecimen(preview, "maison", "light");
    const before = await readScopeTokens(surface);
    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    });
    const after = await readScopeTokens(surface);
    expect(after).toEqual(before);
    expect(after.dark).toBe(false);
  });

  for (const overlay of OVERLAY_PAGES) {
    for (const identity of ["press", "glass"] as const) {
      for (const local of ["light", "dark"] as const) {
        const shell = local === "dark" ? "light" : "dark";
        test(`${overlay.name} ${identity} ${local} ignores shell-${shell}`, async ({ page }) => {
          await persistDocsSiteLook(page, "tide", shell);
          await page.setViewportSize({ width: 1280, height: 900 });
          await page.goto(overlay.path, { waitUntil: "networkidle" });
          const preview = page.locator("[data-component-preview]").first();
          const surface = await pinSpecimen(preview, identity, local);
          const specimen = await readScopeTokens(surface);
          await overlay.open(preview);
          const panel = overlay.locate(page);
          await expect(panel).toBeVisible({ timeout: 10_000 });
          const opened = await readOverlayTokens(panel);
          expect(opened.inScope).toBe(true);
          expect(opened.identity).toBe(identity);
          expect(opened.dark).toBe(local === "dark");
          expect(opened.foreground).toBe(specimen.foreground);
          expect(opened.background).toBe(specimen.background);
          expect(opened.font).toBe(specimen.fontSans);
        });
      }
    }
  }
});
