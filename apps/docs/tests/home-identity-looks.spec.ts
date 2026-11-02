import { expect, test } from "@playwright/test";

const IDENTITIES = [
  { id: "mist", name: "Mist" },
  { id: "press", name: "Press" },
  { id: "tide", name: "Tide" },
  { id: "volt", name: "Volt" },
  { id: "maison", name: "Maison" },
  { id: "glass", name: "Glass" },
] as const;

test("tabs switch the stage identity without leaving the page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const looks = page.locator("[data-home-identity-looks]");
  await looks.scrollIntoViewIfNeeded();
  const tabs = looks.getByRole("tablist", { name: "Visual identities" });
  await expect(tabs).toBeVisible();
  await expect(looks.getByRole("tab")).toHaveCount(6);
  const stage = looks.locator("[data-home-identity-stage]");
  await expect(stage).toHaveAttribute("data-identity", "mist");
  for (const identity of IDENTITIES) {
    await looks.getByRole("tab", { name: identity.name }).click();
    await expect(stage).toHaveAttribute("data-identity", identity.id);
    // The facts card speaks in the identity it describes.
    await expect(looks.locator("[data-home-identity-facts]:visible")).toHaveAttribute("data-identity", identity.id);
    await expect(looks.locator("[data-home-identity-facts]:visible h3")).toHaveText(identity.name);
  }
  await looks.getByRole("tab", { name: "Mist" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(looks.getByRole("tab", { name: "Press" })).toHaveAttribute("aria-selected", "true");
  await expect(stage).toHaveAttribute("data-identity", "press");
});

test("mobile looks does not overflow horizontally", async ({ page }) => {
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    const looks = page.locator("[data-home-identity-looks]");
    await looks.scrollIntoViewIfNeeded();
    await expect(looks.getByRole("tablist")).toBeVisible();
    const box = await looks.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return {
        width: rect.width,
        right: rect.right,
        vw: document.documentElement.clientWidth,
        pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    expect(box.width, `${width}px looks width`).toBeLessThanOrEqual(box.vw + 1);
    expect(box.right, `${width}px looks right`).toBeLessThanOrEqual(box.vw + 1);
    if (width <= 390) {
      expect(box.pageOverflow, `${width}px page overflow`).toBeLessThanOrEqual(1);
    }
  }
});

for (const width of [320, 360, 390]) {
  test(`${width}px: every look name stays readable, and the chosen one is visible`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/", { waitUntil: "networkidle" });
    const looks = page.locator("[data-home-identity-looks]");
    await looks.scrollIntoViewIfNeeded();
    for (const identity of IDENTITIES) {
      const tab = looks.getByRole("tab", { name: identity.name });
      await tab.click();
      await expect(tab).toHaveAttribute("aria-selected", "true");
      const fit = await tab.evaluate((node) => {
        const rect = node.getBoundingClientRect();
        const label = node.lastChild as Text;
        const range = document.createRange();
        range.selectNodeContents(label);
        const text = range.getBoundingClientRect();
        return {
          inView: rect.left >= 0 && rect.right <= document.documentElement.clientWidth,
          textInside: text.left >= rect.left - 0.5 && text.right <= rect.right + 0.5,
          clipped: node.scrollWidth > node.clientWidth + 1,
          fontSize: Number.parseFloat(getComputedStyle(node).fontSize),
        };
      });
      expect(fit, `${width}px ${identity.name}`).toEqual({ inView: true, textInside: true, clipped: false, fontSize: fit.fontSize });
      // Dense UI role: the kit's --text-sm (13px). Smaller than that is unreadable on a phone.
      expect(fit.fontSize).toBeGreaterThanOrEqual(13);
    }
    const dots = await looks.locator("[data-palette-dots] > span").evaluateAll((nodes) =>
      [...new Set(nodes.map((node) => Math.round(node.getBoundingClientRect().width)))],
    );
    expect(dots, "palette dots keep one size across looks").toHaveLength(1);
  });
}

