import { expect, test, type Locator, type Page, type Route } from "@playwright/test";

import { assertFocusVisibleRing, focusWithKeyboard } from "./a11y-helpers";

const EDITOR = "/features/identity-editor#create";
const SERVICE = "**/api/identity/suggest";

const WARM = {
  spacing: "0.2rem",
  borderWidth: "1px",
  radius: "0.25rem",
  bodyLeading: "1.6",
  headingLeading: "1.05",
  headingTracking: "-0.01em",
  labelTracking: "0.12em",
  fontSans: '"Jost Variable", Jost, "Jost Variable Fallback", ui-sans-serif, system-ui, sans-serif',
  fontDisplay: '"Cormorant Variable", Cormorant, "Cormorant Variable Fallback", Georgia, serif',
  light: {
    background: "30 40% 96%",
    foreground: "20 20% 12%",
    primary: "14 55% 34%",
    primaryForeground: "30 40% 96%",
    accent: "14 45% 42%",
    border: "25 20% 52%",
    mutedForeground: "20 12% 32%",
  },
  dark: {
    background: "20 18% 8%",
    foreground: "30 35% 92%",
    primary: "20 70% 68%",
    primaryForeground: "20 18% 8%",
    accent: "20 30% 45%",
    border: "20 15% 40%",
    mutedForeground: "30 15% 70%",
  },
  shadowSm: "0 1px 2px hsl(20 20% 12% / 0.08)",
  shadowMd: "0 6px 16px -8px hsl(20 20% 12% / 0.2)",
};

const VIEWPORTS = [
  { name: "390", width: 390, height: 844 },
  { name: "1440", width: 1440, height: 900 },
] as const;

async function service(page: Page, reply: (posted: { requestId: string }, route: Route) => Promise<void> | void) {
  await page.route(`${SERVICE}/status`, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", json: { available: true } }),
  );
  await page.route(SERVICE, async (route) => {
    const posted = route.request().postDataJSON() as { requestId: string };
    await reply(posted, route);
  });
}

const ok = (posted: { requestId: string }) => ({
  status: 200,
  contentType: "application/json",
  json: { requestId: posted.requestId, summary: "Warmer paper.", changed: ["radius"], references: [], tokens: WARM },
});

async function tabUntilFocused(page: Page, target: Locator, limit = 80) {
  for (let i = 0; i < limit; i++) {
    if (await target.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press("Tab");
  }
  await expect(target, `tabbed ${limit} times`).toBeFocused();
}

async function stop(control: Locator) {
  await expect(control).toBeFocused();
  await assertFocusVisibleRing(control);
}

test.describe("creator keyboard path", () => {
  for (const vp of VIEWPORTS) {
    test(`${vp.name}: Tab order brief → Generate → Apply → Refine → Save → Export, each with a focus ring`, async ({
      page,
    }) => {
      await service(page, (posted, route) => route.fulfill(ok(posted)));
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(EDITOR, { waitUntil: "networkidle" });

      const brief = page.locator("#identity-assistant-brief");
      const generate = page.getByRole("button", { name: "Generate" });
      await expect(brief).toBeVisible();
      await expect(brief).toBeFocused();
      await focusWithKeyboard(brief);
      await stop(brief);
      await page.keyboard.type("A ceramics shop");
      await page.keyboard.press("Tab");
      await stop(generate);
      await page.keyboard.press("Enter");

      const apply = page.getByRole("button", { name: "Use this look" });
      await expect(apply).toBeVisible();
      await tabUntilFocused(page, apply);
      await stop(apply);
      await page.keyboard.press("Enter");

      await expect(brief).toBeFocused();
      const refine = page.getByRole("button", { name: "Refine" });
      await expect(refine).toBeVisible();
      await page.keyboard.type("Calmer");
      await page.keyboard.press("Tab");
      await stop(refine);

      if (vp.width <= 390) {
        await page.keyboard.press("Escape");
        await expect(brief).toHaveCount(0);
      }

      const name = page.getByLabel("Name", { exact: true });
      await tabUntilFocused(page, name);
      await page.keyboard.type("Keyboard look");
      await page.keyboard.press("Tab");
      await stop(page.getByRole("button", { name: "Save look" }));

      await tabUntilFocused(page, page.getByRole("button", { name: "Copy CSS" }));
      await stop(page.getByRole("button", { name: "Copy CSS" }));
    });

    test(`${vp.name}: Escape closes the dock and returns a focus ring to the trigger`, async ({
      page,
    }) => {
      await service(page, (_posted, route) => route.abort());
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(EDITOR, { waitUntil: "networkidle" });

      const brief = page.locator("#identity-assistant-brief");
      const trigger = page.getByRole("button", { name: "And yours?" });
      await expect(page.getByTestId("identity-dock")).toBeVisible();
      await expect(brief).toBeVisible();
      await expect(brief).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(brief).toHaveCount(0);
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await stop(trigger);
    });
  }
});
