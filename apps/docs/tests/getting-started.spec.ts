import { expect, test } from "@playwright/test";

const BASE = "http://127.0.0.1:3100";

test("docs index and guides carry no production memo in visitor copy (#1096)", async ({ page }) => {
  const leaks = [
    "hand-written",
    "catalog.json",
    "apps/docs/",
    "prose/guides/snippets",
    "verify-",
    "docs:generate",
  ];
  for (const path of [
    "/docs",
    "/docs/getting-started",
    "/docs/add-seo-to-nextjs",
    "/docs/build-an-admin-dashboard",
    "/docs/set-up-your-coding-agents",
    "/docs/maturity-and-compatibility",
    "/docs/zedkit-and-shadcn",
  ]) {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    const text = (await page.locator("main").first().innerText()).toLowerCase();
    for (const leak of leaks) {
      expect(text, `${path} must not contain ${JSON.stringify(leak)}`).not.toContain(leak);
    }
  }
});

test("maturity page explains each badge on the page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/docs/maturity-and-compatibility`, { waitUntil: "networkidle" });
  const heading = page.getByRole("heading", { name: "What a badge means", level: 2 });
  await expect(heading).toBeVisible();
  await expect(page.getByText(/No badge = stable: semver-protected/)).toBeVisible();
  await expect(page.getByText(/Beta: tested, documented, accessible/)).toBeVisible();
  await expect(page.getByText(/Alpha: works, but the API can change/)).toBeVisible();
  await expect(page.getByRole("link", { name: "catalog README (Maturity)" })).toHaveCount(0);
  const counts = page.getByRole("heading", { name: "Current catalog counts", level: 2 });
  expect((await heading.boundingBox())!.y).toBeLessThan((await counts.boundingBox())!.y);
});

test("getting started is first stop from docs index", async ({ page }) => {
  await page.goto(`${BASE}/docs`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Start here" })).toBeVisible();
  const startLink = page.getByRole("link", { name: "Getting started" }).first();
  await startLink.click();
  await page.waitForURL("**/docs/getting-started", { timeout: 10000 });
  await expect(page.getByRole("heading", { name: "Quickstart" })).toBeVisible();
  await expect(page.getByText("zedkit-ai validate")).toBeVisible();
  await expect(page.getByText(/Pick one path below \(A through E, plus B′ for copied UI\)/)).toBeVisible();
  await expect(page.getByText(/Both end with something you can see/)).toHaveCount(0);
});

test("getting started leads with install and quickstart before audience guidance", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/docs/getting-started`, { waitUntil: "networkidle" });
  const headings = await page.locator("main h2").evaluateAll((elements) =>
    elements.map((el) => el.textContent?.replace(/Copy Anchor Link/g, "").trim() ?? ""),
  );
  expect(headings.indexOf("Install or copy")).toBeLessThan(headings.indexOf("Who this is for"));
  expect(headings.indexOf("Quickstart")).toBeLessThan(headings.indexOf("Who this is for"));
  await expect(page.getByText("pnpm add @zedtech/zedkit-ui").first()).toBeInViewport();
  const previewAboveAudience = await page.evaluate(() => {
    const preview = document.querySelector("[data-component-preview]");
    const who = [...document.querySelectorAll("main h2")].find((h) => h.textContent?.includes("Who this is for"));
    if (!preview || !who) return false;
    return preview.getBoundingClientRect().top < who.getBoundingClientRect().top;
  });
  expect(previewAboveAudience).toBe(true);
});

test("getting started documents install or copy paths", async ({ page }) => {
  await page.goto(`${BASE}/docs/getting-started#install-or-copy`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Install or copy", level: 2 })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Command" })).toBeVisible();
  await expect(page.getByText(/follow semver on packages at 1\.0\.0/i)).toBeVisible();
  await expect(page.getByText(/copied bricks are plain editable files/)).toBeVisible();
});

