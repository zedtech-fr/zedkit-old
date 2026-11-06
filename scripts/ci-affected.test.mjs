import assert from "node:assert/strict";
import test from "node:test";
import { closure, readWorkspace, scope } from "./ci-affected.mjs";
import { requiredJobsPass } from "./ci-required.mjs";

const workspace = readWorkspace();
const run = (files, baseRef = "dev", event = "pull_request") => scope({ event, baseRef, files, workspace });

test("closure follows workspace dependencies transitively", () => {
  const dirs = closure(workspace, "@zedtech/zedkit-docs");
  assert.ok(dirs.includes("apps/docs/"));
  assert.ok(dirs.includes("packages/ui/"));
  assert.ok(dirs.includes("packages/i18n/"), "ui -> i18n");
  assert.ok(!dirs.includes("packages/nest/"));
});

test("PR to main and pushes are full", () => {
  assert.equal(run(["README.md"], "main").full, true);
  assert.equal(run(["README.md"], "main").docs, true);
  assert.equal(run([], "", "push").full, true);
  assert.equal(run([], "", "push").filter, "");
});

test("PR to dev is never full, even for lockfile, root config and workflows", () => {
  for (const f of ["pnpm-lock.yaml", "package.json", "turbo.json", "tsconfig.base.json", ".github/workflows/ci.yml"]) {
    const r = run([f]);
    assert.equal(r.full, false, f);
    assert.equal(r.filter, "--filter=...[origin/dev]", f);
  }
});

test("lockfile and root config still run docs and registry jobs; workflow edits do not", () => {
  assert.equal(run(["pnpm-lock.yaml"]).docs, true);
  assert.equal(run(["turbo.json"]).registry, true);
  const wf = run([".github/workflows/ci.yml"]);
  assert.deepEqual([wf.docs, wf.registry, wf.workflows, wf.workflow_only], [false, false, true, true]);
});

test("a package outside the docs closure skips docs and registry", () => {
  const r = run(["packages/nest/src/index.ts"]);
  assert.deepEqual([r.docs, r.registry, r.packages], [false, false, true]);
});

test("docs-only diffs skip API report and pack; package and tsconfig.base do not", () => {
  assert.equal(run(["apps/docs/app/page.tsx"]).packages, false);
  assert.equal(run(["docs/catalog/catalog.json"]).packages, false);
  assert.equal(run(["pnpm-lock.yaml"]).packages, false);
  assert.equal(run(["packages/core/src/a.ts"]).packages, true);
  assert.equal(run(["tsconfig.base.json"]).packages, true);
  assert.equal(run(["README.md"], "main").packages, true);
});

test("package docs reach the docs site but not the registry smoke", () => {
  const r = run(["packages/nest/CATALOG.md"]);
  assert.deepEqual([r.docs, r.registry], [true, false]);
});

test("ui reaches docs and registry; seo reaches docs only", () => {
  assert.deepEqual([run(["packages/ui/src/a.tsx"]).docs, run(["packages/ui/src/a.tsx"]).registry], [true, true]);
  assert.deepEqual([run(["packages/seo/src/a.ts"]).docs, run(["packages/seo/src/a.ts"]).registry], [true, false]);
});

test("markdown at the root and .changeset skip heavy jobs", () => {
  const r = run(["README.md", ".changeset/x.md"]);
  assert.deepEqual([r.docs, r.registry, r.workflow_only], [false, false, false]);
});

test("the #1501 file list versus origin/dev does not start docs browsers", () => {
  const r = run([
    ".github/workflows/ci.yml",
    "docs/ci-branch-protection.md",
    "docs/publishing.md",
    "scripts/check-pack.sh",
    "scripts/ci-affected.mjs",
    "scripts/ci-affected.test.mjs",
    "scripts/ci-required.mjs",
  ]);
  assert.deepEqual([r.docs, r.registry, r.ui, r.full, r.workflows, r.workflow_only], [
    false,
    false,
    false,
    false,
    true,
    false,
  ]);
});

test("verified maintainer docs do not start the docs browser jobs", () => {
  for (const f of [
    "docs/publishing.md",
    "docs/ci-branch-protection.md",
    "docs/golden-rule.md",
    "docs/agents-catalog.md",
  ]) {
    const r = run([f]);
    assert.equal(r.docs, false, f);
    assert.equal(r.full, false, f);
  }
  const pack = run(["docs/publishing.md", "scripts/check-pack.sh"]);
  assert.deepEqual([pack.docs, pack.registry, pack.ui, pack.full], [false, false, false, false]);
});

