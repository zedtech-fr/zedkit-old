import { expect, test } from "@playwright/test";

const BASE = "http://127.0.0.1:3100";
const PROMPT = "Set up zedkit AI on this repo following https://zedkit.app/ai/setup.md";

test.describe("home AI setup section", () => {
  test.use({
    permissions: ["clipboard-read", "clipboard-write"],
  });

  test("sits right after the hero, copies the prompt, links the guide", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(BASE, { waitUntil: "networkidle" });

    const aiSetup = page.locator("#ai-setup");
    await expect(aiSetup).toBeVisible();
    await expect(aiSetup.getByRole("heading", { level: 2, name: "One prompt gets you a top-notch AI setup" })).toBeVisible();
    await expect(aiSetup.getByRole("heading", { level: 3, name: "What you get" })).toBeVisible();

    const hero = await page.locator("[data-home-hero-band]").boundingBox();
    const aiBox = await aiSetup.boundingBox();
    const identities = await page.locator("#identities").boundingBox();
    expect(hero && aiBox && identities).toBeTruthy();
    expect(aiBox!.y).toBeGreaterThan(hero!.y);
    expect(aiBox!.y).toBeLessThan(identities!.y);

    await page.getByRole("button", { name: "Copy AI setup prompt" }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(PROMPT);

    const terminal = aiSetup.getByRole("region", { name: "Files the AI setup creates" });
    await expect(terminal).toContainText("npx zedkit-ai setup --provider cursor");
    await expect(terminal).toContainText("skills/");
    await expect(terminal).toContainText("AGENTS.md");

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

    await expect(aiSetup.getByRole("link", { name: "Read the AI setup guide" })).toHaveAttribute("href", "/docs/ai/setup");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("top-notch AI setup, one prompt away");
  });

  test("the guide route exists", async ({ page }) => {
    const response = await page.goto(`${BASE}/docs/ai/setup`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Set up zedkit AI");
  });

  test("terminal region is keyboard reachable and wide screens show it beside the prompt", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE, { waitUntil: "networkidle" });
    const terminal = page.locator("#ai-setup").getByRole("region", { name: "Files the AI setup creates" });
    await terminal.focus();
    await expect(terminal).toBeFocused();
    const prompt = await page.locator("#ai-setup textarea").boundingBox();
    const tree = await terminal.boundingBox();
    expect(prompt && tree).toBeTruthy();
    expect(tree!.x).toBeGreaterThan(prompt!.x + prompt!.width);
  });
});
