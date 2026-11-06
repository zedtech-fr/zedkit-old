import assert from "node:assert/strict";
import test from "node:test";
import { requiredJobsPass } from "./ci-required.mjs";

const ok = {
  changes: "success",
  hygiene: "success",
  workflow_lint: "skipped",
  checks: "success",
  registry: "skipped",
  docs_e2e: "skipped",
  docs_smoke: "skipped",
};

const packOnly = { workflows: false, docs: false, registry: false, workflow_only: false };

test("impact-excluded docs jobs may skip; selected docs jobs must succeed", () => {
  assert.deepEqual(requiredJobsPass({ results: ok, selected: packOnly }), []);
  assert.ok(
    requiredJobsPass({
      results: { ...ok, docs_e2e: "skipped", docs_smoke: "skipped" },
      selected: { ...packOnly, docs: true },
    }).some((e) => e.includes("docs_e2e")),
  );
  assert.deepEqual(
    requiredJobsPass({
      results: { ...ok, docs_e2e: "success", docs_smoke: "success" },
      selected: { ...packOnly, docs: true },
    }),
    [],
  );
});

test("fail, cancel, unknown and missing results are not green", () => {
  for (const result of ["failure", "cancelled", "unknown", ""]) {
    const errors = requiredJobsPass({
      results: { ...ok, docs_e2e: result, docs_smoke: "success" },
      selected: { ...packOnly, docs: true },
    });
    assert.ok(errors.length > 0, result);
  }
});

test("unselected failure still fails the gate", () => {
  const errors = requiredJobsPass({
    results: { ...ok, registry: "failure" },
    selected: packOnly,
  });
  assert.ok(errors.some((e) => e.includes("registry")));
});

test("workflow-only requires the lint job and skips checks and docs", () => {
  assert.deepEqual(
    requiredJobsPass({
      results: {
        ...ok,
        workflow_lint: "success",
        checks: "skipped",
        docs_e2e: "skipped",
        docs_smoke: "skipped",
      },
      selected: { workflows: true, docs: false, registry: false, workflow_only: true },
    }),
    [],
  );
  assert.ok(
    requiredJobsPass({
      results: { ...ok, workflow_lint: "skipped", checks: "skipped" },
      selected: { workflows: true, docs: false, registry: false, workflow_only: true },
    }).some((e) => e.includes("workflow_lint")),
  );
});

test("PR to main keeps docs selected so a skip is not green", () => {
  const errors = requiredJobsPass({
    results: ok,
    selected: { workflows: false, docs: true, registry: true, workflow_only: false },
  });
  assert.ok(errors.some((e) => e.includes("docs_e2e")));
  assert.ok(errors.some((e) => e.includes("registry")));
});
