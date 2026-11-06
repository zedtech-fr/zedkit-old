import { expect, test } from "@playwright/test";

const WIDTHS = [375, 390, 768, 1280] as const;

const SECTION_IDS = ["identities", "get-started", "components", "entry-points"];
const MIN_SECTION_PADDING_PX = 32;
const MIN_CARD_PADDING_PX = 16;

test.describe("home layout rhythm (#387)", () => {
  for (const width of WIDTHS) {
    test(`no overflow and aligned sections at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/", { waitUntil: "networkidle" });

      const metrics = await page.evaluate((sectionIds) => {
        const root = document.querySelector("#home-page");
        const viewportWidth = document.documentElement.clientWidth;
        const scrollWidth = root?.scrollWidth ?? document.documentElement.scrollWidth;

        const sectionGaps: number[] = [];
        const sections = sectionIds
          .map((id) => document.getElementById(id))
          .filter((el): el is HTMLElement => el !== null && el.offsetHeight > 0);
        for (let i = 1; i < sections.length; i++) {
          const prev = sections[i - 1].getBoundingClientRect();
          const next = sections[i].getBoundingClientRect();
          sectionGaps.push(next.top - prev.bottom);
        }

        return {
          scrollWidth,
          viewportWidth,
          sectionGaps,
        };
      }, SECTION_IDS);

      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);

      if (width >= 768) {
        expect(metrics.sectionGaps.length).toBeGreaterThan(0);
        const firstGap = metrics.sectionGaps[0];
        for (const gap of metrics.sectionGaps) {
          expect(Math.abs(gap - firstGap)).toBeLessThan(48);
        }
      }
    });
  }

  test("min section and card padding at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/", { waitUntil: "networkidle" });

    const metrics = await page.evaluate((sectionIds) => {
      const padding = (el: Element | null) => {
        if (!el) return 0;
        const s = getComputedStyle(el);
        return Number.parseFloat(s.paddingTop);
      };
      const sections = sectionIds
        .map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => el !== null);
      const familyRows = [...document.querySelectorAll("[data-home-component-families] > div > div")];
      return {
        sectionPads: sections.map((el) => padding(el)),
        familyPads: familyRows.map((el) => padding(el)),
      };
    }, SECTION_IDS);

    expect(metrics.sectionPads.length).toBe(SECTION_IDS.length);
    for (const pad of metrics.sectionPads) {
      expect(pad).toBeGreaterThanOrEqual(MIN_SECTION_PADDING_PX);
    }
    expect(metrics.familyPads.length).toBeGreaterThan(0);
    for (const pad of metrics.familyPads) {
      expect(pad).toBeGreaterThanOrEqual(MIN_CARD_PADDING_PX);
    }
  });

  test("proximity snap on the home scroll root; the looks band is not snapped", async ({ page }) => {
    const readSnap = () =>
      page.evaluate(() => {
        const html = getComputedStyle(document.documentElement);
        const root = document.querySelector("[data-slot='section-scroll']");
        const identities = document.getElementById("identities");
        const entry = document.getElementById("entry-points");
        const snap = (el: Element | null) => (el ? getComputedStyle(el).scrollSnapAlign : "");
        return {
          htmlType: html.scrollSnapType,
          htmlBehavior: html.scrollBehavior,
          htmlPaddingTop: html.scrollPaddingTop,
          rootType: root ? getComputedStyle(root).scrollSnapType : "",
          identitiesAlign: snap(identities),
          identitiesSnap: identities?.getAttribute("data-snap"),
          entryAlign: snap(entry),
        };
      });

    for (const width of [375, 1440] as const) {
      await page.setViewportSize({ width, height: width === 375 ? 812 : 900 });
      await page.goto("/", { waitUntil: "networkidle" });
      const metrics = await readSnap();
      expect(metrics.htmlType, `${width}`).toMatch(/^y(\s+proximity)?$/);
      expect(metrics.htmlType, `${width}`).not.toMatch(/mandatory/);
      expect(metrics.rootType, `${width}`).toMatch(/^y(\s+proximity)?$/);
      expect(metrics.htmlBehavior, `${width}`).toBe("smooth");
      expect(Number.parseFloat(metrics.htmlPaddingTop), `${width}`).toBeGreaterThanOrEqual(48);
      expect(metrics.identitiesSnap, `${width}`).toBe("none");
      expect(metrics.identitiesAlign, `${width}`).toBe("none");
      expect(metrics.entryAlign, `${width}`).toMatch(/start/);
    }
  });
});

test.describe("home bands (#1025)", () => {
  test("sections bleed edge to edge with content capped at wide on 2560px", async ({ page }) => {
    await page.setViewportSize({ width: 2560, height: 1080 });
    await page.goto("/", { waitUntil: "networkidle" });

    const metrics = await page.evaluate(() => {
      const rect = (el: Element | null | undefined) => {
        const r = el?.getBoundingClientRect();
        return r ? { left: r.left, right: r.right, width: r.width } : null;
      };
      const section = document.getElementById("components");
      return {
        viewportWidth: document.documentElement.clientWidth,
        section: rect(section),
        inner: rect(section?.querySelector(":scope > div")),
        heading: rect(document.querySelector("#home-page h1")),
      };
    });

    expect(metrics.section).not.toBeNull();
    expect(metrics.section!.left).toBeLessThanOrEqual(1);
    expect(metrics.section!.right).toBeGreaterThanOrEqual(metrics.viewportWidth - 1);

    expect(metrics.inner).not.toBeNull();
    expect(metrics.inner!.width).toBeGreaterThan(1200);
    expect(metrics.inner!.width).toBeLessThanOrEqual(1442);
    expect(Math.abs(metrics.inner!.left - (metrics.viewportWidth - metrics.inner!.right))).toBeLessThan(2);

    expect(metrics.heading).not.toBeNull();
    expect(metrics.heading!.left).toBeLessThan((metrics.viewportWidth - 1440) / 2 + 48);
  });
});

test.describe("docs shell wide (#1064)", () => {
  const DOCS_PAGE = "/docs/ui/trigger-actions-with-buttons";

  async function docsGeometry(page: import("@playwright/test").Page) {
    return page.evaluate(() => {
      const rect = (sel: string) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { left: Math.round(r.left), width: Math.round(r.width), right: Math.round(r.right) };
      };
      const widestPreview = () => {
        let best: { left: number; width: number; right: number } | null = null;
        for (const el of document.querySelectorAll("#example [data-preview-surface]")) {
          const r = el.getBoundingClientRect();
          const box = {
            left: Math.round(r.left),
            width: Math.round(r.width),
            right: Math.round(r.right),
          };
          if (!best || box.width > best.width) best = box;
        }
        return best;
      };
      return {
        viewportWidth: window.innerWidth,
        article: rect("#nd-page"),
        main: rect("[data-layout-main]"),
        toc: rect("#nd-toc"),
        preview: widestPreview(),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
  }

  test("docs cluster widens past 1920px: article and previews take a share", async ({ page }) => {
    await page.setViewportSize({ width: 2560, height: 1080 });
    await page.goto(DOCS_PAGE, { waitUntil: "networkidle" });
    const m = await docsGeometry(page);
    expect(m.article).not.toBeNull();
    expect(m.article!.width).toBeGreaterThanOrEqual(1050);
    expect(m.main!.width).toBeGreaterThanOrEqual(1200);
    expect(m.preview!.width).toBeGreaterThanOrEqual(990);
    expect(Math.abs(m.main!.left - 268 - (m.viewportWidth - m.toc!.right))).toBeLessThanOrEqual(2);
    expect(m.overflow).toBeLessThanOrEqual(1);
  });

  test("docs cluster is untouched below 1920px and steps at the boundary", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(DOCS_PAGE, { waitUntil: "networkidle" });
    expect((await docsGeometry(page)).article!.width).toBeLessThanOrEqual(902);
    await page.setViewportSize({ width: 1919, height: 1000 });
    expect((await docsGeometry(page)).article!.width).toBeLessThanOrEqual(902);
    await page.setViewportSize({ width: 1920, height: 1000 });
    const m = await docsGeometry(page);
    expect(m.article!.width).toBeGreaterThanOrEqual(1050);
    expect(m.overflow).toBeLessThanOrEqual(1);
  });
});
