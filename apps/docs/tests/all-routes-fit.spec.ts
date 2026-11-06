import { expect, test } from "@playwright/test";

import { gotoStaticRoute } from "./goto-static-route.js";
import { publishedRoutes } from "./published-routes.js";

/**
 * Every published route, five widths: no sideways page scroll, no runtime
 * errors, one h1, and every image has an alt. The route list comes from the
 * sitemap, so a new page is covered the day it ships.
 *
 * One Playwright test per route so `fullyParallel` + `DOCS_E2E_SHARD` can
 * balance the sweep across runners. The previous single loop was one long
 * test, so a 3-way shard left one job with all the work and one empty.
 */
const WIDTHS = [320, 375, 768, 1024, 1440] as const;

const routes = publishedRoutes();

test.describe.configure({ mode: "parallel" });

test("published sitemap lists more than 100 routes", () => {
  expect(routes.length).toBeGreaterThan(100);
});

for (const route of routes) {
  test(`${route} fits every width and stays error-free`, async ({ page }) => {
    const problems: string[] = [];
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    page.on("console", (message) => {
      if (message.type() === "error" && !/Failed to load resource.*(favicon|_next\/image)/.test(message.text())) {
        errors.push(message.text().slice(0, 160));
      }
    });

    await page.setViewportSize({ width: WIDTHS[0], height: 900 });
    const response = await gotoStaticRoute(page, route);
    if (!response || response.status() !== 200) {
      problems.push(`${route}: status ${response?.status()}`);
    } else {
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 900 });
        const sideways = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        if (sideways > 1) problems.push(`${route} @${width}: ${sideways}px sideways scroll`);
      }
      const facts = await page.evaluate(() => ({
        h1: document.querySelectorAll("h1").length,
        noAlt: [...document.images].filter((img) => !img.hasAttribute("alt")).length,
      }));
      if (facts.h1 !== 1) problems.push(`${route}: ${facts.h1} h1`);
      if (facts.noAlt > 0) problems.push(`${route}: ${facts.noAlt} images without alt`);
      if (errors.length > 0) problems.push(`${route}: ${errors.join(" | ")}`);
    }
    expect(problems).toEqual([]);
  });
}
