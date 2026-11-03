import { expect, test, type Page, type Route } from "@playwright/test";

import { assertA11yGate, assertFocusUnclipped, assertFocusVisibleRing, focusWithKeyboard } from "./a11y-helpers";

const BASE = "http://127.0.0.1:3100";
const EDITOR = `${BASE}/features/identity-editor`;
/** `#create` is how a visitor arrives to create: the assistant opens, with focus in its form. */
const OPEN = `${EDITOR}#create`;
const SERVICE = "**/api/identity/suggest";

const FONT_DISPLAY = '"Cormorant Variable", Cormorant, "Cormorant Variable Fallback", Georgia, serif';
const WARM = {
  spacing: "0.2rem",
  borderWidth: "1px",
  radius: "0.25rem",
  bodyLeading: "1.6",
  headingLeading: "1.05",
  headingTracking: "-0.01em",
  labelTracking: "0.12em",
  fontSans: '"Jost Variable", Jost, "Jost Variable Fallback", ui-sans-serif, system-ui, sans-serif',
  fontDisplay: FONT_DISPLAY,
  light: { background: "30 40% 96%", foreground: "20 20% 12%", primary: "14 55% 34%", primaryForeground: "30 40% 96%", accent: "14 45% 42%", border: "25 20% 52%", mutedForeground: "20 12% 32%" },
  dark: { background: "20 18% 8%", foreground: "30 35% 92%", primary: "20 70% 68%", primaryForeground: "20 18% 8%", accent: "20 30% 45%", border: "20 15% 40%", mutedForeground: "30 15% 70%" },
  shadowSm: "0 1px 2px hsl(20 20% 12% / 0.08)",
  shadowMd: "0 6px 16px -8px hsl(20 20% 12% / 0.2)",
};

type Posted = { requestId: string; prompt: string; history: unknown[]; references: string[]; current: Record<string, unknown> };

/** A scripted suggest service. Records every paid-work request; status calls are free and not counted. */
async function service(page: Page, reply: (posted: Posted, route: Route, index: number) => Promise<void> | void) {
  const posts: Posted[] = [];
  await page.route(`${SERVICE}/status`, (route) => route.fulfill({ status: 200, contentType: "application/json", json: { available: true } }));
  await page.route(SERVICE, async (route) => {
    const posted = route.request().postDataJSON() as Posted;
    posts.push(posted);
    await reply(posted, route, posts.length - 1);
  });
  return posts;
}

const ok = (posted: Posted, tokens: unknown = WARM, extra: Record<string, unknown> = {}) => ({
  status: 200,
  contentType: "application/json",
  json: { requestId: posted.requestId, summary: "Warmer paper, a serif display face, softer corners.", changed: ["radius", "fontDisplay"], references: [], tokens, ...extra },
});

/** The one text box: first it asks for the product, after the first exchange it asks what should change. */
async function brief(page: Page, text: string) {
  await page.locator("#identity-assistant-brief").fill(text);
}

