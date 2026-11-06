import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { identityPresets } from "@zedtech/zedkit-ui";
import postcss from "postcss";

import {
  IDENTITY_KIT_STYLES_CSS,
  identityExportFonts,
  identityExportInstall,
} from "../lib/identity-export-css.ts";
import { allBlocks, buildAdoptionPlan, loadRegistry } from "../lib/adoption-plan.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..", "..");
const catalog = JSON.parse(readFileSync(join(ROOT, "docs/catalog/catalog.json"), "utf8"));
const registry = loadRegistry(ROOT);

function uiNeed(name) {
  const entry = catalog.packages["@zedtech/zedkit-ui"];
  const found = entry.needs.find((item) => item.need === name);
  assert.ok(found, `need ${name} exists`);
  return found;
}

test("maison exports its two font packages, install line and imports", () => {
  const fonts = identityExportFonts(identityPresets.maison);
  assert.deepEqual(fonts?.packages, ["@fontsource-variable/jost", "@fontsource-variable/cormorant"]);
  assert.equal(fonts?.imports, 'import "@fontsource-variable/jost";\nimport "@fontsource-variable/cormorant";');
  assert.equal(
    identityExportInstall(identityPresets.maison),
    "pnpm add @zedtech/zedkit-ui @fontsource-variable/jost @fontsource-variable/cormorant",
  );
});

test("every preset maps to the docs-site font set, each family once", () => {
  assert.deepEqual(identityExportFonts(identityPresets.press)?.packages, [
    "@fontsource-variable/space-grotesk",
    "@fontsource-variable/newsreader",
  ]);
  assert.deepEqual(identityExportFonts(identityPresets.glass)?.packages, [
    "@fontsource-variable/inter",
    "@fontsource-variable/space-grotesk",
  ]);
  assert.deepEqual(identityExportFonts(identityPresets.volt)?.packages, ["@fontsource-variable/geist"]);
  assert.deepEqual(identityExportFonts(identityPresets.mist)?.packages, ["@fontsource-variable/inter"]);
  assert.deepEqual(identityExportFonts(identityPresets.tide)?.packages, ["@fontsource-variable/inter"]);
});

test("system stacks export no fonts, and the install stays the kit alone", () => {
  const system = {
    ...identityPresets.mist,
    fontSans: "ui-sans-serif, system-ui, sans-serif",
    fontDisplay: "Georgia, serif",
  };
  assert.equal(identityExportFonts(system), null);
  assert.equal(identityExportInstall(system), "pnpm add @zedtech/zedkit-ui");
});

test("every preset stack names a mapped family, so kit stack edits cannot silently drop fonts", () => {
  for (const [id, tokens] of Object.entries(identityPresets)) {
    for (const stack of [tokens.fontSans, tokens.fontDisplay]) {
      const probe = { ...identityPresets.mist, fontSans: stack, fontDisplay: "ui-sans-serif, system-ui, sans-serif" };
      assert.ok(
        (identityExportFonts(probe)?.packages.length ?? 0) > 0,
        `${id}: stack maps to no font package: ${stack}`,
      );
    }
  }
});

test("derived font packages are exactly what the docs site loads", () => {
  const docsSite = ["app/fonts.ts", "app/fonts-identity.ts"]
    .flatMap((rel) => [
      ...readFileSync(join(HERE, "..", rel), "utf8").matchAll(/import\s+(?:from\s+)?"(@fontsource-variable\/[^"]+)"/g),
    ])
    .map((match) => match[1]);
  assert.ok(docsSite.length > 0, "docs-site font modules import fontsource packages");
  for (const tokens of Object.values(identityPresets)) {
    for (const pkg of (identityExportFonts(tokens)?.packages ?? [])) {
      assert.ok(docsSite.includes(pkg), `${pkg} is loaded by the docs site`);
      assert.doesNotThrow(() => import.meta.resolve(pkg), `${pkg} resolves to an installed package`);
    }
  }
});

test("kit styles equal the quickstart stylesheet's kit lines", () => {
  const found = uiNeed("Trigger actions with buttons");
  const built = buildAdoptionPlan(
    { need: found, packageName: "@zedtech/zedkit-ui", siteUrl: "https://zedkit.app" },
    { registry },
  );
  const styles = allBlocks(built.modes.find((item) => item.id === "package")).find(
    (block) => block.kind === "file" && block.path === "src/app/globals.css",
  );
  assert.ok(styles, "package mode writes globals.css");
  assert.equal(styles.code, `@import "tailwindcss";\n${IDENTITY_KIT_STYLES_CSS}`);
  assert.doesNotThrow(() => postcss.parse(IDENTITY_KIT_STYLES_CSS), "kit styles parse as CSS");
});
