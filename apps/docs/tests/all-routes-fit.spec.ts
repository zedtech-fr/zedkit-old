import { expect, test } from "@playwright/test";

/**
 * Every published route, five widths: no sideways page scroll, no runtime
 * errors, one h1, and every image has an alt. The route list comes from the
 * sitemap, so a new page is covered the day it ships.
 */
const WIDTHS = [320, 375, 768, 1024, 1440] as const;
const EXTRA_ROUTES = ["/features/identity-editor", "/features/identity-kit-demos"];

test.describe.configure({ mode: "parallel" });

async function routes(request: import("@playwright/test").APIRequestContext): Promise<string[]> {
  const xml = await (await request.get("/sitemap.xml")).text();
  const paths = [...xml.matchAll(/<loc>https?:\/\/[^/]+(\/[^<]*)<\/loc>/g)].map((m) => m[1]!.replace(/\/$/, "") || "/");
  return [...new Set([...paths, ...EXTRA_ROUTES])];
}

test("every route fits every width and stays error-free", async ({ page, request }) => {
  test.setTimeout(15 * 60_000);
  const all = await routes(request);
  expect(all.length).toBeGreaterThan(100);
  const problems: string[] = [];
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error" && !/Failed to load resource.*(favicon|_next\/image)/.test(message.text())) {
      errors.push(message.text().slice(0, 160));
    }
  });

  for (const path of all) {
    errors.length = 0;
    await page.setViewportSize({ width: WIDTHS[0], height: 900 });
    const response = await page.goto(path, { waitUntil: "networkidle" });
    if (!response || response.status() !== 200) {
      problems.push(`${path}: status ${response?.status()}`);
      continue;
    }
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      const sideways = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      if (sideways > 1) problems.push(`${path} @${width}: ${sideways}px sideways scroll`);
    }
    const facts = await page.evaluate(() => ({
      h1: document.querySelectorAll("h1").length,
      noAlt: [...document.images].filter((img) => !img.hasAttribute("alt")).length,
    }));
    if (facts.h1 !== 1) problems.push(`${path}: ${facts.h1} h1`);
    if (facts.noAlt > 0) problems.push(`${path}: ${facts.noAlt} images without alt`);
    if (errors.length > 0) problems.push(`${path}: ${errors.join(" | ")}`);
  }
  expect(problems).toEqual([]);
});
