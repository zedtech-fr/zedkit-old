import type { Page } from "@playwright/test";

export type HeroPageName = "Overview" | "Apps" | "Calendar" | "Team" | "Settings";

/**
 * Shows one page of the hero's example app by its sidebar entry (the chips in the top bar on a phone).
 * The first real press also ends the guided tour, so the page stays where the test put it.
 */
export async function openHeroPage(page: Page, name: HeroPageName): Promise<void> {
  await page
    .locator("#demo")
    .getByRole("navigation", { name: "Pages of the example app" })
    .getByRole("button", { name, exact: true })
    .click();
}

/**
 * Waits for the entrances in the hero to be over, so checks that read colours do not catch a page half faded in.
 * Loops (the floating cards) and scroll-driven motion never end, so they do not count.
 */
export async function settleHero(page: Page): Promise<void> {
  await page.waitForFunction(() =>
    (document.querySelector("#demo")?.getAnimations({ subtree: true }) ?? []).every(
      (animation) =>
        animation.timeline !== document.timeline || animation.effect?.getComputedTiming().iterations === Infinity,
    ),
  );
}
