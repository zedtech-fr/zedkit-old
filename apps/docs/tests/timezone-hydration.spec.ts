import { expect, test } from "@playwright/test";

/**
 * The site is exported once, on one host, and read from everywhere. Anything that depends on the
 * reader's zone must be built where it is shown, or the page fails to hydrate (React #418) and the
 * example opens on the wrong month. The export is built in UTC (CI) or the maintainer's zone (local);
 * these readers are far from both.
 */
const ZONES = ["America/Los_Angeles", "Pacific/Auckland", "Asia/Kolkata"] as const;
const ROUTES = [
  { path: "/docs/ui/pick-a-day-on-a-calendar", month: "October 2026" },
  { path: "/docs/ui/pick-a-date-from-a-popover", month: null },
  { path: "/docs/ui/pick-a-start-and-end-date", month: null },
  { path: "/", month: null },
] as const;

for (const timezoneId of ZONES) {
  test(`${timezoneId}: date examples hydrate cleanly and open on the month they were written for`, async ({
    browser,
  }) => {
    const context = await browser.newContext({ timezoneId });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    page.on("console", (message) => {
      if (message.type() === "error" && !/Failed to load resource/.test(message.text())) errors.push(message.text().slice(0, 200));
    });
    for (const route of ROUTES) {
      errors.length = 0;
      const response = await page.goto(route.path, { waitUntil: "networkidle" });
      // A missing route must fail here rather than pass by having nothing to hydrate.
      expect(response?.status(), route.path).toBe(200);
      if (route.month) await expect(page.getByText(route.month, { exact: true }).first()).toBeVisible();
      expect(errors, `${timezoneId} ${route.path}`).toEqual([]);
    }
    await context.close();
  });
}
