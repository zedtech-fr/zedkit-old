import { expect, test, type Page } from "@playwright/test";

import { assertA11yGate } from "./a11y-helpers";
import { useIdentity } from "./identity-helpers";

// Relative path: the config baseURL decides the port.
const HOME = "/";

test.describe("mist identity", () => {
  test("sets the page in self-hosted Inter, with a metric-aligned fallback", async ({ page }) => {
    await page.goto(HOME, { waitUntil: "networkidle" });
    await useIdentity(page, "mist", "light");
    const family = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(family.startsWith('"Inter Variable"')).toBe(true);
    expect(family).toContain('"Inter Variable Fallback"');
    await expect
      .poll(() => page.evaluate(() => document.fonts.check('16px "Inter Variable"')))
      .toBe(true);
    const heading = await page.evaluate(() => getComputedStyle(document.querySelector("h1")!).fontFamily);
    expect(heading).toBe(family);
  });

  test("text selection uses the inverted accent pair", async ({ page }) => {
    await page.goto(HOME, { waitUntil: "networkidle" });
    await useIdentity(page, "mist", "light");
    const selection = await page.evaluate(() => {
      const probe = document.createElement("span");
      probe.style.color = "hsl(var(--accent-foreground))";
      probe.style.backgroundColor = "hsl(var(--accent))";
      document.querySelector("main")!.appendChild(probe);
      const accent = getComputedStyle(probe);
      const pair = { fg: accent.backgroundColor, bg: accent.color };
      const picked = getComputedStyle(document.querySelector("h1")!, "::selection");
      probe.remove();
      return { pair, picked: { fg: picked.color, bg: picked.backgroundColor } };
    });
    expect(selection.picked).toEqual(selection.pair);
  });

  for (const theme of ["light", "dark"] as const) {
    test(`passes the a11y gate in ${theme}`, async ({ page }) => {
      await page.goto(HOME, { waitUntil: "networkidle" });
      await useIdentity(page, "mist", theme);
      await assertA11yGate(page);
    });
  }

  for (const width of [360, 390] as const) {
    test(`does not overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(HOME, { waitUntil: "networkidle" });
      await useIdentity(page, "mist", "light");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

/** Tokens read through var() on a probe, so the comparison sees resolved values. */
const PROBE_STYLE: Record<string, string> = {
  backgroundColor: "hsl(var(--background))",
  color: "hsl(var(--foreground))",
  outlineColor: "hsl(var(--primary))",
  borderTopColor: "hsl(var(--border))",
  borderBottomColor: "hsl(var(--accent))",
  borderLeftColor: "hsl(var(--muted-foreground))",
  borderRightColor: "hsl(var(--card))",
  borderTopLeftRadius: "var(--radius-xl)",
  borderTopRightRadius: "var(--radius-lg)",
  borderBottomLeftRadius: "var(--radius-md)",
  borderBottomRightRadius: "var(--radius-2xl)",
  paddingTop: "calc(var(--spacing) * 4)",
  fontSize: "var(--text-sm)",
  letterSpacing: "var(--tracking-tight)",
  boxShadow: "var(--zk-shadow-md)",
  borderTopWidth: "var(--zk-border-width)",
  lineHeight: "var(--zk-body-leading, 1.6)",
  transitionDuration: "var(--motion-base)",
  fontFamily: "var(--font-sans)",
  backgroundImage: "var(--zk-bg-pattern)",
};

/** Renders a scoped mist subtree in <main> and reads what it resolves to. */
async function readScopedMist(page: Page) {
  return page.evaluate((style) => {
    const scope = document.createElement("div");
    scope.setAttribute("data-identity-scope", "");
    scope.setAttribute("data-identity", "mist");
    if (document.documentElement.classList.contains("dark")) scope.classList.add("dark");
    const probe = document.createElement("div");
    Object.assign(probe.style, style, { borderStyle: "solid" });
    const heading = document.createElement("h2");
    heading.textContent = "Scoped";
    const label = document.createElement("th");
    label.textContent = "Label";
    scope.append(probe, heading, label);
    document.querySelector("main")!.appendChild(scope);
    const read = (el: Element, keys: string[]) => {
      const computed = getComputedStyle(el);
      return Object.fromEntries(keys.map((key) => [key, computed.getPropertyValue(key)]));
    };
    const out = {
      probe: read(probe, Object.keys(style).map((key) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`))),
      heading: read(heading, ["font-family", "font-weight", "letter-spacing", "text-transform", "line-height"]),
      label: read(label, ["text-transform", "letter-spacing"]),
    };
    scope.remove();
    return out;
  }, PROBE_STYLE);
}

test.describe("scoped mist under another page identity", () => {
  for (const theme of ["light", "dark"] as const) {
    test(`renders like a mist page under every identity, ${theme}`, async ({ page }) => {
      await page.goto(HOME, { waitUntil: "networkidle" });
      await useIdentity(page, "mist", theme);
      const reference = await readScopedMist(page);
      for (const identity of ["press", "tide", "volt", "maison", "glass"]) {
        await useIdentity(page, identity, theme);
        expect({ identity, ...(await readScopedMist(page)) }).toEqual({ identity, ...reference });
      }
    });
  }
});
