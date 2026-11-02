import { expect, test } from "@playwright/test";

import { pinDemoLook, type DocsShippedIdentity } from "./a11y-helpers";

const PAGE = "/docs/ui/trigger-actions-with-buttons";

const SPECIMEN_IDENTITIES = ["tide", "press", "maison"] as const satisfies readonly DocsShippedIdentity[];

/*
 * D5 specimen: docs component previews use a single hairline frame and no
 * drop shadow. Relative paths: the config baseURL decides the port.
 */
for (const identity of SPECIMEN_IDENTITIES) {
  test(`component preview specimen (${identity}): hairline frame, no shadow`, async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    const preview = page.locator("[data-component-preview]").first();
    await pinDemoLook(preview, identity, "light");
    const specimen = preview.locator("[data-preview-frame]");
    await expect(specimen).toBeVisible();
    const style = await specimen.evaluate((el) => {
      const computed = getComputedStyle(el);
      return {
        boxShadow: computed.boxShadow,
        borderTopWidth: computed.borderTopWidth,
        borderColor: computed.borderTopColor,
      };
    });
    const stageBackground = await preview
      .locator("[data-preview-surface]")
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(style.boxShadow).toBe("none");
    expect(style.borderTopWidth).toBe("1px");
    expect(stageBackground).not.toBe("rgba(0, 0, 0, 0)");
    // The frame is site chrome: the same hairline whatever identity is pinned.
    expect(style.borderColor).not.toBe(stageBackground);
  });
}
