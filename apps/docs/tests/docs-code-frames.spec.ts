import { expect, test } from "@playwright/test";

const IDENTITIES = ["mist", "press", "tide", "volt", "maison", "glass"] as const;

test.use({ viewport: { width: 360, height: 740 } });

for (const identity of IDENTITIES) {
  test(`code blocks keep a single frame and scroll inside it (${identity}, 360px)`, async ({ page }) => {
    await page.addInitScript((id) => {
      localStorage.setItem("zk-docs-site-identity", id);
      localStorage.setItem("zk-docs-site-identity-opt-in", "1");
    }, identity);
    await page.goto("/docs/add-seo-to-nextjs");
    await expect(page.locator("html")).toHaveAttribute("data-identity", identity);
    const frame = page.locator("figure.shiki").first();
    await expect(frame).toBeVisible();
    const result = await frame.evaluate((figure) => {
      const pre = figure.querySelector("pre");
      const scroller = figure.querySelector('[role="region"]');
      const box = figure.getBoundingClientRect();
      const style = pre ? getComputedStyle(pre) : null;
      return {
        right: box.right,
        left: box.left,
        figureBorder: parseFloat(getComputedStyle(figure).borderTopWidth),
        preBorder: style ? parseFloat(style.borderTopWidth) : -1,
        preShadow: style?.boxShadow ?? "",
        scrolls: scroller ? scroller.scrollWidth >= scroller.clientWidth : false,
        docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    expect(result.figureBorder).toBeGreaterThan(0);
    expect(result.preBorder).toBe(0);
    expect(result.preShadow).toBe("none");
    expect(result.left).toBeGreaterThanOrEqual(0);
    expect(result.right).toBeLessThanOrEqual(360);
    expect(result.scrolls).toBe(true);
    expect(result.docOverflow).toBeLessThanOrEqual(0);
  });
}

// A component page stacks install tabs, an import line and the registry source: none of them may sit in a second frame.
for (const identity of IDENTITIES) {
  test(`component page code blocks have no frame inside a frame (${identity}, 390px)`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript((id) => {
      localStorage.setItem("zk-docs-site-identity", id);
      localStorage.setItem("zk-docs-site-identity-opt-in", "1");
    }, identity);
    await page.goto("/docs/ui/call-out-a-notice-or-an-error-state");
    await expect(page.locator("html")).toHaveAttribute("data-identity", identity);
    await expect(page.locator("figure.shiki").first()).toBeVisible();
    const nested = await page.evaluate(() => {
      const framed = (el: Element) => {
        const s = getComputedStyle(el);
        return parseFloat(s.borderTopWidth) > 0 && s.borderTopStyle !== "none" && s.borderTopColor !== "rgba(0, 0, 0, 0)";
      };
      return [...document.querySelectorAll("figure.shiki, [role='tabpanel'] figure, [role='tablist']")]
        .filter((el) => el.matches("figure") && framed(el))
        .filter((el) => {
          for (let parent = el.parentElement, depth = 0; parent && depth < 4; parent = parent.parentElement, depth += 1) {
            if (parent.tagName !== "MAIN" && framed(parent)) return true;
          }
          return false;
        }).length;
    });
    expect(nested).toBe(0);
  });
}
