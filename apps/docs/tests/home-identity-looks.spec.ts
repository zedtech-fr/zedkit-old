import { expect, test, type Locator, type Page } from "@playwright/test";

import { assertA11yGate } from "./a11y-helpers";

/** Each identity is shown as its own product screen; the tab leads with the product, the identity follows. */
const IDENTITIES = [
  { id: "mist", name: "Mist", product: "Dev console", heading: "Project settings", action: "Save changes" },
  { id: "press", name: "Press", product: "Newsroom", heading: "Today's desk", action: "Publish" },
  { id: "tide", name: "Tide", product: "Invoicing", heading: "Invoices", action: "Send reminder: Studio Nord" },
  { id: "volt", name: "Volt", product: "Incidents", heading: "Incidents", action: "Acknowledge: p95 latency 1.8 s for 5 min" },
  { id: "maison", name: "Maison", product: "Bag shop", heading: "The autumn collection", action: "Save piece" },
  { id: "glass", name: "Glass", product: "SaaS app", heading: "Usage", action: "Invite teammate" },
] as const;

/** The examples arrive with a short entrance; checks that read colours or positions wait for it to be over. */
async function settle(looks: Locator) {
  await looks.evaluate(
    (node) =>
      new Promise<void>((resolve) => {
        const done = () => node.getAnimations({ subtree: true }).every((animation) => animation.effect?.getComputedTiming().iterations === Infinity);
        const tick = () => (done() ? resolve() : requestAnimationFrame(tick));
        tick();
      }),
  );
}

/**
 * Opens the section at its top, above the pinned stretch, so the first example is the first one. Where the examples
 * follow the scroll (wide, tall, motion allowed), scrolling to the middle of the section would pick one by position.
 */
async function openLooks(page: Page, width = 1440, height = 900): Promise<{ looks: Locator; stage: Locator }> {
  await page.setViewportSize({ width, height });
  await page.goto("/", { waitUntil: "networkidle" });
  const looks = page.locator("[data-home-identity-looks]");
  await looks.evaluate((node) => node.scrollIntoView({ block: "start" }));
  await settle(looks);
  return { looks, stage: looks.locator("[data-home-identity-stage]") };
}

async function pick(looks: Locator, product: string) {
  await looks.getByRole("tab", { name: product }).click();
  await settle(looks);
}

test("the section is a set of examples, not a count of identities", async ({ page }) => {
  await openLooks(page);
  // The section's own heading and intro (the band around the tabs), not just the tabs.
  const section = page.locator("#identities");
  await expect(section.getByRole("heading", { name: "Same components, different products", level: 2 })).toBeVisible();
  await expect(section).not.toContainText(/\bsix\b/i);
});

