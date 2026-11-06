import { expect, test, type Page } from "@playwright/test";

import { DEFAULT_IDENTITY } from "../lib/default-identity";
import { assertA11yGate } from "./a11y-helpers";

const PAGE = "/features/identity-editor";
/** The site's own light/dark switch (header), which is separate from the editor's Preview dark. */
async function siteDark(page: Page) {
  await page.getByRole("button", { name: /toggle theme/i }).first().click();
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
}

const DOCS_CUSTOM_STORAGE_KEY = "zk-docs-site-identity-custom";

async function spacingOnDraft(page: Page) {
  return page.locator('[data-slot="identity-editor-preview"]').evaluate((node) =>
    getComputedStyle(node).getPropertyValue("--spacing").trim(),
  );
}

async function spacingOnHtml(page: Page) {
  return page.locator("html").evaluate((node) => getComputedStyle(node).getPropertyValue("--spacing").trim());
}

async function htmlVar(page: Page, name: string) {
  return page.locator("html").evaluate((node, name) => getComputedStyle(node).getPropertyValue(name).trim(), name);
}

async function sidebarBg(page: Page) {
  return page.locator("#nd-sidebar").evaluate((node) => getComputedStyle(node).backgroundColor);
}

test.describe("identity editor page", () => {
  test("lede and meta description lead with the benefit, untruncated (#1074)", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description).toBe(
      "Try spacing, colour, and type tokens in the browser. Demo only — not a shipped docs feature.",
    );
    await expect(
      page.getByRole("paragraph").filter({ hasText: "Tune tokens and preview them on a card" }),
    ).toBeVisible();
  });

  test("leaves a clear gap between token fields", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    const fields = page.locator('[data-slot="identity-editor-fields"]');
    await expect(fields).toBeVisible();
    await expect(fields).toHaveClass(/gap-5/);
  });

  test("writes spacing onto the draft card and into the URL", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Try looks in the demo editor" })).toBeVisible();
    await expect(page.getByText(/^Change spacing first, then watch the card\./)).toBeVisible();
    await page.getByLabel("Spacing", { exact: true }).fill("0.4rem");
    await expect.poll(() => spacingOnDraft(page)).toBe("0.4rem");
    expect(page.url()).toContain("spacing=0.4rem");
    await page.getByRole("button", { name: "Reset" }).click();
    await expect.poll(() => spacingOnDraft(page)).toBe("0.25rem");
    expect(new URL(page.url()).searchParams.has("spacing")).toBe(false);
  });

  test("keeps the chosen look in the URL and restores it on load", async ({ page }) => {
    await page.goto(`${PAGE}?identity=press`, { waitUntil: "networkidle" });
    await expect(page.getByLabel("Look")).toHaveValue("press");
    await expect.poll(() => spacingOnDraft(page)).toBe("0.2rem");
  });

  test("shipped looks open with no contrast chips", async ({ page }) => {
    for (const id of ["mist", "press", "tide", "volt", "maison", "glass"] as const) {
      await page.goto(`${PAGE}?identity=${id}`, { waitUntil: "networkidle" });
      await expect(page.getByLabel("Look")).toHaveValue(id);
      await expect(page.getByRole("button", { name: /^Fix / })).toHaveCount(0);
    }
  });

  test("warns when light text matches the background and Fix restores it", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByLabel("Foreground").fill("0 0% 100%");
    const chip = page.getByText(/light text \d+(\.\d+)?:1 \(need 4\.5:1\)/);
    await expect(chip).toBeVisible();
    await page.getByRole("button", { name: "Fix light text" }).click();
    await expect(chip).toHaveCount(0);
  });

  test("warns when light accent misses 3:1 against the background", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByLabel("Accent").fill("0 0% 100%");
    const chip = page.getByText(/light accent \d+(\.\d+)?:1 \(need 3:1\)/);
    await expect(chip).toBeVisible();
    await page.getByRole("button", { name: "Fix light accent" }).click();
    await expect(chip).toHaveCount(0);
  });

  test("Preview dark changes the card, not the site, and lives in the URL", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await page.goto(PAGE, { waitUntil: "networkidle" });
    const toggle = page.getByRole("button", { name: "Preview dark", exact: true });
    const card = page.locator('[data-slot="identity-editor-preview"]');
    await expect(page.locator("html")).not.toHaveClass(/\bdark\b/);
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(card).toHaveClass(/\bdark\b/);
    await expect(page.locator("html")).not.toHaveClass(/\bdark\b/);
    expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe("light");
    expect(new URL(page.url()).searchParams.get("preview")).toBe("dark");
    await toggle.click();
    await expect(card).not.toHaveClass(/\bdark\b/);
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(new URL(page.url()).searchParams.has("preview")).toBe(false);
    await page.goto(`${PAGE}?preview=dark`, { waitUntil: "networkidle" });
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(card).toHaveClass(/\bdark\b/);
    await expect(page.locator("html")).not.toHaveClass(/\bdark\b/);
    await page.goto(`${PAGE}?theme=dark`, { waitUntil: "networkidle" });
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
  });

  test("the specimen is not an editor command", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    const specimen = page.getByRole("group", { name: "Draft preview" });
    await expect(specimen.locator("[inert]")).toHaveCount(1);
    const buttons = specimen.locator("button");
    expect(await buttons.count()).toBeGreaterThan(0);
    expect(await buttons.evaluateAll((nodes) => nodes.every((node) => node.closest("[inert]") !== null))).toBe(true);
    await expect(page.getByText("Preview only: the buttons and fields here are samples.")).toBeVisible();
    for (const name of ["Choose and preview", "Save and apply"]) await expect(page.getByRole("group", { name })).toBeVisible();
  });

  test("passes the a11y gate on the panel", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await assertA11yGate(page, "[data-slot=identity-editor]");
  });
});

