import { expect, test, type Page } from "@playwright/test";

import { assertA11yGate, assertFocusUnclipped, assertFocusVisibleRing, focusWithKeyboard } from "./a11y-helpers";

test.describe("home adoption panel", () => {
  async function openHome(page: Page, width = 1280) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    const panel = page.locator("#install-or-copy");
    await panel.scrollIntoViewIfNeeded();
    return panel;
  }

  test("one choice, not a row of buttons: two tabs, one package-manager select", async ({ page }) => {
    const panel = await openHome(page);
    await expect(page.getByRole("heading", { name: "Start your way", level: 2 })).toBeVisible();
    await expect(panel.getByRole("tablist", { name: "How to adopt" }).getByRole("tab")).toHaveText(["Install package", "Copy source"]);
    await expect(panel.getByRole("tab", { name: "Install package" })).toHaveAttribute("aria-selected", "true");
    // No pressed-state buttons standing in for a selector, and exactly one package manager control.
    await expect(panel.locator("button[aria-pressed]")).toHaveCount(0);
    await expect(panel.getByRole("combobox", { name: "Package manager" })).toHaveCount(1);
    // The CLI / manual choice belongs to Copy source only.
    await expect(panel.getByRole("tablist", { name: "Copy method" })).toHaveCount(0);
    await panel.getByRole("tab", { name: "Copy source" }).click();
    await expect(panel.getByRole("tablist", { name: "Copy method" }).getByRole("tab")).toHaveText(["shadcn CLI", "Paste the files"]);
    await panel.getByRole("tab", { name: "Install package" }).click();
    await expect(panel.getByRole("tablist", { name: "Copy method" })).toHaveCount(0);
  });

  test("each path reads as a sequence: what it gives, what it needs, then numbered steps", async ({ page }) => {
    const panel = await openHome(page);
    const steps = (name: string) => panel.locator(`[data-adoption-step="${name}"]`);
    await expect(panel).toContainText("You get");
    await expect(panel).toContainText("You need");
    await expect(panel.locator("[data-adoption-step]")).toHaveCount(3);
    await expect(steps("install")).toContainText("pnpm add @zedtech/zedkit-ui");
    await expect(steps("styles")).toContainText('@import "@zedtech/zedkit-ui/styles.css";');
    await expect(steps("styles")).toContainText("@source");
    await expect(steps("render")).toContainText('import { Button } from "@zedtech/zedkit-ui";');

    await panel.getByRole("tab", { name: "Copy source" }).click();
    await expect(panel.locator("[data-adoption-step]")).toHaveText([/Set up shadcn/, /Add the theme tokens/, /Add Button/, /Import and render/]);
    await panel.getByRole("tab", { name: "Paste the files" }).click();
    await expect(steps("files")).toContainText("src/components/ui/button.tsx");
    await expect(steps("files")).toContainText("const buttonVariants = cva(");
    await expect(steps("render")).toContainText('import { Button } from "@/components/ui/button";');
    await expect(steps("render")).not.toContainText("@zedtech/zedkit-ui");
  });

  test("the rendered Save button is labelled as an example and is not a control of the site", async ({ page }) => {
    const panel = await openHome(page);
    const example = panel.getByRole("group", { name: "Rendered example" });
    await expect(example).toBeVisible();
    await expect(example).toContainText("it does nothing on this site");
    const save = example.getByText("Save", { exact: true });
    await expect(save).toBeVisible();
    // Inert: it cannot take focus, so it is never a tab stop or something to press.
    expect(await save.evaluate((el) => Boolean(el.closest("[inert]")))).toBe(true);
    const focusable = await save.evaluate((el) => {
      (el as HTMLElement).focus();
      return document.activeElement === el;
    });
    expect(focusable).toBe(false);
  });

  test("the package manager rewrites every command and is remembered", async ({ page }) => {
    const panel = await openHome(page);
    const picker = panel.getByRole("combobox", { name: "Package manager" });
    await expect(picker).toHaveText("pnpm");
    await picker.click();
    await page.getByRole("option", { name: "yarn", exact: true }).click();
    await expect(panel.locator('[data-adoption-step="install"]')).toContainText("yarn add @zedtech/zedkit-ui");
    await panel.getByRole("tab", { name: "Copy source" }).click();
    await expect(panel.locator('[data-adoption-step="init"]')).toContainText("yarn dlx shadcn@latest init -d");
    await expect(panel.locator('[data-adoption-step="add"]')).toContainText("yarn dlx shadcn@latest add https://zedkit.app/r/button.json");
    await page.reload({ waitUntil: "networkidle" });
    await panel.scrollIntoViewIfNeeded();
    await expect(panel.getByRole("combobox", { name: "Package manager" })).toHaveText("yarn");
  });

  test("the chosen path is remembered across reloads", async ({ page }) => {
    const panel = await openHome(page);
    await panel.getByRole("tab", { name: "Copy source" }).click();
    await panel.getByRole("tab", { name: "Paste the files" }).click();
    await page.reload({ waitUntil: "networkidle" });
    await panel.scrollIntoViewIfNeeded();
    await expect(panel.getByRole("tab", { name: "Copy source" })).toHaveAttribute("aria-selected", "true");
    await expect(panel.getByRole("tab", { name: "Paste the files" })).toHaveAttribute("aria-selected", "true");
  });

  test("tabs work from the keyboard and focus is visible and unclipped", async ({ page }) => {
    const panel = await openHome(page);
    const install = panel.getByRole("tab", { name: "Install package" });
    const copy = panel.getByRole("tab", { name: "Copy source" });
    await focusWithKeyboard(install);
    await assertFocusVisibleRing(install);
    await assertFocusUnclipped(install);
    await page.keyboard.press("ArrowRight");
    await expect(copy).toHaveAttribute("aria-selected", "true");
    await expect(copy).toBeFocused();
    await expect(panel.getByRole("tabpanel").first()).toBeVisible();
    await page.keyboard.press("Home");
    await expect(install).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("End");
    await expect(copy).toHaveAttribute("aria-selected", "true");
  });

  test("copy puts the exact text on the clipboard and says so", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const panel = await openHome(page);
    const block = panel.locator('[data-adoption-step="install"] figure').first();
    await block.getByRole("button", { name: /^Copy/ }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("pnpm add @zedtech/zedkit-ui");
    await expect(block.getByRole("status")).toHaveText("Copied");
    await expect(block.getByRole("status")).toHaveText("", { timeout: 4000 });

    await panel.getByRole("tab", { name: "Copy source" }).click();
    await panel.getByRole("tab", { name: "Paste the files" }).click();
    const file = panel.locator('[data-adoption-step="files"] figure').first();
    await file.getByRole("button", { name: /^Copy/ }).click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain('"use client";');
    expect(copied).toContain("export { Button, buttonVariants };");
  });

  test("the panel sits between the identities and the component families", async ({ page }) => {
    const panel = await openHome(page);
    const components = page.locator("#components");
    const identities = page.locator("#identities");
    const [panelBox, componentsBox, identitiesBox] = await Promise.all([panel.boundingBox(), components.boundingBox(), identities.boundingBox()]);
    expect(identitiesBox!.y).toBeLessThan(panelBox!.y);
    expect(panelBox!.y).toBeLessThan(componentsBox!.y);
  });

  for (const width of [320, 390, 768]) {
    test(`fits ${width}px: no sideways page scroll${width < 640 ? ", 44px touch targets" : ""}, complete steps`, async ({ page }) => {
      const panel = await openHome(page, width);
      const measure = async () =>
        panel.evaluate((root) => ({
          small: [...root.querySelectorAll('[role="tab"], [role="combobox"], button')]
            .map((el) => ({ name: el.getAttribute("aria-label") ?? el.textContent?.trim() ?? el.tagName, rect: el.getBoundingClientRect() }))
            .filter(({ rect }) => rect.height > 0 && (rect.height < 43.5 || rect.width < 43.5))
            .map(({ name, rect }) => `${name} ${Math.round(rect.width)}x${Math.round(rect.height)}`),
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        }));
      /** The kit raises controls to 44px on phones only (--zk-tap-min); wider screens keep their density. */
      const touch = (small: string[]) => expect(width < 640 ? small : []).toEqual([]);
      touch((await measure()).small);
      // A control in a code frame's title bar sits inside the frame: the bar grows to fit a 44px select, it does not let it stick out.
      const sticking = await panel.evaluate((root) =>
        [...root.querySelectorAll("figure[data-adoption-frame]")].flatMap((frame) => {
          const box = frame.getBoundingClientRect();
          return [...frame.querySelectorAll('button, [role="combobox"]')]
            .map((el) => el.getBoundingClientRect())
            .filter((rect) => rect.height > 0 && (rect.top < box.top - 0.5 || rect.bottom > box.bottom + 0.5))
            .map((rect) => `top ${Math.round(rect.top - box.top)} bottom ${Math.round(rect.bottom - box.bottom)}`);
        }),
      );
      expect(sticking).toEqual([]);
      await panel.getByRole("tab", { name: "Copy source" }).click();
      touch((await measure()).small);
      await panel.getByRole("tab", { name: "Paste the files" }).click();
      const manual = await measure();
      touch(manual.small);
      expect(manual.overflow).toBeLessThanOrEqual(0);
      await expect(panel.locator('[data-adoption-step="tokens"]')).toBeVisible();
    });
  }

  for (const mode of ["light", "dark"] as const) {
    test(`passes the a11y gate on every path (${mode})`, async ({ page }) => {
      await page.addInitScript((theme) => localStorage.setItem("theme", theme), mode);
      const panel = await openHome(page);
      await assertA11yGate(page, "#install-or-copy");
      await panel.getByRole("tab", { name: "Copy source" }).click();
      await assertA11yGate(page, "#install-or-copy");
      await panel.getByRole("tab", { name: "Paste the files" }).click();
      await assertA11yGate(page, "#install-or-copy");
      await panel.screenshot({ path: `test-results/home-adoption-${mode}.png` });
    });
  }
});
