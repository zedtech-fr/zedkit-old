import { expect, test } from "@playwright/test";

const WIDTHS = [320, 375, 768, 1024, 1440] as const;
const PAGES = [
  "/",
  "/catalog",
  "/docs/getting-started",
  "/docs/ui/trigger-actions-with-buttons",
  "/docs/ui/show-a-sortable-filterable-paginated-data-table",
  "/docs/ui/open-modal-dialogs",
] as const;

for (const width of WIDTHS) {
  for (const path of PAGES) {
    test(`${path} fits ${width}px: no page overflow, primary preview not clipped`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path, { waitUntil: "networkidle" });
      const sideways = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(sideways).toBeLessThanOrEqual(1);

      if (path.startsWith("/docs/ui/") || path === "/") {
        await expect(page.locator("[data-component-preview], [data-home-hero-preview]").first()).toBeAttached();
      }

      // Essential content: every visible control in the first preview/hero sits inside the viewport width.
      const clipped = await page.evaluate((w) => {
        const root = document.querySelector("[data-component-preview], [data-home-hero-preview]");
        if (!root) return [];
        const controls = [...root.querySelectorAll("button, a, input, [role='combobox']")]
          .filter((el) => {
            const box = el.getBoundingClientRect();
            if (box.width === 0 || box.height === 0) return false;
            if (el.closest("[data-preview-code-panel], [hidden], [inert], [aria-hidden='true']")) return false;
            // Wide data may scroll in its own region; the control still must be reachable.
            if (el.closest("[class*='overflow-x'], [data-slot='table-container'], [role='region']")) return false;
            return box.left < -1 || box.right > w + 1;
          })
          .map((el) => (el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 40));
        return controls;
      }, width);
      expect(clipped).toEqual([]);
    });
  }
}
