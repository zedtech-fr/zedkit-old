import { expect, test, type Page } from "@playwright/test";

import { assertA11yGate } from "./a11y-helpers";
import { probe, useIdentity } from "./identity-helpers";

// Relative path: the config baseURL decides the port.
const HOME = "/";

/** Computed style of a fresh element with the given classes, appended to <main>. */
async function surface(page: Page, className: string) {
  return page.evaluate((cls) => {
    const el = document.createElement("div");
    el.className = cls;
    document.querySelector("main")!.appendChild(el);
    const style = getComputedStyle(el);
    const out = { background: style.backgroundColor, filter: style.backdropFilter || style.getPropertyValue("-webkit-backdrop-filter") };
    el.remove();
    return out;
  }, className);
}

const ms = (value: string) => Number.parseFloat(value) * (value.trim().endsWith("ms") ? 1 : 1000);

test.describe("glass identity", () => {
  test("site header is one translucent frosted layer", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(HOME, { waitUntil: "networkidle" });
    await useIdentity(page, "glass", "light");
    const bar = await page.evaluate(() => {
      const header = document.querySelector("#nd-nav")!;
      const inner = header.firstElementChild!;
      const h = getComputedStyle(header);
      const frost = getComputedStyle(header, "::before");
      const i = getComputedStyle(inner);
      const alpha = Number(/rgba\([^)]*,\s*([\d.]+)\)/.exec(h.backgroundColor)?.[1] ?? 1);
      const filter = frost.backdropFilter || frost.getPropertyValue("-webkit-backdrop-filter") || h.backdropFilter;
      return {
        alpha,
        filter,
        headerFilter: h.backdropFilter,
        innerFilter: i.backdropFilter,
        innerBg: i.backgroundColor,
        shadow: h.boxShadow,
      };
    });
    expect(bar.alpha).toBeGreaterThanOrEqual(0.55);
    expect(bar.alpha).toBeLessThanOrEqual(0.7);
    // Frost is on ::before so the Guides viewport (a sibling) can blur the page.
    expect(bar.headerFilter === "none" || bar.headerFilter === "").toBe(true);
    expect(bar.filter).toContain("blur(");
    expect(bar.filter).toContain("saturate(");
    // A blurred child of a blurred header blurs nothing and stacks a second tint.
    expect(bar.innerFilter).toBe("none");
    expect(bar.innerBg).toBe("rgba(0, 0, 0, 0)");
    // Relief comes from inset highlights; no outer drop shadow on nav chrome (D5).
    expect(bar.shadow).toContain("inset");
    expect(bar.shadow.split(/,(?![^(]*\))/).every((part) => part.includes("inset"))).toBe(true);
  });

  test("makes cards and popovers translucent with a backdrop blur", async ({ page }) => {
    await page.goto(HOME, { waitUntil: "networkidle" });
    // Glass is the site default: compare against a solid identity first.
    await useIdentity(page, "mist", "light");
    const stock = await surface(page, "bg-card border");
    expect(stock.filter === "" || stock.filter === "none").toBe(true);

    await useIdentity(page, "glass", "light");
    for (const cls of ["bg-card border", "bg-popover border"]) {
      const glass = await surface(page, cls);
      expect(glass.background).toMatch(/\/ 0\.\d+\)$|rgba\(.*, 0\.\d+\)$/);
      expect(glass.filter).toContain("blur(");
    }
    const body = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(body.startsWith('"Inter Variable"')).toBe(true);
    const heading = await page.evaluate(() => getComputedStyle(document.querySelector("h1")!).fontFamily);
    expect(heading.startsWith('"Space Grotesk Variable"')).toBe(true);
  });

  test("keeps a scope with another identity solid inside a glass page", async ({ page }) => {
    await page.goto(HOME, { waitUntil: "networkidle" });
    await useIdentity(page, "glass", "light");
    const nested = await page.evaluate(() => {
      const scope = document.createElement("div");
      scope.setAttribute("data-identity-scope", "");
      scope.setAttribute("data-identity", "mist");
      const card = document.createElement("div");
      card.className = "bg-card border";
      scope.appendChild(card);
      document.querySelector("main")!.appendChild(scope);
      const style = getComputedStyle(card);
      const out = { background: style.backgroundColor, filter: style.backdropFilter };
      scope.remove();
      return out;
    });
    expect(nested.filter === "" || nested.filter === "none").toBe(true);
    expect(nested.background).not.toMatch(/rgba\(.*, 0\.\d+\)$/);
  });

  test("keeps interaction motion within the caps", async ({ page }) => {
    await page.goto(HOME, { waitUntil: "networkidle" });
    await useIdentity(page, "glass", "light");
    expect(ms(await probe(page, "transition-duration", "var(--motion-base)"))).toBeLessThanOrEqual(200);
    expect(ms(await probe(page, "transition-duration", "var(--motion-slow)"))).toBeLessThanOrEqual(300);
    expect(ms(await probe(page, "transition-duration", "var(--zk-lift-duration)"))).toBeLessThanOrEqual(200);
  });

  for (const theme of ["light", "dark"] as const) {
    test(`passes the a11y gate in ${theme}`, async ({ page }) => {
      await page.goto(HOME, { waitUntil: "networkidle" });
      await useIdentity(page, "glass", theme);
      await assertA11yGate(page);
    });
  }

  for (const width of [360, 390] as const) {
    test(`does not overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(HOME, { waitUntil: "networkidle" });
      await useIdentity(page, "glass", "light");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
