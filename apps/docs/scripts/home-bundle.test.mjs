import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const app = join(dirname(fileURLToPath(import.meta.url)), "..");

test("home hero dashboard loads the admin demo through next/dynamic", () => {
  const src = readFileSync(join(app, "ui/home/home-hero-app.tsx"), "utf8");
  assert.match(src, /from "next\/dynamic"/);
  assert.match(src, /components\/demos\/registry/);
  assert.doesNotMatch(src, /from ["']@\/components\/demos\/home-admin-dashboard-demo["']/);
  assert.doesNotMatch(src, /from ["']@\/components\/home-gallery-demos["']/);
});

test("home gallery loads overlay demos through next/dynamic", () => {
  const src = readFileSync(join(app, "components/home-gallery-demos.tsx"), "utf8");
  assert.match(src, /from "next\/dynamic"/);
  assert.doesNotMatch(src, /from ["']@\/components\/demos\/confirm-dialog-demo["']/);
  assert.doesNotMatch(src, /from ["']@\/components\/demos\/drawer-demo["']/);
  assert.match(src, /home-gallery-preview/);
  assert.doesNotMatch(src, /home-admin-dashboard-demo/);
});

test("search dialog is lazy and not preloaded on every page", () => {
  const src = readFileSync(join(app, "app/provider.tsx"), "utf8");
  assert.match(src, /from "next\/dynamic"/);
  assert.match(src, /preload:\s*false/);
  assert.doesNotMatch(src, /from ["']\.\.\/components\/search["']/);
});

test("home hero lead prioritizes get started then catalog (#ZK-09)", () => {
  const lead = readFileSync(join(app, "ui/home/home-hero-lead.tsx"), "utf8");
  const actions = readFileSync(join(app, "ui/home/home-hero-lead-actions.tsx"), "utf8");
  const copy = readFileSync(join(app, "ui/home/i18n/home-hero-copy.ts"), "utf8");
  assert.match(lead, /HomeHeroLeadActions/);
  assert.match(actions, /from "@\/ui\/home\/home-link"/);
  // Primary first, then Set up AI, then the quiet catalog link.
  assert.match(actions, /<Button asChild>\s*\n\s*<HomeLink href="#get-started">\{homeCopy\.heroActions\.getStarted\}/);
  assert.match(actions, /<HomeLink href="#ai-setup">\{homeCopy\.heroActions\.setupAi\}/);
  assert.match(actions, /variant="link"[^>]*>\s*\n\s*<HomeLink href="\/catalog">\{homeCopy\.heroActions\.browseCatalog\}/);
  assert.equal((actions.match(/<HomeLink[\s>]/g) ?? []).length, 3);
  const homeLink = readFileSync(join(app, "ui/home/home-link.tsx"), "utf8");
  assert.match(homeLink, /prefetch=\{false\}/);
  assert.match(copy, /getStarted: "Get started"/);
  assert.match(copy, /setupAi: "Set up AI"/);
  assert.match(copy, /browseCatalog: "Browse catalog"/);
  assert.doesNotMatch(actions + copy, /Browse components/);
});

test("drawer demo save closes and toasts", () => {
  const src = readFileSync(join(app, "components/demos/drawer-demo.tsx"), "utf8");
  assert.match(src, /DrawerClose asChild/);
  assert.match(src, /onClick=\{\(\) => toast\(drawerCopy\.demo\.savedToast\)\}/);
  const copy = readFileSync(join(app, "components/demos/i18n/drawer-copy.ts"), "utf8");
  assert.match(copy, /savedToast: "Saved"/);
  assert.match(src, /open=\{open\} onOpenChange=\{setOpen\}/);
});

test("admin dashboard guide demo wires save and delete to state", () => {
  const src = readFileSync(join(app, "components/demos/admin-dashboard-guide-demo.tsx"), "utf8");
  assert.match(src, /useState<ItemRow\[\]>/);
  assert.match(src, /setRows\(\(current\) => current\.filter/);
  assert.doesNotMatch(src, /h-96 min-h-0 overflow-hidden/);
});

test("mobile header keeps search in the phone chrome", () => {
  const header = readFileSync(join(app, "ui/mobile-header.tsx"), "utf8");
  const trigger = readFileSync(join(app, "ui/mobile-search-trigger.tsx"), "utf8");
  assert.match(header, /MobileSearchTrigger/);
  assert.doesNotMatch(header, /SearchPill/);
  assert.doesNotMatch(header, /DocsIdentityPicker/);
  assert.doesNotMatch(trigger, /fumadocs-core\/search\/client/);
});