test.describe("home closing scene", () => {
  test("invites, shows an example brief with a fake link as the placeholder, and sends nothing", async ({ page }) => {
    const posts = await service(page, (_p, route) => route.abort());
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(BASE, { waitUntil: "networkidle" });
    const scene = page.locator("#your-identity");
    await scene.scrollIntoViewIfNeeded();
    await expect(scene.getByRole("heading", { name: "And yours?", level: 3 })).toBeVisible();
    const field = scene.getByLabel("Your product and brand");
    await expect(field).toHaveValue("");
    expect(await field.getAttribute("placeholder")).toMatch(/hand-thrown ceramics[\s\S]*https:\/\/example\.com\//);
    await field.focus();
    await page.keyboard.type("A calm studio");
    await page.mouse.wheel(0, 400);
    expect(posts).toHaveLength(0);
  });

  test("Start creating opens the editor with the text in place, focused, and a way back; nothing is sent", async ({ page }) => {
    const posts = await service(page, (_p, route) => route.abort());
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(BASE, { waitUntil: "networkidle" });
    const scene = page.locator("#your-identity");
    await scene.scrollIntoViewIfNeeded();
    await scene.getByLabel("Your product and brand").fill("Film restoration. Like https://atelier-nord.example.org/ please.");
    await expect(scene.getByRole("list", { name: "Links found in your text" })).toContainText("atelier-nord.example.org");
    await scene.getByRole("button", { name: "Start creating" }).click();
    await page.waitForURL("**/features/identity-editor#create");
    const field = page.getByLabel("Your product and brand");
    await expect(field).toHaveValue("Film restoration. Like https://atelier-nord.example.org/ please.");
    await expect(field).toBeFocused();
    expect(posts).toHaveLength(0);
    await page.getByRole("link", { name: "← Back to the examples" }).click();
    await page.waitForURL("**/#identities");
  });

  test("a link in the text is shown, can be dropped, and http links are said not to be read", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    const scene = page.locator("#your-identity");
    await scene.scrollIntoViewIfNeeded();
    const field = scene.getByLabel("Your product and brand");
    await field.fill("Shop like https://a.example.org/ and http://old.example.org and https://b.example.org/");
    await expect(scene.getByRole("listitem")).toHaveCount(2);
    await expect(scene).toContainText("does not start with https://");
    await scene.getByRole("button", { name: "Stop reading a.example.org" }).click();
    await expect(scene.getByRole("listitem")).toHaveCount(1);
    await expect(field).not.toHaveValue(/a\.example\.org/);
  });
});

