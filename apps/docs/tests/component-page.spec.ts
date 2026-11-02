import { expect, test, type Page } from "@playwright/test";

import { assertA11yGate, assertFocusUnclipped, assertFocusVisibleRing, focusWithKeyboard } from "./a11y-helpers";

const CONFIRM_DIALOG_DOC = "/docs/ui/confirm-destructive-actions";
const BUTTON_DOC = "/docs/ui/trigger-actions-with-buttons";

/** Secondary choices in "Install or copy" are selects, not rows of buttons. */
async function chooseOption(page: Page, selectName: string, option: string) {
  await page.locator("#install-or-copy").getByRole("combobox", { name: selectName }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}
const choosePackageManager = (page: Page, name: string) => chooseOption(page, "Package manager", name);
const chooseCopyMethod = (page: Page, name: string) => chooseOption(page, "Copy method", name);

test("confirm-dialog component page exposes catalog a11y and troubleshooting in the DOM", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (event) => errors.push(String(event)));
  await page.goto(CONFIRM_DIALOG_DOC, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Accessibility", level: 2 })).toBeVisible();
  await expect(page.getByText(/role="dialog"/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Troubleshooting", level: 2 })).toBeVisible();
  await expect(page.getByText(/onConfirm` runs synchronously then closes/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Install or copy", level: 2 })).toBeVisible();
  expect(errors).toEqual([]);
});

test("confirm-dialog preview precedes install (#R2 template)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(CONFIRM_DIALOG_DOC, { waitUntil: "networkidle" });
  const preview = page.locator("[data-component-preview]").first();
  const install = page.getByRole("heading", { name: "Install or copy", level: 2 });
  await preview.scrollIntoViewIfNeeded();
  await expect(preview).toBeVisible();
  expect((await preview.boundingBox())!.y).toBeLessThan((await install.boundingBox())!.y);
});

test("registry brick label has no decorative icon", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(CONFIRM_DIALOG_DOC, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Copy", exact: true }).click();
  await chooseCopyMethod(page, "Copy manually");
  const brick = page.locator("[data-registry-brick]");
  await brick.scrollIntoViewIfNeeded();
  await expect(brick.getByText("confirm-dialog", { exact: true })).toBeVisible();
  await expect(brick.locator("svg[aria-hidden='true']")).toHaveCount(0);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(true);
});

test("button reference page shows a full button before scroll at 390 (#R2)", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BUTTON_DOC, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Button", level: 1 })).toBeVisible();
  const preview = page.locator("[data-component-preview]").first();
  const create = preview.getByRole("button", { name: "Create app" });
  await expect(create).toBeVisible();
  const box = await create.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y + box!.height).toBeLessThanOrEqual(844);
});

test("button reference page surfaces variant and size in props without search (#R2)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(BUTTON_DOC, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "View props table" }).click();
  const props = page.locator("#props");
  await props.scrollIntoViewIfNeeded();
  await expect(props.locator("[id='type-table-button.tsx-ButtonProps-variant']")).toBeVisible();
  await expect(props.locator("[id='type-table-button.tsx-ButtonProps-size']")).toBeVisible();
  await expect(props.locator("[id='type-table-button.tsx-ButtonProps-asChild']")).toBeVisible();
  await expect(props.locator("[id='type-table-button.tsx-ButtonProps-onClick']")).toHaveCount(0);
  const inherited = props.locator("details");
  await expect(inherited).toBeVisible();
  await inherited.locator("summary").click();
  await expect(props.locator("[id='type-table-button.tsx-ButtonProps-inherited-onClick']")).toBeVisible();
});

test("component page TOC lists the live sections", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(BUTTON_DOC, { waitUntil: "networkidle" });
  const toc = page.locator("#nd-toc");
  await expect(toc.getByRole("link", { name: "Preview" })).toHaveAttribute("href", "#example");
  await expect(toc.getByRole("link", { name: "Guidance" })).toHaveAttribute("href", "#guidance");
  await expect(toc.getByRole("link", { name: "Install or copy" })).toHaveAttribute("href", "#install-or-copy");
  await expect(toc.getByRole("link", { name: "Props" })).toHaveAttribute("href", "#props");
  await expect(page.getByRole("heading", { name: "At a glance" })).toHaveCount(0);
});

test("dialog page offers a package, or a registry copy by CLI or by hand, on the same anatomy", async ({ page }) => {
  await page.goto("/docs/ui/open-modal-dialogs", { waitUntil: "networkidle" });
  const adoption = page.locator("#install-or-copy");
  await expect(adoption.getByRole("tab", { name: "Install", exact: true })).toBeVisible();
  await expect(adoption).toContainText("getting started");
  await expect(page.getByRole("heading", { name: "At a glance" })).toHaveCount(0);
  await expect(page.locator("[data-component-preview]").first()).toBeVisible();
  await expect(page.locator("#usage-and-states")).toContainText("DialogClose");
  await adoption.getByRole("tab", { name: "Copy", exact: true }).click();
  const method = adoption.getByRole("combobox", { name: "Copy method" });
  await expect(method).toContainText("Add with CLI (like shadcn)");
  await method.click();
  await expect(page.getByRole("option", { name: "Add with CLI (like shadcn)" })).toBeVisible();
  await expect(page.getByRole("option", { name: "Copy manually" })).toBeVisible();
});

test("button registry copy adds it with the CLI: local import and a command per package manager", async ({ page }) => {
  await page.goto(BUTTON_DOC, { waitUntil: "networkidle" });
  const adoption = page.locator("#install-or-copy");
  await adoption.getByRole("tab", { name: "Copy", exact: true }).click();
  await expect(page.getByText('import { Button } from "@/components/ui/button"')).toBeVisible();
  await expect(adoption.getByText("pnpm dlx shadcn@latest add")).toBeVisible();
  await choosePackageManager(page, "npm");
  await expect(adoption.getByText("npx shadcn@latest add")).toBeVisible();
  await expect(page.locator("#example")).not.toContainText("saveRef");
});

test("button registry copy by hand shows the file the CLI writes", async ({ page }) => {
  await page.goto(BUTTON_DOC, { waitUntil: "networkidle" });
  const adoption = page.locator("#install-or-copy");
  await adoption.getByRole("tab", { name: "Copy", exact: true }).click();
  await chooseCopyMethod(page, "Copy manually");
  await expect(adoption).toContainText("components/ui/button.tsx");
  await expect(adoption).toContainText("const buttonVariants = cva(");
  await expect(adoption).not.toContainText("shadcn@latest add");
});

test("install or copy keeps two tabs; the package manager is a select that follows you", async ({ page }) => {
  await page.goto(BUTTON_DOC, { waitUntil: "networkidle" });
  const adoption = page.locator("#install-or-copy");
  await expect(adoption.getByRole("tab")).toHaveText(["Install", "Copy"]);
  await expect(adoption.getByRole("combobox", { name: "Package manager" })).toHaveText("pnpm");
  await expect(adoption.getByText("pnpm add @zedtech/zedkit-ui")).toBeVisible();
  await choosePackageManager(page, "yarn");
  await expect(adoption.getByText("yarn add @zedtech/zedkit-ui")).toBeVisible();
  await adoption.getByRole("tab", { name: "Copy", exact: true }).click();
  await expect(adoption.getByRole("combobox", { name: "Package manager" })).toHaveText("yarn");
  await expect(adoption.getByText("yarn dlx shadcn@latest add")).toBeVisible();
  await page.reload({ waitUntil: "networkidle" });
  await expect(adoption.getByRole("combobox", { name: "Package manager" })).toHaveText("yarn");
});

test("install or copy sections copy their own text and read as one frame", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(BUTTON_DOC, { waitUntil: "networkidle" });
  const adoption = page.locator("#install-or-copy");
  const frame = adoption.locator("[data-code-frame]");
  await expect(frame).toHaveCount(1);
  const sections = frame.locator("figure.shiki");
  await expect(sections).toHaveCount(2);
  await expect(sections.nth(0).locator("figcaption")).toHaveText("Terminal");
  await expect(sections.nth(1).locator("figcaption")).toHaveText("Import");
  await sections.nth(0).getByRole("button").click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("pnpm add @zedtech/zedkit-ui");
  await sections.nth(1).getByRole("button").click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('from "@zedtech/zedkit-ui"');
  const borders = await frame.evaluate((root) => ({
    frame: parseFloat(getComputedStyle(root).borderTopWidth),
    sections: [...root.querySelectorAll("figure.shiki")].map((figure) => parseFloat(getComputedStyle(figure).borderTopWidth)),
    shadow: getComputedStyle(root).boxShadow,
  }));
  expect(borders.frame).toBeGreaterThan(0);
  expect(borders.sections).toEqual([0, 0]);
  expect(borders.shadow).toBe("none");
});

test("install or copy fits a phone and keeps 44px touch targets", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BUTTON_DOC, { waitUntil: "networkidle" });
  const adoption = page.locator("#install-or-copy");
  await adoption.scrollIntoViewIfNeeded();
  const measure = async () =>
    adoption.evaluate((root) => {
      const controls = [...root.querySelectorAll('[role="tab"], [role="combobox"], button')];
      return {
        small: controls
          .map((el) => ({ name: el.getAttribute("aria-label") ?? el.textContent?.trim() ?? el.tagName, rect: el.getBoundingClientRect() }))
          .filter(({ rect }) => rect.height > 0 && (rect.height < 43.5 || rect.width < 43.5))
          .map(({ name, rect }) => `${name} ${Math.round(rect.width)}x${Math.round(rect.height)}`),
        right: Math.max(...[...root.querySelectorAll("[data-code-frame]")].map((el) => el.getBoundingClientRect().right)),
        docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
  const install = await measure();
  expect(install.small).toEqual([]);
  expect(install.right).toBeLessThanOrEqual(390);
  expect(install.docOverflow).toBeLessThanOrEqual(0);
  await adoption.getByRole("tab", { name: "Copy", exact: true }).click();
  const copy = await measure();
  expect(copy.small).toEqual([]);
  expect(copy.docOverflow).toBeLessThanOrEqual(0);
  await chooseCopyMethod(page, "Copy manually");
  const manual = await measure();
  expect(manual.small).toEqual([]);
  expect(manual.right).toBeLessThanOrEqual(390);
  expect(manual.docOverflow).toBeLessThanOrEqual(0);
});

for (const width of [390, 1280] as const) {
  test(`install or copy works from the keyboard and its focus ring is not clipped (${width}px)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(BUTTON_DOC, { waitUntil: "networkidle" });
    const adoption = page.locator("#install-or-copy");
    const tab = adoption.getByRole("tab", { name: "Install", exact: true });
    await tab.scrollIntoViewIfNeeded();
    await focusWithKeyboard(tab);
    await assertFocusVisibleRing(tab);
    await assertFocusUnclipped(tab);
    const pm = adoption.getByRole("combobox", { name: "Package manager" });
    await focusWithKeyboard(pm);
    await assertFocusVisibleRing(pm);
    await assertFocusUnclipped(pm);
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("option", { name: "pnpm", exact: true })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("option", { name: "npm", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(pm).toHaveText("npm");
    await expect(adoption.getByText("npm install @zedtech/zedkit-ui")).toBeVisible();
    await expect(pm).toBeFocused();
    const copy = adoption.locator("figure.shiki").first().getByRole("button");
    await focusWithKeyboard(copy);
    await assertFocusVisibleRing(copy);
    await assertFocusUnclipped(copy);
  });
}

for (const mode of ["light", "dark"] as const) {
  test(`install or copy passes the a11y gate on every path (${mode})`, async ({ page }) => {
    await page.addInitScript((theme) => localStorage.setItem("theme", theme), mode);
    await page.goto(BUTTON_DOC, { waitUntil: "networkidle" });
    const adoption = page.locator("#install-or-copy");
    await adoption.scrollIntoViewIfNeeded();
    await assertA11yGate(page, "#install-or-copy");
    await adoption.getByRole("tab", { name: "Copy", exact: true }).click();
    await assertA11yGate(page, "#install-or-copy");
    await chooseCopyMethod(page, "Copy manually");
    await assertA11yGate(page, "#install-or-copy");
  });
}

test.describe("registry brick name light/dark (#769)", () => {
  for (const mode of ["light", "dark"] as const) {
    test(`mist ${mode}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.addInitScript((theme) => {
        localStorage.setItem("zk-docs-site-identity", "mist");
        localStorage.setItem("zk-docs-site-identity-opt-in", "1");
        localStorage.setItem("theme", theme);
      }, mode);
      await page.goto(CONFIRM_DIALOG_DOC, { waitUntil: "networkidle" });
      await page.getByRole("tab", { name: "Copy", exact: true }).click();
      await chooseCopyMethod(page, "Copy manually");
      const brick = page.locator("[data-registry-brick]");
      await brick.scrollIntoViewIfNeeded();
      await expect(brick).toBeVisible();
      await brick.screenshot({ path: `test-results/registry-brick-${mode}.png` });
    });
  }
});

test("guidance answers the reader's questions and sits right after the example", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(BUTTON_DOC, { waitUntil: "networkidle" });
  const guidance = page.locator("#guidance");
  await expect(guidance.getByText("Who is it for?")).toBeVisible();
  await expect(guidance.getByText("When should I use it?")).toBeVisible();
  await expect(guidance.getByText("When should I pick something else?")).toBeVisible();
  const example = await page.locator("#example").boundingBox();
  const props = await page.locator("#props").boundingBox();
  const box = await guidance.boundingBox();
  expect(box!.y).toBeGreaterThan(example!.y);
  expect(box!.y).toBeLessThan(props!.y);
});

const API_HEAVY_DOCS = [
  "collect-multi-line-text-input",
  "constrain-page-width-and-run-sections-edge-to-edge",
  "group-content-in-a-card-section",
  "lay-out-fieldsets-fields-and-error-lists",
  "pin-a-stage-and-change-scene-as-the-page-scrolls",
  "pick-a-day-on-a-calendar",
  "quiet-icon-beside-inline-text",
  "show-loading-placeholder-blocks",
  "show-your-brand-logo",
  "stack-content-and-group-titled-sections",
];

test("props sections stay compact: native attributes fold, kit props lead", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const slug of API_HEAVY_DOCS) {
    await page.goto(`/docs/ui/${slug}`, { waitUntil: "networkidle" });
    const height = await page.locator("#props").evaluate((heading) => {
      const section = heading.closest("section") ?? heading.parentElement!;
      return section.getBoundingClientRect().height;
    });
    expect(height, slug).toBeLessThan(1000);
  }
});

test("IconButton lists its required label with the kit props, not the inherited attributes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/docs/ui/icon-only-actions-with-a-visible-name", { waitUntil: "networkidle" });
  const kit = page.locator("[id='type-table-icon-button.tsx-IconButtonProps']");
  await expect(kit.getByText("label", { exact: true })).toBeVisible();
  await expect(kit.getByText("label?", { exact: true })).toHaveCount(0);
  const rows = await kit.locator("[id^='type-table-icon-button.tsx-IconButtonProps-']").allTextContents();
  expect(rows[0]).toContain("label");
});
