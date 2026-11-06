import { expect, test, type Page } from "@playwright/test";
import { DEFAULT_IDENTITY, HERO_TOUR_LOOK as TOUR_LOOK } from "../lib/default-identity";

const PAGES = ["Overview", "Apps", "Calendar", "Team", "Settings"] as const;
type PageName = (typeof PAGES)[number];

const windowOf = (page: Page) => page.locator("#demo [data-hero-window]");
/** The sidebar entries (from md up) or the chips in the top bar (below md): whichever is on screen. */
const nav = (page: Page) => page.locator("#demo").getByRole("navigation", { name: "Pages of the example app" });
const go = (page: Page, name: PageName) => nav(page).getByRole("button", { name, exact: true }).click();
const section = (page: Page, id: string) => page.locator(`#demo [data-hero-page="${id}"]`);

test("desktop hero puts the proposition beside one working example and does not pin the page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });

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
  await page.goto("/", { waitUntil: "networkidle" });

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
  await page.goto("/", { waitUntil: "networkidle" });
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
  await page.goto("/", { waitUntil: "networkidle" });
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
  await page.goto("/", { waitUntil: "networkidle" });
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
  await page.goto("/", { waitUntil: "networkidle" });
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
  await page.goto("/", { waitUntil: "networkidle" });
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
  // Lower-right of the screen, and not covering the new row. The exact inset
  // follows the toaster, so this does not pin a pixel offset.
  expect(placed.editReachable).toBe(true);
  expect(placed.bottomGap).toBeGreaterThan(-8);
  expect(placed.bottomGap).toBeLessThan(360);
  expect(placed.rightGap).toBeGreaterThan(-8);
  expect(placed.rightGap).toBeLessThan(640);
});

test("on load the lead rises block by block and the window assembles, then everything settles in place", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "domcontentloaded" });

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

const agentPanel = (page: Page) => page.locator("#demo [data-hero-agent-panel]");
const AGENT_PROMPT = "Set up zedkit AI on this repo following https://zedkit.app/ai/setup.md";

/** The tour opens with the agent: it appears, runs and closes before any page is visited. About 10s in all. */
async function agentPlaysFirst(page: Page) {
  await expect(agentPanel(page)).toBeVisible({ timeout: 8000 });
  await expect(agentPanel(page)).toHaveCount(0, { timeout: 20_000 });
}

test("a guided cursor tours the pages by itself, and stops the moment the visitor touches the example", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  const current = () => nav(page).locator("[aria-current='page']").innerText();

  // The cursor sets off while the first page is still assembling: nothing waits on screen for seconds.
  await expect(windowOf(page)).toHaveAttribute("data-tour", "on", { timeout: 2500 });
  await expect(page.locator("#demo [data-hero-cursor]")).toBeVisible();
  // The one prompt comes first, on Overview; only then does the example move to its second page by itself.
  await agentPlaysFirst(page);
  expect(await current()).toBe("Overview");
  await expect.poll(current, { timeout: 8000 }).toBe("Apps");
  // On the table it sorts by name: every row moves, and nothing opens over the page.
  const firstRow = () => section(page, "apps").locator("tbody tr").first().innerText();
  await expect.poll(firstRow, { timeout: 4000 }).toContain("billing");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // The visitor presses inside the frame: the tour ends and the page stays where they put it.
  await go(page, "Settings");
  await expect(windowOf(page)).toHaveAttribute("data-tour", "off");
  await page.waitForTimeout(7000);
  expect(await current()).toBe("Settings");
  await expect(page.locator("#demo [data-hero-cursor]")).toHaveCSS("opacity", "0");
});

test("the tour starts with the Agent panel: it pastes the one prompt, runs the scripted phases, closes, then tours the pages", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const requests: string[] = [];
  await page.goto("/", { waitUntil: "networkidle" });
  page.on("request", (request) => requests.push(request.url()));
  await expect(windowOf(page)).toHaveAttribute("data-tour", "on", { timeout: 2500 });

  // Before any page change, within the first seconds: the panel, the prompt, the run.
  await expect(agentPanel(page)).toBeVisible({ timeout: 8000 });
  await expect(nav(page).locator("[aria-current='page']")).toHaveText("Overview");
  await expect(agentPanel(page).getByRole("textbox", { name: "Message to the agent" })).toHaveValue(AGENT_PROMPT);
  await expect(agentPanel(page)).toHaveAttribute("data-status", "running", { timeout: 6000 });
  await expect(agentPanel(page).locator("[data-phase='read']")).toHaveAttribute("data-state", "running");
  await expect(agentPanel(page)).toHaveAttribute("data-status", "done", { timeout: 12_000 });
  await expect(agentPanel(page).locator("li[data-state='done']")).toHaveCount(4);
  await expect(agentPanel(page)).toContainText("UTC midnight");
  await expect(windowOf(page)).toHaveAttribute("data-tour", "on");
  // The run is scripted: nothing was fetched while it played (the panel's own chunk was loaded ahead of it).
  expect(requests.filter((url) => !/\/_next\/static\//.test(url) && !url.startsWith("data:"))).toEqual([]);

  // Then the panel closes and the tour carries on with the pages, without opening the panel again.
  await expect(agentPanel(page)).toHaveCount(0, { timeout: 8000 });
  await expect.poll(() => nav(page).locator("[aria-current='page']").innerText(), { timeout: 10_000 }).toBe("Apps");
  await expect(agentPanel(page)).toHaveCount(0);
});

test("the Agent button opens the panel with the prompt in place, one tap runs it, and using it ends the tour", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  const open = page.locator("#demo").getByRole("button", { name: "Agent", exact: true });
  await open.click();
  await expect(windowOf(page)).toHaveAttribute("data-tour", "off");
  await expect(open).toHaveAttribute("aria-expanded", "true");
  await expect(agentPanel(page).getByRole("textbox", { name: "Message to the agent" })).toHaveValue(AGENT_PROMPT);
  const send = agentPanel(page).getByRole("button", { name: "Send to the agent" });
  await expect(send).toBeEnabled();
  await send.click();
  await expect(agentPanel(page)).toHaveAttribute("data-status", "done", { timeout: 12_000 });
  await agentPanel(page).getByRole("button", { name: "Close agent" }).click();
  await expect(agentPanel(page)).toHaveCount(0);
  await expect(open).toHaveAttribute("aria-expanded", "false");
});

