import { expect, test } from "@playwright/test";
import {
  assertAxeOnMain,
  assertInternalLinksResolve,
  assertKeyboardReachesFirstMainCta,
  assertNoHorizontalOverflow,
  assertNoNestedInteractive,
  assertUniqueLinkNames,
} from "./site-audit-helpers";
import { REGISTRY_SMOKE_URLS, SITE_AUDIT_ROUTES } from "./site-routes";

test.describe("site semantics harness (#300)", () => {
  for (const route of SITE_AUDIT_ROUTES) {
    test(`${route.label}: mobile width, axe on main, links resolve`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (event) => errors.push(String(event)));
      await page.goto(route.path, { waitUntil: "networkidle" });
      await assertNoHorizontalOverflow(page);
      if (route.strictSemantics) {
        await assertAxeOnMain(page, route.extraAxeOff ?? [], route.axeExclude);
      }
      await assertInternalLinksResolve(page);
      expect(errors).toEqual([]);
    });

    if (route.strictSemantics || route.linkAndInteractiveAudit) {
      test(`${route.label}: no nested interactive, unique link names`, async ({ page }) => {
        await page.goto(route.path, { waitUntil: "networkidle" });
        await assertNoNestedInteractive(page, route.axeExclude);
        await assertUniqueLinkNames(page);
      });
    }
  }

  test("home: keyboard reaches first main CTA", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await assertKeyboardReachesFirstMainCta(page);
  });

  test("home: axe on layout", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await assertAxeOnMain(page, ["label-content-name-mismatch"], "[data-home-dashboard-card], [data-home-hero-proof]");
  });

  test("registry URLs used on the site resolve", async ({ page }) => {
    for (const path of REGISTRY_SMOKE_URLS) {
      const res = await page.request.get(path);
      expect(res.status(), path).toBe(200);
    }
  });
});
