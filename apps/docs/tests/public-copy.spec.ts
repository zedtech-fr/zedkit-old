import { expect, test } from "@playwright/test";

/**
 * Public pages speak to visitors, not to the team that builds them: no QA, harness or
 * "internal" wording on a route a visitor can reach from the sitemap or the home page.
 */
const EXTRA_ROUTES = ["/features/identity-editor", "/features/identity-kit-demos"];
const INTERNAL = /\bharness\b|\bQA\b|\binternal (preview|demo|tool|page)s?\b|for tests\b/i;

test("no public route speaks in internal QA or harness terms", async ({ page, request }) => {
  test.setTimeout(5 * 60_000);
  const xml = await (await request.get("/sitemap.xml")).text();
  const sitemap = [...xml.matchAll(/<loc>https?:\/\/[^/]+(\/[^<]*)<\/loc>/g)].map((m) => m[1]!.replace(/\/$/, "") || "/");
  const routes = [...new Set([...sitemap, ...EXTRA_ROUTES])];
  expect(routes.length).toBeGreaterThan(50);
  const offenders: string[] = [];
  for (const route of routes) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    const visible = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "";
      return `${document.title}\n${meta}\n${document.body.innerText}`;
    });
    const hit = INTERNAL.exec(visible);
    if (hit) offenders.push(`${route}: "${hit[0]}"`);
  }
  expect(offenders).toEqual([]);
});
