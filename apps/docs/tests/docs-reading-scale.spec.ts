import { expect, test } from "@playwright/test";

import { probe } from "./identity-helpers";

/*
 * Docs reading scale: shared tokens (12 / 13 / 14px ladder). Prose body is 15px.
 * 16px applies to form controls only on narrow viewports (--zk-input-font-size).
 */
test("docs shell keeps the reading-scale floor under the default identity", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/docs/getting-started", { waitUntil: "networkidle" });
  expect(await probe(page, "font-size", "var(--text-xs)")).toBe("12px");
  expect(await probe(page, "font-size", "var(--text-sm)")).toBe("13px");
  expect(await probe(page, "font-size", "var(--text-base)")).toBe("14px");

  const prose = await page.locator("#nd-page .prose").first().evaluate((el) => getComputedStyle(el).fontSize);
  expect(prose).toBe("15px");

  const tracking = await page.locator("#nd-page h1").evaluate((el) => {
    const style = getComputedStyle(el);
    return Number.parseFloat(style.letterSpacing) / Number.parseFloat(style.fontSize);
  });
  expect(tracking).toBeGreaterThan(-0.03);
});

test("a scoped demo inside docs keeps the shared identity scale", async ({ page }) => {
  await page.goto("/docs/getting-started", { waitUntil: "networkidle" });
  const scoped = await page.evaluate(() => {
    const scope = document.createElement("div");
    scope.setAttribute("data-identity-scope", "");
    scope.setAttribute("data-identity", "volt");
    const inner = document.createElement("span");
    inner.style.setProperty("font-size", "var(--text-xs)");
    scope.appendChild(inner);
    document.querySelector("main")!.appendChild(scope);
    const out = getComputedStyle(inner).fontSize;
    scope.remove();
    return out;
  });
  expect(scoped).toBe("12px");
});
