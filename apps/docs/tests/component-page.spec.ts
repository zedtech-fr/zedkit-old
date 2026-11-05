import { expect, test, type Page } from "@playwright/test";

import { assertA11yGate, assertFocusUnclipped, assertFocusVisibleRing, focusWithKeyboard } from "./a11y-helpers";

const CONFIRM_DIALOG_DOC = "/docs/ui/confirm-destructive-actions";
const BUTTON_DOC = "/docs/ui/trigger-actions-with-buttons";

/** The adoption panel: two tabs, one package-manager select in the first command, a method choice under Copy source. */
async function choosePackageManager(page: Page, name: string) {
  await page.locator("#install-or-copy").getByRole("combobox", { name: "Package manager" }).click();
  await page.getByRole("option", { name, exact: true }).click();
}
async function openManualCopy(page: Page) {
  const adoption = page.locator("#install-or-copy");
  await adoption.getByRole("tab", { name: "Copy source" }).click();
  await adoption.getByRole("tab", { name: "Paste the files" }).click();
}

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
  await expect(adoption.getByRole("tablist", { name: "How to adopt" }).getByRole("tab")).toHaveText(["Install package", "Copy source"]);
  await expect(page.getByRole("heading", { name: "At a glance" })).toHaveCount(0);
  await expect(page.locator("[data-component-preview]").first()).toBeVisible();
  await expect(page.locator("#usage-and-states")).toContainText("DialogClose");
  await adoption.getByRole("tab", { name: "Copy source" }).click();
  await expect(adoption.getByRole("tablist", { name: "Copy method" }).getByRole("tab")).toHaveText(["shadcn CLI", "Paste the files"]);
  await expect(adoption.getByRole("tab", { name: "shadcn CLI" })).toHaveAttribute("aria-selected", "true");
});

test("button copy source adds it with the CLI: theme tokens, the brick, a local import, a command per package manager", async ({ page }) => {
  await page.goto(BUTTON_DOC, { waitUntil: "networkidle" });
  const adoption = page.locator("#install-or-copy");
  await adoption.getByRole("tab", { name: "Copy source" }).click();
  await expect(adoption.locator('[data-adoption-step="render"]')).toContainText('import { Button } from "@/components/ui/button"');
  await expect(adoption.locator('[data-adoption-step="theme"]')).toContainText("pnpm dlx shadcn@latest add https://zedkit.app/r/theme.json");
  await expect(adoption.locator('[data-adoption-step="add"]')).toContainText("pnpm dlx shadcn@latest add https://zedkit.app/r/button.json");
  await choosePackageManager(page, "npm");
  await expect(adoption.locator('[data-adoption-step="add"]')).toContainText("npx shadcn@latest add https://zedkit.app/r/button.json");
  await expect(page.locator("#example")).not.toContainText("saveRef");
});

test("drawer copy source lists the namespace step, every companion file and the packages they need", async ({ page }) => {
  await page.goto("/docs/ui/slide-in-a-drawer-panel", { waitUntil: "networkidle" });
  const adoption = page.locator("#install-or-copy");
  await adoption.getByRole("tab", { name: "Copy source" }).click();
  await expect(adoption.locator('[data-adoption-step="namespace"]')).toContainText("registry add @zedkit=https://zedkit.app/r/{name}.json");
  await adoption.getByRole("tab", { name: "Paste the files" }).click();
  await expect(adoption.locator('[data-adoption-step="dependencies"]')).toContainText("vaul");
  const files = adoption.locator('[data-adoption-step="files"]');
  await expect(files).toContainText("18 companion files");
  await files.locator("summary").click();
  for (const name of [
    "drawer",
    "drawer-non-modal",
    "drawer-panel-classes",
    "drawer-non-modal-effects",
    "drawer-parts",
    "drawer-non-modal-context",
    "drawer-portal",
    "drawer-vaul",
    "drawer-meta",
    "overlay-modal",
    "theme-scope",
    "surface",
    "parallax",
    "parallax-types",
    "use-narrow-viewport",
    "ui-provider",
    "create-messages-context",
    "messages",
    "button",
  ]) {
    await expect(files.getByRole("region", { name: new RegExp(`src/components/ui/${name}\\.tsx?$`) })).toHaveCount(1);
  }
});

test("theme page shows the stylesheet as CSS and never as a JavaScript import", async ({ page }) => {
  await page.goto("/docs/ui/theme-an-admin-app-dark-light-included", { waitUntil: "networkidle" });
  const adoption = page.locator("#install-or-copy");
  await expect(adoption.locator('[data-adoption-step="install"]')).toContainText("pnpm add @zedtech/zedkit-ui next-themes");
  await expect(adoption.locator('[data-adoption-step="styles"]')).toContainText('@import "@zedtech/zedkit-ui/styles.css";');
  await expect(adoption).not.toContainText("import { @zedtech");
  await expect(adoption.locator('[data-adoption-step="render"]')).toContainText("src/app/layout.tsx");
});

