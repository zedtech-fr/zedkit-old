import { expect, test } from "@playwright/test";
import { openHeroPage } from "./hero-helpers";

const DESKTOP_WIDTHS = [1280, 1440] as const;

for (const width of DESKTOP_WIDTHS) {
  test(`header search clears theme toggle at ${width}px light`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);

    const layout = await page.evaluate(() => {
      const search = document.querySelector("#nd-nav button[class*='max-w']");
      const toggle = document.querySelector("[data-theme-toggle]");
      if (!search || !toggle) return null;
      const toggleLeft = toggle.getBoundingClientRect().left;
      const nodes = [search, ...search.querySelectorAll("*")];
      let maxRight = Number.NEGATIVE_INFINITY;
      const offenders: { tag: string; right: number }[] = [];
      for (const node of nodes) {
        const r = node.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        maxRight = Math.max(maxRight, r.right);
        if (r.right > toggleLeft + 0.5) {
          offenders.push({ tag: node.tagName.toLowerCase(), right: r.right });
        }
      }
      return {
        gap: toggleLeft - maxRight,
        offenders,
        toggleLeft,
        maxRight,
      };
    });
    expect(layout).not.toBeNull();
    expect(layout!.offenders, JSON.stringify(layout!.offenders)).toEqual([]);
    expect(layout!.gap).toBeGreaterThanOrEqual(8);
  });

  test(`catalog results align with filter row at ${width}px light`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/catalog", { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.querySelector("[data-catalog-filter-row]"));
    await expect(page.locator("#catalog-results-heading")).toBeVisible();

    const metrics = await page.evaluate(() => {
      const filterRow = document.querySelector("[data-catalog-filter-row]");
      const filterContainer = filterRow?.closest("[data-slot='container']");
      const resultsHeading = document.querySelector("#catalog-results-heading");
      const resultsContainer = resultsHeading?.closest("[data-slot='container']");
      if (!filterRow || !filterContainer || !resultsHeading || !resultsContainer) {
        return null;
      }
      const resultsStyle = getComputedStyle(resultsContainer);
      const resultsContentLeft =
        resultsContainer.getBoundingClientRect().left + parseFloat(resultsStyle.paddingLeft);
      return {
        filterInDefaultColumn: filterContainer.classList.contains("max-w-default"),
        resultsInWideColumn: resultsContainer.classList.contains("max-w-wide"),
        filterRowInset: Math.abs(
          filterContainer.getBoundingClientRect().left +
            parseFloat(getComputedStyle(filterContainer).paddingLeft) -
            filterRow.getBoundingClientRect().left,
        ),
        resultsInset: Math.abs(resultsContentLeft - resultsHeading.getBoundingClientRect().left),
      };
    });
    expect(metrics).not.toBeNull();
    expect(metrics!.filterInDefaultColumn).toBe(true);
    expect(metrics!.resultsInWideColumn).toBe(true);
    expect(metrics!.filterRowInset).toBeLessThanOrEqual(2);
    expect(metrics!.resultsInset).toBeLessThanOrEqual(2);
  });
}

for (const theme of ["light", "dark"] as const) {
  test(`home hero admin demo shows table and detail at 390px ${theme}`, async ({ page }) => {
    await page.addInitScript((mode) => localStorage.setItem("theme", mode), theme);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "networkidle" });
    await openHeroPage(page, "Apps");

    const card = page.locator("[data-home-dashboard-card]");
    await card.scrollIntoViewIfNeeded();
    await expect(card.getByRole("heading", { name: "Project apps", level: 2 })).toBeVisible();
    await expect(card.locator("[data-slot='table']")).toBeVisible();
    await expect(card.getByRole("columnheader", { name: "Region" })).toBeVisible();

    const preview = page.locator("[data-home-hero-preview]");
    await preview.scrollIntoViewIfNeeded();

    await expect(card.getByRole("button", { name: "Edit console" })).toBeVisible();
    await expect(card.getByRole("button", { name: "Delete console" })).toBeVisible();
    await expect(card.locator("[data-slot='table']")).toBeVisible();

    const visible = await preview.evaluate((el) => {
      const style = getComputedStyle(el);
      const hiddenClip =
        style.overflowY === "hidden" ||
        style.overflow === "hidden" ||
        style.overflowX === "hidden";
      const sizedToContent = el.clientHeight + 2 >= el.scrollHeight;
      return { ok: !hiddenClip && sizedToContent, hiddenClip, sizedToContent };
    });
    expect(visible, JSON.stringify(visible)).toMatchObject({ ok: true });
  });
}