test.describe("identity editor on a phone", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test("keeps Apply on screen at 360px", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.locator('[data-slot="identity-editor"]').screenshot({ path: "test-results/identity-editor-360.png" });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    const apply = page.getByRole("button", { name: "Apply to the whole site" });
    await apply.scrollIntoViewIfNeeded();
    const box = await apply.boundingBox();
    expect(box).toBeTruthy();
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(361);
    const look = await page.getByLabel("Look").boundingBox();
    expect(look?.width ?? 0).toBeGreaterThan(80);
  });

  test("Press Apply stays on screen at 360px", async ({ page }) => {
    await page.goto(`${PAGE}?identity=press`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-identity", "press");
    await page.locator('[data-slot="identity-editor"]').screenshot({ path: "test-results/identity-editor-press-360.png" });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    const apply = page.getByRole("button", { name: "Apply to the whole site" });
    await apply.scrollIntoViewIfNeeded();
    const box = await apply.boundingBox();
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(361);
  });

  test("Apply then Dark keeps a custom look on the site", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByLabel("Spacing", { exact: true }).fill("0.4rem");
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-identity", "mist");
    await siteDark(page);
    await page.getByRole("button", { name: "Preview dark", exact: true }).click();
    await expect.poll(() => spacingOnHtml(page)).toBe("0.4rem");
    await page.getByLabel("Background").fill("120 40% 20%");
    await expect
      .poll(() =>
        page.locator("html").evaluate((node) => getComputedStyle(node).getPropertyValue("--background").trim()),
      )
      .toBe("120 40% 20%");
  });
});