test("button copy source by hand shows the file the CLI writes", async ({ page }) => {
  await page.goto(BUTTON_DOC, { waitUntil: "networkidle" });
  const adoption = page.locator("#install-or-copy");
  await openManualCopy(page);
  await expect(adoption).toContainText("src/components/ui/button.tsx");
  await expect(adoption).toContainText("const buttonVariants = cva(");
  await expect(adoption.locator('[data-adoption-step="init"]')).toContainText("shadcn@latest init");
});

test("install or copy keeps two tabs; the package manager is one select that follows you", async ({ page }) => {
  await page.goto(BUTTON_DOC, { waitUntil: "networkidle" });
  const adoption = page.locator("#install-or-copy");
  await expect(adoption.getByRole("tablist", { name: "How to adopt" }).getByRole("tab")).toHaveText(["Install package", "Copy source"]);
  await expect(adoption.getByRole("combobox", { name: "Package manager" })).toHaveText("pnpm");
  await expect(adoption.getByText("pnpm add @zedtech/zedkit-ui")).toBeVisible();
  await choosePackageManager(page, "yarn");
  await expect(adoption.getByText("yarn add @zedtech/zedkit-ui")).toBeVisible();
  await adoption.getByRole("tab", { name: "Copy source" }).click();
  await expect(adoption.getByRole("combobox", { name: "Package manager" })).toHaveText("yarn");
  await expect(adoption.getByText("yarn dlx shadcn@latest add").first()).toBeVisible();
  await page.reload({ waitUntil: "networkidle" });
  await expect(adoption.getByRole("combobox", { name: "Package manager" })).toHaveText("yarn");
});

test("install or copy blocks copy their own text and say where it goes", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(BUTTON_DOC, { waitUntil: "networkidle" });
  const adoption = page.locator("#install-or-copy");
  const blocks = adoption.locator("figure");
  await expect(blocks).toHaveCount(3);
  await expect(blocks.nth(0).locator("figcaption")).toContainText("Terminal");
  await expect(blocks.nth(1).locator("figcaption")).toContainText("src/app/globals.css");
  await expect(blocks.nth(1).locator("figcaption")).toContainText("Replace the contents");
  await expect(blocks.nth(2).locator("figcaption")).toContainText("src/app/page.tsx");
  await blocks.nth(0).getByRole("button", { name: /^Copy/ }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("pnpm add @zedtech/zedkit-ui");
  await blocks.nth(2).getByRole("button", { name: /^Copy/ }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('from "@zedtech/zedkit-ui"');
});

test("install or copy fits a phone and keeps 44px touch targets", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BUTTON_DOC, { waitUntil: "networkidle" });
  const adoption = page.locator("#install-or-copy");
  await adoption.scrollIntoViewIfNeeded();
  const measure = async () =>
    adoption.evaluate((root) => ({
      small: [...root.querySelectorAll('[role="tab"], [role="combobox"], button')]
        .map((el) => ({ name: el.getAttribute("aria-label") ?? el.textContent?.trim() ?? el.tagName, rect: el.getBoundingClientRect() }))
        .filter(({ rect }) => rect.height > 0 && (rect.height < 43.5 || rect.width < 43.5))
        .map(({ name, rect }) => `${name} ${Math.round(rect.width)}x${Math.round(rect.height)}`),
      right: Math.max(...[...root.querySelectorAll("figure")].map((el) => el.getBoundingClientRect().right)),
      docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }));
  const install = await measure();
  expect(install.small).toEqual([]);
  expect(install.right).toBeLessThanOrEqual(390);
  expect(install.docOverflow).toBeLessThanOrEqual(0);
  await adoption.getByRole("tab", { name: "Copy source" }).click();
  const copy = await measure();
  expect(copy.small).toEqual([]);
  expect(copy.docOverflow).toBeLessThanOrEqual(0);
  await openManualCopy(page);
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
    const tab = adoption.getByRole("tab", { name: "Install package" });
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
    const copy = adoption.locator("figure").first().getByRole("button", { name: /^Copy/ });
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
    await adoption.getByRole("tab", { name: "Copy source" }).click();
    await assertA11yGate(page, "#install-or-copy");
    await openManualCopy(page);
    await assertA11yGate(page, "#install-or-copy");
  });
}

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
