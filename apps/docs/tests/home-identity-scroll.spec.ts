import { expect, test, type Page } from "@playwright/test";

/**
 * Home identities follow the scroll: on a wide, tall screen the tabs and the example pin under the header, and the
 * scroll position picks the example. Everywhere else the section is plain tabs.
 */

const IDS = ["mist", "press", "tide", "volt", "maison", "glass"] as const;
const PRODUCTS = ["Dev console", "Newsroom", "Invoicing", "Incidents", "Bag shop", "SaaS app"] as const;

const stage = (page: Page) => page.locator("[data-home-identity-stage]");

/** Blur so pinned pan is not blocked, then scroll the stage (not the page) to reveal controls below the fold. */
async function revealClippedStage(page: Page) {
  await stage(page).evaluate((node) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    node.scrollTop = node.scrollHeight - node.clientHeight;
  });
}

async function open(page: Page, width = 1440, height = 900) {
  await page.setViewportSize({ width, height });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.locator("[data-home-identity-looks]").evaluate((node) => node.scrollIntoView({ block: "start" }));
}

/** Scrolls to a point of the pinned stretch: 0 is where the pin sticks, 1 where it lets go. */
async function scrollToProgress(page: Page, progress: number) {
  await page.evaluate((point) => {
    const track = document.querySelector("[data-identity-track]")!;
    const pin = document.querySelector<HTMLElement>("[data-identity-pin]")!;
    const stuckAt = Number.parseFloat(getComputedStyle(pin).top);
    const distance = track.getBoundingClientRect().height - pin.offsetHeight;
    window.scrollTo({ top: window.scrollY + track.getBoundingClientRect().top - stuckAt + point * distance, behavior: "instant" });
  }, progress);
}

test("wide and tall: the tabs and the example pin, and the scroll position picks the example", async ({ page }) => {
  await open(page);
  const pin = page.locator("[data-identity-pin]");
  expect(await pin.evaluate((node) => getComputedStyle(node).position)).toBe("sticky");

  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  for (const [index, id] of IDS.entries()) {
    await scrollToProgress(page, (index + 0.5) / IDS.length);
    await expect(stage(page)).toHaveAttribute("data-identity", id);
    await expect(page.getByRole("tab", { name: PRODUCTS[index]! })).toHaveAttribute("aria-selected", "true");
    // Stuck under the header the whole way, and the page below never moves while the examples change size.
    const top = await pin.evaluate((node) => node.getBoundingClientRect().top);
    expect(top).toBeGreaterThan(40);
    expect(top).toBeLessThan(90);
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(pageHeight);
  }
  // The bar under the tabs says how far through the examples the page is.
  const progress = await page.locator("[data-identity-progress] > span").evaluate((node) => getComputedStyle(node).transform);
  expect(progress).not.toBe("none");

  // Scrolled back to the top of the section, the first example is back.
  await scrollToProgress(page, 0.02);
  await expect(stage(page)).toHaveAttribute("data-identity", "mist");
});