test("docs catalog and unknown docs paths still start the docs browser jobs", () => {
  assert.equal(run(["docs/catalog/catalog.json"]).docs, true);
  assert.equal(run(["docs/catalog/README.md"]).docs, true);
  assert.equal(run(["docs/design/signature.md"]).docs, true);
  assert.equal(run(["apps/docs/app/page.tsx"]).docs, true);
  assert.equal(run(["docs/publishing.md", "docs/catalog/catalog.json"]).docs, true);
});

test("mixed workflow and code diff is not workflow-only", () => {
  const r = run([".github/workflows/ci.yml", "packages/ui/src/a.tsx"]);
  assert.deepEqual([r.workflow_only, r.workflows, r.docs], [false, true, true]);
});

test("an empty diff is not workflow-only", () => {
  assert.equal(run([]).workflow_only, false);
});

test("ui gallery smoke follows the ui closure, not the docs app", () => {
  assert.equal(run(["packages/i18n/src/a.ts"]).ui, true);
  assert.equal(run(["apps/docs/app/page.tsx"]).ui, false);
  assert.equal(run(["packages/seo/src/a.ts"]).ui, false);
  assert.equal(run(["packages/nest/src/a.ts"], "main").ui, true);
});

const requiredOk = {
  changes: "success",
  hygiene: "success",
  workflow_lint: "skipped",
  checks: "success",
  ui_smoke: "skipped",
  registry: "skipped",
  docs_build: "skipped",
  docs_e2e: "skipped",
  docs_smoke: "skipped",
};
const packOnly = { workflows: false, docs: false, registry: false, ui: false, workflow_only: false };

test("selected ui gallery smoke must succeed", () => {
  assert.ok(
    requiredJobsPass({
      results: requiredOk,
      selected: { ...packOnly, ui: true },
    }).some((e) => e.includes("ui_smoke")),
  );
  assert.deepEqual(
    requiredJobsPass({
      results: { ...requiredOk, ui_smoke: "success" },
      selected: { ...packOnly, ui: true },
    }),
    [],
  );
});

test("impact-excluded docs jobs may skip; selected docs jobs must succeed", () => {
  assert.deepEqual(requiredJobsPass({ results: requiredOk, selected: packOnly }), []);
  assert.ok(
    requiredJobsPass({
      results: { ...requiredOk, docs_build: "skipped", docs_e2e: "skipped", docs_smoke: "skipped" },
      selected: { ...packOnly, docs: true },
    }).some((e) => e.includes("docs_e2e")),
  );
  assert.deepEqual(
    requiredJobsPass({
      results: {
        ...requiredOk,
        docs_build: "success",
        docs_e2e: "success",
        docs_smoke: "success",
      },
      selected: { ...packOnly, docs: true },
    }),
    [],
  );
});

test("fail, cancel, unknown and missing results are not green", () => {
  for (const result of ["failure", "cancelled", "unknown", ""]) {
    const errors = requiredJobsPass({
      results: { ...requiredOk, docs_build: "success", docs_e2e: result, docs_smoke: "success" },
      selected: { ...packOnly, docs: true },
    });
    assert.ok(errors.length > 0, result);
  }
});

test("unselected failure still fails the gate", () => {
  const errors = requiredJobsPass({
    results: { ...requiredOk, registry: "failure" },
    selected: packOnly,
  });
  assert.ok(errors.some((e) => e.includes("registry")));
});

test("workflow-only requires the lint job and skips checks and docs", () => {
  assert.deepEqual(
    requiredJobsPass({
      results: {
        ...requiredOk,
        workflow_lint: "success",
        checks: "skipped",
        docs_build: "skipped",
        docs_e2e: "skipped",
        docs_smoke: "skipped",
      },
      selected: { workflows: true, docs: false, registry: false, ui: false, workflow_only: true },
    }),
    [],
  );
  assert.ok(
    requiredJobsPass({
      results: { ...requiredOk, workflow_lint: "skipped", checks: "skipped" },
      selected: { workflows: true, docs: false, registry: false, ui: false, workflow_only: true },
    }).some((e) => e.includes("workflow_lint")),
  );
});

test("PR to main keeps docs selected so a skip is not green", () => {
  const errors = requiredJobsPass({
    results: requiredOk,
    selected: { workflows: false, docs: true, registry: true, workflow_only: false },
  });
  assert.ok(errors.some((e) => e.includes("docs_build")));
  assert.ok(errors.some((e) => e.includes("docs_e2e")));
  assert.ok(errors.some((e) => e.includes("registry")));
});
