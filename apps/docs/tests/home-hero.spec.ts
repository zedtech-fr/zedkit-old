import { expect, test, type Page } from "@playwright/test";

const BASE = "http://127.0.0.1:3100";

const PAGES = ["Overview", "Apps", "Calendar", "Team", "Settings"] as const;
type PageName = (typeof PAGES)[number];

const windowOf = (page: Page) => page.locator("#demo [data-hero-window]");
/** The sidebar entries (from md up) or the chips in the top bar (below md): whichever is on screen. */
const nav = (page: Page) => page.locator("#demo").getByRole("navigation", { name: "Pages of the example app" });
const go = (page: Page, name: PageName) => nav(page).getByRole("button", { name, exact: true }).click();
const section = (page: Page, id: string) => page.locator(`#demo [data-hero-page="${id}"]`);

test("desktop hero puts the proposition beside one working example and does not pin the page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE, { waitUntil: "networkidle" });

  await expect(page.locator("[data-home-hero-lead]")).toBeVisible();
  await expect(windowOf(page)).toBeVisible();
  await expect(windowOf(page).getByRole("heading", { level: 2, name: "Website relaunch" })).toBeVisible();

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
      previewBottom: previewBox.bottom + scrollY,
    };
  });
  // Side by side, centred on one another.
  expect(geometry.previewLeft).toBeGreaterThan(geometry.leadRight);
  expect(geometry.centreGap).toBeLessThan(24);
  // The hero is about one screen, not a scroll track: the next band begins right after it.
  expect(geometry.bandHeight).toBeLessThan(800);
  expect(geometry.nextTop - geometry.previewBottom).toBeLessThan(120);
});

test("the example is a small app: five pages, one on show, chosen by the sidebar with pointer or keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE, { waitUntil: "networkidle" });

  await expect(nav(page).getByRole("button")).toHaveText([...PAGES]);
  await expect(nav(page).getByRole("button", { name: "Overview" })).toHaveAttribute("aria-current", "page");
  await expect(section(page, "overview")).toBeVisible();
  for (const id of ["apps", "calendar", "team", "settings"]) await expect(section(page, id)).toBeHidden();

  await go(page, "Calendar");
  await expect(nav(page).getByRole("button", { name: "Calendar" })).toHaveAttribute("aria-current", "page");
  await expect(section(page, "calendar")).toBeVisible();
  await expect(section(page, "overview")).toBeHidden();

  // Keyboard: focus an entry, Enter opens it.
  await nav(page).getByRole("button", { name: "Team" }).focus();
  await page.keyboard.press("Enter");
  await expect(section(page, "team")).toBeVisible();
  await expect(windowOf(page).getByRole("region", { name: "Interactive admin dashboard demo in the hero" })).toBeHidden();

  // A page that is not on show cannot be tabbed into or clicked through.
  const hidden = await page.evaluate(() => {
    const scene = document.querySelector<HTMLElement>("[data-hero-page='settings']")!;
    const control = scene.querySelector<HTMLElement>("input")!;
    return { visibility: getComputedStyle(scene).visibility, focusable: getComputedStyle(control).visibility !== "hidden" };
  });
  expect(hidden).toEqual({ visibility: "hidden", focusable: false });
});

test("switching pages does not move the page, and the Apps table keeps what the visitor did", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  const heights = new Set<number>();
  const measure = async () => heights.add(Math.round((await page.locator("[data-home-hero-preview]").boundingBox())!.height));

  await measure();
  await go(page, "Apps");
  await page.locator("#demo").getByRole("button", { name: "Add app" }).click();
  await page.getByRole("dialog").getByLabel("Name").fill("kept-row");
  await page.getByRole("button", { name: "Create app" }).click();
  await expect(page.locator("#demo").getByRole("cell", { name: "kept-row", exact: true })).toBeVisible();
  await measure();
  for (const name of ["Calendar", "Team", "Settings", "Overview", "Apps"] as const) {
    await go(page, name);
    await measure();
  }
  // Same frame height for every page (±1px for rounding), and the added row is still there.
  expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(1);
  await expect(page.locator("#demo").getByRole("cell", { name: "kept-row", exact: true })).toBeVisible();
});

