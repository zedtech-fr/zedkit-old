import { expect, test, type Page } from "@playwright/test";

const PAGE = "/features/identity-editor";
/** The site's own light/dark switch (header), which is separate from the editor's Preview dark. */
async function siteDark(page: Page) {
  await page.getByRole("button", { name: /toggle theme/i }).first().click();
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
}


async function spacingOnDraft(page: Page) {
  return page.locator('[data-slot="identity-editor-preview"]').evaluate((node) =>
    getComputedStyle(node).getPropertyValue("--spacing").trim(),
  );
}

test.describe("identity editor undo and apply confirmation", () => {
  test("Undo restores the last draft after Reset", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: "Undo" })).toBeDisabled();
    await page.getByLabel("Spacing", { exact: true }).fill("0.4rem");
    await expect.poll(() => spacingOnDraft(page)).toBe("0.4rem");
    await page.getByRole("button", { name: "Reset" }).click();
    await expect.poll(() => spacingOnDraft(page)).toBe("0.25rem");
    await page.getByRole("button", { name: "Undo" }).click();
    await expect.poll(() => spacingOnDraft(page)).toBe("0.4rem");
  });

  test("undo of a dark colour lets a later light edit rewrite it", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Preview dark", exact: true }).click();
    await page.getByLabel("Background").fill("120 40% 20%");
    await page.getByRole("button", { name: "Undo" }).click();
    await page.getByRole("button", { name: "Preview dark", exact: true }).click();
    await page.getByLabel("Background").fill("0 0% 95%");
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await siteDark(page);
    await expect
      .poll(() =>
        page.locator("html").evaluate((node) => getComputedStyle(node).getPropertyValue("--background").trim()),
      )
      .toMatch(/^0 0% 5(\.0)?%$/);
  });

  test("undo of a light edit keeps an earlier dark override", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "light"));
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Preview dark", exact: true }).click();
    await page.getByLabel("Background").fill("120 40% 20%");
    await page.getByRole("button", { name: "Preview dark", exact: true }).click();
    await page.getByLabel("Background").fill("0 0% 95%");
    await page.getByRole("button", { name: "Undo" }).click();
    await page.getByLabel("Background").fill("0 0% 90%");
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await siteDark(page);
    await expect
      .poll(() =>
        page.locator("html").evaluate((node) => getComputedStyle(node).getPropertyValue("--background").trim()),
      )
      .toBe("120 40% 20%");
  });

  test("Apply to the whole site confirms on the page", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await expect(page.getByText("Applied to the whole site.", { exact: true })).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: "Custom identity active" })).toBeVisible();
  });
});
