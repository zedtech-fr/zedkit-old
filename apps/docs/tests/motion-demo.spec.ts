import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Relative path: the config baseURL decides the port.
const MOTION_PAGE = "/docs/ui/animate-entrances-and-hover-feedback-with-css-utilities";

test.describe("motion utilities demo", () => {
  test("renders the utilities, replays, and passes axe", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (event) => errors.push(String(event)));
    await page.goto(MOTION_PAGE, { waitUntil: "networkidle" });
    const card = page.getByText("Compose", { exact: true });
    await expect(card).toBeVisible();
    // The utilities are generated and wired to the motion keyframes.
    const first = page.locator(".animate-fade-up.stagger-1").first();
    await expect(first).toHaveCSS("animation-name", "zk-reveal-up");
    await expect(page.locator(".animate-fade-up.stagger-2").first()).not.toHaveCSS("animation-delay", "0s");
    await expect(page.locator(".hover-lift").first()).toHaveCSS("transition-property", /translate/);
    await page.getByRole("button", { name: "Replay entrance" }).click();
    await expect(card).toBeVisible();
    // Axe reads contrast mid-fade otherwise: wait for the entrances to end.
    await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity).map((a) => a.finished)));
    const results = await new AxeBuilder({ page }).include("[data-preview-surface]").analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
    expect(errors).toEqual([]);
  });

  test("reduced motion switches every animation off", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(MOTION_PAGE, { waitUntil: "networkidle" });
    await expect(page.locator(".animate-fade-up.stagger-1").first()).toHaveCSS("animation-name", "none");
    await expect(page.locator("[data-stagger] > *").first()).toHaveCSS("animation-name", "none");
    await expect(page.locator("[data-stagger] > *").first()).toHaveCSS("opacity", "1");
  });

  test("hover and stagger examples have a live preview next to their code", async ({ page }) => {
    await page.goto(MOTION_PAGE, { waitUntil: "networkidle" });
    const hoverPreview = page.locator("[data-component-preview]").filter({ hasText: "Website relaunch" }).first();
    await hoverPreview.scrollIntoViewIfNeeded();
    const lift = hoverPreview.locator(".hover-lift").filter({ hasText: "Website relaunch" });
    await expect(lift).toBeVisible();
    await expect(hoverPreview.getByRole("button", { name: "Presses down on click" })).toBeVisible();
    const staggerPreview = page.locator("[data-component-preview]").filter({ hasText: "Write the launch email" }).first();
    await staggerPreview.scrollIntoViewIfNeeded();
    const tasks = staggerPreview.locator("[data-stagger]").first();
    await expect(tasks.getByText("Write the launch email")).toBeVisible();
    await staggerPreview.getByRole("button", { name: "Replay", exact: true }).click();
    await expect(tasks.getByText("Publish the sale banner")).toBeVisible();
  });
});
