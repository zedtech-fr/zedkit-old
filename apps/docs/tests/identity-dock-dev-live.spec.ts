import { expect, test } from "@playwright/test";

const LIVE = process.env.DOCS_E2E_LIVE_DEV === "1";

test.describe("IdentityDock on dev (live suggest)", () => {
  test.skip(!LIVE, "Set DOCS_E2E_LIVE_DEV=1 and DOCS_E2E_BASE_URL=https://dev.zedkit.app");

  const dock = (page: import("@playwright/test").Page) => page.getByTestId("identity-dock");
  const brief = (page: import("@playwright/test").Page) => page.locator("#identity-assistant-brief");

  async function generateAndCapture(page: import("@playwright/test").Page, prompt: string) {
    const posts: { status: number; error?: string }[] = [];
    page.on("response", (response) => {
      if (!response.url().includes("/api/identity/suggest") || response.request().method() !== "POST") return;
      void response
        .json()
        .then((body) => posts.push({ status: response.status(), error: typeof body?.error === "string" ? body.error : undefined }))
        .catch(() => posts.push({ status: response.status() }));
    });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(dock(page)).toBeVisible();
    await page.keyboard.press("Control+I");
    await brief(page).fill(prompt);
    await page.getByRole("button", { name: "Generate", exact: true }).click();
    await expect
      .poll(() => posts.length, { timeout: 90_000 })
      .toBeGreaterThan(0);
    return posts[0]!;
  }

  test("1440: real generation returns 200 and a proposal", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const post = await generateAndCapture(page, "A calm SaaS dashboard with soft corners");
    expect(post, `suggest POST status=${post.status} error=${post.error ?? "none"}`).toMatchObject({ status: 200 });
    await expect(page.locator("[data-assistant-proposal]")).toBeVisible({ timeout: 5_000 });
  });

  test("390: real generation returns 200 and a proposal", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const post = await generateAndCapture(page, "A calm ceramics studio");
    expect(post, `suggest POST status=${post.status} error=${post.error ?? "none"}`).toMatchObject({ status: 200 });
    await expect(page.locator("[data-assistant-proposal]")).toBeVisible({ timeout: 5_000 });
  });

  test("accept, reload, tweak uses persisted preview tokens", async ({ page }) => {
    const posts: { current: { radius: string } }[] = [];
    page.on("response", (response) => {
      if (!response.url().includes("/api/identity/suggest") || response.request().method() !== "POST") return;
      void response
        .json()
        .then(() => {
          const body = response.request().postDataJSON() as { current: { radius: string } };
          posts.push(body);
        })
        .catch(() => {});
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(dock(page)).toBeVisible();
    await page.keyboard.press("Control+I");
    await expect(brief(page)).toBeVisible();
    await brief(page).fill("A ceramics studio with round corners");
    await page.getByRole("button", { name: "Generate", exact: true }).click();
    await expect(page.locator("[data-assistant-proposal]")).toBeVisible({ timeout: 90_000 });
    const beforeRadius = await page.evaluate(() =>
      getComputedStyle(document.querySelector("[data-demo-specimen]")!).getPropertyValue("--radius").trim(),
    );
    await page.getByRole("button", { name: "Use this look" }).click();
    const acceptedRadius = await page.evaluate(() => {
      const raw = window.localStorage.getItem("zk-identity-dock-v2");
      return raw ? (JSON.parse(raw) as { previewTokens?: { radius: string } }).previewTokens?.radius : null;
    });
    expect(acceptedRadius).toBeTruthy();
    await page.reload({ waitUntil: "domcontentloaded" });
    const afterReload = await page.evaluate(() =>
      getComputedStyle(document.querySelector("[data-demo-specimen]")!).getPropertyValue("--radius").trim(),
    );
    expect(afterReload).toBe(acceptedRadius);
    expect(afterReload).not.toBe(beforeRadius);
    await page.keyboard.press("Control+I");
    await brief(page).fill("Make it a bit calmer");
    await page.getByRole("button", { name: "Generate", exact: true }).click();
    await expect.poll(() => posts.length, { timeout: 90_000 }).toBe(2);
    expect(posts[1]!.current.radius).toBe(acceptedRadius);
  });
});
