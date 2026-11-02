import { expect, test, type Page } from "@playwright/test";

const BASE = "http://127.0.0.1:3100";

const EXAMPLES = ["Data table", "Detail panel", "Date picker"] as const;

const tabs = (page: Page) => page.locator("#demo").getByRole("tablist", { name: "Kit examples" });
const panel = (page: Page, id: "table" | "panel" | "calendar") => page.locator(`#demo [data-hero-example="${id}"]`);

test("desktop hero puts the proposition beside one working example and does not pin the page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE, { waitUntil: "networkidle" });

  const lead = page.locator("[data-home-hero-lead]");
  const preview = page.locator("[data-home-hero-preview]");
  await expect(lead).toBeVisible();
  await expect(preview).toBeVisible();
  await expect(page.locator("#demo").getByRole("button", { name: "Add app" })).toBeVisible();

  const geometry = await page.evaluate(() => {
    const leadBox = document.querySelector("[data-home-hero-lead]")!.getBoundingClientRect();
    const previewBox = document.querySelector("[data-home-hero-preview]")!.getBoundingClientRect();
    const band = document.querySelector("[data-home-hero-band]")!.getBoundingClientRect();
    const next = document.querySelector("[data-home-below-hero] section")!.getBoundingClientRect();
    return {
      leadRight: leadBox.right,
      previewLeft: previewBox.left,
      centreGap: Math.abs(leadBox.top + leadBox.height / 2 - (previewBox.top + previewBox.height / 2)),
      bandHeight: band.height,
      nextTop: next.top + scrollY,
      previewBottom: previewBox.bottom,
    };
  });
  // Side by side, centred on one another.
  expect(geometry.previewLeft).toBeGreaterThan(geometry.leadRight);
  expect(geometry.centreGap).toBeLessThan(24);
  // The hero is one screen, not a scroll track: the next band begins right after it.
  expect(geometry.bandHeight).toBeLessThan(760);
  expect(geometry.nextTop - geometry.previewBottom).toBeLessThan(240);
});

test("the three examples are real tabs: named, selectable by pointer and keyboard, one panel at a time", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE, { waitUntil: "networkidle" });

  const list = tabs(page);
  await expect(list.getByRole("tab")).toHaveText([...EXAMPLES]);
  await expect(list.getByRole("tab", { name: "Data table" })).toHaveAttribute("aria-selected", "true");
  await expect(panel(page, "table")).toBeVisible();
  await expect(panel(page, "panel")).toBeHidden();
  await expect(panel(page, "calendar")).toBeHidden();

  // Pointer.
  await list.getByRole("tab", { name: "Detail panel" }).click();
  await expect(list.getByRole("tab", { name: "Detail panel" })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#demo").getByText("Task details")).toBeVisible();
  await expect(panel(page, "table")).toBeHidden();

  // Keyboard: arrows move and select, Home and End jump, and the selected tab labels its panel.
  await list.getByRole("tab", { name: "Detail panel" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(list.getByRole("tab", { name: "Date picker" })).toHaveAttribute("aria-selected", "true");
  await expect(panel(page, "calendar")).toBeVisible();
  await page.keyboard.press("Home");
  await expect(list.getByRole("tab", { name: "Data table" })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("End");
  await expect(list.getByRole("tab", { name: "Date picker" })).toHaveAttribute("aria-selected", "true");
  const labelled = await panel(page, "calendar").evaluate((node) => {
    const label = document.getElementById(node.getAttribute("aria-labelledby") ?? "");
    return { role: node.getAttribute("role"), label: label?.textContent };
  });
  expect(labelled).toEqual({ role: "tabpanel", label: "Date picker" });

  // An example that is not on show cannot be tabbed into or clicked through.
  await list.getByRole("tab", { name: "Data table" }).click();
  const hidden = await page.evaluate(() => {
    const scene = document.querySelector<HTMLElement>("[data-hero-example='calendar']")!;
    const control = scene.querySelector<HTMLElement>("button")!;
    return { visibility: getComputedStyle(scene).visibility, focusable: getComputedStyle(control).visibility !== "hidden" };
  });
  expect(hidden).toEqual({ visibility: "hidden", focusable: false });
});

test("switching examples does not move the page, and the table keeps what the visitor did", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  const list = tabs(page);
  const heights = new Set<number>();
  const measure = async () =>
    heights.add(Math.round((await page.locator("[data-home-hero-preview]").boundingBox())!.height));

  await measure();
  await page.locator("#demo").getByRole("button", { name: "Add app" }).click();
  await page.getByRole("dialog").getByLabel("Name").fill("kept-row");
  await page.getByRole("button", { name: "Create app" }).click();
  await expect(page.locator("#demo").getByRole("cell", { name: "kept-row", exact: true })).toBeVisible();
  await measure();
  for (const name of ["Detail panel", "Date picker", "Data table"]) {
    await list.getByRole("tab", { name }).click();
    await measure();
  }
  // Same frame height for every example (±1px for rounding), and the added row is still there.
  expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(1);
  await expect(page.locator("#demo").getByRole("cell", { name: "kept-row", exact: true })).toBeVisible();
});

test("the table state select belongs to the table: it is there for the table and nowhere else", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  const state = page.locator("[data-hero-demo-display]").getByRole("combobox", { name: "Table preview mode" });
  await expect(state).toBeVisible();
  await tabs(page).getByRole("tab", { name: "Date picker" }).click();
  await expect(state).toHaveCount(0);
  // Identity and mode apply to every example.
  await expect(page.locator("[data-hero-demo-display]").getByRole("combobox")).toHaveCount(2);
});