test.describe("the assistant folds away, and on a phone the conversation and the preview take turns", () => {
  test("it starts folded so the editor keeps its order; a click, #create or a brief from the home page opens it", async ({ page }) => {
    await service(page, (_posted, route) => route.abort());
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(EDITOR, { waitUntil: "networkidle" });
      const summary = page.getByText("Create an identity from a description");
      await expect(summary).toBeVisible();
      await expect(page.locator("#identity-assistant-brief")).toBeHidden();
      if (width < 640) expect((await summary.boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
      await summary.click();
      await expect(page.locator("#identity-assistant-brief")).toBeVisible();
      await page.goto(OPEN, { waitUntil: "networkidle" });
      await expect(page.locator("#identity-assistant-brief")).toBeFocused();
    }
  });

  test("390px: a proposal takes the visitor to the preview with focus; the way back is one tap; using it returns to the form", async ({ page }) => {
    const used = { url: "https://atelier-nord.example.org/", status: "used", analysis: "text-only", host: "atelier-nord.example.org", title: "Atelier Nord" };
    const posts = await service(page, (posted, route) => route.fulfill(ok(posted, WARM, { references: [used] })));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(OPEN, { waitUntil: "networkidle" });
    const views = page.getByRole("group", { name: "Conversation or preview" });
    const conversation = views.getByRole("button", { name: "Conversation" });
    const preview = views.getByRole("button", { name: "Preview" });
    await expect(conversation).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("[data-assistant-pane='preview']")).toBeHidden();
    await expect(page.getByText("This is your draft as it is now.")).toBeHidden();

    await brief(page, "A ceramics shop");
    await page.getByRole("button", { name: "Generate" }).click();
    await expect(page.locator("[data-assistant-proposal]")).toBeVisible();
    await expect(preview).toHaveAttribute("aria-pressed", "true");
    await expect(preview).toBeFocused();
    await expect(page.locator("[data-assistant-pane='conversation']")).toBeHidden();
    // What happened to the links qualifies the proposal, so it stays on screen when the conversation is hidden.
    await expect(page.locator("[data-assistant-reference-report]")).toContainText("Atelier Nord Read as text only");
    await expect(page.locator("[data-assistant-status]")).toContainText("A proposed look is ready.");
    // The switch is on screen after the change: nothing to scroll back for.
    const box = (await views.boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(844);

    await conversation.click();
    await expect(page.locator("#identity-assistant-brief")).toBeVisible();
    await expect(page.locator("[data-assistant-proposal]")).toBeHidden();
    await expect(preview.locator("[aria-hidden='true']")).toBeVisible();
    await preview.click();
    await expect(page.locator("[data-assistant-proposal]")).toBeVisible();

    await page.getByRole("button", { name: "Use this look" }).click();
    await expect(conversation).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#identity-assistant-brief")).toBeFocused();
    expect(posts).toHaveLength(1);

    await preview.click();
    await expect(page.getByText("This is your draft as it is now.")).toBeVisible();
  });

  test("an idle status line takes no room: no blank band between the switch and the form", async ({ page }) => {
    await service(page, (posted, route) => route.fulfill(ok(posted)));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(OPEN, { waitUntil: "networkidle" });
    const status = await page.locator("[data-assistant-status]").boundingBox();
    expect(status!.height).toBe(0);
    const views = (await page.getByRole("group", { name: "Conversation or preview" }).boundingBox())!;
    const label = (await page.getByText("Your product and brand").first().boundingBox())!;
    expect(label.y - (views.y + views.height), "the form follows the switch at one gap, not two").toBeLessThanOrEqual(24);
  });

  test("1440px: no switch, the conversation and the proposal are both on the page", async ({ page }) => {
    await service(page, (posted, route) => route.fulfill(ok(posted)));
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(OPEN, { waitUntil: "networkidle" });
    await expect(page.getByRole("group", { name: "Conversation or preview" })).toBeHidden();
    await brief(page, "A ceramics shop");
    await page.getByRole("button", { name: "Generate" }).click();
    await expect(page.locator("[data-assistant-proposal]")).toBeVisible();
    await expect(page.locator("#identity-assistant-brief")).toBeVisible();
  });
});

test.describe("the assistant in the editor", () => {
  test("paid work starts only on Generate: opening, scrolling, typing and focus send nothing", async ({ page }) => {
    const posts = await service(page, (posted, route) => route.fulfill(ok(posted)));
    await page.goto(OPEN, { waitUntil: "networkidle" });
    const field = page.getByLabel("Your product and brand");
    await field.focus();
    await field.fill("A ceramics shop");
    await page.mouse.wheel(0, 800);
    await page.keyboard.press("Tab");
    expect(posts).toHaveLength(0);
    await page.getByRole("button", { name: "Generate" }).click();
    await expect(page.locator("[data-assistant-proposal]")).toBeVisible();
    expect(posts).toHaveLength(1);
  });

  test("a brief becomes a proposal in light and dark; using it changes the draft only", async ({ page }) => {
    const posts = await service(page, (posted, route) =>
      route.fulfill(ok(posted, WARM, { references: [{ url: "https://atelier-nord.example.org/", status: "used", analysis: "text-only", host: "atelier-nord.example.org", title: "Atelier Nord" }, { url: "https://missing.example.org/", status: "failed", reason: "status-404" }] })),
    );
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(OPEN, { waitUntil: "networkidle" });
    const draftBefore = await page.locator("[data-slot='identity-editor-preview']").evaluate((node) => getComputedStyle(node).borderRadius);
    await brief(page, "Film restoration, https://atelier-nord.example.org/ and https://missing.example.org/");
    await page.getByRole("button", { name: "Generate" }).click();
    const proposal = page.locator("[data-assistant-proposal]");
    await expect(proposal.getByRole("group", { name: "Light" })).toBeVisible();
    await expect(proposal.getByRole("group", { name: "Dark" })).toBeVisible();
    expect(posts[0].references).toEqual(["https://atelier-nord.example.org/", "https://missing.example.org/"]);
    // Honest about the links: text only for the one that was read, a reason for the one that was not.
    const report = page.locator("[data-assistant-reference-report]");
    await expect(report).toContainText("Atelier Nord Read as text only. Pictures and layout are not analysed.");
    await expect(report).toContainText("missing.example.org Could not be used: the page answered with 404.");
    await expect(report).not.toContainText(/analysed visually|visual analysis/i);
    // Nothing is applied yet.
    expect(await page.locator("[data-slot='identity-editor-preview']").evaluate((node) => getComputedStyle(node).borderRadius)).toBe(draftBefore);
    await proposal.getByRole("button", { name: "Use this look" }).click();
    await expect(page.locator("[data-assistant-proposal]")).toHaveCount(0);
    await expect(page.getByLabel("Radius", { exact: true })).toHaveValue("0.25rem");
    await expect(page.locator("#identity-assistant-brief")).toBeFocused();
    await expect(page.locator("[data-assistant-thread]")).toContainText("Warmer paper");
    // A follow-up is a refinement and carries the exchange so far.
    await expect(page.getByRole("button", { name: "Refine" })).toBeVisible();
    await brief(page, "Rounder corners");
    await page.getByRole("button", { name: "Refine" }).click();
    await expect(page.locator("[data-assistant-proposal]")).toBeVisible();
    expect(posts).toHaveLength(2);
    expect(posts[1].history).toHaveLength(2);
    expect((posts[1].current as { radius: string }).radius).toBe("0.25rem");
  });

  test("a double press is one request", async ({ page }) => {
    const posts = await service(page, async (posted, route) => {
      await new Promise((done) => setTimeout(done, 600));
      await route.fulfill(ok(posted));
    });
    await page.goto(OPEN, { waitUntil: "networkidle" });
    await brief(page, "A ceramics shop");
    await page.getByRole("button", { name: "Generate" }).dblclick();
    await expect(page.locator("[data-assistant-proposal]")).toBeVisible();
    expect(posts).toHaveLength(1);
  });

  test("Cancel leaves the draft alone, and a late answer cannot bring the result back", async ({ page }) => {
    let release: () => void = () => {};
    const gate = new Promise<void>((done) => (release = done));
    await service(page, async (posted, route) => {
      await gate;
      await route.fulfill(ok(posted)).catch(() => {});
    });
    await page.goto(OPEN, { waitUntil: "networkidle" });
    await brief(page, "A ceramics shop");
    await page.getByRole("button", { name: "Generate" }).click();
    await expect(page.getByText("Working on it. Your current look is unchanged.")).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByText("Cancelled. Nothing changed.")).toBeVisible();
    release();
    await page.waitForTimeout(600);
    await expect(page.locator("[data-assistant-proposal]")).toHaveCount(0);
    await expect(page.getByLabel("Radius", { exact: true })).toHaveValue("0.5rem");
  });

  test("the last proposal stays while the next one fails, and a quota refusal says when to retry without promising an allowance", async ({ page }) => {
    await service(page, async (posted, route, index) => {
      if (index === 0) return route.fulfill(ok(posted));
      return route.fulfill({ status: 429, contentType: "application/json", headers: { "retry-after": "1800" }, json: { error: "quota", retryAfterSec: 1800 } });
    });
    await page.goto(OPEN, { waitUntil: "networkidle" });
    await brief(page, "A ceramics shop");
    await page.getByRole("button", { name: "Generate" }).click();
    await expect(page.locator("[data-assistant-proposal]")).toBeVisible();
    await page.getByRole("button", { name: "Generate" }).click();
    await expect(page.locator("[data-assistant-status]")).toContainText("The daily limit for the assistant has been reached. Try again in 30 minutes.");
    await expect(page.locator("[data-assistant-proposal]")).toBeVisible();
    await expect(page.locator("main")).not.toContainText(/remaining|left today|requests left/i);
  });

  test("an answer that is not a valid identity changes nothing and says so", async ({ page }) => {
    await service(page, (posted, route) => route.fulfill(ok(posted, { ...WARM, radius: "0.5rem; } body { display: none" })));
    await page.goto(OPEN, { waitUntil: "networkidle" });
    await brief(page, "A ceramics shop");
    await page.getByRole("button", { name: "Generate" }).click();
    await expect(page.locator("[data-assistant-status]")).toContainText("could not be used, so nothing changed");
    await expect(page.locator("[data-assistant-proposal]")).toHaveCount(0);
    await expect(page.getByLabel("Radius", { exact: true })).toHaveValue("0.5rem");
  });

  test("when the assistant is off, it says so and the presets and fields still work", async ({ page }) => {
    await page.route(`${SERVICE}/status`, (route) => route.fulfill({ status: 200, contentType: "application/json", json: { available: false, reason: "not-configured" } }));
    const posts: unknown[] = [];
    await page.route(SERVICE, (route) => (posts.push(1), route.abort()));
    await page.goto(OPEN, { waitUntil: "networkidle" });
    await expect(page.locator("[data-assistant-unavailable]")).toContainText("not set up here yet");
    await brief(page, "A ceramics shop");
    await expect(page.getByRole("button", { name: "Generate" })).toBeDisabled();
    await page.getByLabel("Spacing", { exact: true }).fill("0.3rem");
    await expect(page.getByLabel("Spacing", { exact: true })).toHaveValue("0.3rem");
    await page.getByLabel("Look").selectOption("press");
    await expect(page.getByLabel("Radius", { exact: true })).toHaveValue("0px");
    expect(posts).toHaveLength(0);
  });

  test("with no service at all (a static host), it is off and nothing breaks", async ({ page }) => {
    await page.route(`${SERVICE}/status`, (route) => route.fulfill({ status: 404, body: "" }));
    await page.goto(OPEN, { waitUntil: "networkidle" });
    await expect(page.locator("[data-assistant-unavailable]")).toContainText("not available here");
    await expect(page.getByLabel("Radius", { exact: true })).toBeVisible();
  });
});

