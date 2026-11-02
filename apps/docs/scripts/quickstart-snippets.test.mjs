import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  UI_QUICKSTART_SNIPPETS_DIR,
} from "../home-quickstart/snippet-manifest.mjs";

const ROOT = join(import.meta.dirname, "..", "..", "..");

test("UI quickstart snippets stay self-contained per path", () => {
  const npmPage = readFileSync(join(UI_QUICKSTART_SNIPPETS_DIR, "npm-page.tsx"), "utf8");
  const registryPage = readFileSync(join(UI_QUICKSTART_SNIPPETS_DIR, "registry-page.tsx"), "utf8");
  const registryAdd = readFileSync(join(UI_QUICKSTART_SNIPPETS_DIR, "registry-add.sh"), "utf8").trim();

  assert.match(npmPage, /from "@zedtech\/zedkit-ui"/);
  assert.doesNotMatch(npmPage, /@\/components\/ui\/button/);

  assert.match(registryPage, /from "@\/components\/ui\/button"/);
  assert.doesNotMatch(registryPage, /@zedtech\/zedkit-ui/);

  assert.match(registryAdd, /\/button\.json$/);
  assert.doesNotMatch(registryAdd, /\/badge\.json$/);
});

test("quickstart smoke script uses the canonical snippet directory", () => {
  const smoke = readFileSync(join(ROOT, "scripts", "quickstart-smoke.sh"), "utf8");
  assert.match(smoke, /apps\/docs\/home-quickstart\/snippets/);
  for (const name of ["install.sh", "npm-globals.css", "npm-page.tsx", "registry-theme-add.sh", "registry-add.sh", "registry-page.tsx"]) {
    assert.match(smoke, new RegExp(name.replace(".", "\\.")));
  }
});
