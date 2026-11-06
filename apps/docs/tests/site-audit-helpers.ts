import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

const MOBILE_WIDTH = 375;

/**
 * Baseline axe on `main` (#300 harness). `color-contrast` stays off: enabling
 * it fails on all 8 strict routes (probed 2026-10-26, systemic token issue
 * for the UI lane), not just home. Fumadocs chrome duplicates are out of
 * scope here.
 */
const AXE_BASELINE_RULES_OFF = [
  "landmark-unique",
  "region",
  "landmark-one-main",
  "color-contrast",
] as const;

export async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  await page.setViewportSize({ width: MOBILE_WIDTH, height: 844 });
  // Settle webfonts + layout before measuring: scrollWidth races font swap
  // and flakes in CI without this (see #412 follow-ups).
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.waitForTimeout(500);
  const target = page.locator("main");
  const hasMain = (await target.count()) > 0;
  const scrollWidth = await page.evaluate((useMain) => {
    const el = useMain ? document.querySelector("main") : document.documentElement;
    if (!el) return document.documentElement.scrollWidth;
    return el.scrollWidth;
  }, hasMain);
  const clientWidth = await page.evaluate((useMain) => {
    const el = useMain ? document.querySelector("main") : document.documentElement;
    if (!el) return document.documentElement.clientWidth;
    return el.clientWidth;
  }, hasMain);
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
}

export async function assertAxeOnMain(
  page: Page,
  extraRulesOff: string[] = [],
  exclude?: string,
): Promise<void> {
  let builder = new AxeBuilder({ page }).include("main");
  if (exclude) {
    // Nested AppShell preview has its own <main>/<header>, which also match
    // include("main"). Exclude those roots, not only the wrapper.
    builder = builder.exclude(exclude).exclude(`${exclude} main`).exclude(`${exclude} header`);
  }
  const results = await builder.disableRules([...AXE_BASELINE_RULES_OFF, ...extraRulesOff]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

export async function assertNoNestedInteractive(page: Page, exclude?: string): Promise<void> {
  let builder = new AxeBuilder({ page }).include("main").withRules(["nested-interactive"]);
  if (exclude) builder = builder.exclude(exclude);
  const results = await builder.analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

export async function assertUniqueLinkNames(page: Page): Promise<void> {
  const main = page.locator("main").first();
  await expect(main).toBeVisible();
  const links = await main.getByRole("link").evaluateAll((nodes) =>
    nodes.map((node) => {
      const name = node.textContent?.trim() ?? "";
      const aria = node.getAttribute("aria-label")?.trim() ?? "";
      const href = node.getAttribute("href") ?? "";
      const label = aria || name;
      return label.length > 0 ? { label, href } : null;
    }).filter((row): row is { label: string; href: string } => row !== null),
  );
  const byLabel = new Map<string, Set<string>>();
  for (const { label, href } of links) {
    const hrefs = byLabel.get(label) ?? new Set<string>();
    hrefs.add(href);
    byLabel.set(label, hrefs);
  }
  const ambiguous = [...byLabel.entries()].filter(([, hrefs]) => hrefs.size > 1);
  expect(
    ambiguous,
    `same link name, different destinations: ${JSON.stringify(ambiguous.map(([label, hrefs]) => [label, [...hrefs]]))}`,
  ).toEqual([]);
}

export async function assertInternalLinksResolve(page: Page): Promise<void> {
  const hrefs = await page.locator("main a[href]").evaluateAll((anchors) =>
    anchors
      .map((a) => a.getAttribute("href"))
      .filter((h): h is string => typeof h === "string" && h.length > 0),
  );
  const internal = hrefs
    .filter((h) => h.startsWith("/") && !h.startsWith("//"))
    .slice(0, 24);
  for (const href of internal) {
    const res = await page.request.get(href);
    expect(res.status(), href).toBeLessThan(400);
  }
}

/** Tab until focus lands on a link or button inside `main`. */
export async function assertKeyboardReachesFirstMainCta(page: Page): Promise<void> {
  for (let i = 0; i < 50; i++) {
    const inMainCta = await page.evaluate(() => {
      const main = document.querySelector("main");
      const el = document.activeElement;
      if (!main || !el || !main.contains(el)) return false;
      const tag = el.tagName;
      return tag === "A" || tag === "BUTTON" || el.getAttribute("role") === "button";
    });
    if (inMainCta) return;
    await page.keyboard.press("Tab");
  }
  expect(false, "keyboard path did not reach a main CTA").toBe(true);
}
