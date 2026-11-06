import { expect, test } from "@playwright/test";

const PROMPT = "Set up zedkit AI on this repo following https://zedkit.app/ai/setup.md";

test.describe("home AI setup section", () => {
  test.use({
    permissions: ["clipboard-read", "clipboard-write"],
  });

  test("sits right after the hero, copies the prompt, links the guide", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });

    const aiSetup = page.locator("#ai-setup");
    await expect(aiSetup).toBeVisible();
    await expect(aiSetup.getByRole("heading", { level: 2, name: "One prompt, and your agent knows your repo" })).toBeVisible();
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
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Your AI agent, set up with one prompt");
  });

  test("the guide route exists", async ({ page }) => {
    const response = await page.goto("/docs/ai/setup", { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Set up zedkit AI in");
    await expect(page.locator("h1 [data-slot='word-roll']")).toBeVisible();
    await expect(page.getByText("Give your coding agent one prompt to set up ZedKit AI in your project.")).toBeVisible();
    await expect(page.locator("[data-slot='text'] p")).toHaveCount(0);
  });

  test("the guide H1 keeps the same tree under reduced motion (no cycling)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/docs/ai/setup", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1, name: "Set up zedkit AI in Cursor, Muse, Claude, or your choice" })).toBeVisible();
    await expect(page.locator("h1 [data-word-roll='in']")).toHaveText("Cursor");
    await expect(page.locator("h1 [data-animate]")).toHaveCount(0);
  });

  test("terminal region is keyboard reachable and wide screens show it beside the prompt", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    const terminal = page.locator("#ai-setup").getByRole("region", { name: "Files the AI setup creates" });
    await terminal.focus();
    await expect(terminal).toBeFocused();
    const prompt = await page.locator("#ai-setup textarea").boundingBox();
    const tree = await terminal.boundingBox();
    expect(prompt && tree).toBeTruthy();
    expect(tree!.x).toBeGreaterThan(prompt!.x + prompt!.width);
  });

  test("no skill or subagent counters; the benefits name what the setup does", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    const text = await page.locator("#ai-setup").innerText();
    expect(text).not.toMatch(/\b\d+\s+(skills?|subagents?|agents?|commands?)\b/i);
    for (const title of ["Thin orchestration", "Clear roles", "Business rules from your code", "Skills tailored to your repo"]) {
      await expect(page.locator("#ai-setup").getByRole("heading", { level: 4, name: title })).toBeVisible();
    }
  });

  test("the shorter column stays in view while the longer one scrolls (StickyAside)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    const aside = page.locator("#ai-setup [data-sticky-aside-aside]");
    const main = page.locator("#ai-setup [data-sticky-aside-main]");
    const heights = await Promise.all([aside.boundingBox(), main.boundingBox()]);
    expect(heights[0]!.height).toBeLessThan(heights[1]!.height);
    await expect(aside).toHaveCSS("position", "sticky");
    await main.evaluate((node) => window.scrollTo({ top: node.getBoundingClientRect().top + window.scrollY + 100, behavior: "instant" }));
    await page.waitForTimeout(700);
    const first = (await aside.boundingBox())!.y;
    await page.evaluate(() => window.scrollBy({ top: 150, behavior: "instant" }));
    await page.waitForTimeout(300);
    const second = (await aside.boundingBox())!.y;
    expect(Math.abs(second - first)).toBeLessThan(2);
    expect(first).toBeLessThan(120);
  });

  test("the entrance uses the kit animate layer", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator("#ai-setup [data-animate-stagger]")).toHaveAttribute("data-animate", "fade-up");
    await expect(page.locator("#ai-setup [data-slot='animate']")).toHaveAttribute("data-animate", "fade-in");
  });

  test("under reduced motion nothing waits for an entrance", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    await page.locator("#ai-setup").scrollIntoViewIfNeeded();
    const pending = await page.locator("#ai-setup [data-animate-state='pending']").count();
    expect(pending).toBe(0);
    await expect(page.locator("#ai-setup [data-slot='animate']")).toHaveCSS("opacity", "1");
  });
});
