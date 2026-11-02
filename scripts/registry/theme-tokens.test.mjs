import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { checkRegistryThemeDrift, expectedRegistryThemeFromStyles } from "./theme-tokens.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

test("focus-ring registry css follows the outline in styles.css, not a box-shadow", () => {
  const css = readFileSync(join(root, "packages/ui/src/styles.css"), "utf8");
  const expected = expectedRegistryThemeFromStyles(css);
  const ring = expected.badge.css["@utility focus-ring"]["&:focus-visible"];
  const control = expected.button.css["@utility focus-ring-control"]["&:focus-visible"];
  assert.equal(ring.outline, "var(--ring-width) solid hsl(var(--ring))");
  assert.equal(ring["outline-offset"], "var(--ring-offset-width)");
  assert.equal(ring["box-shadow"], undefined);
  assert.equal(control.outline, "var(--ring-width-control) solid hsl(var(--ring))");
  assert.equal(control["outline-offset"], "var(--ring-offset-width)");
  assert.equal(control["box-shadow"], undefined);
});

test("expectedRegistryThemeFromStyles matches registry.json badge, drawer and status-dot", () => {
  const css = readFileSync(join(root, "packages/ui/src/styles.css"), "utf8");
  const registry = JSON.parse(readFileSync(join(root, "registry.json"), "utf8"));
  const expected = expectedRegistryThemeFromStyles(css);
  const badge = registry.items.find((item) => item.name === "badge");
  const drawer = registry.items.find((item) => item.name === "drawer");
  const dot = registry.items.find((item) => item.name === "status-dot");
  const check = registry.items.find((item) => item.name === "checkmark");
  const sep = registry.items.find((item) => item.name === "separator");
  assert.deepEqual(badge.cssVars, expected.badge.cssVars);
  assert.deepEqual(badge.css, expected.badge.css);
  assert.deepEqual(drawer.cssVars, expected.drawer.cssVars);
  assert.deepEqual(dot.cssVars, expected["status-dot"].cssVars);
  assert.deepEqual(check.cssVars, expected.checkmark.cssVars);
  assert.deepEqual(check.css, expected.checkmark.css);
  const label = registry.items.find((item) => item.name === "status-label");
  assert.deepEqual(label.cssVars, expected["status-label"].cssVars);
  const bar = registry.items.find((item) => item.name === "progress-bar");
  assert.deepEqual(bar.cssVars, expected["progress-bar"].cssVars);
  assert.deepEqual(sep.cssVars, expected.separator.cssVars);
  const alert = registry.items.find((item) => item.name === "alert");
  assert.deepEqual(alert.cssVars, expected.alert.cssVars);
  const typo = registry.items.find((item) => item.name === "typography");
  assert.deepEqual(typo.cssVars, expected.typography.cssVars);
  const detail = registry.items.find((item) => item.name === "detail-panel");
  assert.deepEqual(detail.cssVars, expected["detail-panel"].cssVars);
  const tabs = registry.items.find((item) => item.name === "tabs");
  assert.deepEqual(tabs.cssVars, expected.tabs.cssVars);
  assert.deepEqual(tabs.css, expected.tabs.css);
  const card = registry.items.find((item) => item.name === "card");
  assert.deepEqual(card.cssVars, expected.card.cssVars);
  const shell = registry.items.find((item) => item.name === "app-shell");
  assert.deepEqual(shell.cssVars, expected["app-shell"].cssVars);
  const wizard = registry.items.find((item) => item.name === "wizard-steps");
  assert.deepEqual(wizard.cssVars, expected["wizard-steps"].cssVars);
  const cardSkel = registry.items.find((item) => item.name === "card-skeleton");
  assert.deepEqual(cardSkel.cssVars, expected["card-skeleton"].cssVars);
  const iconLabel = registry.items.find((item) => item.name === "icon-label");
  assert.deepEqual(iconLabel.cssVars, expected["icon-label"].cssVars);
});

test("checkRegistryThemeDrift is clean on the repo", () => {
  assert.deepEqual(checkRegistryThemeDrift(root), []);
});

function fixtureRoot(mutateRegistry) {
  const dir = mkdtempSync(join(tmpdir(), "theme-drift-"));
  mkdirSync(join(dir, "packages/ui/src"), { recursive: true });
  writeFileSync(
    join(dir, "packages/ui/src/styles.css"),
    readFileSync(join(root, "packages/ui/src/styles.css"), "utf8"),
  );
  const registry = JSON.parse(readFileSync(join(root, "registry.json"), "utf8"));
  mutateRegistry(registry);
  writeFileSync(join(dir, "registry.json"), JSON.stringify(registry));
  return dir;
}

test("checkRegistryThemeDrift fails on a drifted value", () => {
  const dir = fixtureRoot((registry) => {
    registry.items.find((item) => item.name === "badge").cssVars.theme["ring-width"] = "99px";
  });
  const errors = checkRegistryThemeDrift(dir);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /badge: registry\.json cssVars does not match/);
});

test("checkRegistryThemeDrift fails on unregistered brick tokens", () => {
  const dir = fixtureRoot((registry) => {
    registry.items.push({ name: "next-brick", cssVars: { theme: { "some-token": "1px" } } });
  });
  const errors = checkRegistryThemeDrift(dir);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /next-brick: registry theme tokens are not covered/);
});

test("checkRegistryThemeDrift fails on missing required tokens", () => {
  const dir = fixtureRoot((registry) => {
    delete registry.items.find((item) => item.name === "badge").cssVars;
  });
  const errors = checkRegistryThemeDrift(dir);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /badge: registry\.json missing cssVars required/);
});

test("checkRegistryThemeDrift ignores key order", () => {
  const dir = fixtureRoot((registry) => {
    const theme = registry.items.find((item) => item.name === "badge").cssVars.theme;
    const reordered = {};
    for (const key of Object.keys(theme).reverse()) reordered[key] = theme[key];
    registry.items.find((item) => item.name === "badge").cssVars.theme = reordered;
  });
  assert.deepEqual(checkRegistryThemeDrift(dir), []);
});
