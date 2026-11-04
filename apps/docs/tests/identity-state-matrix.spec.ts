import { expect, test, type Locator, type Page, type Route } from "@playwright/test";

const EDITOR = "/features/identity-editor";
const SERVICE = "**/api/identity/suggest";

const WARM = {
  spacing: "0.2rem",
  borderWidth: "1px",
  radius: "0.25rem",
  bodyLeading: "1.6",
  headingLeading: "1.05",
  headingTracking: "-0.01em",
  labelTracking: "0.12em",
  fontSans: '"Jost Variable", Jost, "Jost Variable Fallback", ui-sans-serif, system-ui, sans-serif',
  fontDisplay: '"Cormorant Variable", Cormorant, "Cormorant Variable Fallback", Georgia, serif',
  light: {
    background: "30 40% 96%",
    foreground: "20 20% 12%",
    primary: "14 55% 34%",
    primaryForeground: "30 40% 96%",
    accent: "14 45% 42%",
    border: "25 20% 52%",
    mutedForeground: "20 12% 32%",
  },
  dark: {
    background: "20 18% 8%",
    foreground: "30 35% 92%",
    primary: "20 70% 68%",
    primaryForeground: "20 18% 8%",
    accent: "20 30% 45%",
    border: "20 15% 40%",
    mutedForeground: "30 15% 70%",
  },
  shadowSm: "0 1px 2px hsl(20 20% 12% / 0.08)",
  shadowMd: "0 6px 16px -8px hsl(20 20% 12% / 0.2)",
};

const VIEWPORTS = [
  { name: "320", width: 320, height: 568 },
  { name: "390", width: 390, height: 844 },
  { name: "1024", width: 1024, height: 768 },
  { name: "1440", width: 1440, height: 900 },
] as const;

const DOMAINS = [
  { brief: "A ceramics shop with a cart", domain: "commerce" },
  { brief: "B2B admin dashboard with usage quotas", domain: "saas-dashboard" },
  { brief: "Independent magazine newsroom", domain: "editorial" },
  { brief: "Hair salon appointment booking", domain: "service-booking" },
] as const;

async function service(page: Page, reply: (posted: { requestId: string }, route: Route) => Promise<void> | void) {
  await page.route(`${SERVICE}/status`, (route) => route.fulfill({ status: 200, contentType: "application/json", json: { available: true } }));
  await page.route(SERVICE, async (route) => {
    const posted = route.request().postDataJSON() as { requestId: string };
    await reply(posted, route);
  });
}

const ok = (posted: { requestId: string }, tokens: unknown = WARM) => ({
  status: 200,
  contentType: "application/json",
  json: { requestId: posted.requestId, summary: "Warmer paper.", changed: ["radius"], references: [], tokens },
});

async function siteBackground(page: Page) {
  return page.locator("html").evaluate((node) => getComputedStyle(node).getPropertyValue("--background").trim());
}