test("choosing a day in the date picker example answers with that day", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await tabs(page).getByRole("tab", { name: "Date picker" }).click();
  await expect(panel(page, "calendar").getByText("Chosen: 15 October")).toBeVisible();
  await panel(page, "calendar").getByRole("button", { name: /October 20th/ }).click();
  await expect(panel(page, "calendar").getByText("Chosen: 20 October")).toBeVisible();
});

test("a toast raised in the example sits in the viewport corner and leaves the new row's actions reachable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  const demo = page.locator("#demo").getByLabel("Interactive admin dashboard demo in the hero");

  await demo.getByRole("button", { name: "Add app" }).click();
  await page.getByRole("dialog").getByLabel("Name").fill("toast-corner");
  await page.getByRole("button", { name: "Create app" }).click();
  await expect(page.getByText("App added")).toBeVisible();
  // The drawer's own overlay has to be gone, or it would be what the pointer hits.
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.locator("[data-slot='drawer-overlay'], [data-slot='dialog-overlay']")).toHaveCount(0);

  const placed = await page.evaluate(() => {
    const toast = document.querySelector("[data-sonner-toast]")!.getBoundingClientRect();
    const edit = document.querySelector("button[aria-label='Edit toast-corner']")!;
    const box = edit.getBoundingClientRect();
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return {
      bottomGap: innerHeight - toast.bottom,
      rightGap: innerWidth - toast.right,
      editReachable: hit === edit || edit.contains(hit),
    };
  });
  // Pinned to the viewport corner (24px offset), not to a card that holds the example.
  expect(placed.bottomGap).toBeGreaterThanOrEqual(16);
  expect(placed.bottomGap).toBeLessThanOrEqual(32);
  expect(placed.rightGap).toBeGreaterThanOrEqual(16);
  expect(placed.rightGap).toBeLessThanOrEqual(32);
  expect(placed.editReachable).toBe(true);
});

test("the lead rises in one block at a time on load and settles fully visible and in place", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE, { waitUntil: "domcontentloaded" });

  // Three blocks (name and title, sentence, actions), each one beat after the one before.
  const beats = await page.evaluate(() =>
    [...document.querySelectorAll("[data-home-hero-lead] > *")].map((block) => {
      const style = getComputedStyle(block);
      return { name: style.animationName, delay: style.animationDelay };
    }),
  );
  expect(beats.map((beat) => beat.name)).toEqual(Array(3).fill("zk-home-hero-rise"));
  const delays = beats.map((beat) => Number.parseFloat(beat.delay));
  expect(delays[0]).toBe(0);
  expect(delays[1]).toBeGreaterThan(delays[0]!);
  expect(delays[2]).toBeGreaterThan(delays[1]!);
  expect(delays[2]).toBeLessThan(0.3);

  await page.waitForLoadState("networkidle");
  await expect
    .poll(() =>
      page.evaluate(() =>
        [...document.querySelectorAll("[data-home-hero-lead] > *")].map((block) => {
          const style = getComputedStyle(block);
          return `${style.opacity} ${style.transform}`;
        }),
      ),
    )
    .toEqual(Array(3).fill("1 none"));
  // The example is not animated: its loading frame is swapped for the real one and would replay.
  expect(await page.locator("[data-home-hero-preview]").evaluate((node) => getComputedStyle(node).animationName)).toBe(
    "none",
  );
});

test("reduced motion changes nothing about the hero: it never animated", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  const animated = await page.evaluate(() =>
    document
      .getAnimations()
      .filter((animation) => document.querySelector("[data-home-hero-band]")?.contains((animation.effect as KeyframeEffect | null)?.target ?? null))
      .map((animation) => animation.constructor.name),
  );
  expect(animated).toEqual([]);
  await expect(tabs(page).getByRole("tab")).toHaveCount(3);
});

for (const width of [320, 360, 390]) {
  test(`${width}px: the three tabs and the example fit the screen, nothing scrolls sideways`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(BASE, { waitUntil: "networkidle" });
    const fit = await page.evaluate(() => {
      const list = document.querySelector("[data-home-hero-examples]")!;
      const triggers = [...list.querySelectorAll<HTMLElement>("[role='tab']")];
      return {
        inside: triggers.every((tab) => {
          const box = tab.getBoundingClientRect();
          return box.left >= 0 && box.right <= document.documentElement.clientWidth;
        }),
        clipped: triggers.some((tab) => tab.scrollWidth > tab.clientWidth + 1),
        targets: Math.min(...triggers.map((tab) => tab.getBoundingClientRect().height)),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    expect(fit.inside, "every tab is on screen").toBe(true);
    expect(fit.clipped, "no tab label is cut").toBe(false);
    expect(fit.targets, "tab height (px) reaches a comfortable target").toBeGreaterThanOrEqual(36);
    expect(fit.overflow).toBeLessThanOrEqual(1);
    await expect(page.locator("#demo").getByRole("button", { name: "Add app" })).toBeVisible();

    const select = page.getByRole("combobox", { name: /identity/i }).first();
    await select.scrollIntoViewIfNeeded();
    const readable = await select.evaluate((node) => {
      const value = node.querySelector("[data-slot='select-value']") ?? node;
      return { width: node.getBoundingClientRect().width, clipped: value.scrollWidth > value.clientWidth + 1, text: (value.textContent ?? "").trim() };
    });
    expect(readable.text.length).toBeGreaterThan(2);
    expect(readable.width).toBeGreaterThanOrEqual(100);
    expect(readable.clipped).toBe(false);
  });
}
