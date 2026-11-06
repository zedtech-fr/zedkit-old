import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const app = join(dirname(fileURLToPath(import.meta.url)), "..");

test("root layout ships static theme-color metas before JS", () => {
  const layout = readFileSync(join(app, "app/layout.tsx"), "utf8");
  assert.match(layout, /name="theme-color"/);
  assert.match(layout, /prefers-color-scheme: light/);
  assert.match(layout, /prefers-color-scheme: dark/);
  assert.match(layout, /DOCS_THEME_COLOR_LIGHT/);
  assert.match(layout, /DOCS_THEME_COLOR_DARK/);
});

test("ThemeColorMeta still syncs theme-color after identity and theme changes", () => {
  const source = readFileSync(join(app, "ui/theme-color-meta.tsx"), "utf8");
  assert.match(source, /meta\[name="theme-color"\]/);
  assert.match(source, /data-identity/);
  assert.match(source, /resolvedTheme/);
});
