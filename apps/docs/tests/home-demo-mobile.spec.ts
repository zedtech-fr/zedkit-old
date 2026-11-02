import { expect, test } from "@playwright/test";
import { openHeroPage } from "./hero-helpers";

const MOBILE = { width: 390, height: 844 };

test.describe("home dashboard mobile (#388)", () => {
  test.use({ viewport: MOBILE });

  test("single card chrome, toolbar row, compact row actions", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await openHeroPage(page, "Apps");

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

    const bordered = await page.locator("[data-home-dashboard-card]").evaluate((card) => {
      const demo = card.querySelector('[aria-label="Interactive admin dashboard demo in the hero"]');
      if (!demo) return { ok: false, reason: "demo missing" };
      const cardBorder = getComputedStyle(card).borderTopWidth;
      const demoBorder = getComputedStyle(demo).borderTopWidth;
      return { ok: cardBorder !== "0px" && demoBorder === "0px", cardBorder, demoBorder };
    });
    expect(bordered, JSON.stringify(bordered)).toMatchObject({ ok: true });

    const card = page.locator("[data-home-dashboard-card]");
    await card.scrollIntoViewIfNeeded();

    const toolbar = card.locator("[data-demo-toolbar]");
    await expect(toolbar).toBeVisible();
    await expect(toolbar.getByRole("button", { name: "Add app" })).toBeVisible();
    const display = page.locator("[data-hero-demo-display]");
    await expect(display.locator("[role=combobox]")).toHaveCount(3);
    // The three selects may wrap onto a second row; none may shrink until its value is unreadable.
    const widths = await display.evaluate((row) =>
      [...row.querySelectorAll("[role=combobox]")].map((el) => Math.round(el.getBoundingClientRect().width)),
    );
    expect(widths.every((width) => width >= 80), JSON.stringify(widths)).toBe(true);
    expect(widths[0], "the look select shows its value").toBeGreaterThanOrEqual(100);

    const actionStacks = card.locator("[data-demo-row-actions]");
    await expect(actionStacks.first()).toBeVisible();
    const stacked = await actionStacks.first().evaluate((row) => {
      const buttons = row.querySelectorAll("button");
      if (buttons.length < 2) return { ok: false };
      const tops = [...buttons].map((b) => b.getBoundingClientRect().top);
      return { ok: Math.max(...tops) - Math.min(...tops) < 4, tops };
    });
    expect(stacked, JSON.stringify(stacked)).toMatchObject({ ok: true });

    await expect(page.getByText("Page 1 of 1")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  });

  test("edit sheet keeps side gutters, a visible handle, and clears the bottom edge", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await openHeroPage(page, "Apps");
    const card = page.locator("[data-home-dashboard-card]");
    await card.scrollIntoViewIfNeeded();
    await card.getByRole("button", { name: "Edit console" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await expect(dialog).toHaveAttribute("data-vaul-drawer-direction", "bottom");
    // Wait for the arrival animation to settle before measuring.
    await expect
      .poll(async () => dialog.evaluate((el) => el.getAnimations().length + (getComputedStyle(el).transform === "none" ? 0 : 1)))
      .toBeLessThanOrEqual(1);
    await page.waitForTimeout(600);

    const sheet = await dialog.boundingBox();
    expect(sheet).not.toBeNull();
    if (!sheet) return;
    expect(sheet.y + sheet.height).toBeGreaterThanOrEqual(MOBILE.height - 1);

    const targets = [
      dialog.getByRole("heading", { name: "Edit app" }),
      dialog.getByText("Name and region are stored in local state only."),
      dialog.getByLabel("Name"),
      dialog.getByRole("combobox", { name: "Region" }),
      dialog.getByRole("button", { name: "Save changes" }),
      dialog.getByRole("button", { name: "Cancel" }),
    ];
    for (const target of targets) {
      // Visible edges: the padding box of plain text blocks is not what the reader sees, so measure their content.
      const edges = await target.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        const isControl = el.matches("input, button, select, [role=combobox]");
        const padLeft = isControl ? 0 : Number.parseFloat(style.paddingLeft);
        const padRight = isControl ? 0 : Number.parseFloat(style.paddingRight);
        return { label: (el.textContent ?? el.tagName).slice(0, 30), left: rect.left + padLeft, right: rect.right - padRight };
      });
      expect(edges.left - sheet.x, `left gutter of ${edges.label}`).toBeGreaterThanOrEqual(12);
      expect(sheet.x + sheet.width - edges.right, `right gutter of ${edges.label}`).toBeGreaterThanOrEqual(12);
    }

    // Actions: clear of the bottom edge of the viewport.
    for (const name of ["Save changes", "Cancel"]) {
      const box = await dialog.getByRole("button", { name }).boundingBox();
      expect(box).not.toBeNull();
      if (!box) continue;
      expect(MOBILE.height - (box.y + box.height), `${name} distance to the bottom edge`).toBeGreaterThanOrEqual(12);
    }

    // Fields keep the 16px floor (no iOS zoom on focus).
    const fieldSizes = await dialog.evaluate((root) =>
      [...root.querySelectorAll("input, select, [role=combobox]")].map((el) => Number.parseFloat(getComputedStyle(el).fontSize)),
    );
    expect(fieldSizes.length).toBeGreaterThanOrEqual(2);
    for (const size of fieldSizes) expect(size).toBeGreaterThanOrEqual(16);

    // The grab handle is drawn and big enough to see.
    const handle = dialog.locator("[data-vaul-handle]");
    await expect(handle).toBeVisible();
    const handleBox = await handle.boundingBox();
    expect(handleBox?.width ?? 0).toBeGreaterThanOrEqual(32);
    expect(handleBox?.height ?? 0).toBeGreaterThanOrEqual(4);

    // The page behind does not overflow sideways while the sheet is open.
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  for (const width of [320, 360, 390] as const) {
    test(`hero shows a full record row and actions at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/", { waitUntil: "networkidle" });
      await openHeroPage(page, "Apps");
      const card = page.locator("[data-home-dashboard-card]");
      await card.scrollIntoViewIfNeeded();
      const preview = page.locator("[data-home-hero-preview]");
      const metrics = await preview.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          overflowY: style.overflowY,
          clientHeight: el.clientHeight,
          scrollHeight: el.scrollHeight,
        };
      });
      expect(metrics.overflowY).not.toBe("hidden");
      expect(metrics.clientHeight + 2).toBeGreaterThanOrEqual(metrics.scrollHeight);
      await expect(card.getByRole("button", { name: "Edit console" })).toBeVisible();
      await expect(card.getByRole("button", { name: "Delete console" })).toBeVisible();

      await card.getByRole("button", { name: "Add app" }).click();
      await page.getByRole("dialog").getByLabel("Name").fill(`mobile-${width}`);
      await page.getByRole("button", { name: "Create app" }).click();
      await expect(page.getByRole("dialog")).toBeHidden();
      await expect(card.getByRole("cell", { name: `mobile-${width}`, exact: true })).toBeVisible();
    });
  }
});
