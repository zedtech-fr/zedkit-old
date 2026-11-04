import { expect, test, type Locator, type Page } from "@playwright/test";

const PAGE = "/features/identity-editor";

const LIGHT = [
  "--spacing",
  "--zk-border-width",
  "--radius",
  "--radius-xl",
  "--zk-body-leading",
  "--zk-heading-leading",
  "--zk-heading-tracking",
  "--zk-label-tracking",
  "--zk-font-sans",
  "--zk-font-display",
  "--background",
  "--foreground",
  "--primary",
  "--primary-foreground",
  "--accent",
  "--border",
  "--muted-foreground",
  "--zk-shadow-sm",
  "--zk-shadow-md",
] as const;

const DARK = [
  "--background",
  "--foreground",
  "--primary",
  "--primary-foreground",
  "--accent",
  "--border",
  "--muted-foreground",
  "--card",
  "--sidebar",
] as const;

/** Distinct from the editor's default look so a false match cannot be the unedited draft. */
const DOCK_TOKENS = {
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

function readTokens(el: Locator, names: readonly string[]) {
  return el.evaluate((node, keys) => {
    const style = getComputedStyle(node);
    return Object.fromEntries(keys.map((name) => [name, style.getPropertyValue(name).trim()]));
  }, [...names]);
}

async function mockSuggest(page: Page) {
  await page.route("**/api/identity/suggest/status", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", json: { available: true } }),
  );
  await page.route("**/api/identity/suggest", async (route) => {
    const posted = route.request().postDataJSON() as { requestId: string };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      json: {
        requestId: posted.requestId,
        summary: "Warmer paper, a serif display face, softer corners.",
        changed: ["radius", "fontDisplay"],
        references: [],
        tokens: DOCK_TOKENS,
      },
    });
  });
}

test("exported CSS on a clean fixture computes the same tokens as the preview", async ({ page, context }) => {
  await page.goto(PAGE, { waitUntil: "networkidle" });
  await page.getByLabel("Spacing", { exact: true }).fill("0.4rem");
  await page.getByLabel("Radius", { exact: true }).fill("0.75rem");
  await page.getByLabel("Primary", { exact: true }).fill("10 60% 30%");

  const preview = page.locator('[data-slot="identity-editor-preview"]');
  const lightPreview = await readTokens(preview, LIGHT);
  expect(lightPreview["--spacing"]).toBe("0.4rem");
  expect(lightPreview["--radius"]).toBe("0.75rem");
  expect(lightPreview["--primary"]).toBe("10 60% 30%");

  const css = await page.getByLabel("CSS", { exact: true }).inputValue();
  expect(css).toContain(":root {");
  expect(css).toContain(":root.dark");

  const fixture = await context.newPage();
  await fixture.setContent(`<!doctype html><html><head><style>${css}</style></head><body><div id="specimen">x</div></body></html>`);
  expect(await readTokens(fixture.locator("#specimen"), LIGHT)).toEqual(lightPreview);

  await page.getByRole("button", { name: "Preview dark" }).click();
  await expect(preview).toHaveClass(/dark/);
  const darkPreview = await readTokens(preview, DARK);
  expect(darkPreview["--background"]).not.toBe(lightPreview["--background"]);

  await fixture.setContent(
    `<!doctype html><html class="dark"><head><style>${css}</style></head><body><div id="specimen">x</div></body></html>`,
  );
  expect(await readTokens(fixture.locator("#specimen"), DARK)).toEqual(darkPreview);
  await fixture.close();
});

test("exported CSS on a clean fixture computes the same tokens as the dock preview", async ({ page, context }) => {
  await mockSuggest(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${PAGE}#create`, { waitUntil: "networkidle" });
  await page.locator("#identity-assistant-brief").fill("A ceramics shop");
  await page.getByRole("button", { name: "Generate" }).click();

  const proposal = page.locator("[data-assistant-proposal]");
  await expect(proposal).toBeVisible();
  // Compare DOM is After, then Before: the first specimen is the proposal.
  const after = proposal.locator("[data-slot='brief-specimen']").first();
  const lightCard = after.getByRole("group", { name: "Light" });
  const lightPreview = await readTokens(lightCard, LIGHT);
  expect(lightPreview["--spacing"]).toBe(DOCK_TOKENS.spacing);
  expect(lightPreview["--radius"]).toBe(DOCK_TOKENS.radius);
  expect(lightPreview["--zk-body-leading"]).toBe(DOCK_TOKENS.bodyLeading);
  expect(lightPreview["--zk-heading-leading"]).toBe(DOCK_TOKENS.headingLeading);
  const darkCard = after.getByRole("group", { name: "Dark" });
  if ((await darkCard.count()) === 0) await lightCard.evaluate((el) => el.classList.add("dark"));
  const darkPreview = await readTokens((await darkCard.count()) > 0 ? darkCard : lightCard, DARK);
  expect(darkPreview["--background"]).not.toBe(lightPreview["--background"]);

  await proposal.getByRole("button", { name: "Use this look" }).click();
  const cssField = page.getByLabel("CSS", { exact: true });
  await expect(cssField).toHaveValue(new RegExp(`--spacing:\\s*${DOCK_TOKENS.spacing}`));
  const css = await cssField.inputValue();
  expect(css).toContain(":root {");
  expect(css).toContain(":root.dark");

  const fixture = await context.newPage();
  await fixture.setContent(`<!doctype html><html><head><style>${css}</style></head><body><div id="specimen">x</div></body></html>`);
  expect(await readTokens(fixture.locator("#specimen"), LIGHT)).toEqual(lightPreview);

  await fixture.setContent(
    `<!doctype html><html class="dark"><head><style>${css}</style></head><body><div id="specimen">x</div></body></html>`,
  );
  expect(await readTokens(fixture.locator("#specimen"), DARK)).toEqual(darkPreview);
  await fixture.close();
});
