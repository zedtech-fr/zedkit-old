import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { changesetStatusVerdict } from "./changeset-status-needed.mjs";

const VERSION_DELTA = [
  "packages/ai/package.json",
  "packages/ai/CHANGELOG.md",
  "packages/ui/package.json",
  "packages/ui/CHANGELOG.md",
  "packages/devtools/package.json",
  "packages/devtools/CHANGELOG.md",
  "packages/observability/package.json",
  "packages/observability/CHANGELOG.md",
];

test("consumed version delta (package.json + CHANGELOG only, no pending changesets) skips", () => {
  assert.equal(
    changesetStatusVerdict({ pendingChangesetFiles: [], changedPackageAppPaths: VERSION_DELTA }),
    "skip-version-delta",
  );
});

test("an app package.json + CHANGELOG with no pending changeset is a version delta", () => {
  assert.equal(
    changesetStatusVerdict({
      pendingChangesetFiles: [],
      changedPackageAppPaths: ["apps/docs/package.json", "apps/docs/CHANGELOG.md"],
    }),
    "skip-version-delta",
  );
});

test("source change with no changeset still runs (the gate that must fail)", () => {
  assert.equal(
    changesetStatusVerdict({
      pendingChangesetFiles: [],
      changedPackageAppPaths: ["packages/ai/src/index.ts"],
    }),
    "run",
  );
  assert.equal(
    changesetStatusVerdict({
      pendingChangesetFiles: [],
      changedPackageAppPaths: [...VERSION_DELTA, "packages/ai/src/bin.ts"],
    }),
    "run",
  );
});

test("a pending changeset always runs, including on version-shaped paths", () => {
  assert.equal(
    changesetStatusVerdict({
      pendingChangesetFiles: [".changeset/fix.md"],
      changedPackageAppPaths: ["packages/ai/src/index.ts"],
    }),
    "run",
  );
  assert.equal(
    changesetStatusVerdict({
      pendingChangesetFiles: [".changeset/fix.md"],
      changedPackageAppPaths: VERSION_DELTA,
    }),
    "run",
  );
});

test("no package or app changes skips (does not replace the gate with a blanket dev→main skip)", () => {
  assert.equal(
    changesetStatusVerdict({ pendingChangesetFiles: [], changedPackageAppPaths: [] }),
    "skip-unchanged",
  );
});

test("this checkout vs origin/main is the consumed version delta", () => {
  const out = execFileSync(process.execPath, [fileURLToPath(new URL("./changeset-status-needed.mjs", import.meta.url))], {
    encoding: "utf8",
  }).trim();
  assert.equal(out, "skip-version-delta");
});