test("the table state select belongs to the Apps page: it is there for the table and nowhere else", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  const display = page.locator("[data-hero-demo-display]");
  const state = display.getByRole("combobox", { name: "Table preview mode" });
  await expect(state).toHaveCount(0);
  await go(page, "Apps");
  await expect(state).toBeVisible();
  await go(page, "Calendar");
  await expect(state).toHaveCount(0);
  // Identity and mode apply to every page.
  await expect(display.getByRole("combobox")).toHaveCount(2);
});

test("choosing a day in the calendar page answers with what is due that day", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await go(page, "Calendar");
  const calendar = section(page, "calendar");
  await expect(calendar.getByText("Due on 4 November")).toBeVisible();
  await expect(calendar.getByText("Redirect the old product URLs")).toBeVisible();
  await calendar.getByRole("button", { name: /November 5th/ }).click();
  await expect(calendar.getByText("Due on 5 November")).toBeVisible();
  await expect(calendar.getByText("Connect the contact form to email")).toBeVisible();
  await calendar.getByRole("button", { name: /November 8th/ }).click();
  await expect(calendar.getByText("Nothing due this day.")).toBeVisible();
});

test("the team page and the settings page answer the visitor", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await go(page, "Team");
  const team = section(page, "team");
  await team.getByRole("button", { name: /Luca Moretti/ }).click();
  await expect(team.getByRole("button", { name: /Luca Moretti/ })).toHaveAttribute("aria-pressed", "true");
  await expect(team.getByText("Engineering").last()).toBeVisible();
  await expect(team.getByText("Redirect the old product URLs", { exact: false })).toBeVisible();

  await go(page, "Settings");
  const settings = section(page, "settings");
  await settings.getByRole("button", { name: "Save changes" }).click();
  await expect(settings.getByRole("status")).toHaveText("Saved");
  await settings.getByRole("textbox", { name: "Workspace" }).fill("Harbor Staging");
  await expect(settings.getByText("Saved", { exact: true })).toHaveCount(0);
});

test("a toast raised in the example sits in the viewport corner and leaves the new row's actions reachable", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await go(page, "Apps");
  const demo = page.locator("#demo").getByLabel("Interactive admin dashboard demo in the hero");

  await demo.getByRole("button", { name: "Add app" }).click();
  await page.getByRole("dialog").getByLabel("Name").fill("toast-corner");
  await page.getByRole("button", { name: "Create app" }).click();
  await expect(page.getByText("App added")).toBeVisible();
  // The drawer's own overlay has to be gone, or it would be what the pointer hits.
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.locator("[data-slot='drawer-overlay'], [data-slot='dialog-overlay']")).toHaveCount(0);
  await page.locator("button[aria-label='Edit toast-corner']").evaluate((node) => node.scrollIntoView({ block: "center" }));

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

test("on load the lead rises block by block and the window assembles, then everything settles in place", async ({ page }) => {
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
  await expect(windowOf(page)).toBeVisible();
  // The window, its sidebar entries and the stat cards each have an entrance of their own...
  const entrances = await page.evaluate(() => {
    const name = (selector: string) => getComputedStyle(document.querySelector(selector)!).animationName;
    return [
      name("[data-hero-window]"),
      name("[data-hero-nav-item]"),
      name("[data-hero-page='overview'] [data-hero-block]"),
      name("[data-hero-bar]"),
    ];
  });
  expect(entrances).toEqual(["zk-home-window-in", "zk-home-slide", "zk-home-rise", "zk-home-grow"]);

  // ...and when they are done nothing is left applied: no transform on the window (it would become the containing block of a toast).
  await expect
    .poll(() =>
      page.evaluate(() => {
        const settled = (selector: string) => {
          const style = getComputedStyle(document.querySelector(selector)!);
          return `${style.opacity} ${style.transform}`;
        };
        return [
          ...[...document.querySelectorAll("[data-home-hero-lead] > *")].map((block) => {
            const style = getComputedStyle(block);
            return `${style.opacity} ${style.transform}`;
          }),
          settled("[data-hero-window]"),
          settled("[data-hero-page='overview'] [data-hero-block]"),
        ];
      }),
    )
    .toEqual(Array(5).fill("1 none"));
});