test.describe("identity editor apply to site", () => {
  test("paints sidebar and page on Apply, with before/after site captures", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route("**/api/identity/suggest/status", (route) => route.fulfill({ status: 200, contentType: "application/json", json: { available: true } }));
    await page.route("**/api/identity/suggest", async (route) => {
      const posted = route.request().postDataJSON() as { requestId: string; current: Record<string, unknown> };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          requestId: posted.requestId,
          summary: "A warm pink page.",
          changed: ["light.background"],
          references: [],
          tokens: {
            ...posted.current,
            light: {
              background: "0 80% 70%",
              foreground: "0 0% 10%",
              primary: "0 0% 10%",
              accent: "0 70% 40%",
              border: "0 40% 40%",
            },
          },
        },
      });
    });
    await page.goto("/docs/getting-started", { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("data-identity", DEFAULT_IDENTITY);
    const beforeSidebar = await sidebarBg(page);
    const beforeBackground = await htmlVar(page, "--background");
    await page.screenshot({ path: "test-results/identity-editor-site-before.png", fullPage: true });
    await page.goto(`${PAGE}#create`, { waitUntil: "networkidle" });
    await page.getByLabel("Your product and brand").fill("warm ivory boutique");
    await page.getByRole("button", { name: "Generate" }).click();
    await page.getByRole("button", { name: "Use this look" }).click();
    // Using a look changes the draft only: the site is untouched until the visitor says so.
    await expect.poll(() => htmlVar(page, "--background")).toBe(beforeBackground);
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await expect(page.getByText("Applied to the whole site.", { exact: true })).toBeVisible();
    await expect.poll(() => htmlVar(page, "--background")).toBe("0 80% 70%");
    await expect.poll(() => htmlVar(page, "--sidebar")).toBe("0 80% 70%");
    await expect.poll(() => htmlVar(page, "--card")).toBe("0 80% 70%");
    expect(beforeBackground).not.toBe("0 80% 70%");
    await page.screenshot({ path: "test-results/identity-editor-site-after.png", fullPage: true });
    await page.goto("/docs/getting-started", { waitUntil: "networkidle" });
    await expect.poll(() => htmlVar(page, "--sidebar")).toBe("0 80% 70%");
    await expect.poll(() => sidebarBg(page)).not.toBe(beforeSidebar);
    await page.screenshot({ path: "test-results/identity-editor-site-after-docs.png", fullPage: true });
  });

  test("toolbar Apply paints sidebar from Background", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByLabel("Background").fill("0 80% 70%");
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await expect(page.getByText("Applied to the whole site.", { exact: true })).toBeVisible();
    await expect.poll(() => htmlVar(page, "--sidebar")).toBe("0 80% 70%");
    await expect.poll(() => htmlVar(page, "--card")).toBe("0 80% 70%");
  });

  test("applies the draft to the whole site without a reload", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByLabel("Spacing", { exact: true }).fill("0.4rem");
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-identity", "mist");
    await expect.poll(() => spacingOnHtml(page)).toBe("0.4rem");
    await expect(page.getByRole("status").filter({ hasText: "Custom identity active" })).toBeVisible();
  });

  test("keeps the site in step with later draft edits", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    const before = await spacingOnHtml(page);
    await page.getByLabel("Spacing", { exact: true }).fill("0.4rem");
    await expect.poll(() => spacingOnDraft(page)).toBe("0.4rem");
    await expect.poll(() => spacingOnHtml(page)).toBe(before);
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await expect.poll(() => spacingOnHtml(page)).toBe("0.4rem");
    await page.getByLabel("Spacing", { exact: true }).fill("0.5rem");
    await expect.poll(() => spacingOnHtml(page)).toBe("0.5rem");
    await expect(page.getByText("Applied to the whole site.", { exact: true })).toBeVisible();
  });

  test("keeps the custom identity after navigation", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByLabel("Spacing", { exact: true }).fill("0.4rem");
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await page.goto("/docs/getting-started", { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("data-identity", "mist");
    await expect.poll(() => spacingOnHtml(page)).toBe("0.4rem");
  });

  test("resets to the default identity and clears storage", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByLabel("Spacing", { exact: true }).fill("0.4rem");
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await page.getByRole("button", { name: "Back to default" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-identity", DEFAULT_IDENTITY);
    await expect.poll(() => spacingOnHtml(page)).toMatch(/^0?\.26rem$/);
    await expect(page.getByRole("button", { name: "Back to default" })).toHaveCount(0);
    expect(await page.evaluate((key) => localStorage.getItem(key), DOCS_CUSTOM_STORAGE_KEY)).toBeNull();
  });

  test.describe.skip("header preset switching (removed from site shell, D3)", () => {
  test("a header preset switch parks applied custom work instead of wiping it", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${PAGE}?identity=mist`, { waitUntil: "networkidle" });
    await page.getByLabel("Radius", { exact: true }).fill("2rem");
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-identity", "mist");
    await expect.poll(() => htmlVar(page, "--radius")).toBe("2rem");
    const parked = await page.evaluate((key) => localStorage.getItem(key), DOCS_CUSTOM_STORAGE_KEY);
    expect(parked).toContain("2rem");

    const chooser = page.getByRole("combobox", { name: "Identity" }).first();
    await chooser.selectOption("tide");
    await expect(page.locator("html")).toHaveAttribute("data-identity", "tide");
    expect(await page.evaluate((key) => localStorage.getItem(key), DOCS_CUSTOM_STORAGE_KEY)).toBe(parked);

    await chooser.selectOption("mist");
    await expect(page.locator("html")).toHaveAttribute("data-identity", "mist");
    await expect.poll(() => htmlVar(page, "--radius")).toBe("2rem");
  });

  test("editor follows a header switch when clean or driving the site", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${PAGE}?identity=mist`, { waitUntil: "networkidle" });
    const chooser = page.getByRole("combobox", { name: "Identity" }).first();

    // Clean draft: the editor adopts the header's look and the URL follows.
    // Press, not glass: glass is the site default, so switching to it is a no-op.
    await chooser.selectOption("press");
    await expect(page.locator("html")).toHaveAttribute("data-identity", "press");
    await expect(page.getByLabel("Look")).toHaveValue("press");
    expect(new URL(page.url()).searchParams.get("identity")).toBe("press");

    // Applied draft: fields and URL resync to the header's new look.
    await page.getByLabel("Radius", { exact: true }).fill("2rem");
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await expect.poll(() => htmlVar(page, "--radius")).toBe("2rem");
    await expect(page.getByText("Applied to the whole site.")).toBeVisible();
    await chooser.selectOption("mist");
    await expect(page.locator("html")).toHaveAttribute("data-identity", "mist");
    await expect(page.getByLabel("Look")).toHaveValue("mist");
    await expect(page.getByLabel("Radius", { exact: true })).not.toHaveValue("2rem");
    expect(new URL(page.url()).searchParams.get("identity")).toBe("mist");
    expect(new URL(page.url()).searchParams.get("radius")).toBeNull();

    // Detached: further edits no longer drive the site.
    await expect(page.getByText("Applied to the whole site.")).toHaveCount(0);
    await page.getByLabel("Radius", { exact: true }).fill("3rem");
    await expect(page.locator("html")).toHaveAttribute("data-identity", "mist");
    await expect.poll(() => htmlVar(page, "--radius")).not.toBe("3rem");
  });

  test("editor keeps an unapplied draft when the header switches", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${PAGE}?identity=tide`, { waitUntil: "networkidle" });
    await page.getByLabel("Radius", { exact: true }).fill("2rem");
    await page.getByRole("combobox", { name: "Identity" }).first().selectOption("press");
    await expect(page.locator("html")).toHaveAttribute("data-identity", "press");
    await expect(page.getByLabel("Look")).toHaveValue("tide");
    await expect(page.getByLabel("Radius", { exact: true })).toHaveValue("2rem");
    expect(page.url()).toContain("identity=tide");
    expect(page.url()).toContain("radius=2rem");
  });
  });

  test("Apply Press replaces the site look in light and dark", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("data-identity", DEFAULT_IDENTITY);
    await page.getByLabel("Look").selectOption("press");
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-identity", "press");
    await expect
      .poll(() => page.locator("html").evaluate((node) => getComputedStyle(node).getPropertyValue("--radius").trim()))
      .toBe("0px");
    await siteDark(page);
    await page.getByRole("button", { name: "Preview dark", exact: true }).click();
    await expect
      .poll(() =>
        page.locator("html").evaluate((node) => getComputedStyle(node).getPropertyValue("--background").trim()),
      )
      .toBe("0 0% 6%");
    await page.getByLabel("Background").fill("120 40% 20%");
    await expect
      .poll(() =>
        page.locator("html").evaluate((node) => getComputedStyle(node).getPropertyValue("--background").trim()),
      )
      .toBe("120 40% 20%");
  });

  test("an old URL without darkKept still keeps a dark override", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await page.goto(`${PAGE}?identity=mist&dark-background=${encodeURIComponent("120 40% 20%")}`, {
      waitUntil: "networkidle",
    });
    await page.getByLabel("Background").fill("0 0% 95%");
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await siteDark(page);
    await expect
      .poll(() =>
        page.locator("html").evaluate((node) => getComputedStyle(node).getPropertyValue("--background").trim()),
      )
      .toBe("120 40% 20%");
  });

  test("a URL-loaded dark colour stays kept after a light edit", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Preview dark", exact: true }).click();
    await page.getByLabel("Background").fill("120 40% 20%");
    await page.getByRole("button", { name: "Preview dark", exact: true }).click();
    await page.getByLabel("Background").fill("0 0% 95%");
    await expect.poll(() => new URL(page.url()).searchParams.get("darkKept")).toBe("background");
    await page.reload({ waitUntil: "networkidle" });
    await page.getByLabel("Background").fill("0 0% 90%");
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await siteDark(page);
    await expect
      .poll(() =>
        page.locator("html").evaluate((node) => getComputedStyle(node).getPropertyValue("--background").trim()),
      )
      .toBe("120 40% 20%");
  });

  test("a manual dark colour survives a later light edit", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Preview dark", exact: true }).click();
    await page.getByLabel("Background").fill("120 40% 20%");
    await page.getByRole("button", { name: "Preview dark", exact: true }).click();
    await page.getByLabel("Background").fill("0 0% 95%");
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await siteDark(page);
    await expect
      .poll(() =>
        page.locator("html").evaluate((node) => getComputedStyle(node).getPropertyValue("--background").trim()),
      )
      .toBe("120 40% 20%");
  });

  test("a light colour edit writes an AA dark pair onto the site", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByLabel("Background").fill("0 0% 95%");
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await siteDark(page);
    await expect(page.getByRole("button", { name: /^Fix dark / })).toHaveCount(0);
    await expect
      .poll(() =>
        page.locator("html").evaluate((node) => getComputedStyle(node).getPropertyValue("--background").trim()),
      )
      .toMatch(/^0 0% 5(\.0)?%$/);
  });

  test("applies dark tokens while the site is dark", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "dark"));
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    await page.getByRole("button", { name: "Preview dark", exact: true }).click();
    await page.getByLabel("Background").fill("120 40% 20%");
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await expect.poll(() =>
      page.locator("html").evaluate((node) => getComputedStyle(node).getPropertyValue("--background").trim()),
    ).toBe("120 40% 20%");
    await expect(page.getByRole("status").filter({ hasText: "Custom identity active" })).toBeVisible();
  });

  test.describe.skip("header Identity control (removed from site shell, D3)", () => {
  test("header Identity control parks Custom after Apply to the whole site; Reset discards it", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByLabel("Spacing", { exact: true }).fill("0.4rem");
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    const chooser = page.getByRole("combobox", { name: "Identity" }).first();
    await expect(chooser).toHaveValue("mist");
    await chooser.selectOption("press");
    await expect(page.locator("html")).toHaveAttribute("data-identity", "press");
    await expect.poll(() => spacingOnHtml(page)).toMatch(/^0?\.2rem$/);
    await expect(chooser).toHaveValue("press");
    expect(await chooser.locator("option").evaluateAll((options) => options.map((o) => (o as HTMLOptionElement).value))).not.toContain(
      "custom",
    );
    // Parked, not wiped: the applied work is still stored and the explicit
    // reset remains the way to drop it.
    expect(await page.evaluate((key) => localStorage.getItem(key), DOCS_CUSTOM_STORAGE_KEY)).toContain("0.4rem");
    await page.getByRole("button", { name: "Back to default" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-identity", DEFAULT_IDENTITY);
    expect(await page.evaluate((key) => localStorage.getItem(key), DOCS_CUSTOM_STORAGE_KEY)).toBeNull();
    await expect(page.getByRole("button", { name: "Back to default" })).toHaveCount(0);
  });

  test("header Identity control parks Custom in dark mode", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.addInitScript(() => localStorage.setItem("theme", "dark"));
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    await page.getByLabel("Spacing", { exact: true }).fill("0.4rem");
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    const chooser = page.getByRole("combobox", { name: "Identity" }).first();
    await expect(chooser).toHaveValue("mist");
    await chooser.selectOption("tide");
    await expect(page.locator("html")).toHaveAttribute("data-identity", "tide");
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    await expect.poll(() => spacingOnHtml(page)).toMatch(/^0?\.28rem$/);
    await expect(chooser).toHaveValue("tide");
    expect(await page.evaluate((key) => localStorage.getItem(key), DOCS_CUSTOM_STORAGE_KEY)).toContain("0.4rem");
  });
  });
});

test.describe("identity editor named looks", () => {
  test("saves, lists, applies, renames and deletes a named look", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByLabel("Background").fill("0 80% 70%");
    await page.getByLabel("Name").fill("Coral");
    await page.getByRole("button", { name: "Save look" }).click();
    await expect(page.getByLabel("Look")).toHaveValue("n-coral");
    const look = page.getByLabel("Look", { exact: true });
    await look.selectOption("n-coral");
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-identity", "n-coral");
    await expect.poll(() => htmlVar(page, "--sidebar")).toBe("0 80% 70%");
    await expect.poll(() => htmlVar(page, "--card")).toBe("0 80% 70%");
    await page.getByLabel("Name").fill("Sunset");
    await page.getByRole("button", { name: "Rename" }).click();
    await expect(look).toHaveValue("n-coral");
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(look).toHaveValue("n-coral");
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page.getByRole("button", { name: "Delete look" }).click();
    await expect(page.getByLabel("Look", { exact: true })).toHaveValue(DEFAULT_IDENTITY);
    await expect(page.locator("html")).toHaveAttribute("data-identity", DEFAULT_IDENTITY);
  });

  test("keeps a named look after reload", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByLabel("Background").fill("0 80% 70%");
    await page.getByLabel("Name").fill("Coral");
    await page.getByRole("button", { name: "Save look" }).click();
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-identity", "n-coral");
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("data-identity", "n-coral");
    await expect.poll(() => htmlVar(page, "--sidebar")).toBe("0 80% 70%");
    await expect(page.getByLabel("Look")).toHaveValue("n-coral");
  });
});


test.describe("identity editor: choose, see, adjust, then keep", () => {
  test("on a standard phone the first screen holds the look, a useful preview and the first adjustment", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(PAGE, { waitUntil: "networkidle" });
    const boxes = await page.evaluate(() => {
      const top = (selector: string) => document.querySelector(selector)?.getBoundingClientRect() ?? null;
      const spacing = document.getElementById("identity-editor-spacing");
      return {
        look: top("#identity-editor-look"),
        card: top('[data-slot="identity-editor-preview"]'),
        spacing: spacing?.getBoundingClientRect() ?? null,
        keep: top('[data-slot="identity-editor-keep"]'),
        vh: innerHeight,
      };
    });
    expect(boxes.look && boxes.card && boxes.spacing && boxes.keep).toBeTruthy();
    // Look, then the card in full, then the first field: all above the fold of an 844px phone.
    expect(boxes.look!.bottom).toBeLessThan(boxes.card!.top);
    expect(boxes.card!.bottom).toBeLessThan(boxes.spacing!.top);
    expect(boxes.spacing!.bottom, "the Spacing field is on the first screen").toBeLessThanOrEqual(boxes.vh);
    // Saving and applying come after the first adjustment, and are still on the page, not folded away.
    expect(boxes.keep!.top).toBeGreaterThan(boxes.spacing!.bottom);
    await expect(page.getByRole("button", { name: "Save look" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Apply to the whole site" })).toBeVisible();
  });

  test("desktop rows line up on their bottom edge whatever the hint text under them", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(PAGE, { waitUntil: "networkidle" });
    const rows = await page.evaluate(() => {
      const bottom = (target: string) => {
        const el = target.startsWith("#")
          ? document.querySelector(target)
          : [...document.querySelectorAll("button")].find((button) => button.textContent?.trim() === target);
        return Math.round((el?.getBoundingClientRect().bottom ?? Number.NaN) * 10) / 10;
      };
      return {
        look: ["#identity-editor-look", "Preview dark", "Undo", "Reset"].map(bottom),
        name: ["#identity-editor-name", "Save look", "Rename", "Delete"].map(bottom),
      };
    });
    for (const [row, values] of Object.entries(rows)) {
      expect(values.every(Number.isFinite), `${row} row found`).toBe(true);
      expect(Math.max(...values) - Math.min(...values), `${row} row bottoms ${values.join(", ")}`).toBeLessThanOrEqual(1);
    }
    // Typing a name removes the hint under it; nothing in the row moves.
    const before = await page.locator("#identity-editor-name").evaluate((el) => el.getBoundingClientRect().bottom);
    await page.locator("#identity-editor-name").fill("Harbor");
    const after = await page.locator("#identity-editor-name").evaluate((el) => el.getBoundingClientRect().bottom);
    expect(after).toBe(before);
  });
});

test("on a phone the pinned preview card never covers the field that has focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(PAGE, { waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  for (const label of ["Radius", "Border width", "Spacing"]) {
    await page.getByLabel(label, { exact: true }).focus();
    await page.waitForTimeout(150);
    const gap = await page.evaluate((name) => {
      const card = document.querySelector('[data-slot="identity-editor-preview"]')!.getBoundingClientRect();
      const input = [...document.querySelectorAll("input")].find((el) => el.labels?.[0]?.textContent?.trim() === name)!;
      const box = input.getBoundingClientRect();
      const pinned = getComputedStyle(document.querySelector('[data-slot="identity-editor-preview"]')!).position === "sticky";
      return { pinned, clearance: box.top - card.bottom, inView: box.bottom <= innerHeight };
    }, label);
    // Pinned or not, the focused field is on screen and not under the card (WCAG 2.4.11).
    expect(gap.inView, `${label} on screen`).toBe(true);
    if (gap.pinned) expect(gap.clearance, `${label} clear of the pinned card`).toBeGreaterThanOrEqual(0);
  }
});
