import { expect, test, type Locator, type Page } from "@playwright/test";

import { assertA11yGate } from "./a11y-helpers";

const BASE = "http://127.0.0.1:3100/docs/ui";
const IDENTITY_KIT_DEMOS = "/features/identity-kit-demos";
const IDENTITIES = ["mist", "press", "tide", "volt", "maison", "glass"] as const;
const SCENES = "pin-a-stage-and-change-scene-as-the-page-scrolls";

async function openDocs(page: Page, slug: string, identity: string, mode: string) {
  await page.addInitScript(
    ([i, m]) => {
      localStorage.setItem("zk-docs-site-identity", i!);
      localStorage.setItem("zk-docs-site-identity-opt-in", "1");
      localStorage.setItem("theme", m!);
    },
    [identity, mode],
  );
  await page.goto(`${BASE}/${slug}`, { waitUntil: "networkidle" });
}

async function openFeatures(page: Page, path: string, identity: string, mode: string) {
  await page.addInitScript(
    ([i, m]) => {
      localStorage.setItem("zk-docs-site-identity", i!);
      localStorage.setItem("zk-docs-site-identity-opt-in", "1");
      localStorage.setItem("theme", m!);
    },
    [identity, mode],
  );
  await page.goto(`http://127.0.0.1:3100${path}`, { waitUntil: "networkidle" });
}

async function noSidewaysScroll(page: Page) {
  const sideways = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(sideways).toBeLessThanOrEqual(1);
}

/**
 * Scroll through one pinned track and return, for each sample, the id of the
 * scene that is fully visible (opacity above 0.9) and whether the visual sits
 * inside the window.
 */
async function sampleTrack(page: Page, track: Locator, samples: number) {
  const box = await track.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return { top: rect.top + window.scrollY, height: rect.height };
  });
  const viewport = page.viewportSize()!;
  const travel = box.height - viewport.height;
  const seen: Array<{ active: string | null; inside: boolean }> = [];
  for (let step = 0; step <= samples; step += 1) {
    const y = box.top + (travel * step) / samples - 1;
    await page.evaluate((to) => window.scrollTo(0, to), Math.max(0, Math.round(y)));
    await page.waitForTimeout(200);
    seen.push(
      await track.evaluate((el, height) => {
        const scenes = [...el.querySelectorAll<HTMLElement>("[data-scroll-scene]")];
        const active = scenes.find((scene) => Number(getComputedStyle(scene).opacity) > 0.9);
        const visual = active?.querySelector<HTMLElement>("[data-scroll-scene-visual]");
        const rect = visual?.getBoundingClientRect();
        return {
          active: active?.getAttribute("data-scroll-scene") ?? null,
          inside: rect ? rect.top >= 0 && rect.bottom <= height : false,
        };
      }, viewport.height),
    );
  }
  return seen;
}

test.describe("scroll scenes previews", () => {
  for (const identity of IDENTITIES) {
    for (const mode of ["light", "dark"] as const) {
      for (const [device, width, height] of [
        ["desktop", 1280, 1000],
        ["phone", 390, 844],
      ] as const) {
        test(`${device} ${identity} ${mode}`, async ({ page }) => {
          await page.setViewportSize({ width, height });
          await openDocs(page, SCENES, identity, mode);
          const previews = page.locator("[data-component-preview]");
          await expect(previews).toHaveCount(4);

          const supported = await page.evaluate(() => CSS.supports("animation-timeline: view()"));
          const tour = previews.nth(0).locator("[data-scroll-scenes]");
          await expect(tour).toHaveAttribute("data-scene-count", "3");
          await expect(tour.locator("[data-scroll-scene]")).toHaveCount(3);
          await expect(tour.getByRole("heading", { level: 2 })).toHaveCount(3);
          for (const visual of await tour.locator("[data-demo-scene-visual]").all()) {
            await expect(visual).toHaveAttribute("aria-hidden", "true");
            await expect(visual).toHaveJSProperty("inert", true);
          }

          if (supported) {
            const seen = await sampleTrack(page, tour, 8);
            expect(seen[0]!.active).toBe("plan");
            expect(seen[seen.length - 1]!.active).toBe("ship");
            const order = seen.map((sample) => sample.active).filter((id) => id !== null);
            expect(new Set(order)).toEqual(new Set(["plan", "track", "ship"]));
            const rank = order.map((id) => ["plan", "track", "ship"].indexOf(id!));
            expect(rank).toEqual([...rank].sort((a, b) => a - b));
            for (const sample of seen) {
              if (sample.active) expect(sample.inside).toBe(true);
            }
          }

          const shot = identity === "mist" || identity === "volt";
          if (shot && supported) {
            const box = await tour.evaluate((el) => {
              const rect = el.getBoundingClientRect();
              return { top: rect.top + window.scrollY, height: rect.height };
            });
            for (const [name, fraction] of [["plan", 0.02], ["track", 0.5], ["ship", 0.98]] as const) {
              await page.evaluate(
                (to) => window.scrollTo(0, to),
                Math.round(box.top + (box.height - height) * fraction),
              );
              await page.waitForTimeout(300);
              await page.screenshot({
                path: `test-results/scroll-scenes-${name}-${identity}-${mode}-${device}.png`,
              });
            }
          }

          const beforeAfter = previews.nth(1).locator("[data-scroll-scenes]");
          await expect(beforeAfter).toHaveAttribute("data-scene-count", "2");
          if (supported) {
            const seen = await sampleTrack(page, beforeAfter, 6);
            expect(seen[0]!.active).toBe("before");
            expect(seen[seen.length - 1]!.active).toBe("after");
          }

          const looks = previews.nth(2).locator("[data-scroll-scenes]");
          await expect(looks).toHaveAttribute("data-scene-count", "3");
          await expect(looks.locator("[data-scroll-scene]")).toHaveCount(3);
          const pricing = previews.nth(3).locator("[data-scroll-scenes]");
          await expect(pricing).toHaveAttribute("data-scene-count", "3");
          await expect(pricing.getByText("$29")).toBeVisible();

          await page.evaluate(() => window.scrollTo(0, 0));
          await assertA11yGate(page, "[data-component-preview]");
          await noSidewaysScroll(page);
        });
      }
    }
  }

  test("reduced motion stacks the scenes with the same content", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openDocs(page, SCENES, "mist", "light");
    const tour = page.locator("[data-component-preview]").nth(0).locator("[data-scroll-scenes]");
    for (const scene of await tour.locator("[data-scroll-scene]").all()) {
      await expect(scene).toHaveCSS("opacity", "1");
      await expect(scene.getByRole("heading", { level: 2 })).toBeVisible();
    }
    await assertA11yGate(page, "[data-component-preview]");
  });
});