test("what the visitor typed in the Agent panel is kept when it is opened again", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "networkidle" });
  const open = page.locator("#demo").getByRole("button", { name: "Agent", exact: true });
  await open.click();
  const field = agentPanel(page).getByRole("textbox", { name: "Message to the agent" });
  await field.fill("Another prompt");
  await agentPanel(page).getByRole("button", { name: "Close agent" }).click();
  await open.click();
  await expect(field).toHaveValue("Another prompt");
});

test("the tour also changes the look in the Display row, and a look the visitor leaves in place stays", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  const select = page.locator("#demo [data-hero-look-select]");
  const scope = page.locator("#demo [data-home-hero-visuals]");
  const before = await scope.getAttribute("data-identity");
  const label = (id: string) => id.charAt(0).toUpperCase() + id.slice(1);
  await expect(select).toHaveText(label(DEFAULT_IDENTITY));

  // Nobody touches anything: the cursor presses the select and the whole example, cards included, changes look.
  await expect(select).toHaveText(label(TOUR_LOOK), { timeout: 40_000 });
  await expect(scope).toHaveAttribute("data-identity", TOUR_LOOK);
  expect(before).not.toBe(TOUR_LOOK);
  // The site around the example keeps its own look.
  expect(await page.locator("html").getAttribute("data-identity")).toBe(before);

  // The visitor presses a page entry: the tour ends and the look stays as it was.
  await go(page, "Team");
  await expect(windowOf(page)).toHaveAttribute("data-tour", "off");
  await page.waitForTimeout(6000);
  await expect(select).toHaveText(label(TOUR_LOOK));
  await expect(scope).toHaveAttribute("data-identity", TOUR_LOOK);
});

const tourControl = (page: Page) => page.locator("#demo").getByRole("button", { name: /^(Pause|Play) tour$/ });

test("the tour has a visible Pause control; paused it stays put, and Play starts again from the first page", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  const current = () => nav(page).locator("[aria-current='page']").innerText();

  await expect(windowOf(page)).toHaveAttribute("data-tour", "on", { timeout: 2500 });
  await expect(tourControl(page)).toHaveText("Pause tour");
  await agentPlaysFirst(page);
  await expect.poll(current, { timeout: 8000 }).toBe("Apps");

  // Pausing is not taking over: the label flips and the cursor stops, with the example where it was.
  await tourControl(page).click();
  await expect(tourControl(page)).toHaveText("Play tour");
  await expect(windowOf(page)).toHaveAttribute("data-tour", "off");
  const parked = await current();
  await page.waitForTimeout(6000);
  expect(await current()).toBe(parked);

  // Play is deliberate. The tour begins again with the agent on Overview and goes on from there.
  await tourControl(page).click();
  await expect(tourControl(page)).toHaveText("Pause tour");
  await expect(windowOf(page)).toHaveAttribute("data-tour", "on");
  // ...with the one prompt again, then the pages.
  await agentPlaysFirst(page);
  await expect.poll(current, { timeout: 8000 }).toBe("Apps");
});

test("touching the example takes it over, and the tour never restarts by itself", async ({ page }) => {
  test.setTimeout(45_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  const current = () => nav(page).locator("[aria-current='page']").innerText();
  await expect(windowOf(page)).toHaveAttribute("data-tour", "on", { timeout: 2500 });
  await go(page, "Calendar");
  await expect(tourControl(page)).toHaveText("Play tour");
  await expect(windowOf(page)).toHaveAttribute("data-tour", "off");
  await page.waitForTimeout(8000);
  expect(await current()).toBe("Calendar");
  await expect(windowOf(page)).toHaveAttribute("data-tour", "off");
  // Leaving the page and coming back is not a reason to restart either.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(3000);
  expect(await current()).toBe("Calendar");
});

test("the tour control can be used from the keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(windowOf(page)).toHaveAttribute("data-tour", "on", { timeout: 2500 });
  await tourControl(page).focus();
  await page.keyboard.press("Enter");
  await expect(tourControl(page)).toHaveText("Play tour");
  await expect(tourControl(page)).toBeFocused();
  await page.keyboard.press("Space");
  await expect(tourControl(page)).toHaveText("Pause tour");
  await expect(windowOf(page)).toHaveAttribute("data-tour", "on");
});

