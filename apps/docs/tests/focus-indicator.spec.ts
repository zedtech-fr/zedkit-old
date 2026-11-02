import { expect, test, type Locator, type Page } from "@playwright/test";

import { assertFocusUnclipped, assertFocusVisibleRing, focusWithKeyboard, readFocusIndicator } from "./a11y-helpers";
import { openHeroPage } from "./hero-helpers";

/**
 * The focus assertion reads what the browser paints. Each case is a plain page
 * with one button; the negative cases must fail the same helper the demo specs use.
 */
async function pageWith(page: import("@playwright/test").Page, css: string) {
  await page.setContent(`<style>body{background:#fff;margin:24px}button{all:unset;padding:8px 16px;background:#eee;color:#111}${css}</style><button>Save</button>`);
  const button = page.getByRole("button", { name: "Save" });
  await focusWithKeyboard(button);
  return button;
}

test("an outline counts as a focus indicator", async ({ page }) => {
  const button = await pageWith(page, "button:focus-visible{outline:2px solid #1d4ed8}");
  expect((await readFocusIndicator(button)).kind).toBe("outline");
  await assertFocusVisibleRing(button);
});

test("a box-shadow ring added by focus counts", async ({ page }) => {
  const button = await pageWith(page, "button:focus-visible{box-shadow:0 0 0 2px #fff,0 0 0 4px #1d4ed8}");
  expect((await readFocusIndicator(button)).kind).toBe("ring");
  await assertFocusVisibleRing(button);
});

test("removing the focus indicator fails", async ({ page }) => {
  const button = await pageWith(page, "button:focus-visible{outline:none}");
  expect((await readFocusIndicator(button)).kind).toBe("none");
  await expect(assertFocusVisibleRing(button)).rejects.toThrow();
});

test("a permanent outline is not a focus state", async ({ page }) => {
  // Same contrasted 2px outline on every state: focus changes nothing, so nothing shows where focus is.
  const button = await pageWith(page, "button{outline:2px solid #1d4ed8;outline-offset:2px}");
  expect((await readFocusIndicator(button)).kind).toBe("none");
  await expect(assertFocusVisibleRing(button)).rejects.toThrow();
});

test("an outline that focus thickens or recolours still counts", async ({ page }) => {
  const thicker = await pageWith(page, "button{outline:1px solid #888}button:focus-visible{outline:3px solid #1d4ed8}");
  expect((await readFocusIndicator(thicker)).kind).toBe("outline");
  await assertFocusVisibleRing(thicker);
  const recoloured = await pageWith(page, "button{outline:2px solid #888}button:focus-visible{outline-color:#1d4ed8}");
  expect((await readFocusIndicator(recoloured)).kind).toBe("outline");
  await assertFocusVisibleRing(recoloured);
});

test("an indicator that an ancestor clips is reported as clipped", async ({ page }) => {
  await page.setContent(
    `<style>body{background:#fff;margin:24px}.clip{overflow:hidden;display:inline-block}button{all:unset;padding:8px 16px;background:#eee}button:focus-visible{outline:2px solid #1d4ed8;outline-offset:2px}</style><div class="clip"><button>Save</button></div>`,
  );
  const button = page.getByRole("button", { name: "Save" });
  await focusWithKeyboard(button);
  await assertFocusVisibleRing(button);
  await expect(assertFocusUnclipped(button)).rejects.toThrow(/clipped/);
});

test("a ring drawn inside the control is not reported as clipped, one only partly inside is", async ({ page }) => {
  const css = (offset: string) =>
    `<style>body{background:#fff;margin:24px}.clip{overflow:hidden;display:inline-block}button{all:unset;padding:8px 16px;background:#eee}button:focus-visible{outline:3px solid #1d4ed8;outline-offset:${offset}}</style><div class="clip"><button>Save</button></div>`;
  await page.setContent(css("-3px"));
  const inside = page.getByRole("button", { name: "Save" });
  await focusWithKeyboard(inside);
  await assertFocusUnclipped(inside);
  await page.setContent(css("-1px"));
  const partly = page.getByRole("button", { name: "Save" });
  await focusWithKeyboard(partly);
  await expect(assertFocusUnclipped(partly)).rejects.toThrow(/clipped/);
});

test("an indicator with room around it is not clipped", async ({ page }) => {
  await page.setContent(
    `<style>body{background:#fff;margin:24px}.room{overflow:hidden;padding:8px;display:inline-block}button{all:unset;padding:8px 16px;background:#eee}button:focus-visible{outline:2px solid #1d4ed8;outline-offset:2px}</style><div class="room"><button>Save</button></div>`,
  );
  const button = page.getByRole("button", { name: "Save" });
  await focusWithKeyboard(button);
  await assertFocusUnclipped(button);
});

test("a resting drop shadow is not a focus state", async ({ page }) => {
  const button = await pageWith(page, "button{box-shadow:0 1px 2px rgba(0,0,0,.4)}button:focus-visible{outline:none}");
  expect((await readFocusIndicator(button)).kind).toBe("none");
  await expect(assertFocusVisibleRing(button)).rejects.toThrow();
});

