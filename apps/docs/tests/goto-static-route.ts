import type { Page } from "@playwright/test";

/**
 * Open a static-export docs route. `networkidle` is wrong here: the sitemap
 * sweep visits 100+ pages and any page that keeps a connection open (or never
 * reaches zero in-flight requests in CI) would block forever with the default
 * navigation timeout. After `load`, the HTML and client bundles are present;
 * axe and layout checks do not need an idle network.
 */
export async function gotoStaticRoute(page: Page, path: string) {
  return page.goto(path, { waitUntil: "load" });
}
