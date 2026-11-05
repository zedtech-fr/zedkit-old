import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { checkCopySourceFamily, checkCopySourceFamilyTheme, kitRegistryDep } from "./copy-source.mjs";
import { expectedRegistryThemeFromStyles } from "./theme-tokens.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const registry = JSON.parse(readFileSync(join(root, "registry.json"), "utf8"));
const css = readFileSync(join(root, "packages/ui/src/styles.css"), "utf8");
const expected = expectedRegistryThemeFromStyles(css);

/** StatusLabel brick family (#420): composed label + kit siblings + theme slices. */
const STATUS_FAMILY = ["status-label", "status-dot", "checkmark"];

test("status family uses kit registry slugs for siblings", () => {
  assert.deepEqual(checkCopySourceFamily(registry, STATUS_FAMILY), []);
  const label = registry.items.find((item) => item.name === "status-label");
  assert.deepEqual(label.registryDependencies, ["@zedkit/checkmark", "@zedkit/status-dot", "utils"]);
});

test("status family ships cssVars/css needed without npm styles.css", () => {
  assert.deepEqual(checkCopySourceFamilyTheme(registry, expected, STATUS_FAMILY), []);
  const dot = registry.items.find((item) => item.name === "status-dot");
  const check = registry.items.find((item) => item.name === "checkmark");
  assert.deepEqual(dot.cssVars, expected["status-dot"].cssVars);
  assert.deepEqual(check.cssVars, expected.checkmark.cssVars);
  assert.deepEqual(check.css, expected.checkmark.css);
});

test("bare kit sibling names are rejected for the status family", () => {
  const broken = JSON.parse(JSON.stringify(registry));
  const label = broken.items.find((item) => item.name === "status-label");
  label.registryDependencies = ["checkmark", "status-dot", "utils"];
  assert.match(checkCopySourceFamily(broken, STATUS_FAMILY).join("\n"), /use @zedkit\/checkmark/);
});

/** Card loading placeholder family (#420): composed skeleton + kit Skeleton brick. */
const CARD_SKELETON_FAMILY = ["card-skeleton", "skeleton", "surface"];

test("card-skeleton family uses kit registry slug for skeleton", () => {
  assert.deepEqual(checkCopySourceFamily(registry, CARD_SKELETON_FAMILY), []);
  const cardSkel = registry.items.find((item) => item.name === "card-skeleton");
  assert.deepEqual(cardSkel.registryDependencies, ["@zedkit/skeleton", "utils", "@zedkit/surface"]);
});

test("card-skeleton family ships cssVars for copy-only theme", () => {
  assert.deepEqual(checkCopySourceFamilyTheme(registry, expected, CARD_SKELETON_FAMILY), []);
  const cardSkel = registry.items.find((item) => item.name === "card-skeleton");
  assert.deepEqual(cardSkel.cssVars, expected["card-skeleton"].cssVars);
});

/** Confirm dialog family (#420): kit Button + Dialog, not upstream shadcn. */
const CONFIRM_DIALOG_FAMILY = ["confirm-dialog", "button", "dialog", "surface"];

test("confirm-dialog family uses kit registry slugs for button and dialog", () => {
  assert.deepEqual(checkCopySourceFamily(registry, CONFIRM_DIALOG_FAMILY), []);
  const confirm = registry.items.find((item) => item.name === "confirm-dialog");
  assert.deepEqual(confirm.registryDependencies, ["@zedkit/button", "@zedkit/dialog", "utils"]);
});

/** Drawer family (#420): kit Button for Radix drawer chrome. */
const DRAWER_FAMILY = ["drawer", "button", "surface"];

test("surface item stages parallax companions after Surface wraps ParallaxLayer", () => {
  const surface = registry.items.find((item) => item.name === "surface");
  const paths = surface.files.map((file) => file.path);
  for (const leaf of ["surface.tsx", "parallax.tsx", "parallax-types.ts"]) {
    assert.ok(paths.some((path) => path.endsWith(leaf)), `surface item missing ${leaf}`);
  }
});

test("drawer family uses kit registry slug for button", () => {
  assert.deepEqual(checkCopySourceFamily(registry, DRAWER_FAMILY), []);
  const drawer = registry.items.find((item) => item.name === "drawer");
  assert.deepEqual(drawer.registryDependencies, ["@zedkit/button", "utils", "@zedkit/surface"]);
  const paths = drawer.files.map((file) => file.path);
  for (const leaf of [
    "drawer-non-modal.tsx",
    "drawer-panel-classes.ts",
    "drawer-non-modal-effects.ts",
    "drawer-parts.tsx",
    "drawer-non-modal-context.tsx",
    "drawer-portal.tsx",
    "drawer-vaul.tsx",
    "drawer-meta.tsx",
  ]) {
    assert.ok(paths.some((path) => path.endsWith(leaf)), `drawer item missing ${leaf}`);
  }
});

test("copy theme item matches styles.css motion and semantic tokens", () => {
  assert.deepEqual(registry.items.find((item) => item.name === "theme").cssVars, expected.theme.cssVars);
});

test("kitRegistryDep uses @zedkit namespace for composed siblings", () => {
  assert.equal(kitRegistryDep("badge"), "@zedkit/badge");
});
