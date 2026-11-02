import { expect, test } from "@playwright/test";

/**
 * `multiline` is documented to wrap a long value so it reads in full on a narrow screen. It used to be
 * `white-space: nowrap` inside a horizontally scrolling textarea: documented one way, built the other.
 */
const PAGE = "/docs/ui/display-a-shown-once-secret-with-copy";

for (const width of [320, 390, 768]) {
  test(`${width}px: a multiline value wraps and grows to show all of it`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(PAGE, { waitUntil: "networkidle" });
    const field = page.locator("[data-component-preview]").first().getByRole("textbox", { name: "Install command" });
    await field.scrollIntoViewIfNeeded();
    const metrics = await field.evaluate((node) => {
      const area = node as HTMLTextAreaElement;
      return {
        wraps: getComputedStyle(area).whiteSpace,
        sidewaysOverflow: area.scrollWidth - area.clientWidth,
        hiddenLines: area.scrollHeight - area.clientHeight,
        lines: Math.round(area.clientHeight / Number.parseFloat(getComputedStyle(area).lineHeight)),
        pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    expect(metrics.wraps).toBe("pre-wrap");
    expect(metrics.sidewaysOverflow, "nothing to scroll sideways").toBeLessThanOrEqual(1);
    expect(metrics.hiddenLines, "every line is on show").toBeLessThanOrEqual(1);
    expect(metrics.pageOverflow).toBeLessThanOrEqual(1);
    if (width <= 390) expect(metrics.lines, "a 70-character command takes more than one line on a phone").toBeGreaterThan(1);
  });
}

test("a multiline value copies whole, whatever the wrapping shows", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(PAGE, { waitUntil: "networkidle" });
  const preview = page.locator("[data-component-preview]").first();
  const value = await preview.getByRole("textbox", { name: "Install command" }).inputValue();
  await preview.getByRole("button", { name: "Copy install command" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(value);
  expect(value).not.toContain("\n");
});
