import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  compactSearchText,
  rankAndGroupSearchItems,
  rankTierForRecord,
  buildCanonicalQueryIndex,
} from "../lib/docs-search-ranking.mjs";

const app = join(dirname(fileURLToPath(import.meta.url)), "..");
const canonicalSrc = readFileSync(join(app, "content", "docs-search-canonical.ts"), "utf8");
const canonicalMatch = canonicalSrc.match(
  /export const docsSearchCanonicalByHref[^=]*=\s*(\{[\s\S]*?\n\});/,
);
assert.ok(canonicalMatch, "docs-search-canonical.ts must export docsSearchCanonicalByHref");
const canonicalByHref = JSON.parse(canonicalMatch[1]);

const buttonHref = Object.values(canonicalByHref).find((entry) => entry.label === "Button");
const dialogHref = Object.values(canonicalByHref).find((entry) => entry.label === "Dialog");
const tableHref = Object.values(canonicalByHref).find((entry) => entry.label === "DataTable");

assert.ok(buttonHref && dialogHref && tableHref, "catalog must define Button, Dialog, and DataTable pages");

/** @param {string} href @param {string} label */
const page = (href, label) => ({
  id: href,
  type: "page",
  url: href,
  content: label === "Button" ? "Trigger actions with buttons" : label,
});

/** @param {string} href @param {string} snippet */
const section = (href, snippet) => ({
  id: `${href}#x`,
  type: "heading",
  url: `${href}#preview`,
  content: snippet,
});

test("compactSearchText folds spaces for multi-word component names", () => {
  assert.equal(compactSearchText("data table"), "datatable");
});

test("button query ranks the Button doc page first and labels it Button", () => {
  const items = [
    page("/docs/ui/confirm-destructive-actions", "Confirm destructive actions"),
    section("/docs/ui/confirm-destructive-actions", "Delete with a Button"),
    page(buttonHref.href, "Trigger actions with buttons"),
    section(buttonHref.href, "Preview"),
    page("/docs/getting-started", "Getting started"),
    section("/docs/getting-started", "Save button in your app"),
  ];
  const ranked = rankAndGroupSearchItems(items, "button", canonicalByHref);
  assert.equal(ranked[0]?.type, "page");
  assert.equal(ranked[0]?.url, buttonHref.href);
  assert.equal(ranked[0]?.content, "Button");
  assert.ok(ranked[1]?.url.startsWith(buttonHref.href));
});

test("dialog query ranks the Dialog doc page first", () => {
  const items = [
    page("/docs/ui/slide-in-a-drawer-panel", "Slide in a drawer panel"),
    section("/docs/ui/slide-in-a-drawer-panel", "Dialog vs drawer"),
    page(dialogHref.href, "Open modal dialogs"),
    page("/docs/ui/confirm-destructive-actions", "Confirm destructive actions"),
  ];
  const ranked = rankAndGroupSearchItems(items, "dialog", canonicalByHref);
  assert.equal(ranked[0]?.url, dialogHref.href);
  assert.equal(ranked[0]?.content, "Dialog");
});

test("data table query ranks the DataTable doc page first", () => {
  const items = [
    page("/docs/ui/theme-an-admin-app-dark-light-included", "Theme an admin app"),
    section("/docs/ui/theme-an-admin-app-dark-light-included", "Tables in the dashboard"),
    page(tableHref.href, "Show a sortable, filterable, paginated data table"),
    page("/docs/build-an-admin-dashboard", "Build an admin dashboard"),
  ];
  const ranked = rankAndGroupSearchItems(items, "data table", canonicalByHref);
  assert.equal(ranked[0]?.url, tableHref.href);
  assert.equal(ranked[0]?.content, "DataTable");
});

test("button query injects the Button page when the index omitted it", () => {
  const items = [
    page("/docs/ui/open-a-menu-of-actions-from-a-button", "Open a menu of actions from a button"),
    section("/docs/ui/open-a-menu-of-actions-from-a-button", "Dropdown menu"),
  ];
  const ranked = rankAndGroupSearchItems(items, "button", canonicalByHref);
  assert.equal(ranked[0]?.url, buttonHref.href);
  assert.equal(ranked[0]?.content, "Button");
});

test("dialog query injects the Dialog page when the index omitted it", () => {
  const items = [
    page("/docs/ui/slide-in-a-drawer-panel", "Slide in a drawer panel"),
    section("/docs/ui/slide-in-a-drawer-panel", "Dialog vs drawer"),
  ];
  const ranked = rankAndGroupSearchItems(items, "dialog", canonicalByHref);
  assert.equal(ranked[0]?.url, dialogHref.href);
  assert.equal(ranked[0]?.content, "Dialog");
});

test("dialog query ignores index rows with a missing url", () => {
  const items = [
    { id: "bad", type: "heading", content: "Dialog usage" },
    page(dialogHref.href, "Open modal dialogs"),
  ];
  assert.doesNotThrow(() => rankAndGroupSearchItems(items, "dialog", canonicalByHref));
  const ranked = rankAndGroupSearchItems(items, "dialog", canonicalByHref);
  assert.equal(ranked[0]?.url, dialogHref.href);
});

test("exact canonical tier beats prefix matches on other pages", () => {
  const byQuery = buildCanonicalQueryIndex(canonicalByHref);
  const buttonTier = rankTierForRecord(page(buttonHref.href, "Trigger actions with buttons"), "button", byQuery, canonicalByHref);
  const otherTier = rankTierForRecord(
    section("/docs/ui/confirm-destructive-actions", "Button variants"),
    "button",
    byQuery,
    canonicalByHref,
  );
  assert.equal(buttonTier, 0);
  assert.ok(otherTier >= 1);
});
