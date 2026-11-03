import { expect, test, type Page, type Route } from "@playwright/test";

const BASE = "http://127.0.0.1:3100";
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
  light: { background: "30 40% 96%", foreground: "20 20% 12%", primary: "14 55% 34%", primaryForeground: "30 40% 96%", accent: "14 45% 42%", border: "25 20% 52%", mutedForeground: "20 12% 32%" },
  dark: { background: "20 18% 8%", foreground: "30 35% 92%", primary: "20 70% 68%", primaryForeground: "20 18% 8%", accent: "20 30% 45%", border: "20 15% 40%", mutedForeground: "30 15% 70%" },
  shadowSm: "0 1px 2px hsl(20 20% 12% / 0.08)",
  shadowMd: "0 6px 16px -8px hsl(20 20% 12% / 0.2)",
};

function ok(posted: { requestId: string }) {
  return {
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      requestId: posted.requestId,
      summary: "Warmer shop counter.",
      changed: ["radius"],
      tokens: WARM,
      references: [],
    }),
  };
}

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

  test("brief and expanded state survive navigation between routes", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    await dock(page).locator("[data-slot='identity-dock-trigger']").click();
    await dock(page).locator("#identity-assistant-brief").fill("A calm SaaS dashboard");
    await page.goto(`${BASE}/docs`, { waitUntil: "networkidle" });
    await expect(page.locator("[data-slot='identity-dock-panel'][data-state='open']")).toBeVisible();
    await expect(dock(page).locator("#identity-assistant-brief")).toHaveValue("A calm SaaS dashboard");
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
    await dock(page).locator("[data-slot='identity-dock-trigger']").click();
    await dock(page).locator("#identity-assistant-brief").fill("A ceramics shop");
    await page.locator("[data-slot='identity-dock-panel']").getByRole("button", { name: "Generate" }).click();
    const message = page.locator("[data-slot='identity-dock-panel'] [data-assistant-status]");
    await expect(message).not.toBeEmpty();
    await expect(message).toBeInViewport();
    const panel = page.locator("[data-slot='identity-dock-panel']");
    const box = await message.boundingBox();
    const panelBox = await panel.boundingBox();
    expect(box).toBeTruthy();
    expect(panelBox).toBeTruthy();
    expect(box!.y).toBeGreaterThanOrEqual(panelBox!.y);
    expect(box!.y + box!.height).toBeLessThanOrEqual(panelBox!.y + panelBox!.height + 1);
  });
});
