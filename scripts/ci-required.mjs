#!/usr/bin/env node
// Aggregate required-check: selected jobs must succeed; skipped is allowed
// only when the detector excluded that job. Failure, cancel, unknown and
// missing results never pass.

export function requiredJobsPass({ results, selected }) {
  const errors = [];
  if (results.changes !== "success") errors.push(`changes must succeed (got ${results.changes || "missing"})`);
  if (results.hygiene !== "success") errors.push(`hygiene must succeed (got ${results.hygiene || "missing"})`);

  const want = {
    workflow_lint: Boolean(selected.workflows),
    checks: !selected.workflow_only,
    ui_smoke: Boolean(selected.ui) && !selected.workflow_only,
    registry: Boolean(selected.registry) && !selected.workflow_only,
    docs_build: Boolean(selected.docs) && !selected.workflow_only,
    docs_e2e: Boolean(selected.docs) && !selected.workflow_only,
    docs_smoke: Boolean(selected.docs) && !selected.workflow_only,
  };

  for (const [job, isSelected] of Object.entries(want)) {
    const result = results[job] ?? "";
    if (isSelected) {
      if (result !== "success") errors.push(`${job} selected but ${result || "missing"}`);
      continue;
    }
    if (result !== "skipped" && result !== "success") {
      errors.push(`${job} ${result || "missing"}`);
    }
  }
  return errors;
}

function flag(name) {
  return process.env[name] === "true";
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const errors = requiredJobsPass({
    results: {
      changes: process.env.CHANGES ?? "",
      hygiene: process.env.HYGIENE ?? "",
      workflow_lint: process.env.WORKFLOW_LINT ?? "",
      checks: process.env.CHECKS ?? "",
      ui_smoke: process.env.UI_SMOKE ?? "",
      registry: process.env.REGISTRY ?? "",
      docs_build: process.env.DOCS_BUILD ?? "",
      docs_e2e: process.env.DOCS_E2E ?? "",
      docs_smoke: process.env.DOCS_SMOKE ?? "",
    },
    selected: {
      workflows: flag("WORKFLOWS"),
      docs: flag("DOCS"),
      registry: flag("REGISTRY_SCOPE"),
      ui: flag("UI_SCOPE"),
      workflow_only: flag("WORKFLOW_ONLY"),
    },
  });
  if (errors.length > 0) {
    console.error(errors.map((e) => `ci-required: ${e}`).join("\n"));
    process.exitCode = 1;
  }
}
