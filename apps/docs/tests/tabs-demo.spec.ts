import { expect, test } from "@playwright/test";

const URL = "http://127.0.0.1:3100/docs/ui/switch-between-tabbed-panels";
const IDENTITIES = ["mist", "press", "tide", "volt", "maison", "glass"] as const;

test.describe("tabs page shows a live preview for each example", () => {
  for (const identity of IDENTITIES) {
    for (const mode of ["light", "dark"] as const) {
      for (const [device, width, height] of [
        ["desktop", 1280, 1000],
        ["phone", 390, 844],
      ] as const) {
        test(`${device} ${identity} ${mode}`, async ({ page }) => {
          await page.setViewportSize({ width, height });
          await page.addInitScript(
            ([i, m]) => {
              localStorage.setItem("zk-docs-site-identity", i!);
              localStorage.setItem("zk-docs-site-identity-opt-in", "1");
              localStorage.setItem("theme", m!);
            },
            [identity, mode],
          );
          await page.goto(URL, { waitUntil: "networkidle" });

          const previews = page.locator("[data-component-preview]");
          await expect(previews).toHaveCount(2);

          // Project page: Overview is open first, Tasks and Activity are one click away.
          const project = previews.nth(0);
          await project.scrollIntoViewIfNeeded();
          await expect(project.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
          await expect(project.getByText("Design review, 3 November")).toBeVisible();
          await project.getByRole("tab", { name: "Tasks" }).click();
          await expect(project.getByText("Case study pages")).toBeVisible();
          await expect(project.getByText("Design review, 3 November")).toBeHidden();
          await project.getByRole("tab", { name: "Activity" }).click();
          await expect(project.getByText("closed “Homepage layout”")).toBeVisible();

          // Controlled example: a button outside the tabs drives them.
          const controlled = previews.nth(1);
          await controlled.scrollIntoViewIfNeeded();
          await expect(controlled.getByText("Showing: Week")).toBeVisible();
          await expect(controlled.getByText("Week 44: 31 appointments")).toBeVisible();
          await controlled.getByRole("button", { name: "Jump to the month" }).click();
          await expect(controlled.getByRole("tab", { name: "Month" })).toHaveAttribute("aria-selected", "true");
          await expect(controlled.getByText("Showing: Month")).toBeVisible();
          await controlled.getByRole("tab", { name: "Day" }).click();
          await expect(controlled.getByText("Showing: Day")).toBeVisible();

          const sideways = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          );
          expect(sideways).toBeLessThanOrEqual(1);
          await project.getByRole("tab", { name: "Tasks" }).click();
          await project.screenshot({ path: `test-results/tabs-${identity}-${mode}-${device}.png` });
          await controlled.screenshot({ path: `test-results/tabs-controlled-${identity}-${mode}-${device}.png` });
        });
      }
    }
  }
});