test("a ring too faint against its background fails", async ({ page }) => {
  const button = await pageWith(page, "button:focus-visible{outline:2px solid #f3f3f3}");
  await expect(assertFocusVisibleRing(button)).rejects.toThrow();
});

test("a pointer-style focus is rejected, not waved through", async ({ page }) => {
  await page.setContent(`<style>button:focus-visible{outline:2px solid #1d4ed8}</style><button>Save</button>`);
  const button = page.getByRole("button", { name: "Save" });
  await button.click();
  await expect(assertFocusVisibleRing(button)).rejects.toThrow(/keyboard/);
});

test("a hairline ring fails", async ({ page }) => {
  const button = await pageWith(page, "button:focus-visible{outline:1px solid #1d4ed8}");
  await expect(assertFocusVisibleRing(button)).rejects.toThrow();
});

test.describe("the kit's own button", () => {
  const PAGE = "/docs/ui/trigger-actions-with-buttons";

  test("paints a real indicator on keyboard focus", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    const button = page.locator("[data-component-preview] [data-slot='button']").first();
    await focusWithKeyboard(button);
    await assertFocusVisibleRing(button);
  });

  test("fails once its indicator is removed", async ({ page }) => {
    await page.goto(PAGE, { waitUntil: "networkidle" });
    await page.addStyleTag({ content: "[data-slot='button']:focus-visible{outline:none!important;box-shadow:none!important}" });
    const button = page.locator("[data-component-preview] [data-slot='button']").first();
    await focusWithKeyboard(button);
    await expect(assertFocusVisibleRing(button)).rejects.toThrow();
  });
});

test.describe("controls whose own styles used to hide the ring", () => {
  test("home identity tabs, docs Preview/Code tabs and the hero selects paint a real indicator", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    await openHeroPage(page, "Apps");
    const tab = page.locator("[data-home-identity-looks]").getByRole("tab", { name: "Dev console" });
    await tab.scrollIntoViewIfNeeded();
    await focusWithKeyboard(tab);
    await assertFocusVisibleRing(tab);
    for (const name of ["Identity for this demo", "Color mode for this demo", "Table preview mode"]) {
      const select = page.getByRole("combobox", { name });
      await select.scrollIntoViewIfNeeded();
      await focusWithKeyboard(select);
      await assertFocusVisibleRing(select);
    }
    await page.goto("/docs/ui/trigger-actions-with-buttons", { waitUntil: "networkidle" });
    const preview = page.getByRole("tab", { name: "Preview" }).first();
    await focusWithKeyboard(preview);
    await assertFocusVisibleRing(preview);
  });

  // Each one is a control inside a container that scrolls or clips: the ring must be drawn, and drawn whole.
  const UNCLIPPED: { name: string; path: string; viewport?: number; find: (page: Page) => Locator }[] = [
    { name: "hero page entry", path: "/", find: (page) => page.locator("#demo").getByRole("navigation", { name: "Pages of the example app" }).getByRole("button", { name: "Calendar", exact: true }) },
    { name: "identity example tab", path: "/", find: (page) => page.locator("[data-home-identity-looks]").getByRole("tab", { name: /Dev console/ }) },
    { name: "docs Preview tab", path: "/docs/ui/trigger-actions-with-buttons", find: (page) => page.getByRole("tab", { name: "Preview" }).first() },
    { name: "editor Look select", path: "/features/identity-editor", find: (page) => page.getByLabel("Look", { exact: true }) },
    { name: "editor Preview dark", path: "/features/identity-editor", find: (page) => page.getByRole("button", { name: "Preview dark" }) },
    { name: "hero page chip on a phone", path: "/", viewport: 390, find: (page) => page.locator("#demo").getByRole("navigation", { name: "Pages of the example app" }).getByRole("button", { name: "Team", exact: true }) },
  ];
  for (const target of UNCLIPPED) {
    test(`${target.name}: focus shows and nothing clips it`, async ({ page }) => {
      await page.setViewportSize({ width: target.viewport ?? 1280, height: 900 });
      await page.goto(target.path, { waitUntil: "networkidle" });
      const control = target.find(page);
      await control.scrollIntoViewIfNeeded();
      await focusWithKeyboard(control);
      await assertFocusVisibleRing(control);
      await assertFocusUnclipped(control);
    });
  }

  test("forced colors keep drawing the focus outline", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/docs/ui/trigger-actions-with-buttons", { waitUntil: "networkidle" });
    const button = page.locator("[data-component-preview] [data-slot='button']").first();
    await focusWithKeyboard(button);
    const outline = await button.evaluate((el) => {
      const style = getComputedStyle(el);
      return { width: Number.parseFloat(style.outlineWidth), style: style.outlineStyle };
    });
    expect(outline.style).not.toBe("none");
    expect(outline.width).toBeGreaterThanOrEqual(2);
  });
});
