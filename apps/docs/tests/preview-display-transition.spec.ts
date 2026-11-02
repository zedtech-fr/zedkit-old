import { expect, test, type Locator } from "@playwright/test";

const PAGE = "/docs/ui/trigger-actions-with-buttons";

async function layout(preview: Locator) {
  return preview.evaluate((root) => {
    const tabs = root.querySelector("[role='tablist']")!.getBoundingClientRect();
    const row = root.querySelector<HTMLElement>("[data-preview-display]")!;
    const rect = row.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    // The Full/Mobile width switch is a desktop control (hidden on a phone by design).
    const controls = [...row.querySelectorAll("select, button")]
      .filter((node) => node.checkVisibility())
      .map((node) => {
        const box = node.getBoundingClientRect();
        return { visible: box.width > 0 && box.height > 0, inView: box.left >= 0 && box.right <= vw };
      });
    return {
      beside: Math.abs(rect.top - tabs.top) < 40,
      rowWidth: rect.width,
      vw,
      controls,
      pageOverflow: document.documentElement.scrollWidth - vw,
      toggleVisible: [...root.querySelectorAll("button")].some(
        (button) => button.textContent === "Display" && button.getBoundingClientRect().width > 0,
      ),
    };
  });
}

test("Display opened on a phone keeps an intentional layout when the window widens", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(PAGE, { waitUntil: "networkidle" });
  const preview = page.locator("[data-component-preview]").first();
  await preview.scrollIntoViewIfNeeded();
  const toggle = preview.getByRole("button", { name: "Display", exact: true });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  const phone = await layout(preview);
  expect(phone.controls).toHaveLength(4);
  expect(phone.controls.every((control) => control.visible && control.inView)).toBe(true);
  expect(phone.pageOverflow).toBeLessThanOrEqual(1);

  for (const width of [768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const wide = await layout(preview);
    expect(wide.toggleVisible, `${width}px: the toggle is a phone control`).toBe(false);
    // Tablet widths may wrap the row under the tabs (fonts decide); from 1024 it sits beside them.
    if (width >= 1024) {
      expect(wide.beside, `${width}px: controls share the tab row`).toBe(true);
      expect(wide.rowWidth, `${width}px: the row hugs its controls`).toBeLessThan(wide.vw * 0.8);
    }
    expect(wide.controls, `${width}px: style, width and mode controls`).toHaveLength(6);
    expect(wide.controls.every((control) => control.visible && control.inView), `${width}px: reachable`).toBe(true);
    await preview.getByLabel("Style of this demo").selectOption("press");
    await expect(preview.locator("[data-preview-surface]")).toHaveAttribute("data-identity", "press");
    await preview.getByLabel("Style of this demo").selectOption("mist");
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  // The row settles into place over a transition; the assertion is about where it ends up, so it waits for
  // that (a read taken during the move saw the controls at x=283..423 of a 390px screen).
  await expect
    .poll(async () => {
      const back = await layout(preview);
      return back.controls.length === 4 && back.controls.every((control) => control.visible && control.inView);
    }, { message: "the four phone controls are back in view once the row has settled" })
    .toBe(true);
});