test("a tab press while pinned jumps to that example's stretch and stays there", async ({ page }) => {
  await open(page);
  await scrollToProgress(page, 0.1);
  await page.getByRole("tab", { name: "Bag shop" }).click();
  await expect(stage(page)).toHaveAttribute("data-identity", "maison");
  await page.waitForTimeout(400);
  await expect(stage(page)).toHaveAttribute("data-identity", "maison");

  // Keyboard: the arrow keys move the tab and the scroll together.
  await page.getByRole("tab", { name: "Bag shop" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(stage(page)).toHaveAttribute("data-identity", "glass");
  await page.keyboard.press("Home");
  await expect(stage(page)).toHaveAttribute("data-identity", "mist");
  await page.waitForTimeout(400);
  await expect(page.getByRole("tab", { name: "Dev console" })).toHaveAttribute("aria-selected", "true");
});

test("working inside a pinned example neither scrolls the page nor changes the example", async ({ page }) => {
  await open(page);
  await scrollToProgress(page, 0.12 / IDS.length);
  await expect(stage(page)).toHaveAttribute("data-identity", "mist");
  const before = await page.evaluate(() => window.scrollY);

  // Type, open a dialog and close it with Escape, open a drawer and close it: the usual things a visitor does.
  await stage(page).getByRole("textbox", { name: "Workspace" }).fill("Harbor Staging");
  await revealClippedStage(page);
  const deleteBtn = stage(page).getByRole("button", { name: "Delete project" });
  await expect(deleteBtn).toBeVisible();
  await deleteBtn.evaluate((node) => node.click());
  await expect(page.getByRole("dialog", { name: "Delete this project?" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Delete this project?" })).toHaveCount(0);
  await stage(page).getByRole("button", { name: "Leo Martin" }).evaluate((node) => node.click());
  await expect(page.getByRole("dialog", { name: "Leo Martin" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.waitForTimeout(400);

  expect(Math.abs((await page.evaluate(() => window.scrollY)) - before)).toBeLessThanOrEqual(1);
  await expect(stage(page)).toHaveAttribute("data-identity", "mist");
  await expect(stage(page).getByRole("textbox", { name: "Workspace" })).toHaveValue("Harbor Staging");
});

test("an example taller than the frame starts at its top with a fade, then pans to its bottom as the page scrolls", async ({ page }) => {
  await open(page, 1440, 760);
  const tide = 2;
  await scrollToProgress(page, (tide + 0.1) / IDS.length);
  await expect(stage(page)).toHaveAttribute("data-identity", "tide");
  await expect(stage(page)).toHaveAttribute("data-clipped", "");
  await expect(stage(page).locator("[data-identity-fade]")).toBeVisible();
  expect(await stage(page).evaluate((node) => node.scrollTop)).toBe(0);

  // Later in the same step the frame has moved down: the last invoice is fully inside it and the fade is gone.
  await scrollToProgress(page, (tide + 0.9) / IDS.length);
  await expect(stage(page)).toHaveAttribute("data-identity", "tide");
  await expect.poll(() => stage(page).evaluate((node) => node.scrollTop)).toBeGreaterThan(40);
  await expect(stage(page)).not.toHaveAttribute("data-clipped", "");
  const last = stage(page).getByRole("list", { name: "Invoices" }).getByRole("listitem").last();
  const box = (await last.boundingBox())!;
  const frame = (await stage(page).boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(frame.y + frame.height + 1);

  // A new example starts at the top again.
  await scrollToProgress(page, (tide + 1.1) / IDS.length);
  await expect(stage(page)).toHaveAttribute("data-identity", "volt");
  expect(await stage(page).evaluate((node) => node.scrollTop)).toBe(0);
});

for (const size of [
  { name: "phone", width: 390, height: 844 },
  { name: "short window", width: 1440, height: 640 },
  { name: "tablet", width: 768, height: 1024 },
]) {
  test(`${size.name}: nothing is pinned, the tabs are the whole interaction`, async ({ page }) => {
    await open(page, size.width, size.height);
    const pin = page.locator("[data-identity-pin]");
    expect(await pin.evaluate((node) => getComputedStyle(node).position)).toBe("static");
    expect(await page.locator("[data-identity-progress]").evaluate((node) => getComputedStyle(node).display)).toBe("none");
    const track = await page.locator("[data-identity-track]").evaluate((node) => node.getBoundingClientRect().height);
    const pinHeight = await pin.evaluate((node) => node.getBoundingClientRect().height);
    expect(track).toBeLessThanOrEqual(pinHeight + 1);

    await page.getByRole("tab", { name: "Newsroom" }).click();
    await expect(stage(page)).toHaveAttribute("data-identity", "press");
    // Scrolling does not change the chosen example.
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(300);
    await expect(stage(page)).toHaveAttribute("data-identity", "press");
  });
}

test("reduced motion: nothing is pinned and the examples do not follow the scroll", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  expect(await page.locator("[data-identity-pin]").evaluate((node) => getComputedStyle(node).position)).toBe("static");
  await page.getByRole("tab", { name: "Incidents" }).click();
  await page.evaluate(() => window.scrollBy(0, 900));
  await page.waitForTimeout(300);
  await expect(stage(page)).toHaveAttribute("data-identity", "volt");
  const entrance = await page.evaluate(() => getComputedStyle(document.querySelector("[data-identity-example]")!).animationName);
  expect(entrance).toBe("none");
});
