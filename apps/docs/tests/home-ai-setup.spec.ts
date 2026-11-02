import { expect, test } from "@playwright/test";

const BASE = "http://127.0.0.1:3100";
const INIT_CMD = "npx @zedtech/zedkit-ai init";

test.describe("home AI setup block (#398)", () => {
  test.use({
    permissions: ["clipboard-read", "clipboard-write"],
  });

  test("placement, clipboard, and mobile width at 390px", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(BASE, { waitUntil: "networkidle" });

    const aiSetup = page.locator("#entry-points #ai-setup");
    const components = page.locator("#components");
    await expect(aiSetup).toBeVisible();

    const aiBox = await aiSetup.boundingBox();
    const componentsBox = await components.boundingBox();
    expect(aiBox && componentsBox).toBeTruthy();
    expect(componentsBox!.y).toBeLessThan(aiBox!.y);

    await page.getByRole("button", { name: "Copy init command" }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(INIT_CMD);

    await page.getByRole("button", { name: "Copy setup-ai command" }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("/setup-ai");

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

    await expect(page.getByRole("link", { name: "Open agent setup docs" }).first()).toHaveAttribute(
      "href",
      "/docs/ai/set-up-ai-agent-instructions-skills-subagents-and-commands-in-a-repo",
    );
    await expect(page.getByRole("link", { name: "Get started" }).first()).toHaveAttribute("href", "#get-started");
  });
});
