import { expect, test, type Page, type Route } from "@playwright/test";

const BASE = "http://127.0.0.1:3100";
const SERVICE = "**/api/identity/suggest";

async function service(page: Page, handler: (posted: { requestId: string; prompt: string }, route: Route) => ReturnType<Route["fulfill"]> | Promise<ReturnType<Route["fulfill"]>>) {
  const posts: { requestId: string; prompt: string }[] = [];
  await page.route(`${SERVICE}/status`, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ available: true }) }),
  );
  await page.route(SERVICE, async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }
    const posted = route.request().postDataJSON() as { requestId: string; prompt: string };
    posts.push(posted);
    await handler(posted, route);
  });
  return posts;
}

test.describe("IdentityDock", () => {
  const dock = (page: Page) => page.getByTestId("identity-dock");
  const brief = (page: Page) => page.locator("#identity-assistant-brief");

  test("Try the demo editor opens the dock on the editor with no inline assistant", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.locator("#identities").scrollIntoViewIfNeeded();
    await page.getByRole("link", { name: "Try the demo editor" }).click();
    await page.waitForURL("**/features/identity-editor#create");
    await expect(page.locator("[data-slot='identity-assistant']")).toHaveCount(0);
    await expect(brief(page)).toBeVisible();
    await expect(page.getByTestId("identity-dock")).toBeVisible();
  });

  test("brief persists across reload in zk-identity-dock-v2", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.keyboard.press("Control+I");
    await brief(page).fill("Persist after reload");
    await page.reload({ waitUntil: "networkidle" });
    await page.keyboard.press("Control+I");
    await expect(brief(page)).toHaveValue("Persist after reload");
    const stored = await page.evaluate(() => window.localStorage.getItem("zk-identity-dock-v2"));
    expect(stored).toContain("Persist after reload");
  });

  test("brief persists when moving to another route", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    await dock(page).locator("[data-slot='identity-dock-trigger']").click();
    await brief(page).fill("A calm SaaS dashboard");
    await page.goto(`${BASE}/docs`, { waitUntil: "networkidle" });
    await dock(page).locator("[data-slot='identity-dock-trigger']").click();
    await expect(brief(page)).toHaveValue("A calm SaaS dashboard");
  });

  test("Escape and close return focus to the dock trigger", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.setViewportSize({ width: 1440, height: 900 });
    const trigger = dock(page).locator("[data-slot='identity-dock-trigger']");
    await trigger.focus();
    await page.keyboard.press("Control+I");
    await expect(brief(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();

    await page.keyboard.press("Control+I");
    await expect(brief(page)).toBeVisible();
    await page.getByRole("button", { name: "Close identity assistant" }).click();
    await expect(trigger).toBeFocused();
  });

  test("Nouvelle conversation clears brief, thread, and persisted dock state", async ({ page }) => {
    await page.addInitScript((key) => {
      window.localStorage.setItem(
        key,
        JSON.stringify({
          brief: "Saved brief",
          session: {
            thread: [{ role: "user", text: "Hello" }],
            pending: null,
            proposal: null,
            notice: null,
            references: [],
          },
        }),
      );
    }, "zk-identity-dock-v2");
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.keyboard.press("Control+I");
    await expect(brief(page)).toHaveValue("Saved brief");
    await expect(page.getByText("Hello")).toBeVisible();
    await expect(page.getByRole("button", { name: "New conversation" })).toBeVisible();
    await page.getByTestId("identity-dock-new-conversation").click();
    await expect(brief(page)).toHaveValue("");
    await expect(page.getByText("Hello")).toHaveCount(0);
    const stored = await page.evaluate(() => window.localStorage.getItem("zk-identity-dock-v2"));
    expect(stored).toBeNull();
  });

  test("390px: quota feedback stays visible inside the dock panel", async ({ page }) => {
    await service(page, (_posted, route) =>
      route.fulfill({
        contentType: "application/json",
        status: 429,
        headers: { "retry-after": "1800" },
        body: JSON.stringify({ error: "quota", retryAfterSec: 1800 }),
      }),
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.keyboard.press("Control+I");
    await expect(brief(page)).toBeVisible();
    await brief(page).fill("A ceramics shop");
    await page.getByRole("button", { name: "Generate" }).click();
    const message = page.locator("[data-assistant-status]");
    await expect(message).not.toBeEmpty();
    await expect(message).toBeInViewport();
    const box = await message.boundingBox();
    const panelBox = await page.locator("[data-slot='identity-dock-panel']").boundingBox();
    expect(box).toBeTruthy();
    expect(panelBox).toBeTruthy();
    expect(box!.y).toBeGreaterThanOrEqual(panelBox!.y);
    expect(box!.y + box!.height).toBeLessThanOrEqual(panelBox!.y + panelBox!.height + 1);
  });

  test("refine chips send a follow-up and show before and after previews", async ({ page }) => {
    const WARM = {
      spacing: "0.2rem",
      borderWidth: "1px",
      radius: "0.25rem",
      bodyLeading: "1.6",
      headingLeading: "1.05",
      headingTracking: "-0.01em",
      labelTracking: "0.12em",
      fontSans: '"Jost Variable", Jost, ui-sans-serif, system-ui, sans-serif',
      fontDisplay: "Georgia, serif",
      light: { background: "30 40% 96%", foreground: "20 20% 12%", primary: "14 55% 34%", primaryForeground: "30 40% 96%", accent: "14 45% 42%", border: "25 20% 52%", mutedForeground: "20 12% 32%" },
      dark: { background: "20 18% 8%", foreground: "30 35% 92%", primary: "20 70% 68%", primaryForeground: "20 18% 8%", accent: "20 30% 45%", border: "20 15% 40%", mutedForeground: "30 15% 70%" },
      shadowSm: "0 1px 2px hsl(20 20% 12% / 0.08)",
      shadowMd: "0 6px 16px -8px hsl(20 20% 12% / 0.2)",
    };
    const posts: { requestId: string; prompt: string; history?: unknown[] }[] = [];
    await page.route(SERVICE, async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      const posted = route.request().postDataJSON() as { requestId: string; prompt: string; history?: unknown[] };
      posts.push(posted);
      const index = posts.length - 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          requestId: posted.requestId,
          summary: "Adjusted",
          changed: ["radius"],
          references: [],
          tokens: { ...WARM, radius: index === 0 ? "0.25rem" : "0.5rem" },
        },
      });
    });
    await page.route(`${SERVICE}/status`, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ available: true }) }),
    );
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.keyboard.press("Control+I");
    await brief(page).fill("A ceramics shop");
    await page.getByRole("button", { name: "Generate" }).click();
    await expect(page.locator("[data-assistant-proposal]")).toBeVisible();
    await page.getByRole("button", { name: "Use this look" }).click();
    await expect(page.getByRole("group", { name: "Quick refinements" })).toBeVisible();
    await page.getByRole("button", { name: "Calmer" }).click();
    await expect(page.locator("[data-assistant-proposal]")).toBeVisible();
    await expect(page.locator("[data-assistant-proposal-compare]")).toContainText("Before");
    await expect(page.locator("[data-assistant-proposal-compare]")).toContainText("After");
    expect(posts).toHaveLength(2);
    expect(posts[1].prompt).toMatch(/calmer/i);
  });
});
