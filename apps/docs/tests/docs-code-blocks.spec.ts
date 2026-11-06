import { expect, test, type Page } from "@playwright/test";

const ROUTES = [
  "/docs",
  "/docs/getting-started",
  "/docs/ai/set-up-ai-agent-instructions-skills-subagents-and-commands-in-a-repo",
  "/docs/ui/trigger-actions-with-buttons",
] as const;

const MOBILE = { width: 390, height: 844 };

async function assertCodeBlocksHealthy(page: Page, requireBlocks: boolean) {
  const result = await page.evaluate((mustHaveBlocks) => {
    const doc = document.documentElement;
    const pageScrollOk = doc.scrollWidth <= doc.clientWidth + 1;
    const figures = Array.from(document.querySelectorAll("main figure.shiki"));
    if (figures.length === 0) {
      return { ok: !mustHaveBlocks && pageScrollOk, pageScrollOk, blockCount: 0 };
    }
    for (const figure of figures) {
      const pre = figure.querySelector("pre");
      if (!pre) return { ok: false, reason: "missing pre inside figure", pageScrollOk };
      if (!figure.querySelector("button")) {
        return { ok: false, reason: "missing copy control", pageScrollOk };
      }
      if (!figure.querySelector('[tabindex="0"]')) {
        return { ok: false, reason: "missing focusable scroll viewport", pageScrollOk };
      }
      for (const line of figure.querySelectorAll(".line")) {
        const ls = getComputedStyle(line);
        if (parseFloat(ls.borderBottomWidth) > 0) {
          return { ok: false, reason: "line has border-bottom", pageScrollOk };
        }
        const bg = ls.backgroundColor;
        const transparent =
          bg === "transparent" || bg === "rgba(0, 0, 0, 0)" || bg.endsWith(", 0)");
        if (!transparent && ls.display === "inline") {
          return { ok: false, reason: "inline line has chip background", pageScrollOk };
        }
      }
    }
    return { ok: pageScrollOk, pageScrollOk, blockCount: figures.length };
  }, requireBlocks);
  expect(result, JSON.stringify(result)).toMatchObject({ ok: true });
}

test.describe("docs code blocks (#395)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE);
  });

  for (const path of ROUTES) {
    test(`${path} renders fenced code as one block`, async ({ page }) => {
      await page.goto(path, { waitUntil: "networkidle" });
      await assertCodeBlocksHealthy(page, path !== "/docs");
    });
  }
});
