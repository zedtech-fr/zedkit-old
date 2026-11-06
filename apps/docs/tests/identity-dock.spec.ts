import { expect, test, type Page, type Route } from "@playwright/test";

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
    await page.goto("/", { waitUntil: "networkidle" });
    await page.locator("#identities").scrollIntoViewIfNeeded();
    await page.getByRole("link", { name: "Try the demo editor" }).click();
    await page.waitForURL("**/features/identity-editor#create");
    await expect(page.locator("[data-slot='identity-assistant']")).toHaveCount(0);
    await expect(brief(page)).toBeVisible();
    await expect(page.getByTestId("identity-dock")).toBeVisible();
  });

  test("brief persists across reload in zk-identity-dock-v2", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(dock(page)).toBeVisible();
    await page.keyboard.press("Control+I");
    await brief(page).fill("Persist after reload");
    await page.reload({ waitUntil: "networkidle" });
    await expect(dock(page)).toBeVisible();
    await page.keyboard.press("Control+I");
    await expect(brief(page)).toHaveValue("Persist after reload");
    const stored = await page.evaluate(() => window.localStorage.getItem("zk-identity-dock-v2"));
    expect(stored).toContain("Persist after reload");
  });

  test("accepted preview tokens persist across reload", async ({ page }) => {
    const proposed = {
      spacing: "0.25rem",
      borderWidth: "1px",
      radius: "0.875rem",
      bodyLeading: "1.55",
      headingLeading: "1.1",
      headingTracking: "-0.02em",
      labelTracking: "0.025em",
      fontSans: '"Inter Variable", Inter, "Inter Variable Fallback", ui-sans-serif, system-ui, sans-serif',
      fontDisplay: '"Inter Variable", Inter, "Inter Variable Fallback", ui-sans-serif, system-ui, sans-serif',
      light: { background: "0 0% 100%", foreground: "240 10% 3.9%", primary: "240 5.9% 10%", primaryForeground: "0 0% 98%", accent: "240 4.8% 59.9%", border: "240 5.9% 60%", mutedForeground: "240 5% 32%" },
      dark: { background: "240 10% 3.9%", foreground: "0 0% 98%", primary: "0 0% 98%", primaryForeground: "240 5.9% 10%", accent: "240 3.7% 37.9%", border: "240 3.7% 37.9%", mutedForeground: "240 5% 64.9%" },
      shadowSm: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
      shadowMd: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    };
    const posts: { current: { radius: string } }[] = [];
    await page.route(SERVICE, async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      const posted = route.request().postDataJSON() as { requestId: string; prompt: string; current: { radius: string } };
      posts.push(posted);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: { requestId: posted.requestId, summary: "Rounder.", changed: ["radius"], references: [], tokens: proposed },
      });
    });
    await page.route(`${SERVICE}/status`, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ available: true }) }),
    );
    await page.goto("/", { waitUntil: "networkidle" });
    await page.keyboard.press("Control+I");
    await brief(page).fill("A ceramics studio");
    // No thread yet: the send control reads Generate, never Refine.
    await expect(page.getByRole("button", { name: "Refine", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Generate", exact: true }).click();
    await expect(page.locator("[data-assistant-proposal]")).toBeVisible();
    await page.getByRole("button", { name: "Use this look" }).click();
    await page.reload({ waitUntil: "networkidle" });
    const stored = await page.evaluate(() => {
      const raw = window.localStorage.getItem("zk-identity-dock-v2");
      return raw ? (JSON.parse(raw) as { previewTokens?: { radius: string } }).previewTokens?.radius : null;
    });
    expect(stored).toBe("0.875rem");
    const specimenRadius = await page.evaluate(() =>
      getComputedStyle(document.querySelector("[data-demo-specimen]")!).getPropertyValue("--radius").trim(),
    );
    expect(specimenRadius).toBe("0.875rem");
    await page.keyboard.press("Control+I");
    await brief(page).fill("A bit calmer");
    // Once a look was accepted a thread exists, so the same control switches to Refine.
    await expect(page.getByRole("button", { name: "Generate", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Refine", exact: true }).click();
    await expect.poll(() => posts.length).toBe(2);
    expect(posts[1]!.current.radius).toBe("0.875rem");
  });

  test("accepted newsroom preview keeps the editorial specimen after reload", async ({ page }) => {
    const proposed = {
      spacing: "0.25rem",
      borderWidth: "1px",
      radius: "0.875rem",
      bodyLeading: "1.55",
      headingLeading: "1.1",
      headingTracking: "-0.02em",
      labelTracking: "0.025em",
      fontSans: '"Inter Variable", Inter, "Inter Variable Fallback", ui-sans-serif, system-ui, sans-serif',
      fontDisplay: '"Inter Variable", Inter, "Inter Variable Fallback", ui-sans-serif, system-ui, sans-serif',
      light: { background: "0 0% 100%", foreground: "240 10% 3.9%", primary: "240 5.9% 10%", primaryForeground: "0 0% 98%", accent: "240 4.8% 59.9%", border: "240 5.9% 60%", mutedForeground: "240 5% 32%" },
      dark: { background: "240 10% 3.9%", foreground: "0 0% 98%", primary: "0 0% 98%", primaryForeground: "240 5.9% 10%", accent: "240 3.7% 37.9%", border: "240 3.7% 37.9%", mutedForeground: "240 5% 64.9%" },
      shadowSm: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
      shadowMd: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    };
    await page.route(SERVICE, async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      const posted = route.request().postDataJSON() as { requestId: string };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: { requestId: posted.requestId, summary: "Editorial.", changed: ["radius"], references: [], tokens: proposed },
      });
    });
    await page.route(`${SERVICE}/status`, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ available: true }) }),
    );
    await page.goto("/", { waitUntil: "networkidle" });
    await page.keyboard.press("Control+I");
    await brief(page).fill("I run a daily newspaper");
    await page.getByRole("button", { name: "Generate", exact: true }).click();
    await expect(page.locator("[data-assistant-proposal] [data-specimen-domain=editorial]").first()).toBeVisible();
    await expect(page.locator("[data-assistant-proposal]")).toContainText("North Ledger");
    await page.getByRole("button", { name: "Use this look" }).click();
    await page.getByRole("button", { name: "Preview" }).click();
    await expect(page.locator("[data-assistant-pane=preview] [data-specimen-domain=editorial]").first()).toBeVisible();
    await expect(page.locator("[data-assistant-pane=preview]")).toContainText("North Ledger");
    const stored = await page.evaluate(() => {
      const raw = window.localStorage.getItem("zk-identity-dock-v2");
      return raw ? (JSON.parse(raw) as { previewDomain?: string }).previewDomain : null;
    });
    expect(stored).toBe("editorial");
    await page.reload({ waitUntil: "networkidle" });
    await page.keyboard.press("Control+I");
    await page.getByRole("button", { name: "Preview" }).click();
    await expect(page.locator("[data-assistant-pane=preview] [data-specimen-domain=editorial]").first()).toBeVisible();
    await expect(page.locator("[data-assistant-pane=preview]")).toContainText("North Ledger");
  });

  test("after accepting a look, export rows copy install, CSS, and AI prompt", async ({ page, context }) => {
    const proposed = {
      spacing: "0.25rem",
      borderWidth: "1px",
      radius: "0.875rem",
      bodyLeading: "1.55",
      headingLeading: "1.1",
      headingTracking: "-0.02em",
      labelTracking: "0.025em",
      fontSans: '"Inter Variable", Inter, "Inter Variable Fallback", ui-sans-serif, system-ui, sans-serif',
      fontDisplay: '"Inter Variable", Inter, "Inter Variable Fallback", ui-sans-serif, system-ui, sans-serif',
      light: { background: "0 0% 100%", foreground: "240 10% 3.9%", primary: "240 5.9% 10%", primaryForeground: "0 0% 98%", accent: "240 4.8% 59.9%", border: "240 5.9% 60%", mutedForeground: "240 5% 32%" },
      dark: { background: "240 10% 3.9%", foreground: "0 0% 98%", primary: "0 0% 98%", primaryForeground: "240 5.9% 10%", accent: "240 3.7% 37.9%", border: "240 3.7% 37.9%", mutedForeground: "240 5% 64.9%" },
      shadowSm: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
      shadowMd: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    };
    await page.route(SERVICE, async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      const posted = route.request().postDataJSON() as { requestId: string; prompt: string };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: { requestId: posted.requestId, summary: "Rounder.", changed: ["radius"], references: [], tokens: proposed },
      });
    });
    await page.route(`${SERVICE}/status`, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ available: true }) }),
    );
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/", { waitUntil: "networkidle" });
    await page.keyboard.press("Control+I");
    await brief(page).fill("Export block check");
    await page.getByRole("button", { name: "Generate", exact: true }).click();
    await expect(page.locator("[data-assistant-proposal]")).toBeVisible();
    await page.getByRole("button", { name: "Use this look" }).click();
    const exportBlock = page.locator("[data-slot='identity-dock-export']");
    await expect(exportBlock).toBeVisible();
    await exportBlock.getByRole("button", { name: "Copy Install command" }).click();
    await expect.poll(async () => page.evaluate(() => navigator.clipboard.readText())).toBe(
      "pnpm add @zedtech/zedkit-ui @fontsource-variable/inter",
    );
    await expect(exportBlock.getByRole("status").first()).toContainText("Install command copied");
    await exportBlock.getByRole("button", { name: "Copy this CSS tokens" }).click();
    const css = await page.evaluate(() => navigator.clipboard.readText());
    expect(css).toContain(":root {");
    expect(css).toContain("0.875rem");
    await exportBlock.getByRole("button", { name: "Copy AI setup prompt" }).click();
    await expect.poll(async () => page.evaluate(() => navigator.clipboard.readText())).toContain("Set up zedkit AI");
  });

  test("brief persists when moving to another route", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await dock(page).locator("[data-slot='identity-dock-trigger']").click();
    await brief(page).fill("A calm SaaS dashboard");
    await page.goto("/docs", { waitUntil: "networkidle" });
    await dock(page).locator("[data-slot='identity-dock-trigger']").click();
    await expect(brief(page)).toHaveValue("A calm SaaS dashboard");
  });

  test("Escape and close return focus to the dock trigger", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
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

  test("the dock does not take focus when the page loads", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    const trigger = dock(page).locator("[data-slot='identity-dock-trigger']");
    await expect(trigger).toBeVisible();
    // Give the late mount effect more than the frame it would use to move focus.
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe("BODY");
  });

  test("the widget is a chat: greeting first, multiline composer with send, and no New conversation control", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    await page.keyboard.press("Control+I");
    await expect(page.locator("[data-assistant-greeting]")).toContainText("Describe your product in a few plain sentences");
    const field = brief(page);
    await expect(field).toBeVisible();
    expect(await field.evaluate((node) => node.tagName)).toBe("TEXTAREA");
    const send = page.getByRole("button", { name: "Generate", exact: true });
    await expect(send).toBeVisible();
    await expect(page.getByRole("button", { name: /new conversation/i })).toHaveCount(0);
    await expect(page.getByTestId("identity-dock-new-conversation")).toHaveCount(0);
    const panel = page.locator("[data-slot='identity-dock-panel']");
    const panelBox = (await panel.boundingBox())!;
    expect(panelBox.width).toBeLessThan(page.viewportSize()!.width * 0.75);
    await field.fill("Line one");
    await field.press("Shift+Enter");
    await field.type("Line two");
    expect(await field.inputValue()).toContain("\n");
    await expect(page.getByRole("group", { name: "Conversation or preview" })).toBeVisible();
  });

  test("the composer placeholder rotates through examples, and Enter sends", async ({ page }) => {
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
    const posts = await service(page, (posted, route) =>
      route.fulfill({ status: 200, contentType: "application/json", json: { requestId: posted.requestId, summary: "Warmer.", changed: ["radius"], references: [], tokens: WARM } }),
    );
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    await page.keyboard.press("Control+I");
    const field = brief(page);
    await expect(field).toBeVisible();
    const first = await field.getAttribute("placeholder");
    await expect.poll(async () => field.getAttribute("placeholder"), { timeout: 10_000 }).not.toBe(first);
    await field.fill("A ceramics shop");
    await field.press("Enter");
    await expect(page.locator("[data-assistant-proposal]")).toBeVisible();
    expect(posts).toHaveLength(1);
  });

  test("a garbled open request still opens the widget without touching the brief", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.keyboard.press("Control+I");
    await brief(page).fill("kept");
    await page.evaluate(() => window.dispatchEvent(new CustomEvent("zk-identity-dock-open", { detail: 42 })));
    await expect(brief(page)).toHaveValue("kept");
    await expect(page.locator("[data-slot='identity-dock-panel']")).toBeVisible();
  });

  test("390px: sheet height is adjusted with the drag handle, not text detent buttons", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "networkidle" });
    await page.keyboard.press("Control+I");
    await expect(page.locator("[data-slot='identity-dock-panel']")).toBeVisible();
    await expect(page.getByRole("button", { name: /peek height|half height|full height/i })).toHaveCount(0);
    await expect(page.locator("[data-slot='drawer-handle']")).toBeVisible();
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
    await page.goto("/", { waitUntil: "networkidle" });
    await page.keyboard.press("Control+I");
    await expect(brief(page)).toBeVisible();
    await brief(page).fill("A ceramics shop");
    await page.getByRole("button", { name: "Generate" }).click();
    const message = page.locator("[data-assistant-notice]");
    await expect(message).not.toBeEmpty();
    await expect(message).toBeInViewport();
    const box = await message.boundingBox();
    const panelBox = (await page.locator("[data-slot='identity-dock-panel']").boundingBox())!;
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
    await page.goto("/", { waitUntil: "networkidle" });
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

  test("390px: generation completes and shows a proposal", async ({ page }) => {
    const tokens = {
      spacing: "0.25rem",
      borderWidth: "1px",
      radius: "0.5rem",
      bodyLeading: "1.55",
      headingLeading: "1.1",
      headingTracking: "-0.02em",
      labelTracking: "0.025em",
      fontSans: '"Jost Variable", Jost, ui-sans-serif, system-ui, sans-serif',
      fontDisplay: "Georgia, serif",
      light: { background: "30 40% 96%", foreground: "20 20% 12%", primary: "14 55% 34%", primaryForeground: "30 40% 96%", accent: "14 45% 42%", border: "25 20% 52%", mutedForeground: "20 12% 32%" },
      dark: { background: "20 18% 8%", foreground: "30 35% 92%", primary: "20 70% 68%", primaryForeground: "20 18% 8%", accent: "20 30% 45%", border: "20 15% 40%", mutedForeground: "30 15% 70%" },
      shadowSm: "0 1px 2px hsl(20 20% 12% / 0.08)",
      shadowMd: "0 6px 16px -8px hsl(20 20% 12% / 0.2)",
    };
    await service(page, (_posted, route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        json: { requestId: _posted.requestId, summary: "Softer type and calmer contrast.", changed: ["radius"], references: [], tokens },
      }),
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "networkidle" });
    await page.keyboard.press("Control+I");
    await brief(page).fill("A calm ceramics studio");
    await page.getByRole("button", { name: "Generate" }).click();
    await expect(page.locator("[data-assistant-proposal]")).toBeVisible();
    await expect(page.getByRole("button", { name: "Use this look" })).toBeVisible();
  });

  test("Preview and Conversation show Apply to the whole site once a suggestion exists", async ({ page }) => {
    const proposed = {
      spacing: "0.25rem",
      borderWidth: "1px",
      radius: "1rem",
      bodyLeading: "1.55",
      headingLeading: "1.1",
      headingTracking: "-0.02em",
      labelTracking: "0.025em",
      fontSans: '"Inter Variable", Inter, "Inter Variable Fallback", ui-sans-serif, system-ui, sans-serif',
      fontDisplay: '"Inter Variable", Inter, "Inter Variable Fallback", ui-sans-serif, system-ui, sans-serif',
      light: {
        background: "210 40% 96%",
        foreground: "222 47% 11%",
        primary: "222 47% 11%",
        primaryForeground: "210 40% 98%",
        accent: "215 20% 45%",
        border: "214 20% 55%",
        mutedForeground: "215 16% 35%",
      },
      dark: {
        background: "222 47% 11%",
        foreground: "210 40% 98%",
        primary: "210 40% 98%",
        primaryForeground: "222 47% 11%",
        accent: "217 20% 40%",
        border: "217 20% 40%",
        mutedForeground: "215 16% 70%",
      },
      shadowSm: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
      shadowMd: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    };
    await service(page, (posted, route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          requestId: posted.requestId,
          summary: "Cooler paper.",
          changed: ["radius", "light.background"],
          references: [],
          tokens: proposed,
        },
      }),
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "networkidle" });
    await page.keyboard.press("Control+I");
    await expect(page.getByRole("button", { name: "Apply to the whole site" })).toHaveCount(0);
    await brief(page).fill("A cool SaaS dashboard");
    await page.getByRole("button", { name: "Generate", exact: true }).click();
    await expect(page.locator("[data-assistant-proposal]")).toBeVisible();
    const previewApply = page.locator("[data-assistant-proposal]").getByRole("button", { name: "Apply to the whole site" });
    await expect(previewApply).toBeVisible();
    const before = await page.locator("html").evaluate((node) => getComputedStyle(node).getPropertyValue("--background").trim());
    await previewApply.click();
    await expect.poll(() =>
      page.locator("html").evaluate((node) => getComputedStyle(node).getPropertyValue("--background").trim()),
    ).toBe("210 40% 96%");
    expect(await page.evaluate(() => localStorage.getItem("zk-docs-site-identity-opt-in"))).toBe("1");
    await page.getByRole("button", { name: "Remove from the whole site" }).click();
    await expect.poll(() =>
      page.locator("html").evaluate((node) => getComputedStyle(node).getPropertyValue("--background").trim()),
    ).toBe(before);
    expect(await page.evaluate(() => localStorage.getItem("zk-docs-site-identity-opt-in"))).toBeNull();
    await page.getByRole("button", { name: "Conversation", exact: true }).click();
    const conversationApply = page.locator("[data-slot='identity-apply-site-conversation']").getByRole("button", {
      name: "Apply to the whole site",
    });
    await expect(conversationApply).toBeVisible();
    await conversationApply.click();
    await expect.poll(() =>
      page.locator("html").evaluate((node) => getComputedStyle(node).getPropertyValue("--background").trim()),
    ).toBe("210 40% 96%");
    await page.getByRole("button", { name: "Remove from the whole site" }).click();
    await expect.poll(() =>
      page.evaluate(() => localStorage.getItem("zk-docs-site-identity-opt-in")),
    ).toBeNull();
  });
});

test.describe("IdentityDock reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the composer placeholder stays still", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.keyboard.press("Control+I");
    const field = page.locator("#identity-assistant-brief");
    await expect(field).toBeVisible();
    const first = await field.getAttribute("placeholder");
    await page.waitForTimeout(4500);
    expect(await field.getAttribute("placeholder")).toBe(first);
  });
});
