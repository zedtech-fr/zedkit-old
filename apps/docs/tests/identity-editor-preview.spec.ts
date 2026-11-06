import { expect, test } from "@playwright/test";

const PAGE = "/features/identity-editor";

test("draft stays on screen while a lower field is in view on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(PAGE, { waitUntil: "networkidle" });
  const field = page.getByLabel("Border", { exact: true });
  await field.scrollIntoViewIfNeeded();
  const preview = page.locator('[data-slot="identity-editor-preview"]');
  const previewBox = await preview.boundingBox();
  const fieldBox = await field.boundingBox();
  expect(previewBox).not.toBeNull();
  expect(fieldBox).not.toBeNull();
  expect(previewBox!.y).toBeGreaterThanOrEqual(40);
  expect(previewBox!.y).toBeLessThan(80);
  expect(fieldBox!.y).toBeGreaterThan(previewBox!.y + previewBox!.height - 1);
});
