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
