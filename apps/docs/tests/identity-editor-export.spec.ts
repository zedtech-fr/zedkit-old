import { expect, test } from "@playwright/test";

const PAGE = "/features/identity-editor";

test.describe("identity editor export", () => {
  test("CSS and JSON fields follow a spacing edit", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByLabel("Spacing", { exact: true }).fill("0.4rem");
    await expect(page.getByLabel("CSS", { exact: true })).toHaveValue(/--spacing:\s*0\.4rem/);
    const json = await page.getByLabel("JSON", { exact: true }).inputValue();
    expect(JSON.parse(json) as { spacing: string }).toMatchObject({ spacing: "0.4rem" });
  });

  test("blocks copy until contrast failure is confirmed", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(PAGE, { waitUntil: "networkidle" });
    const background = await page.getByLabel("Background", { exact: true }).inputValue();
    await page.getByLabel("Foreground", { exact: true }).fill(background);
    await expect(page.getByText(/light text \d+(\.\d+)?:1 \(need 4\.5:1\)/)).toBeVisible();
    await expect(page.getByText("Copy is blocked until you fix contrast warnings or confirm export.")).toBeVisible();
    await page.getByRole("button", { name: "Copy CSS" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByText("Copied CSS")).toHaveCount(0);
    await page.getByRole("button", { name: "Copy CSS" }).click();
    await page.getByRole("button", { name: "Export anyway" }).click();
    await expect(page.getByText("Copied CSS")).toBeVisible();
  });

  test("states what the export is, and loads an export back into every field", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "What this exports" })).toBeVisible();
    await expect(page.getByText(/A recipe, not a complete look/)).toBeVisible();

    const edits: Record<string, string> = {
      Spacing: "0.31rem",
      "Border width": "2px",
      Radius: "0.75rem",
      "Line height": "1.7",
      "Heading line height": "1.2",
      "Letter spacing": "-0.03em",
      "Label spacing": "0.1em",
      Shadow: "0 1px 2px 0 rgb(0 0 0 / 0.2)",
      "Large shadow": "0 6px 8px -2px rgb(0 0 0 / 0.2)",
      Background: "10 40% 94%",
      Foreground: "10 30% 12%",
      Primary: "200 60% 30%",
      "Primary text": "0 0% 99%",
      Accent: "20 80% 40%",
      Border: "30 20% 40%",
      "Muted text": "30 10% 30%",
    };
    for (const [label, value] of Object.entries(edits)) await page.getByLabel(label, { exact: true }).fill(value);
    const exported = await page.getByLabel("JSON", { exact: true }).inputValue();

    await page.getByRole("button", { name: "Reset" }).click();
    await expect(page.getByLabel("Spacing", { exact: true })).toHaveValue("0.25rem");
    await page.getByLabel("Pasted recipe").fill(exported);
    await page.getByRole("button", { name: "Load recipe" }).click();
    await expect(page.getByText("Recipe loaded into the draft.")).toBeVisible();
    for (const [label, value] of Object.entries(edits)) await expect(page.getByLabel(label, { exact: true })).toHaveValue(value);
    await expect(page.getByLabel("JSON", { exact: true })).toHaveValue(exported);

    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByLabel("Spacing", { exact: true })).toHaveValue("0.25rem");
  });

  test("a loaded recipe reopens identically after a reload and in a fresh tab, and Undo still steps back", async ({
    page,
    context,
  }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    const base = JSON.parse(await page.getByLabel("JSON", { exact: true }).inputValue()) as {
      fontSans: string;
      fontDisplay: string;
      light: Record<string, string>;
      dark: Record<string, string>;
    };
    const recipe = {
      ...base,
      fontSans: 'Georgia, "Times New Roman", serif',
      fontDisplay: '"Courier New", Courier, monospace',
      light: { ...base.light, primary: "10 60% 30%" },
      dark: { ...base.dark, primary: "200 70% 72%" },
    };
    await page.getByLabel("Pasted recipe").fill(JSON.stringify(recipe));
    await page.getByRole("button", { name: "Load recipe" }).click();
    await expect(page.getByText("Recipe loaded into the draft.")).toBeVisible();

    const specimen = (p: typeof page) =>
      p.locator('[data-slot="identity-editor-preview"]').evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          sans: style.getPropertyValue("--zk-font-sans").trim(),
          display: style.getPropertyValue("--zk-font-display").trim(),
          primary: style.getPropertyValue("--primary").trim(),
        };
      });
    const exportedJson = async (p: typeof page) => JSON.parse(await p.getByLabel("JSON", { exact: true }).inputValue()) as typeof recipe;
    const expected = { sans: recipe.fontSans, display: recipe.fontDisplay, primary: recipe.light.primary };

    expect(await specimen(page)).toEqual(expected);
    expect(await exportedJson(page)).toEqual(recipe);

    const link = page.url();
    expect(new URL(link).searchParams.get("fontSans")).toBe(recipe.fontSans);
    expect(new URL(link).searchParams.get("fontDisplay")).toBe(recipe.fontDisplay);

    await page.reload({ waitUntil: "networkidle" });
    expect(await specimen(page)).toEqual(expected);
    expect(await exportedJson(page)).toEqual(recipe);

    const fresh = await context.newPage();
    await fresh.goto(link, { waitUntil: "networkidle" });
    expect(await specimen(fresh)).toEqual(expected);
    expect(await exportedJson(fresh)).toEqual(recipe);
    await fresh.close();

    // Undo steps back from the loaded recipe to the look it replaced, fonts included.
    await page.getByRole("button", { name: "Reset" }).click();
    await page.getByLabel("Pasted recipe").fill(JSON.stringify(recipe));
    await page.getByRole("button", { name: "Load recipe" }).click();
    await page.getByRole("button", { name: "Undo" }).click();
    const undone = await exportedJson(page);
    expect(undone.fontSans).toBe(base.fontSans);
    expect(undone.fontDisplay).toBe(base.fontDisplay);
    expect(new URL(page.url()).searchParams.has("fontSans")).toBe(false);
  });

  test("a recipe that cannot be loaded says why and leaves the draft alone", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.getByLabel("Pasted recipe").fill("{ nope");
    await page.getByRole("button", { name: "Load recipe" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "not valid JSON" })).toBeVisible();
    const json = JSON.parse(await page.getByLabel("JSON", { exact: true }).inputValue()) as Record<string, unknown>;
    await page.getByLabel("Pasted recipe").fill(JSON.stringify({ ...json, radius: undefined }));
    await page.getByRole("button", { name: "Load recipe" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "radius" })).toBeVisible();
    await expect(page.getByLabel("Spacing", { exact: true })).toHaveValue("0.25rem");
  });
});
