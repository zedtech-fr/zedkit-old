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
  const panel = (page: Page) => page.locator("[data-slot='identity-dock-panel'], [data-slot='identity-dock-sheet']");
  const brief = (page: Page) => page.locator("#identity-assistant-brief");

  test("brief persists when moving to another route", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    await dock(page).locator("[data-slot='identity-dock-trigger']").click();
    await brief(page).fill("A calm SaaS dashboard");
    await page.goto(`${BASE}/docs`, { waitUntil: "networkidle" });
    await dock(page).locator("[data-slot='identity-dock-trigger']").click();
    await expect(brief(page)).toHaveValue("A calm SaaS dashboard");
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
});
