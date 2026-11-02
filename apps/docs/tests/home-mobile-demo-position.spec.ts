import { expect, test } from "@playwright/test";

import { HOME_MOBILE_INTERACTIVE_DEMO_MAX_TOP_PX } from "@/ui/home/home-rhythm";

const MOBILE = { width: 390, height: 844 };

test.describe("home mobile demo position (L2d)", () => {
  test.use({ viewport: MOBILE });

  test("interactive admin demo starts within ~1.5 screens of the home top", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const metrics = await page.evaluate(() => {
      const root = document.querySelector("#home-page");
      const demo = document.querySelector("#demo");
      const demoApp = document.querySelector('[aria-label="Interactive admin dashboard demo in the hero"]');
      if (!root || !demo || !demoApp) return null;
      const rootTop = root.getBoundingClientRect().top + window.scrollY;
      const demoTop = demo.getBoundingClientRect().top + window.scrollY;
      return { offset: demoTop - rootTop, demoVisible: demoApp.getBoundingClientRect().height > 0 };
    });

    expect(metrics).not.toBeNull();
    expect(metrics!.demoVisible).toBe(true);
    expect(metrics!.offset).toBeLessThanOrEqual(HOME_MOBILE_INTERACTIVE_DEMO_MAX_TOP_PX);
  });
});