/** Visible in the viewport, and not sitting under a pinned preview. */
async function onScreen(page: Page, target: Locator, height: number) {
  await target.scrollIntoViewIfNeeded();
  await expect(target).toBeVisible();
  await expect(target).toBeInViewport();
  const box = (await target.boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(height + 1);
  const pinned = page.locator("[data-slot='identity-editor-preview']");
  if ((await pinned.count()) === 0) return;
  const pin = await pinned.boundingBox();
  // Narrow layout pins the preview at the top of the column; wide layout puts it beside the form.
  if (pin && pin.y < 80 && pin.x < 16) expect(box.y + 1).toBeGreaterThanOrEqual(pin.y + pin.height);
}

async function typeBrief(page: Page, text: string) {
  const field = page.locator("#identity-assistant-brief");
  if (!(await field.isVisible())) {
    await page.keyboard.press("Control+I");
  }
  await expect(field).toBeVisible();
  await field.fill(text);
  await field.scrollIntoViewIfNeeded();
}

async function openCreatorOnEditor(page: Page) {
  await page.goto(EDITOR, { waitUntil: "networkidle" });
  const field = page.locator("#identity-assistant-brief");
  if (!(await field.isVisible())) {
    await page.keyboard.press("Control+I");
  }
  await expect(field).toBeVisible();
}

test.describe("creator state matrix", () => {
  for (const vp of VIEWPORTS) {
    test(`${vp.name}: idle, loading and success stay on screen; a proposal does not paint the site`, async ({ page }) => {
      let release: () => void = () => {};
      const gate = new Promise<void>((done) => (release = done));
      await service(page, async (posted, route) => {
        await gate;
        await route.fulfill(ok(posted));
      });
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await openCreatorOnEditor(page);
      await expect(page.locator("[data-assistant-status]")).toHaveText("");
      const before = await siteBackground(page);
      await typeBrief(page, "A ceramics shop");
      await page.getByRole("button", { name: "Generate" }).click();
      await onScreen(page, page.getByText("Working on it. Your current look is unchanged."), vp.height);
      release();
      await onScreen(page, page.locator("[data-assistant-proposal]"), vp.height);
      expect(await siteBackground(page)).toBe(before);
    });

    test(`${vp.name}: error stays on screen`, async ({ page }) => {
      await service(page, (posted, route) => route.fulfill(ok(posted, { ...WARM, radius: "0.5rem; } body { display: none" })));
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await openCreatorOnEditor(page);
      await typeBrief(page, "A ceramics shop");
      await page.getByRole("button", { name: "Generate" }).click();
      await onScreen(page, page.locator("[data-assistant-status]"), vp.height);
      await expect(page.locator("[data-assistant-status]")).toContainText("could not be used, so nothing changed");
    });

    test(`${vp.name}: quota stays on screen and is not a daily allowance`, async ({ page }) => {
      await service(page, (_posted, route) =>
        route.fulfill({
          status: 429,
          contentType: "application/json",
          headers: { "retry-after": "1800" },
          json: { error: "quota", retryAfterSec: 1800 },
        }),
      );
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await openCreatorOnEditor(page);
      await typeBrief(page, "A ceramics shop");
      await page.getByRole("button", { name: "Generate" }).click();
      const status = page.locator("[data-assistant-status]");
      await onScreen(page, status, vp.height);
      await expect(status).toContainText("The assistant limit has been reached.");
      await expect(status).toContainText("Try again in 30 minutes.");
      await expect(status).not.toContainText(/daily/i);
    });
  }

  test("resume: a saved look is still there after reload", async ({ page }) => {
    await page.goto("/features/identity-editor", { waitUntil: "networkidle" });
    await page.getByLabel("Name", { exact: true }).fill("Matrix look");
    await page.getByRole("button", { name: "Save look" }).click();
    await expect(page.getByText("Saved on this device as “Matrix look”.")).toBeVisible();
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByLabel("Look")).toContainText("Matrix look");
  });

  for (const vp of VIEWPORTS) {
    test(`${vp.name}: an unfinished brief is still there after reload`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(EDITOR, { waitUntil: "networkidle" });
      await typeBrief(page, "A ceramics shop");
      await expect.poll(() => page.evaluate(() => sessionStorage.getItem("zk-creator-session-brief"))).toBe("A ceramics shop");
      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator("#identity-assistant-brief")).toHaveValue("A ceramics shop");
    });
  }

  test("390: clearing the brief stays cleared after reload", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(EDITOR, { waitUntil: "networkidle" });
    await typeBrief(page, "A ceramics shop");
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem("zk-creator-session-brief"))).toBe("A ceramics shop");
    await page.locator("#identity-assistant-brief").fill("");
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem("zk-creator-session-brief"))).toBeNull();
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("#identity-assistant-brief")).toHaveValue("");
  });
});

