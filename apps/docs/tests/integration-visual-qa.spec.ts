import { expect, test, type Page } from "@playwright/test";

import { DEFAULT_IDENTITY } from "../lib/default-identity";

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
] as const;

const HOME = "/";
const DIALOG_PAGE = "/docs/ui/open-modal-dialogs";
const DRAWER_PAGE = "/docs/ui/slide-in-a-drawer-panel";

async function assertShellIdentity(page: Page) {
  await expect(page.locator("#nd-nav select, #nd-mobile-nav select")).toHaveCount(0);
  await expect(page.getByLabel("Try another identity")).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("data-identity", DEFAULT_IDENTITY);
  await expect(page.getByRole("status").filter({ hasText: "Custom identity active" })).toHaveCount(0);
}

async function assertNoVisibleNativeSelectOnHome(page: Page) {
  const visible = await page.locator('main select:not([aria-hidden="true"])').evaluateAll((nodes) =>
    nodes.filter((node) => {
      const style = window.getComputedStyle(node);
      return style.display !== "none" && style.visibility !== "hidden";
    }).length,
  );
  expect(visible).toBe(0);
}

async function assertNoLatestInHero(page: Page) {
  await expect(page.getByText(/^Latest in v/)).toHaveCount(0);
}

async function assertOmittedIdentityDocsRedirect(page: Page) {
  const design = await page.request.get("/docs/ui/design-your-identity", { maxRedirects: 0 });
  if ([301, 308].includes(design.status())) {
    expect(design.headers()["location"]).toMatch(/identity-editor/);
  } else {
    expect(design.status()).toBe(200);
    expect(await design.text()).toMatch(/identity-editor/);
  }

  const oneAttr = await page.request.get("/docs/ui/switch-the-visual-identity-with-one-attribute", {
    maxRedirects: 0,
  });
  if ([301, 308].includes(oneAttr.status())) {
    expect(oneAttr.headers()["location"]).toMatch(/^\/$/);
  } else {
    expect(oneAttr.status()).toBe(200);
    expect(await oneAttr.text()).toMatch(/location\.replace\("\/"|url=\//);
  }

  await page.goto("/docs/ui/design-your-identity", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/identity-editor/);
}

test("omitted identity doc URLs redirect away from catalog pages", async ({ page }) => {
  await assertOmittedIdentityDocsRedirect(page);
});

test("search index omits identity feature doc URLs", async ({ request }) => {
  const res = await request.get("/api/search");
  expect(res.ok()).toBeTruthy();
  const body = await res.text();
  expect(body).not.toContain("/docs/ui/design-your-identity");
  expect(body).not.toContain("switch-the-visual-identity-with-one-attribute");
});

async function assertDialogSurfaceCalm(page: Page) {
  await page.goto(DIALOG_PAGE, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Open dialog" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const footer = dialog.locator('[data-slot="dialog-footer"]');
  await expect(footer).toBeVisible();
  const footerBox = await footer.boundingBox();
  const dialogBox = await dialog.boundingBox();
  expect(footerBox && dialogBox).toBeTruthy();
  if (footerBox && dialogBox) {
    expect(footerBox.x + footerBox.width).toBeLessThanOrEqual(dialogBox.x + dialogBox.width + 2);
  }
  await page.keyboard.press("Escape");
}

async function assertLinkGhostHoverCalm(page: Page) {
  await page.goto("/docs/ui/trigger-actions-with-buttons", { waitUntil: "networkidle" });
  const preview = page.locator("[data-component-preview]").first();
  await preview.scrollIntoViewIfNeeded();
  for (const name of ["Cancel", "Details"] as const) {
    const button = preview.getByRole("button", { name });
    await button.hover();
    const accentFill = await button.evaluate((el) => {
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
    expect(accentFill).toBe(false);
  }
}

async function assertInstallSection(page: Page) {
  await page.goto(HOME, { waitUntil: "networkidle" });
  const section = page.locator("#install-or-copy");
  // Two adoption paths (install, copy), the install command first, with its copy button.
  await expect(section.getByRole("tablist", { name: "How to adopt" }).getByRole("tab")).toHaveCount(2);
  await expect(section.getByRole("tab", { name: "Install package" })).toHaveAttribute("aria-selected", "true");
  await expect(section.getByRole("region", { name: "Terminal" }).first()).toBeVisible();
  await expect(section.getByRole("button", { name: "Copy terminal" })).toBeVisible();
}

async function assertMobileDrawerCoherent(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(HOME, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.getByRole("dialog");
  await expect(menu).toBeVisible();
  await expect(menu.locator("select")).toHaveCount(0);
  await expect(menu.getByLabel("Try another identity")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
}

for (const theme of ["light", "dark"] as const) {
  for (const viewport of VIEWPORTS) {
    test(`clean storage shell QA ${theme} ${viewport.width}px`, async ({ page }) => {
      await page.addInitScript((mode) => localStorage.setItem("theme", mode), theme);
      await page.setViewportSize(viewport);
      await page.goto(HOME, { waitUntil: "networkidle" });
      await assertShellIdentity(page);
      await assertNoVisibleNativeSelectOnHome(page);
      await assertNoLatestInHero(page);
    });

    test(`dirty legacy storage shell QA ${theme} ${viewport.width}px`, async ({ page }) => {
      await page.addInitScript((mode) => {
        localStorage.setItem("theme", mode);
        localStorage.setItem("zk-identity", "mist");
        localStorage.setItem("zk-identity-custom", ":root{--spacing:0.5rem}");
      }, theme);
      await page.setViewportSize(viewport);
      await page.goto(HOME, { waitUntil: "networkidle" });
      await assertShellIdentity(page);
      await assertNoVisibleNativeSelectOnHome(page);
      await assertNoLatestInHero(page);
    });
  }
}

test("dialog surface and footer alignment at 1024px", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await assertDialogSurfaceCalm(page);
});

test("button link and ghost hover stay calm at 1024px", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await assertLinkGhostHoverCalm(page);
});

test("install section layout at 390px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await assertInstallSection(page);
});

test("mobile shell drawer has no identity control", async ({ page }) => {
  await assertMobileDrawerCoherent(page);
});

test("drawer demo opens on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(DRAWER_PAGE, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Open drawer" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
});