test("the demo keeps its promises: Discard restores, Save keeps, Delete confirms and restores", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const stage = page.locator("[data-home-identity-stage]");
  await stage.scrollIntoViewIfNeeded();
  const name = stage.getByRole("textbox", { name: "Workspace" });
  const status = stage.locator("[data-home-identity-status]");

  await name.fill("Harbor Staging");
  await expect(status).toHaveText("Unsaved changes.");
  await stage.getByRole("button", { name: "Discard" }).click();
  await expect(name).toHaveValue("Harbor Console");
  await expect(status).toHaveText("Changes discarded.");

  await name.fill("Harbor Staging");
  await stage.getByRole("button", { name: "Save changes" }).click();
  await expect(status).toHaveText("Changes saved.");
  await name.fill("Something else");
  await stage.getByRole("button", { name: "Discard" }).click();
  await expect(name).toHaveValue("Harbor Staging");

  await stage.getByRole("button", { name: "Delete project" }).click();
  const dialog = page.getByRole("dialog", { name: "Delete this project?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(status).not.toContainText("deleted");
  await stage.getByRole("button", { name: "Delete project" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete project" }).click();
  await expect(status).toContainText("Project deleted");
  await stage.getByRole("button", { name: "Restore project" }).click();
  await expect(stage.getByRole("button", { name: "Delete project" })).toBeVisible();
});

/** Looks that show a second specimen, in its own frame beside (not inside) the shared settings card. */
const EXPRESSION: Record<string, string | null> = {
  Mist: null,
  Press: "Editorial reading",
  Tide: null,
  Volt: "Dense workspace",
  Maison: "Editorial reading",
  Glass: "Layered surfaces",
};

for (const width of [320, 1280]) {
  test(`${width}px: each look shows its own evidence beside the shared task, without overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    const looks = page.locator("[data-home-identity-looks]");
    await looks.scrollIntoViewIfNeeded();
    for (const [name, label] of Object.entries(EXPRESSION)) {
      await looks.getByRole("tab", { name }).click();
      const stage = looks.locator("[data-home-identity-stage]");
      // The shared task is always there, so looks stay comparable.
      await expect(stage.getByRole("button", { name: "Save changes" })).toBeVisible();
      if (label) {
        await expect(stage.getByText(label, { exact: true })).toBeVisible();
        // Its own frame: the specimen is not a child of the settings card, so Delete stays with project settings.
        const placement = await stage.evaluate((node) => {
          const card = node.querySelector("[data-slot='card']")!;
          const scene = node.querySelector("[data-home-identity-scene]")!;
          const remove = [...node.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Delete project")!;
          return {
            sceneOutsideCard: !card.contains(scene),
            deleteInCard: card.contains(remove),
            sceneAfterCard: Boolean(card.compareDocumentPosition(scene) & Node.DOCUMENT_POSITION_FOLLOWING),
          };
        });
        expect(placement, `${name}`).toEqual({ sceneOutsideCard: true, deleteInCard: true, sceneAfterCard: true });
      } else await expect(stage.getByText(/Editorial reading|Dense workspace|Layered surfaces/)).toHaveCount(0);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${width}px ${name}`).toBeLessThanOrEqual(1);
    }
  });
}

test("Volt's dense list reads as dense without small type: rows tighter than the table's, text at the 13px floor", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  const looks = page.locator("[data-home-identity-looks]");
  await looks.getByRole("tab", { name: "Volt" }).click();
  const heights = await looks.locator("[data-home-identity-stage]").evaluate((stage) => {
    const row = (selector: string) => stage.querySelector(selector)?.getBoundingClientRect().height ?? 0;
    return { dense: row("ul[aria-label='Recent activity'] li"), table: row("tbody tr") };
  });
  expect(heights.dense).toBeGreaterThan(0);
  expect(heights.dense).toBeLessThan(heights.table);
  // Event text is what a reader acts on, so it keeps the dense-UI floor; density comes from the rhythm.
  const sizes = await looks.locator("ul[aria-label='Recent activity'] li span").evaluateAll((spans) =>
    spans.filter((span) => (span.textContent ?? "").trim()).map((span) => Number.parseFloat(getComputedStyle(span).fontSize)),
  );
  expect(sizes.length).toBeGreaterThan(0);
  for (const size of sizes) expect(size).toBeGreaterThanOrEqual(13);
});

test("Delete project: the dialog traps focus, Cancel and Escape return it, Confirm completes and Restore undoes it", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  const stage = page.locator("[data-home-identity-stage]");
  await stage.scrollIntoViewIfNeeded();
  const trigger = stage.getByRole("button", { name: "Delete project" });
  const status = stage.locator("[data-home-identity-status]");

  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  for (let step = 0; step < 6; step += 1) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((node) => node.contains(document.activeElement)), `Tab ${step + 1} stays inside`).toBe(true);
  }
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(status).not.toContainText("deleted");

  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();

  await trigger.click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete project" }).click();
  await expect(status).toContainText("Nothing was removed");
  const restore = stage.getByRole("button", { name: "Restore project" });
  await restore.click();
  await expect(stage.getByRole("button", { name: "Delete project" })).toBeVisible();
  await expect(stage.getByText("Active", { exact: true }).first()).toBeVisible();
});
