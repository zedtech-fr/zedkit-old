import { expect, test } from "@playwright/test";

import { assertAxeOnMain, assertNoHorizontalOverflow } from "./site-audit-helpers";

const PAGE =
  "http://127.0.0.1:3100/docs/ai/set-up-ai-agent-instructions-skills-subagents-and-commands-in-a-repo";

test.describe("agents table icons (#428)", () => {
  test("each agent row shows a decorative icon without horizontal overflow", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Agents", level: 2 })).toBeVisible();

    const agentsTable = page.getByRole("table").filter({ has: page.getByRole("columnheader", { name: "Agent" }) });
    await expect(agentsTable).toBeVisible();
    const icons = agentsTable.locator("svg[aria-hidden='true']");
    await expect(icons).toHaveCount(18);

    for (const width of [360, 390] as const) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(PAGE, { waitUntil: "networkidle" });
      const scrollOk = await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      );
      expect(scrollOk).toBe(true);
    }

    await assertNoHorizontalOverflow(page);
    await assertAxeOnMain(page);

    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await expect(agentsTable.locator("svg[aria-hidden='true']")).toHaveCount(18);
  });
});

test.describe("AI command and lens lists (#762)", () => {
  test("each name keeps a decorative icon without overflow at phone width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await expect(page.locator("[data-kit-names='command'] svg[aria-hidden='true']")).toHaveCount(10);
    await expect(page.locator("[data-kit-names='lens'] svg[aria-hidden='true']")).toHaveCount(17);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    );
    expect(overflow).toBe(true);
  });

  for (const mode of ["light", "dark"] as const) {
    test(`mist ${mode}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.addInitScript((theme) => {
        localStorage.setItem("zk-docs-site-identity", "mist");
        localStorage.setItem("zk-docs-site-identity-opt-in", "1");
        localStorage.setItem("theme", theme);
      }, mode);
      await page.goto(PAGE, { waitUntil: "networkidle" });
      const commands = page.locator("[data-kit-names='command']");
      const lenses = page.locator("[data-kit-names='lens']").first();
      await commands.scrollIntoViewIfNeeded();
      await expect(commands.getByText("review", { exact: true })).toBeVisible();
      await commands.screenshot({ path: `test-results/ai-commands-${mode}.png` });
      await page.locator("#review-lenses").scrollIntoViewIfNeeded();
      await expect(lenses.getByText("ponytail", { exact: true })).toBeVisible();
      await page.locator("#review-lenses").locator("xpath=following-sibling::p[1]").screenshot({
        path: `test-results/ai-lenses-${mode}.png`,
      });
    });
  }
});
