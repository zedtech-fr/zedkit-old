import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { persistDocsSiteLook } from "./identity-helpers";

const DRAWER_PAGE = "/docs/ui/slide-in-a-drawer-panel";
const MOBILE = { width: 390, height: 844 };

test.describe("drawer mobile sheet (refs #425)", () => {
  test.use({ viewport: MOBILE, hasTouch: true, isMobile: true });

  test("opens as a bottom sheet with motion, context, and close target", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (event) => errors.push(String(event)));
    await page.goto(DRAWER_PAGE, { waitUntil: "networkidle" });
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.getByRole("button", { name: "Open drawer" }).click();
    await page.waitForTimeout(300);
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    if (box && viewport) {
      expect(box.height).toBeLessThanOrEqual(viewport.height * 0.92);
      expect(box.y).toBeGreaterThan(0);
      expect(box.height).toBeLessThan(viewport.height);
    }
    await expect(dialog).toHaveAttribute("data-vaul-drawer-direction", "bottom");

    const overlay = page.locator("[data-vaul-overlay]");
    await expect(overlay).toBeVisible();
    const transition = await dialog.evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(transition).not.toBe("0s");

    const close = dialog.getByRole("button", { name: "Close" });
    const closeBox = await close.boundingBox();
    expect(closeBox).not.toBeNull();
    if (closeBox) {
      expect(closeBox.width).toBeGreaterThanOrEqual(44);
      expect(closeBox.height).toBeGreaterThanOrEqual(44);
    }

    const axe = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
    expect(axe.violations, JSON.stringify(axe.violations, null, 2)).toEqual([]);

    await overlay.click({ position: { x: 8, y: 8 } });
    await expect(dialog).toBeHidden();
    // Let the overlay finish fading out: a click on a still-covered trigger makes the
    // test runner retry with a different scroll alignment, which is not the drawer's doing.
    await expect(overlay).toHaveCount(0);
    const scrollBefore = await page.evaluate(() => window.scrollY);

    await page.getByRole("button", { name: "Open drawer" }).click();
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    // Opening and closing never loses the reader's place.
    expect(Math.abs((await page.evaluate(() => window.scrollY)) - scrollBefore)).toBeLessThanOrEqual(2);
    expect(errors).toEqual([]);
  });
});

