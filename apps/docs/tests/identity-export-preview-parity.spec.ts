import { expect, test, type Page } from "@playwright/test";

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

function readTokens(page: Page, selector: string, names: readonly string[]) {
  return page.locator(selector).evaluate((el, keys) => {
    const style = getComputedStyle(el);
    return Object.fromEntries(keys.map((name) => [name, style.getPropertyValue(name).trim()]));
  }, [...names]);
}

test("exported CSS on a clean fixture computes the same tokens as the preview", async ({ page, context }) => {
  await page.goto(PAGE, { waitUntil: "networkidle" });
  await page.getByLabel("Spacing", { exact: true }).fill("0.4rem");
  await page.getByLabel("Radius", { exact: true }).fill("0.75rem");
  await page.getByLabel("Primary", { exact: true }).fill("10 60% 30%");

  const preview = page.locator('[data-slot="identity-editor-preview"]');
  const lightPreview = await readTokens(page, '[data-slot="identity-editor-preview"]', LIGHT);
  expect(lightPreview["--spacing"]).toBe("0.4rem");
  expect(lightPreview["--radius"]).toBe("0.75rem");
  expect(lightPreview["--primary"]).toBe("10 60% 30%");

  const css = await page.getByLabel("CSS", { exact: true }).inputValue();
  expect(css).toContain(":root {");
  expect(css).toContain(":root.dark");

  const fixture = await context.newPage();
  await fixture.setContent(`<!doctype html><html><head><style>${css}</style></head><body><div id="specimen">x</div></body></html>`);
  expect(await readTokens(fixture, "#specimen", LIGHT)).toEqual(lightPreview);

  await page.getByRole("button", { name: "Preview dark" }).click();
  await expect(preview).toHaveClass(/dark/);
  const darkPreview = await readTokens(page, '[data-slot="identity-editor-preview"]', DARK);
  expect(darkPreview["--background"]).not.toBe(lightPreview["--background"]);

  await fixture.setContent(
    `<!doctype html><html class="dark"><head><style>${css}</style></head><body><div id="specimen">x</div></body></html>`,
  );
  expect(await readTokens(fixture, "#specimen", DARK)).toEqual(darkPreview);
  await fixture.close();
});
