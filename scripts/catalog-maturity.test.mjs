import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  CATALOG_MATURITY_TARGETS,
  MATURITY_DEFINITIONS,
  countCatalogStatuses,
} from "./catalog.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("MATURITY_DEFINITIONS cover every catalog status", () => {
  for (const status of ["planned", "alpha", "beta", "stable", "deprecated"]) {
    assert.ok(MATURITY_DEFINITIONS[status]?.length, status);
  }
});

test("docs/catalog/README.md#maturity mentions semver and no badge for stable", () => {
  const readme = readFileSync(join(root, "docs", "catalog", "README.md"), "utf8");
  const section = readme.split("## Maturity")[1]?.split("## Package header")[0] ?? "";
  assert.match(section, /API-frozen under semver/i);
  assert.match(section, /without a badge/i);
  assert.match(section, /not covered by the semver guarantee/i);
});

test("catalog need counts match Option B targets", () => {
  execSync("node scripts/catalog.mjs build", { cwd: root, stdio: "pipe" });
  const catalog = JSON.parse(readFileSync(join(root, "docs", "catalog", "catalog.json"), "utf8"));
  const packages = Object.entries(catalog.packages).map(([name, entry]) => ({
    name,
    needs: entry.needs,
  }));
  const counts = countCatalogStatuses(packages);
  assert.deepEqual(
    {
      stable: counts.stable,
      beta: counts.beta,
      alpha: counts.alpha,
    },
    CATALOG_MATURITY_TARGETS,
  );
});