test.describe("drawer desktop side panel", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("right drawer on wide viewport", async ({ page }) => {
    await page.goto(DRAWER_PAGE, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Open drawer" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("data-vaul-drawer-direction", "right");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});

const DIRECTIONS = ["bottom", "left", "right", "top"] as const;
const LABEL = { bottom: "Bottom", left: "Left", right: "Right", top: "Top" } as const;
const PHONES = [
  { width: 360, height: 640 },
  { width: 390, height: 844 },
] as const;

for (const phone of PHONES) {
  test.describe(`drawer directions on a ${phone.width}x${phone.height} phone`, () => {
    test.use({ viewport: phone, hasTouch: true, isMobile: true });

    for (const direction of DIRECTIONS) {
      test(`${direction}: geometry, touch targets, field size and close paths`, async ({ page }) => {
        await page.goto(DRAWER_PAGE, { waitUntil: "networkidle" });
        await page.getByRole("button", { name: LABEL[direction], exact: true }).click();
        await expect(page.getByRole("button", { name: LABEL[direction], exact: true })).toHaveAttribute("aria-pressed", "true");
        await page.getByRole("button", { name: "Open drawer" }).click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible({ timeout: 10_000 });
        await expect(dialog).toHaveAttribute("data-vaul-drawer-direction", direction);
        // Wait for the arrival animation to settle before measuring.
        await expect
          .poll(async () => dialog.evaluate((el) => el.getAnimations().length + (getComputedStyle(el).transform === "none" ? 0 : 1)))
          .toBeLessThanOrEqual(1);
        await page.waitForTimeout(600);

        const box = await dialog.boundingBox();
        expect(box).not.toBeNull();
        if (!box) return;
        if (direction === "left" || direction === "right") {
          expect(box.width).toBeLessThanOrEqual(phone.width * 0.9 + 1);
          expect(box.width).toBeGreaterThan(phone.width * 0.6);
          expect(box.y).toBeLessThanOrEqual(1);
          expect(box.height).toBeGreaterThanOrEqual(phone.height - 1);
          if (direction === "left") expect(box.x).toBeLessThanOrEqual(1);
          else expect(box.x + box.width).toBeGreaterThanOrEqual(phone.width - 1);
          await expect(dialog.locator("[data-vaul-handle]")).toBeHidden();
        } else {
          expect(box.width).toBeGreaterThanOrEqual(phone.width - 1);
          expect(box.height).toBeLessThanOrEqual(phone.height * 0.92);
          if (direction === "bottom") expect(box.y + box.height).toBeGreaterThanOrEqual(phone.height - 1);
          else expect(box.y).toBeLessThanOrEqual(1);
          const handle = dialog.locator("[data-vaul-handle]");
          await expect(handle).toBeVisible();
          const handleBox = await handle.boundingBox();
          expect(handleBox?.width ?? 0).toBeGreaterThanOrEqual(32);
          expect(handleBox?.height ?? 0).toBeGreaterThanOrEqual(4);
        }

        const overlay = page.locator("[data-vaul-overlay]");
        await expect(overlay).toBeVisible();
        const overlayAlpha = await overlay.evaluate((el) => getComputedStyle(el).backgroundColor);
        expect(overlayAlpha).not.toBe("rgba(0, 0, 0, 0)");

        // Every field inside the drawer: text ≥16px (control heights belong to the control components, not the drawer).
        const small = await dialog.evaluate((root) => {
          const found: string[] = [];
          for (const el of root.querySelectorAll("button, input, select, textarea, a[href]")) {
            if (el.matches("[data-vaul-handle]")) continue;
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) continue;
            if (el.matches("input, select, textarea") && Number.parseFloat(getComputedStyle(el).fontSize) < 16) {
              found.push(`${el.tagName} font ${getComputedStyle(el).fontSize}`);
            }
          }
          return found;
        });
        expect(small).toEqual([]);
        const closeBox = await dialog.getByRole("button", { name: "Close" }).boundingBox();
        expect(closeBox?.width ?? 0).toBeGreaterThanOrEqual(44);
        expect(closeBox?.height ?? 0).toBeGreaterThanOrEqual(44);

        // The body scrolls inside the drawer and the page stays put.
        const pageY = await page.evaluate(() => window.scrollY);
        const overflow = await dialog.evaluate((root) => {
          const body = [...root.querySelectorAll("*")].find((el) => getComputedStyle(el).overflowY === "auto");
          return body ? { scrolls: body.scrollHeight >= body.clientHeight, clipped: body.getBoundingClientRect().bottom <= window.innerHeight + 1 } : null;
        });
        expect(overflow?.scrolls).toBe(true);
        expect(overflow?.clipped).toBe(true);
        expect(await page.evaluate(() => window.scrollY)).toBe(pageY);

        const field = dialog.getByLabel("Note");
        await field.focus();
        await expect(field).toBeInViewport();
        await field.blur();

        // Close with the dimmed area (a corner away from the panel).
        const corner = direction === "left" ? { x: phone.width - 6, y: phone.height / 2 } : direction === "right" ? { x: 6, y: phone.height / 2 } : direction === "bottom" ? { x: phone.width / 2, y: 6 } : { x: phone.width / 2, y: phone.height - 6 };
        await page.mouse.click(corner.x, corner.y);
        await expect(dialog).toBeHidden();
      });

      test(`${direction}: drag toward the edge closes it`, async ({ page }) => {
        // Drag thresholds measured on a solid look; Glass (the site default) has its own overlay motion.
        await persistDocsSiteLook(page, "tide", "light");
        await page.goto(DRAWER_PAGE, { waitUntil: "networkidle" });
        await page.getByRole("button", { name: LABEL[direction], exact: true }).click();
        await page.getByRole("button", { name: "Open drawer" }).click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible({ timeout: 10_000 });
        await page.waitForTimeout(600);
        const box = await dialog.boundingBox();
        expect(box).not.toBeNull();
        if (!box) return;
        // Grab the panel on its header area (never on the scrolling body).
        const grabX = box.x + box.width / 2;
        const grabY = direction === "top" ? box.y + box.height - 12 : box.y + 14;
        const vector = { bottom: [0, 1], top: [0, -1], left: [-1, 0], right: [1, 0] }[direction];
        await page.mouse.move(grabX, grabY);
        await page.mouse.down();
        for (let step = 1; step <= 12; step++) {
          await page.mouse.move(grabX + vector[0] * step * 40, grabY + vector[1] * step * 40);
        }
        await page.mouse.up();
        await expect(dialog).toBeHidden({ timeout: 5_000 });
      });
    }

    test("auto (the default) is a bottom sheet on a phone", async ({ page }) => {
      await page.goto(DRAWER_PAGE, { waitUntil: "networkidle" });
      await page.getByRole("button", { name: "Open drawer" }).click();
      await expect(page.getByRole("dialog")).toHaveAttribute("data-vaul-drawer-direction", "bottom");
    });
  });
}