test.describe("saved on this device", () => {
  // These tests are about storage, not the assistant: a dev server has no service, so say so quickly.
  test.beforeEach(async ({ page }) => {
    await page.route(`${SERVICE}/status`, (route) => route.fulfill({ status: 404, body: "" }));
  });

  test("a saved look comes back after a reload with its fonts", async ({ page }) => {
    await service(page, (posted, route) => route.fulfill(ok(posted)));
    await page.goto(OPEN, { waitUntil: "networkidle" });
    await brief(page, "A ceramics shop");
    await page.getByRole("button", { name: "Generate" }).click();
    await page.getByRole("button", { name: "Use this look" }).click();
    await expect(page.getByText("Saved on this device, in this browser. Nothing is uploaded.")).toBeVisible();
    await page.getByLabel("Name", { exact: true }).fill("Atelier");
    await page.getByRole("button", { name: "Save look" }).click();
    await expect(page.getByText("Saved on this device as “Atelier”.")).toBeVisible();
    await page.reload({ waitUntil: "networkidle" });
    await page.getByLabel("Look").selectOption({ label: "Atelier" });
    await expect(page.getByLabel("Radius", { exact: true })).toHaveValue("0.25rem");
    expect(await page.evaluate(() => (JSON.parse(localStorage.getItem("zk-identity-library") ?? "{}") as { version: number }).version)).toBe(2);
    expect(await page.evaluate(() => localStorage.getItem("zk-identity-library"))).toContain("Cormorant");
  });

  test("saving under a name that is taken asks first; it never replaces silently", async ({ page }) => {
    await page.goto(EDITOR, { waitUntil: "networkidle" });
    await page.getByLabel("Name", { exact: true }).fill("Atelier");
    await page.getByRole("button", { name: "Save look" }).click();
    await expect(page.getByText("Saved on this device as “Atelier”.")).toBeVisible();
    await page.getByLabel("Radius", { exact: true }).fill("2px");
    await page.getByLabel("Name", { exact: true }).fill("atelier");
    await page.getByRole("button", { name: "Save look" }).click();
    const clash = page.locator("[data-slot='identity-editor-clash']");
    await expect(clash).toContainText("“Atelier” is already saved on this device.");
    expect(await page.evaluate(() => (JSON.parse(localStorage.getItem("zk-identity-library") ?? "{}") as { items: { tokens: { radius: string } }[] }).items[0]?.tokens.radius)).toBe("0.5rem");
    await clash.getByRole("button", { name: "Save as “Atelier 2”" }).click();
    await expect(page.getByText("Saved on this device as “Atelier 2”.")).toBeVisible();
    expect(await page.evaluate(() => (JSON.parse(localStorage.getItem("zk-identity-library") ?? "{}") as { items: unknown[] }).items.length)).toBe(2);
  });

  test("a browser with no room or no storage says so in words", async ({ page }) => {
    await page.addInitScript(() => {
      const real = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key: string, value: string) {
        if (key === "zk-identity-library") throw Object.assign(new Error("quota"), { name: "QuotaExceededError" });
        return real.call(this, key, value);
      };
    });
    await page.goto(EDITOR, { waitUntil: "networkidle" });
    await page.getByLabel("Name", { exact: true }).fill("Atelier");
    await page.getByRole("button", { name: "Save look" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "no room left to save" })).toBeVisible();
  });

  test("corrupt saved data is reported and does not break the editor", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("zk-identity-library", "{not json"));
    await page.goto(EDITOR, { waitUntil: "networkidle" });
    await expect(page.getByText("Saved looks on this device could not be read")).toBeVisible();
    await expect(page.getByLabel("Radius", { exact: true })).toBeVisible();
  });

  test("applying to the whole site is explicit, and removing it puts the site back", async ({ page }) => {
    await page.goto(EDITOR, { waitUntil: "networkidle" });
    const before = await page.locator("html").evaluate((node) => getComputedStyle(node).getPropertyValue("--background").trim());
    await page.getByLabel("Background", { exact: true }).fill("0 80% 70%");
    await expect.poll(() => page.locator("html").evaluate((node) => getComputedStyle(node).getPropertyValue("--background").trim())).toBe(before);
    await page.getByRole("button", { name: "Apply to the whole site" }).click();
    await expect.poll(() => page.locator("html").evaluate((node) => getComputedStyle(node).getPropertyValue("--background").trim())).toBe("0 80% 70%");
    await page.getByRole("button", { name: "Remove from the whole site" }).click();
    await expect.poll(() => page.locator("html").evaluate((node) => getComputedStyle(node).getPropertyValue("--background").trim())).toBe(before);
    expect(await page.evaluate(() => localStorage.getItem("zk-docs-site-identity-opt-in"))).toBeNull();
  });
});