test("install code on a docs page scrolls horizontally with a focusable region", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/ui/slide-in-a-drawer-panel", { waitUntil: "networkidle" });
  const install = page.locator("#install-or-copy figure.shiki").first();
  await install.scrollIntoViewIfNeeded();
  await expect(install).toBeVisible();
  const metrics = await install.evaluate((figure) => {
    const region = figure.querySelector('[role="region"]');
    const pre = figure.querySelector("pre");
    if (!region || !pre) return { ok: false };
    const style = getComputedStyle(region);
    const mask = style.maskImage || style.webkitMaskImage || "";
    const hasEdgeAffordance = mask.includes("gradient");
    const needsHorizontalScroll = pre.scrollWidth > region.clientWidth + 1;
    const scrolls = region.scrollWidth > region.clientWidth;
    return {
      ok:
        (style.overflowX === "auto" || style.overflowX === "scroll") &&
        region.getAttribute("tabindex") === "0" &&
        hasEdgeAffordance &&
        (!needsHorizontalScroll || scrolls),
      overflowX: style.overflowX,
      scrolls,
      needsHorizontalScroll,
      hasEdgeAffordance,
    };
  });
  expect(metrics, JSON.stringify(metrics)).toMatchObject({ ok: true });
});

test("home get-started install commands scroll horizontally at 390px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#get-started", { waitUntil: "networkidle" });
  const block = page.locator("#install-or-copy [data-adoption-step='install'] figure").first();
  const region = block.getByRole("region", { name: "Terminal", exact: true });
  await block.scrollIntoViewIfNeeded();
  await expect(region).toBeVisible();
  const metrics = await region.evaluate((scrollRegion) => {
    const style = getComputedStyle(scrollRegion);
    const command = scrollRegion.textContent?.trim() ?? "";
    const canScroll = scrollRegion.scrollWidth > scrollRegion.clientWidth + 1;
    return {
      ok:
        command.length > 0 &&
        (style.overflowX === "auto" || style.overflowX === "scroll") &&
        scrollRegion.getAttribute("tabindex") === "0" &&
        (canScroll || command.length > 24),
      scrollWidth: scrollRegion.scrollWidth,
      regionClientWidth: scrollRegion.clientWidth,
      canScroll,
      overflowX: style.overflowX,
    };
  });
  expect(metrics, JSON.stringify(metrics)).toMatchObject({ ok: true });
  const pageOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(pageOverflow).toBeLessThanOrEqual(1);
});

for (const width of [1280, 1600] as const) {
  test(`home band spacing and width stay consistent at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForFunction(() => {
      const bandIds = ["ai-setup", "identities", "get-started", "components", "entry-points"] as const;
      return bandIds.every((id) => {
        const section = document.getElementById(id);
        return section?.querySelector("[data-slot='container']") != null;
      });
    });

    const metrics = await page.evaluate(() => {
      const containerBox = (root: Element | null | undefined) => {
        const inner =
          root?.querySelector("[data-slot='container']") ??
          (root?.matches("[data-slot='container']") ? root : null);
        return inner?.getBoundingClientRect() ?? null;
      };

      const heroBand = document.querySelector("[data-home-hero-band]");
      const aiSetup = document.getElementById("ai-setup");
      const identities = document.getElementById("identities");
      const getStarted = document.getElementById("get-started");
      const components = document.getElementById("components");
      const entryPoints = document.getElementById("entry-points");
      const boxes = [
        containerBox(heroBand),
        containerBox(aiSetup),
        containerBox(identities),
        containerBox(getStarted),
        containerBox(components),
        containerBox(entryPoints),
      ];
      if (boxes.some((box) => !box)) return null;

      const sectionMd = getComputedStyle(document.documentElement)
        .getPropertyValue("--zk-section-md")
        .trim();
      const probe = document.createElement("div");
      probe.style.paddingTop = sectionMd || "var(--zk-section-md)";
      document.body.appendChild(probe);
      const sectionMdPx = parseFloat(getComputedStyle(probe).paddingTop);
      probe.remove();

      const bandBottom = (el: Element | null) => el?.getBoundingClientRect().bottom ?? Number.NaN;
      const bandTop = (el: Element | null) => el?.getBoundingClientRect().top ?? Number.NaN;
      const gaps = [
        bandTop(aiSetup) - bandBottom(heroBand),
        bandTop(identities) - bandBottom(aiSetup),
        bandTop(getStarted) - bandBottom(identities),
        bandTop(components) - bandBottom(getStarted),
        bandTop(entryPoints) - bandBottom(components),
      ];

      const bands = boxes as DOMRect[];
      const widths = bands.map((box) => box.width);
      const lefts = bands.map((box) => box.left);

      return {
        gaps,
        sectionMdPx,
        widthDelta: Math.max(...widths) - Math.min(...widths),
        leftDelta: Math.max(...lefts) - Math.min(...lefts),
      };
    });

    expect(metrics).not.toBeNull();
    expect(metrics!.widthDelta).toBeLessThanOrEqual(2);
    expect(metrics!.leftDelta).toBeLessThanOrEqual(2);
    for (const gap of metrics!.gaps) {
      expect(gap).toBeGreaterThanOrEqual(0);
      expect(gap).toBeLessThanOrEqual(metrics!.sectionMdPx * 1.35);
    }
  });
}