test.describe("widget state matrix", () => {
  async function openDock(page: Page) {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.getByTestId("identity-dock")).toBeVisible();
    await page.keyboard.press("Control+I");
    await expect(page.locator("#identity-assistant-brief")).toBeVisible();
    return page.locator("[data-slot='identity-dock-panel']");
  }

  test("Control+I opens the panel, Escape closes it", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.getByTestId("identity-dock")).toBeVisible();
    await page.keyboard.press("Control+i");
    const panel = page.locator("[data-slot='identity-dock-panel'][data-state='open']");
    await expect(panel).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("[data-slot='identity-dock-panel'][data-state='open']")).toHaveCount(0);
    await expect(page.locator("[data-slot='identity-dock-trigger']")).toBeVisible();
  });

  test("390: the panel is a bottom sheet, not a full-screen overlay", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const panel = await openDock(page);
    await expect(panel).toBeVisible();
    const box = (await panel.boundingBox())!;
    expect(box.y).toBeGreaterThan(40);
    expect(box.y + box.height).toBeGreaterThan(844 - 24);
    expect(box.height).toBeLessThan(844);
  });

  test("320: loading and success stay inside the panel", async ({ page }) => {
    let release: () => void = () => {};
    const gate = new Promise<void>((done) => (release = done));
    await service(page, async (posted, route) => {
      await gate;
      await route.fulfill(ok(posted));
    });
    await page.setViewportSize({ width: 320, height: 568 });
    const panel = await openDock(page);
    const body = panel.locator("[data-slot='identity-dock-body']");
    await page.locator("#identity-assistant-brief").fill("A ceramics shop");
    await page.getByRole("button", { name: "Generate" }).click();
    const working = body.getByText("Working on it. Your current look is unchanged.");
    await expect(working).toBeVisible();
    const bodyBox = (await body.boundingBox())!;
    const workBox = (await working.boundingBox())!;
    expect(workBox.y).toBeGreaterThanOrEqual(bodyBox.y);
    expect(workBox.y + workBox.height).toBeLessThanOrEqual(bodyBox.y + bodyBox.height + 1);
    release();
    await expect(panel.locator("[data-assistant-proposal]")).toBeVisible();
  });

  test("using a look does not paint the site chrome", async ({ page }) => {
    await service(page, (posted, route) => route.fulfill(ok(posted)));
    await page.setViewportSize({ width: 1440, height: 900 });
    await openDock(page);
    const before = await siteBackground(page);
    await page.locator("#identity-assistant-brief").fill("A ceramics shop");
    await page.getByRole("button", { name: "Generate" }).click();
    await page.getByRole("button", { name: "Use this look" }).click();
    expect(await siteBackground(page)).toBe(before);
  });

  test("quota stays inside the panel; resume keeps the brief after reload", async ({ page }) => {
    await service(page, (_posted, route) =>
      route.fulfill({
        status: 429,
        contentType: "application/json",
        headers: { "retry-after": "1800" },
        json: { error: "quota", retryAfterSec: 1800 },
      }),
    );
    await page.setViewportSize({ width: 390, height: 844 });
    const panel = await openDock(page);
    await page.locator("#identity-assistant-brief").fill("A ceramics shop");
    await page.getByRole("button", { name: "Generate" }).click();
    const status = page.locator("[data-assistant-status]");
    await expect(status).toContainText("The assistant limit has been reached.");
    const statusBox = (await status.boundingBox())!;
    const body = panel.locator("[data-slot='identity-dock-body']");
    const bodyBox = (await body.boundingBox())!;
    expect(statusBox.y).toBeGreaterThanOrEqual(bodyBox.y);
    expect(statusBox.y + statusBox.height).toBeLessThanOrEqual(bodyBox.y + bodyBox.height + 1);

    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByTestId("identity-dock")).toBeVisible();
    if ((await page.locator("#identity-assistant-brief").count()) === 0) {
      await page.keyboard.press("Control+I");
    }
    await expect(page.locator("#identity-assistant-brief")).toHaveValue("A ceramics shop");
  });
});

test.describe("domain compositions", () => {
  for (const row of DOMAINS) {
    test(`brief “${row.brief}” shows the ${row.domain} composition`, async ({ page }) => {
      await service(page, (posted, route) => route.fulfill(ok(posted)));
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(EDITOR, { waitUntil: "networkidle" });
      await typeBrief(page, row.brief);
      await page.getByRole("button", { name: "Generate" }).click();
      await expect(page.locator(`[data-specimen-domain='${row.domain}']`)).toBeVisible();
    });
  }
});