test("with no tour to control (reduced motion, a phone), there is no tour button", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(tourControl(page)).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 390, height: 800 });
  await page.reload({ waitUntil: "networkidle" });
  await expect(tourControl(page)).toHaveCount(0);
});

test("the guided tour waits while the example is off screen and carries on when it is back", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  const current = () => nav(page).locator("[aria-current='page']").innerText();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(900); // a step already under way may finish
  const parked = await current();
  await page.waitForTimeout(5000);
  expect(await current()).toBe(parked);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(current, { timeout: 30_000 }).not.toBe(parked);
});

test("the cards over the window's edge follow the pointer, and are out of reach of keyboard and screen readers", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
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
  await page.goto("/", { waitUntil: "networkidle" });
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
    await page.goto("/", { waitUntil: "networkidle" });
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

test("390px: the Display controls share one row, none stranded alone, on every page", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "networkidle" });
  for (const name of ["Overview", "Apps"] as const) {
    await go(page, name);
    const rects = await page.locator("[data-hero-demo-display] [role='combobox']").evaluateAll((nodes) =>
      nodes.map((node) => {
        const box = node.getBoundingClientRect();
        return { top: Math.round(box.top), width: Math.round(box.width), right: Math.round(box.right) };
      }),
    );
    expect(rects.length, `${name}: identity and mode, plus the table state on Apps`).toBe(name === "Apps" ? 3 : 2);
    expect(new Set(rects.map((rect) => rect.top)).size, `${name}: one row`).toBe(1);
    for (const rect of rects) {
      expect(rect.width).toBeGreaterThanOrEqual(100);
      expect(rect.right).toBeLessThanOrEqual(390);
    }
  }
});

for (const width of [1024, 1100]) {
  test(`${width}px: the frame is the same height on every page, because the Pause button never wraps the footer`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/", { waitUntil: "networkidle" });
    const preview = page.locator("[data-home-hero-preview]");
    const heights = new Set<number>();
    for (const name of ["Overview", "Apps", "Calendar", "Team", "Settings"] as const) {
      await go(page, name);
      heights.add(Math.round((await preview.boundingBox())!.height));
    }
    expect(Math.max(...heights) - Math.min(...heights), `heights ${[...heights].join(", ")}`).toBeLessThanOrEqual(1);
    // The words are gone from the screen, not from the control: it is still named, and it still works.
    // (Choosing a page is a takeover, so by now the control offers to play again.)
    const control = page.locator("#demo").getByRole("button", { name: /(pause|play) tour/i });
    await expect(control).toBeVisible();
    await expect(control).toHaveAttribute("title", /(pause|play) tour/i);
  });
}

test("glass has colour behind the window, and the cards over its edge really blur it once they have settled", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  const shapes = page.locator("[data-home-hero-band] [data-hero-shapes]");
  await expect(shapes).toHaveAttribute("aria-hidden", "true");
  await expect(shapes).toBeVisible();
  const painted = await shapes.locator("> span").evaluateAll((nodes) =>
    nodes.filter((node) => getComputedStyle(node).display !== "none").map((node) => getComputedStyle(node).backgroundColor),
  );
  expect(painted).toHaveLength(3);
  for (const colour of painted) expect(colour).not.toBe("rgba(0, 0, 0, 0)");

  // After the entrance: the card blurs what is behind it, and nothing above it is a backdrop root that would stop that
  // (a running or leftover opacity, filter or mask on an ancestor).
  await page.waitForTimeout(2500);
  const state = await page.evaluate(() => {
    const card = document.querySelector("[data-hero-notice]")!;
    const blur = getComputedStyle(card).backdropFilter;
    const roots: string[] = [];
    for (let node = card.parentElement; node && node !== document.documentElement; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (Number(style.opacity) < 1 || (style.filter !== "none" && style.filter !== "") || style.maskImage !== "none") {
        roots.push(`${node.tagName}.${node.className}`);
      }
    }
    return { blur, roots };
  });
  expect(state.blur).toMatch(/blur\(.+\).*saturate\(.+\).*brightness\(.+\)/);
  expect(state.roots).toEqual([]);

  // Another look on the page: no shapes, no change to the page.
  await page.evaluate(() => document.documentElement.setAttribute("data-identity", "mist"));
  await expect(shapes).toBeHidden();
});

for (const width of [320, 390, 768, 1440]) {
  test(`${width}px: the colour behind the window does not widen the page`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}
