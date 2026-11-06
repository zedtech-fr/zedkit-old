import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";
import test from "node:test";

const root = join(import.meta.dirname, "..");
const script = readFileSync(join(root, "scripts/check-api-report.sh"), "utf8");

/** Every publishable workspace package under packages/* (16 today). */
function packageDirs() {
  return readdirSync(join(root, "packages"), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

function entryPackagesFromScript() {
  const found = new Set();
  for (const line of script.split("\n")) {
    const match = line.match(/^\s*"([a-z0-9-]+)\|/);
    if (match) found.add(match[1]);
  }
  return [...found].sort();
}

test("check-api-report.sh lists every packages/* workspace package", () => {
  const want = packageDirs();
  assert.equal(want.length, 16, "update this test if the workspace package count changes");
  const have = entryPackagesFromScript();
  assert.deepEqual(
    have,
    want,
    `entries in check-api-report.sh must cover all packages; missing: ${want.filter((p) => !have.includes(p)).join(", ")}`,
  );
});

test("changeset gate in check-api-report.sh lists a report for each package", () => {
  const want = packageDirs();
  const block = script.slice(script.indexOf("reports = ["), script.indexOf("]", script.indexOf("reports = [")) + 1);
  for (const pkg of want) {
    assert.match(block, new RegExp(`packages/${pkg}/etc/zedkit-${pkg}\\.api\\.md`));
  }
});

test("changeset gate skips the version PR branch", () => {
  assert.match(script, /changeset-release\/main/);
  assert.match(script, /skip changeset gate on version PR/);
});

test("extractor runs in parallel on GNU xargs and falls back otherwise", () => {
  assert.match(script, /xargs -P "\$\{API_EXTRACTOR_JOBS:-4\}"/);
  assert.match(script, /BSD xargs has no -P/);
});
