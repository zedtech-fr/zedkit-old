import { expect, test, type Page } from "@playwright/test";

const SECTIONS = ["primitives", "overlays", "data-table", "layout", "loading", "forms", "wizard", "marketing"];

/** No sideways scroll: every section fits its viewport (mobile persona). */
async function expectNoOverflow(page: Page): Promise<void> {
  const offenders = await page.evaluate(() => {
    const bad: string[] = [];
    for (const section of document.querySelectorAll("section[id]")) {
      for (const el of section.querySelectorAll("*")) {
        const box = el.getBoundingClientRect();
        if (box.right > window.innerWidth + 1 || box.left < -1) {
          bad.push(`${section.id}: <${el.tagName.toLowerCase()}> overflows`);
          break;
        }
      }
    }
    return bad;
  });
  expect(offenders).toEqual([]);
}

test("data-animate pending hides with opacity only, and reduced motion keeps content visible", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    const el = document.createElement("p");
    el.id = "zk-animate-probe";
    el.setAttribute("data-animate", "fade-up");
    el.setAttribute("data-animate-state", "pending");
    el.textContent = "probe";
    document.body.append(el);
  });
  await expect(page.locator("#zk-animate-probe")).toHaveCSS("opacity", "0");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("#zk-animate-probe")).toHaveCSS("opacity", "1");
});

test("gallery renders every section with no errors (light)", async ({ page }) => {
  const problems: string[] = [];
  page.on("pageerror", (error) => problems.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(message.text());
  });
  await page.goto("/");
  for (const id of SECTIONS) {
    await expect(page.locator(`#${id}`)).toBeVisible();
  }
  await expect(page.locator("text=Page 1 of 0")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open dialog" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open drawer" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open sheet" })).toBeVisible();
  expect(problems).toEqual([]);
  await expectNoOverflow(page);
  await expect(page).toHaveScreenshot("gallery-light.png");
});

test("gallery renders the dark theme with no errors", async ({ page }) => {
  const problems: string[] = [];
  page.on("pageerror", (error) => problems.push(String(error)));
  await page.goto("/dark");
  await expect(page.locator("html.dark")).toHaveCount(1);
  for (const id of SECTIONS) {
    await expect(page.locator(`#${id}`)).toBeVisible();
  }
  expect(problems).toEqual([]);
  await expectNoOverflow(page);
  await expect(page).toHaveScreenshot("gallery-dark.png");
});

test.describe("mobile viewport", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("gallery renders the drawer triggers with no errors", async ({ page }) => {
    const problems: string[] = [];
    page.on("pageerror", (error) => problems.push(String(error)));
    await page.goto("/");
    await expect(page.locator("#overlays")).toBeVisible();
    await expect(page.getByRole("button", { name: "Open drawer" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Open sheet" })).toBeVisible();
    expect(problems).toEqual([]);
    await expectNoOverflow(page);
    await expect(page).toHaveScreenshot("gallery-mobile.png");
  });
});