test("getting started lists a core npm quickstart path", async ({ page }) => {
  await page.goto(`${BASE}/docs/getting-started`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Path C — core helpers (npm only)", level: 3 })).toBeVisible();
  await expect(page.getByText("pnpm add @zedtech/zedkit-core")).toBeVisible();
});

test("getting started lists a server npm quickstart path", async ({ page }) => {
  await page.goto(`${BASE}/docs/getting-started`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Path D — server helpers (npm only)", level: 3 })).toBeVisible();
  await expect(page.getByText("pnpm add @zedtech/zedkit-server")).toBeVisible();
});

test("getting started lists a nest npm quickstart path", async ({ page }) => {
  await page.goto(`${BASE}/docs/getting-started`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Path E — Nest API (npm only)", level: 3 })).toBeVisible();
  await expect(page.getByText("pnpm add @zedtech/zedkit-nest")).toBeVisible();
});

test("getting started package table links SEO row to SEO scenario", async ({ page }) => {
  await page.goto(`${BASE}/docs/getting-started#choose-a-package`, { waitUntil: "networkidle" });
  const table = page
    .getByRole("table")
    .filter({ has: page.getByRole("columnheader", { name: "Typical first page" }) });
  await table.getByRole("link", { name: "SEO scenario" }).click();
  await expect(page.getByRole("heading", { name: "Scenario — SEO", level: 2 })).toBeVisible();
});

test("getting started package table links UI row to Quickstart paths B–B′", async ({ page }) => {
  await page.goto(`${BASE}/docs/getting-started#choose-a-package`, { waitUntil: "networkidle" });
  const table = page
    .getByRole("table")
    .filter({ has: page.getByRole("columnheader", { name: "Typical first page" }) });
  await table.getByRole("link", { name: "Quickstart paths B–B′" }).click();
  await expect(page.getByRole("heading", { name: "Quickstart", level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Path B — UI button (npm package)", level: 3 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Path B′ — UI button (shadcn registry)", level: 3 })).toBeVisible();
});

test("getting started package table links agents row to Quickstart path A", async ({ page }) => {
  await page.goto(`${BASE}/docs/getting-started#choose-a-package`, { waitUntil: "networkidle" });
  const table = page
    .getByRole("table")
    .filter({ has: page.getByRole("columnheader", { name: "Typical first page" }) });
  await table.getByRole("link", { name: "Quickstart path A" }).click();
  await expect(page.getByRole("heading", { name: "Quickstart", level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Path A — coding agents (about two minutes)", level: 3 })).toBeVisible();
});

test("getting started package table links backend row to Quickstart paths", async ({ page }) => {
  await page.goto(`${BASE}/docs/getting-started#choose-a-package`, { waitUntil: "networkidle" });
  const table = page
    .getByRole("table")
    .filter({ has: page.getByRole("columnheader", { name: "Typical first page" }) });
  await table.getByRole("link", { name: "Quickstart paths C–E" }).click();
  await expect(page.getByRole("heading", { name: "Quickstart", level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Path C — core helpers (npm only)", level: 3 })).toBeVisible();
});

test("getting started install cards keep their explanation visible at phone widths", async ({ page }) => {
  for (const width of [320, 360, 390] as const) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`${BASE}/docs/getting-started#install-or-copy`, { waitUntil: "networkidle" });
    const host = page
      .locator("[data-docs-table]")
      .filter({ has: page.getByRole("columnheader", { name: "Command" }) });
    await host.scrollIntoViewIfNeeded();
    const clipped = await host.evaluate((node) => {
      const hostRect = node.getBoundingClientRect();
      const overflowX = getComputedStyle(node).overflowX;
      const hits: string[] = [];
      if (overflowX === "clip" || overflowX === "hidden") {
        const table = node.querySelector("table");
        if (table && table.scrollWidth > node.clientWidth + 1) {
          hits.push("parent clip hides table");
        }
      }
      for (const cell of node.querySelectorAll("td")) {
        const text = (cell.textContent ?? "").trim().slice(0, 48);
        const rect = cell.getBoundingClientRect();
        if (rect.right > hostRect.right + 1 && overflowX !== "auto" && overflowX !== "scroll") {
          hits.push(text);
        }
      }
      return { overflowX, hits };
    });
    expect(clipped.hits, `${width}px ${JSON.stringify(clipped)}`).toEqual([]);
    await expect(host.getByRole("link", { name: "Updating copied files" })).toBeVisible();
    await host.getByRole("link", { name: "Updating copied files" }).focus();
    await expect(host.getByRole("link", { name: "Updating copied files" })).toBeFocused();
  }
});

test("getting started package cards fit the viewport at phone widths", async ({ page }) => {
  for (const width of [320, 360, 390] as const) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`${BASE}/docs/getting-started#choose-a-package`, { waitUntil: "networkidle" });
    const host = page
      .locator("[data-docs-table]")
      .filter({ has: page.getByRole("columnheader", { name: "Typical first page" }) });
    await host.scrollIntoViewIfNeeded();
    const clipped = await host.evaluate((node) => {
      const hostRect = node.getBoundingClientRect();
      const overflowX = getComputedStyle(node).overflowX;
      const hits: string[] = [];
      if (overflowX === "clip" || overflowX === "hidden") {
        const table = node.querySelector("table");
        if (table && table.scrollWidth > node.clientWidth + 1) {
          hits.push("parent clip hides table");
        }
      }
      for (const row of node.querySelectorAll("tbody tr")) {
        const rect = row.getBoundingClientRect();
        if (rect.right > hostRect.right + 1 || rect.left < hostRect.left - 1) {
          hits.push((row.textContent ?? "").trim().slice(0, 40));
        }
      }
      return { overflowX, hits, hostWidth: hostRect.width, tableWidth: node.querySelector("table")?.scrollWidth ?? 0 };
    });
    expect(clipped.hits, `${width}px ${JSON.stringify(clipped)}`).toEqual([]);
    expect(clipped.tableWidth).toBeLessThanOrEqual(clipped.hostWidth + 1);
  }
});

test("getting started package table keeps a decorative area icon", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/docs/getting-started#choose-a-package`, { waitUntil: "networkidle" });
  const table = page
    .getByRole("table")
    .filter({ has: page.getByRole("columnheader", { name: "Typical first page" }) });
  for (const name of ["UI", "Core & server", "SEO", "Coding agents"] as const) {
    await expect(table.getByRole("cell", { name, exact: true }).locator("svg[aria-hidden='true']")).toHaveCount(1);
  }
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(true);
});

test.describe("getting started package table light/dark (#753)", () => {
  for (const mode of ["light", "dark"] as const) {
    test(`mist ${mode}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.addInitScript((theme) => {
        localStorage.setItem("zk-docs-site-identity", "mist");
        localStorage.setItem("zk-docs-site-identity-opt-in", "1");
        localStorage.setItem("theme", theme);
      }, mode);
      await page.goto(`${BASE}/docs/getting-started#choose-a-package`, { waitUntil: "networkidle" });
      const table = page
        .getByRole("table")
        .filter({ has: page.getByRole("columnheader", { name: "Typical first page" }) });
      await table.scrollIntoViewIfNeeded();
      await expect(table.getByRole("cell", { name: "UI", exact: true })).toBeVisible();
      await table.screenshot({ path: `test-results/getting-started-packages-${mode}.png` });
    });
  }
});

test("getting started next steps tutorials follow choose-a-package table order", async ({ page }) => {
  await page.goto(`${BASE}/docs/getting-started`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Next steps", level: 2 }).scrollIntoViewIfNeeded();
  const titles = await page.getByRole("heading", { name: "Next steps", level: 2 }).evaluate((heading) => {
    const item = [...heading.parentElement!.querySelectorAll("li")].find((li) =>
      li.textContent?.includes("Tutorials"),
    );
    return [...(item?.querySelectorAll("a") ?? [])].map((anchor) => anchor.textContent?.trim() ?? "");
  });
  expect(titles).toEqual([
    "Build an admin dashboard",
    "Start a safe NestJS API",
    "Add SEO to a Next.js app",
    "Set up your coding agents",
    "zedkit and shadcn/ui",
  ]);
});

test("getting started scenarios follow choose-a-package table order", async ({ page }) => {
  await page.goto(`${BASE}/docs/getting-started`, { waitUntil: "networkidle" });
  const order = await page.locator("main h2").evaluateAll((elements) =>
    elements
      .map((el) => el.textContent?.replace(/Copy Anchor Link/g, "").trim() ?? "")
      .filter((text) => text.startsWith("Scenario —")),
  );
  expect(order).toEqual([
    "Scenario — UI",
    "Scenario — backend",
    "Scenario — SEO",
    "Scenario — coding agents",
  ]);
});

test("getting started includes UI, backend, agents, and SEO scenarios", async ({ page }) => {
  await page.goto(`${BASE}/docs/getting-started`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Scenario — coding agents", level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Scenario — backend", level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Scenario — SEO", level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Scenario — UI", level: 2 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start a safe NestJS API" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Add SEO to a Next.js app" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Build an admin dashboard" }).first()).toBeVisible();
});

test("getting started troubleshooting mentions server env boot failures", async ({ page }) => {
  await page.goto(`${BASE}/docs/getting-started`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Troubleshooting", level: 2 }).scrollIntoViewIfNeeded();
  const row = page.getByRole("row", { name: /Boot fails on bad process\.env/ });
  await expect(row).toBeVisible();
  await expect(row.getByRole("link", { name: "Fail fast on bad environment variables" })).toBeVisible();
  await expect(row.getByRole("link", { name: "Start a safe NestJS API" })).toBeVisible();
});

test("getting started links to a catalog page", async ({ page }) => {
  await page.goto(`${BASE}/docs/getting-started`, { waitUntil: "networkidle" });
  await page
    .getByRole("main")
    .getByRole("link", { name: "AI setup catalog page", exact: true })
    .click();
  await page.waitForURL("**/docs/ai/**", { timeout: 10000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
