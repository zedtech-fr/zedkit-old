import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test, type Page } from "@playwright/test";

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "src", "parallax.css"), "utf8");

const LAYER_BUDGET = 12;

async function mountParallax(page: Page, extra = ""): Promise<void> {
  await page.evaluate((html) => {
    document.documentElement.style.height = "400vh";
    document.body.style.height = "400vh";
    document.body.insertAdjacentHTML("beforeend", html);
  }, extra);
}

function sceneHtml(): string {
  return `
<section id="zk-parallax-scene" data-parallax data-parallax-axis="y" data-parallax-range="cover" style="height:200vh;position:relative;">
  <div id="zk-layer-far" data-parallax-layer data-parallax-depth="far" data-parallax-move style="height:8rem;background:gray;"></div>
  <div id="zk-layer-zero" data-parallax-layer data-parallax-depth="0" style="height:4rem;">copy</div>
  <div id="zk-layer-near" data-parallax-layer data-parallax-depth="near" data-parallax-move style="height:4rem;"></div>
  <div id="zk-toast" style="position:fixed;top:12px;left:12px;width:8rem;height:2rem;">toast</div>
</section>`;
}

async function waitFrames(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
}

test("parallax CSS contract in Chromium (AC 9.2-9.5, 9.9)", async ({ page }) => {
  const problems: string[] = [];
  page.on("pageerror", (error) => problems.push(String(error)));
  await page.goto("/");
  await page.addStyleTag({ content: css });
  await mountParallax(page, sceneHtml());
  await waitFrames(page);

  const supported = await page.evaluate(() => CSS.supports("animation-timeline: view()"));
  const zero = page.locator("#zk-layer-zero");
  await expect(zero).toHaveCSS("translate", /^(none|)$/);

  const report = await page.evaluate(() => {
    const far = document.getElementById("zk-layer-far");
    const toast = document.getElementById("zk-toast");
    const scene = document.getElementById("zk-parallax-scene");
    const animations = document
      .getAnimations()
      .filter((animation) => {
        const effect = animation.effect;
        if (!effect || !("target" in effect) || !(effect.target instanceof Element)) return false;
        return Boolean(effect.target.closest("[data-parallax]"));
      });
    return {
      animationCount: animations.length,
      timelineTypes: animations.map((animation) => animation.timeline?.constructor.name ?? "none"),
      overflow: scene ? getComputedStyle(scene).overflow : "",
      toastTop: toast?.getBoundingClientRect().top ?? -1,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      farTranslate: far ? getComputedStyle(far).translate : "",
    };
  });

  expect(report.overflow).toBe("clip");
  expect(report.animationCount).toBeLessThanOrEqual(LAYER_BUDGET);
  expect(report.scrollWidth).toBeLessThanOrEqual(report.clientWidth + 1);
  expect(problems).toEqual([]);

  if (supported) {
    expect(report.timelineTypes.every((name) => /ViewTimeline|ScrollTimeline|DocumentTimeline/.test(name))).toBe(true);
  } else {
    expect(report.farTranslate === "none" || report.farTranslate === "" || report.farTranslate === "0px").toBe(true);
  }

  const toastBefore = report.toastTop;
  await page.evaluate(() => window.scrollTo(0, 400));
  await waitFrames(page);
  const toastAfter = await page.evaluate(() => document.getElementById("zk-toast")?.getBoundingClientRect().top ?? -1);
  expect(Math.abs(toastAfter - toastBefore)).toBeLessThan(2);

  const positions = [0, 600, 1200];
  const translates: string[] = [];
  for (const y of positions) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await waitFrames(page);
    translates.push(await page.evaluate(() => getComputedStyle(document.getElementById("zk-layer-zero")!).translate));
  }
  expect(translates.every((value) => value === "none" || value === "")).toBe(true);
});

test("parallax does not overflow at 320, 390, 1440 and zoom 200% (AC 9.5)", async ({ page }) => {
  await page.goto("/");
  await page.addStyleTag({ content: css });
  await mountParallax(
    page,
    `<section data-parallax data-parallax-axis="x" style="height:120vh;width:100%;">
      <div data-parallax-layer data-parallax-depth="near" data-parallax-move data-parallax-axis="x" style="height:6rem;width:100%;"></div>
    </section>`,
  );

  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 700 });
    await waitFrames(page);
    const box = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(box.scrollWidth, `${width}px`).toBeLessThanOrEqual(box.clientWidth + 1);
  }

  await page.setViewportSize({ width: 390, height: 700 });
  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  await waitFrames(page);
  const zoomed = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(zoomed.scrollWidth).toBeLessThanOrEqual(zoomed.clientWidth + 1);
});