test("tabs switch the example and its identity without leaving the page", async ({ page }) => {
  const { looks, stage } = await openLooks(page);
  await expect(looks.getByRole("tablist", { name: "Examples" })).toBeVisible();
  await expect(looks.getByRole("tab")).toHaveCount(6);
  await expect(stage).toHaveAttribute("data-identity", "mist");
  for (const identity of IDENTITIES) {
    await pick(looks, identity.product);
    await expect(stage).toHaveAttribute("data-identity", identity.id);
    await expect(looks.getByRole("tab", { name: identity.product })).toContainText(identity.name);
    // The facts card speaks in the identity it describes.
    await expect(looks.locator("[data-home-identity-facts]:visible")).toHaveAttribute("data-identity", identity.id);
    await expect(looks.locator("[data-home-identity-facts]:visible h3")).toHaveText(identity.name);
  }
  await pick(looks, "Dev console");
  await looks.getByRole("tab", { name: "Dev console" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(looks.getByRole("tab", { name: "Newsroom" })).toHaveAttribute("aria-selected", "true");
  await expect(stage).toHaveAttribute("data-identity", "press");
});

test("mobile looks does not overflow horizontally", async ({ page }) => {
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    const looks = page.locator("[data-home-identity-looks]");
    await looks.scrollIntoViewIfNeeded();
    await expect(looks.getByRole("tablist")).toBeVisible();
    const box = await looks.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return {
        width: rect.width,
        right: rect.right,
        vw: document.documentElement.clientWidth,
        pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    expect(box.width, `${width}px looks width`).toBeLessThanOrEqual(box.vw + 1);
    expect(box.right, `${width}px looks right`).toBeLessThanOrEqual(box.vw + 1);
    if (width <= 390) {
      expect(box.pageOverflow, `${width}px page overflow`).toBeLessThanOrEqual(1);
    }
  }
});

for (const width of [320, 360, 390]) {
  test(`${width}px: every tab stays readable, and the chosen one is visible`, async ({ page }) => {
    const { looks } = await openLooks(page, width, 800);
    for (const identity of IDENTITIES) {
      const tab = looks.getByRole("tab", { name: identity.product });
      await tab.click();
      await expect(tab).toHaveAttribute("aria-selected", "true");
      const fit = await tab.evaluate((node) => {
        const rect = node.getBoundingClientRect();
        const inside = (el: Element) => {
          const range = document.createRange();
          range.selectNodeContents(el);
          const text = range.getBoundingClientRect();
          return text.left >= rect.left - 0.5 && text.right <= rect.right + 0.5;
        };
        const product = node.querySelector("[data-tab-label]")!;
        return {
          inView: rect.left >= 0 && rect.right <= document.documentElement.clientWidth,
          textInside: [...node.querySelectorAll("span")].every((span) => !span.textContent || inside(span)),
          clipped: node.scrollWidth > node.clientWidth + 1,
          fontSize: Number.parseFloat(getComputedStyle(product).fontSize),
        };
      });
      expect(fit, `${width}px ${identity.product}`).toEqual({ inView: true, textInside: true, clipped: false, fontSize: fit.fontSize });
      // Dense UI role: the kit's --text-sm (13px). Smaller than that is unreadable on a phone.
      expect(fit.fontSize).toBeGreaterThanOrEqual(13);
    }
    const dots = await looks.locator("[data-palette-dots] > span").evaluateAll((nodes) =>
      [...new Set(nodes.map((node) => Math.round(node.getBoundingClientRect().width)))],
    );
    expect(dots, "palette dots keep one size across looks").toHaveLength(1);
  });
}

for (const width of [320, 1280]) {
  test(`${width}px: every identity shows its own screen, without overflow`, async ({ page }) => {
    const { looks, stage } = await openLooks(page, width, 900);
    const seen = new Set<string>();
    for (const identity of IDENTITIES) {
      await pick(looks, identity.product);
      await expect(stage.getByRole("heading", { name: identity.heading, exact: true }).first()).toBeVisible();
      await expect(stage.getByRole("button", { name: identity.action })).toBeVisible();
      // Not the same page restyled: no other example's controls leak in, and no two screens read alike.
      if (identity.id !== "mist") await expect(stage.getByText("Harbor Console")).toHaveCount(0);
      seen.add(await stage.innerText());
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${width}px ${identity.name}`).toBeLessThanOrEqual(1);
    }
    expect(seen.size).toBe(IDENTITIES.length);
  });
}

for (const theme of ["light", "dark"] as const) {
  for (const width of [390, 1280]) {
    test(`${width}px ${theme}: every example passes the a11y gate`, async ({ page }) => {
      await page.addInitScript((mode) => localStorage.setItem("theme", mode), theme);
      const { looks } = await openLooks(page, width, 900);
      for (const identity of IDENTITIES) {
        await pick(looks, identity.product);
        await assertA11yGate(page, "[data-home-identity-looks]");
      }
    });
  }
}

test("Dev console keeps its promises: Discard restores, Save keeps, Delete confirms and restores", async ({ page }) => {
  const { stage } = await openLooks(page);
  const name = stage.getByRole("textbox", { name: "Workspace" });
  const status = stage.locator("[data-home-identity-status]");

  await name.fill("Harbor Staging");
  await expect(status).toHaveText("Unsaved changes.");
  await stage.getByRole("button", { name: "Discard" }).click();
  await expect(name).toHaveValue("Harbor Console");
  await expect(status).toHaveText("Changes discarded.");

  await name.fill("Harbor Staging");
  await stage.getByRole("button", { name: "Save changes" }).click();
  await expect(status).toHaveText("Changes saved.");
  await name.fill("Something else");
  await stage.getByRole("button", { name: "Discard" }).click();
  await expect(name).toHaveValue("Harbor Staging");

  await stage.getByRole("button", { name: "Delete project" }).click();
  const dialog = page.getByRole("dialog", { name: "Delete this project?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(status).not.toContainText("deleted");
  await stage.getByRole("button", { name: "Delete project" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete project" }).click();
  await expect(status).toContainText("Project deleted");
  await stage.getByRole("button", { name: "Restore project" }).click();
  await expect(stage.getByRole("button", { name: "Delete project" })).toBeVisible();
});

test("Dev console: a member row opens a drawer, the role saves to the table, an invite can be resent", async ({ page }) => {
  const { stage } = await openLooks(page);
  const table = stage.getByRole("table", { name: "Workspace members" });
  // The whole row is the target, not only the name.
  await table.getByRole("row", { name: /Sam Okafor/ }).click();
  const drawer = page.getByRole("dialog", { name: "Sam Okafor" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText("sam@harbor.test")).toBeVisible();
  await drawer.getByRole("combobox", { name: "Role" }).click();
  await page.getByRole("option", { name: "Admin" }).click();
  await drawer.getByRole("button", { name: "Save role" }).click();
  await expect(drawer).toHaveCount(0);
  await expect(table.getByRole("row", { name: /Sam Okafor/ })).toContainText("Admin");

  // Keyboard: the name button opens it, Escape closes it and focus comes back to that button.
  const leo = table.getByRole("button", { name: "Leo Martin" });
  await leo.focus();
  await page.keyboard.press("Enter");
  const invited = page.getByRole("dialog", { name: "Leo Martin" });
  await expect(invited).toBeVisible();
  await invited.getByRole("button", { name: "Resend invite" }).click();
  await expect(invited.getByRole("status")).toContainText("Invite to leo@harbor.test resent");
  await expect(invited.getByRole("button", { name: "Resend invite" })).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(invited).toHaveCount(0);
  await expect(leo).toBeFocused();
  // Active members have no invite to resend.
  await table.getByRole("button", { name: "Maya Laurent" }).click();
  await expect(page.getByRole("dialog", { name: "Maya Laurent" }).getByRole("button", { name: "Resend invite" })).toHaveCount(0);
});

for (const theme of ["light", "dark"] as const) {
  for (const width of [390, 1280]) {
    test(`${width}px ${theme}: the member drawer passes the a11y gate and stays on screen`, async ({ page }) => {
      await page.addInitScript((mode) => localStorage.setItem("theme", mode), theme);
      const { stage } = await openLooks(page, width, 900);
      await stage.getByRole("button", { name: "Leo Martin" }).click();
      const drawer = page.getByRole("dialog", { name: "Leo Martin" });
      await expect(drawer).toBeVisible();
      await page.waitForTimeout(400);
      await assertA11yGate(page, "body");
      const box = await drawer.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(-1);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
    });
  }
}

test("Newsroom: picking a story loads it, editing updates the preview, Publish moves it", async ({ page }) => {
  const { looks, stage } = await openLooks(page);
  await pick(looks, "Newsroom");
  const queue = stage.getByRole("table", { name: "Story queue" });
  await stage.getByRole("button", { name: /Ninety voices/ }).click();
  const headline = stage.getByRole("textbox", { name: "Headline" });
  await expect(headline).toHaveValue("Ninety voices, one shipyard");
  await headline.fill("Ninety voices, one dry dock");
  await expect(stage.getByRole("article", { name: "Reading preview" }).getByRole("heading")).toHaveText("Ninety voices, one dry dock");
  await stage.getByRole("button", { name: "Publish" }).click();
  await expect(stage.locator("[data-home-identity-status]")).toContainText("Published: Ninety voices, one dry dock");
  await expect(queue.getByRole("row", { name: /Ninety voices, one dry dock/ })).toContainText("Published");
  await stage.getByRole("button", { name: "Save as draft" }).click();
  await expect(queue.getByRole("row", { name: /Ninety voices, one dry dock/ })).toContainText("Draft");
});

test("Invoicing: totals follow the data, the filter narrows the list, a reminder is a one-time action", async ({ page }) => {
  const { looks, stage } = await openLooks(page);
  await pick(looks, "Invoicing");
  await expect(stage.getByText("€12,480")).toBeVisible();
  await expect(stage.getByText("€8,920")).toBeVisible();
  const list = stage.getByRole("list", { name: "Invoices" });
  await expect(list.getByRole("listitem")).toHaveCount(6);
  await stage.getByRole("button", { name: "Overdue", exact: true }).click();
  await expect(list.getByRole("listitem")).toHaveCount(2);
  await stage.getByRole("button", { name: "Send reminder: Studio Nord" }).click();
  await expect(stage.locator("[data-home-identity-status]")).toContainText("Reminder to Studio Nord marked as sent");
  await expect(stage.getByRole("button", { name: "Send reminder: Studio Nord" })).toHaveCount(0);
  await expect(list.getByText("Reminder sent")).toHaveCount(1);
});

test("Incidents: the filter and Open only narrow the dense list, Ack closes one", async ({ page }) => {
  const { looks, stage } = await openLooks(page);
  await pick(looks, "Incidents");
  const rows = stage.getByRole("list", { name: "Recent incidents" }).getByRole("listitem");
  const status = stage.locator("[data-home-identity-status]");
  await expect(rows).toHaveCount(6);
  await expect(status).toHaveText("4 open");
  await stage.getByRole("switch", { name: "Open only" }).click();
  await expect(rows).toHaveCount(4);
  await stage.getByRole("textbox", { name: "Filter events" }).fill("queue");
  await expect(rows).toHaveCount(1);
  await stage.getByRole("button", { name: "Acknowledge: depth 4.1k, workers 6/8" }).click();
  await expect(status).toHaveText("3 open");
  await expect(rows).toHaveCount(0);
  await expect(stage.getByText("No events match.")).toBeVisible();
});

test("Bag shop: pick a piece, edit its price and stock, Save updates the collection and the low-stock notice", async ({ page }) => {
  const { looks, stage } = await openLooks(page);
  await pick(looks, "Bag shop");
  await expect(stage.getByRole("alert")).toContainText("Pochette Soir: 2 left");
  await stage.getByRole("button", { name: /^Pochette Soir/ }).click();
  const price = stage.getByRole("textbox", { name: "Price (EUR)" });
  await expect(price).toHaveValue("890");
  await price.fill("950");
  await stage.getByRole("textbox", { name: "In stock" }).fill("5");
  await stage.getByRole("button", { name: "Save piece" }).click();
  await expect(stage.locator("[data-home-identity-status]")).toContainText("Pochette Soir saved");
  await expect(stage.getByRole("button", { name: /^Pochette Soir/ })).toContainText("€950");
  await expect(stage.getByRole("alert")).toHaveCount(0);
});

test("SaaS app: the invite popover floats over the team card and adds a member", async ({ page }) => {
  const { looks, stage } = await openLooks(page);
  await pick(looks, "SaaS app");
  const team = stage.getByRole("list", { name: "Team members" }).getByRole("listitem");
  await expect(team).toHaveCount(2);
  await stage.getByRole("button", { name: "Invite teammate" }).click();
  const send = page.getByRole("button", { name: "Send invite" });
  await expect(send).toBeDisabled();
  await page.getByRole("textbox", { name: "Work email" }).fill("ana@lumen.app");
  await send.click();
  await expect(team).toHaveCount(3);
  await expect(team.last()).toContainText("ana@lumen.app");
  await expect(stage.locator("[data-home-identity-status]")).toContainText("ana@lumen.app added as invited");
});

test("Incidents reads as dense: its rows are tighter than the Dev console table's", async ({ page }) => {
  const { looks, stage } = await openLooks(page, 1280, 900);
  const height = (selector: string) =>
    stage.evaluate((node, query) => node.querySelector(query)?.getBoundingClientRect().height ?? 0, selector);
  const table = await height("tbody tr");
  await pick(looks, "Incidents");
  const dense = await height("ul[aria-label='Recent incidents'] li");
  expect(dense).toBeGreaterThan(0);
  expect(table).toBeGreaterThan(0);
  expect(dense).toBeLessThan(table);
});

test("Delete project: the dialog traps focus, Cancel and Escape return it, Confirm completes and Restore undoes it", async ({ page }) => {
  const { stage } = await openLooks(page, 1280, 900);
  const trigger = stage.getByRole("button", { name: "Delete project" });
  const status = stage.locator("[data-home-identity-status]");

  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  for (let step = 0; step < 6; step += 1) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((node) => node.contains(document.activeElement)), `Tab ${step + 1} stays inside`).toBe(true);
  }
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(status).not.toContainText("deleted");

  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();

  await trigger.click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete project" }).click();
  await expect(status).toContainText("Nothing was removed");
  const restore = stage.getByRole("button", { name: "Restore project" });
  await restore.click();
  await expect(stage.getByRole("button", { name: "Delete project" })).toBeVisible();
  await expect(stage.getByText("Active", { exact: true }).first()).toBeVisible();
});

test("Volt's incident log keeps the 13px floor: density comes from the rhythm, not from small type", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const { looks } = await openLooks(page);
  await pick(looks, "Incidents");
  const sizes = await looks.locator("[data-home-identity-stage] ul li *").evaluateAll((nodes) =>
    nodes
      .filter((node) => (node.textContent ?? "").trim() && node.children.length === 0)
      .map((node) => Number.parseFloat(getComputedStyle(node).fontSize)),
  );
  expect(sizes.length).toBeGreaterThan(0);
  for (const size of sizes) expect(size).toBeGreaterThanOrEqual(13);
});