test.describe("fit and access", () => {
  for (const width of [320, 390, 768, 1440]) {
    test(`${width}px: no sideways scroll with a proposal on screen, controls reachable`, async ({ page }) => {
      await service(page, (posted, route) => route.fulfill(ok(posted)));
      await page.setViewportSize({ width, height: 900 });
      await page.goto(OPEN, { waitUntil: "networkidle" });
      await brief(page, "Film restoration, like https://atelier-nord.example.org/");
      await page.getByRole("button", { name: "Generate" }).click();
      await expect(page.locator("[data-assistant-proposal]")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
      const use = page.getByRole("button", { name: "Use this look" });
      await use.scrollIntoViewIfNeeded();
      await expect(use).toBeVisible();
      if (width < 640) expect((await use.boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
    });
  }

  test("the brief, Generate and the proposal actions work from the keyboard with visible focus", async ({ page }) => {
    await service(page, (posted, route) => route.fulfill(ok(posted)));
    await page.goto(OPEN, { waitUntil: "networkidle" });
    const field = page.getByLabel("Your product and brand");
    await focusWithKeyboard(field);
    await assertFocusVisibleRing(field);
    await page.keyboard.type("A ceramics shop");
    await page.keyboard.press("Control+Enter");
    await expect(page.locator("[data-assistant-proposal]")).toBeVisible();
    const use = page.getByRole("button", { name: "Use this look" });
    await focusWithKeyboard(use);
    await assertFocusVisibleRing(use);
    await assertFocusUnclipped(use);
    await page.keyboard.press("Enter");
    await expect(page.locator("#identity-assistant-brief")).toBeFocused();
  });

  for (const mode of ["light", "dark"] as const) {
    test(`the assistant and its proposal pass the a11y gate (${mode})`, async ({ page }) => {
      await page.addInitScript((theme) => localStorage.setItem("theme", theme), mode);
      await service(page, (posted, route) => route.fulfill(ok(posted)));
      await page.goto(OPEN, { waitUntil: "networkidle" });
      await assertA11yGate(page, "[data-slot='identity-assistant']");
      await brief(page, "A ceramics shop, like https://atelier-nord.example.org/");
      await page.getByRole("button", { name: "Generate" }).click();
      await expect(page.locator("[data-assistant-proposal]")).toBeVisible();
      await assertA11yGate(page, "[data-slot='identity-assistant']");
      await page.locator("[data-slot='identity-assistant']").screenshot({ path: `test-results/identity-creator-${mode}.png` });
    });
  }
});