test("a guided cursor tours the pages by itself, and stops for good the moment the visitor touches the example", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  const current = () => nav(page).locator("[aria-current='page']").innerText();

  await expect(windowOf(page)).toHaveAttribute("data-tour", "on", { timeout: 8000 });
  await expect(page.locator("#demo [data-hero-cursor]")).toBeVisible();
  // Nobody touched anything, and the example moves on to its second page by itself, using the real sidebar entry.
  await expect.poll(current, { timeout: 12000 }).toBe("Apps");

  // The visitor presses inside the frame: the tour ends and the page stays where they put it.
  await go(page, "Settings");
  await expect(windowOf(page)).toHaveAttribute("data-tour", "off");
  await page.waitForTimeout(7000);
  expect(await current()).toBe("Settings");
  await expect(page.locator("#demo [data-hero-cursor]")).toHaveCSS("opacity", "0");
});

test("the guided tour waits while the example is off screen", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(5500);
  await expect(windowOf(page)).not.toHaveAttribute("data-tour", /.+/);
  await expect(nav(page).locator("[aria-current='page']")).toHaveText("Overview");
});

test("the cards over the window's edge follow the pointer, and are out of reach of keyboard and screen readers", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  const satellite = page.locator("#demo [data-hero-satellite]").first();
  await expect(page.locator("#demo [data-hero-satellite]")).toHaveCount(2);
  await expect(satellite).toHaveAttribute("aria-hidden", "true");
  expect(await satellite.evaluate((node) => node.hasAttribute("inert"))).toBe(true);
  expect(await satellite.evaluate((node) => node.querySelectorAll("a, button, input, [tabindex]").length)).toBe(0);

  const frame = (await page.locator("#demo").boundingBox())!;
  const px = () => page.locator("#demo").evaluate((node) => Number.parseFloat(node.style.getPropertyValue("--zk-px") || "0"));
  await page.mouse.move(frame.x + frame.width - 4, frame.y + 4, { steps: 4 });
  await expect.poll(px).toBeGreaterThan(0.9);
  await page.mouse.move(frame.x + 4, frame.y + frame.height - 4, { steps: 4 });
  await expect.poll(px).toBeLessThan(-0.9);
  await page.mouse.move(0, 0);
  await expect.poll(px).toBe(0);
});

test("reduced motion: nothing in the hero animates, nothing tours, and the numbers are the final ones", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(3500);
  const animated = await page.evaluate(() =>
    document
      .getAnimations()
      .filter((animation) => document.querySelector("[data-home-hero-band]")?.contains((animation.effect as KeyframeEffect | null)?.target ?? null))
      .map((animation) => animation.constructor.name),
  );
  expect(animated).toEqual([]);
  await expect(windowOf(page)).not.toHaveAttribute("data-tour", /.+/);
  await expect(section(page, "overview").locator("[data-beat='1'] span[aria-hidden='true']")).toHaveText("10");
  await expect(nav(page).locator("[aria-current='page']")).toHaveText("Overview");
  await expect(nav(page).getByRole("button")).toHaveCount(5);
});

for (const width of [320, 360, 390]) {
  test(`${width}px: the pages and the example fit the screen, nothing scrolls sideways`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(BASE, { waitUntil: "networkidle" });
    const fit = await page.evaluate(() => {
      const bar = document.querySelector<HTMLElement>("#demo nav.md\\:hidden")!;
      const chips = [...bar.querySelectorAll<HTMLElement>("button")];
      const frame = document.querySelector("[data-home-hero-preview]")!.getBoundingClientRect();
      return {
        chipHeight: Math.min(...chips.map((chip) => chip.getBoundingClientRect().height)),
        frameInside: frame.left >= 0 && frame.right <= document.documentElement.clientWidth,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        satellites: [...document.querySelectorAll("[data-hero-satellite]")].every((node) => getComputedStyle(node).display === "none"),
      };
    });
    expect(fit.chipHeight, "page chip height (px) reaches a comfortable target").toBeGreaterThanOrEqual(44);
    expect(fit.frameInside).toBe(true);
    expect(fit.overflow).toBeLessThanOrEqual(1);
    expect(fit.satellites, "the decorative cards stay off the phone").toBe(true);

    for (const name of PAGES) {
      await go(page, name);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${width}px ${name}`).toBeLessThanOrEqual(1);
    }
    await go(page, "Apps");
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