test.describe("identity previews", () => {
  for (const identity of IDENTITIES) {
    for (const mode of ["light", "dark"] as const) {
      for (const [device, width, height] of [
        ["desktop", 1280, 1000],
        ["phone", 390, 844],
      ] as const) {
        test(`${device} ${identity} ${mode}`, async ({ page }) => {
          await page.setViewportSize({ width, height });
          await openFeatures(page, IDENTITY_KIT_DEMOS, identity, mode);
          const previews = page.locator("[data-component-preview]");
          await expect(previews).toHaveCount(3);
          const html = page.locator("html");
          await expect(html).toHaveAttribute("data-identity", identity);

          // Live switcher: the whole page follows, only the demo key is written.
          const live = previews.nth(0);
          await live.scrollIntoViewIfNeeded();
          const select = live.getByRole("combobox", { name: "Look" });
          await expect(select).toHaveValue(identity);
          const target = IDENTITIES[(IDENTITIES.indexOf(identity) + 1) % IDENTITIES.length]!;
          await select.selectOption(target);
          await expect(html).toHaveAttribute("data-identity", target);
          await expect(live.getByRole("status")).toContainText(
            `Current look: ${target[0]!.toUpperCase()}${target.slice(1)}`,
          );
          expect(await page.evaluate(() => localStorage.getItem("harbor-demo-identity"))).toBe(target);
          expect(await page.evaluate(() => localStorage.getItem("zk-docs-site-identity"))).toBe(identity);
          await assertA11yGate(page, "[data-component-preview]");
          await select.selectOption(identity);
          await expect(html).toHaveAttribute("data-identity", identity);
          await live.screenshot({ path: `test-results/identity-header-${identity}-${mode}-${device}.png` });

          // Scoped looks: six cards, six different looks, the page untouched.
          const scoped = previews.nth(1);
          await scoped.scrollIntoViewIfNeeded();
          const cards = scoped.locator("[data-demo-scope]");
          await expect(cards).toHaveCount(6);
          await cards.first().getByRole("button", { name: "Save" }).click();
          await expect(cards.first().getByRole("status")).toHaveText("Saved");
          await cards.first().getByRole("button", { name: "Cancel" }).click();
          await expect(cards.first().getByRole("status")).toHaveText("New");
          const signatures = await cards.evaluateAll((nodes) =>
            nodes.map((node) => {
              const save = node.querySelector("button")!;
              const title = node.querySelector("h2")!;
              return `${getComputedStyle(save).backgroundColor}|${getComputedStyle(title).fontFamily}|${getComputedStyle(node).borderRadius}`;
            }),
          );
          expect(new Set(signatures).size).toBe(6);
          await expect(html).toHaveAttribute("data-identity", identity);
          await assertA11yGate(page, "[data-component-preview]");
          await scoped.screenshot({ path: `test-results/identity-scope-${identity}-${mode}-${device}.png` });

          // Touch picker: sheet, radio group, live status line.
          const picker = previews.nth(2);
          await picker.scrollIntoViewIfNeeded();
          await expect(picker.getByRole("status")).toHaveText("Nothing chosen yet.");
          await picker.getByRole("button", { name: /^Look: / }).click();
          const sheet = page.getByRole("dialog");
          await expect(sheet.getByRole("radiogroup", { name: "Look" })).toBeVisible();
          await expect(sheet.getByRole("radio")).toHaveCount(3);
          await sheet.getByRole("radio", { name: /^Tide/ }).click();
          await expect(html).toHaveAttribute("data-identity", "tide");
          await expect(sheet.getByRole("radio", { name: /^Tide/ })).toHaveAttribute("aria-checked", "true");
          await page.keyboard.press("Escape");
          await expect(sheet).toHaveCount(0);
          await expect(picker.getByRole("status")).toHaveText("Chosen: tide");
          await picker.screenshot({ path: `test-results/identity-picker-${identity}-${mode}-${device}.png` });
          await noSidewaysScroll(page);
        });
      }
    }
  }

  test("leaving the page restores the page look", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1000 });
    await openFeatures(page, IDENTITY_KIT_DEMOS, "press", "light");
    const live = page.locator("[data-component-preview]").nth(0);
    // Wait for hydration: the server renders the fallback look, the hydrated
    // store reports the page look. Selecting earlier loses the change when
    // hydration resets the controlled select.
    await expect(live.getByRole("status")).toHaveText(/Current look:\s*Press/);
    await live.getByRole("combobox", { name: "Look" }).selectOption("volt");
    await expect(page.locator("html")).toHaveAttribute("data-identity", "volt");
    await page.locator(`a[href$="/${SCENES}"]`).first().click();
    await page.waitForURL(`**/${SCENES}`);
    await expect(page.locator("html")).toHaveAttribute("data-identity", "press");
  });
});
