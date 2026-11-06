# `main` branch protection

`main` is protected by the repository ruleset
[**main: required CI checks**](https://github.com/zedtech-fr/zedkit/rules/26112670)
(target: default branch). Direct pushes are blocked; land changes with a
pull request and green required checks.

## Required status checks (CI workflow)

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) ends with a job
named **`ci-required`**. It `needs` the jobs below. Selected jobs must
succeed; skipped is allowed only when the detector excluded that job
(same `if: always()` pattern as `docs-e2e`). Once the ruleset lists only
that name, adding or renaming a leaf job does not need a settings change.

**Full CI runs only for pushes and PRs targeting `main`.** A PR into `dev`
(lockfile, root config and workflow changes included) takes the
affected-only path: turbo runs typecheck, lint and tests for the changed
packages and their dependents, the docs and registry jobs run only when
`scripts/ci-affected.mjs` finds a relevant path, and the workspace-wide
coverage run is skipped. `ci-required` accepts a skipped job only when
the detector excluded it; a selected job that skipped, failed or cancelled
is not green.

**Same-repo PRs into `dev`** run the heavy jobs (`checks`, `registry-smoke`,
`quickstart-smoke`, `adoption-smoke`, `docs-e2e-shard`, `docs-e2e-routes`,
`docs-smoke`) on the Dedibox self-hosted runner (`[self-hosted, dedibox]`),
with persistent `/runner-cache` (pnpm store, turbo, tsbuildinfo, eslint) and
Playwright from the runner image. Job **names** stay neutral (`checks`, not
`checks-dedibox`) so `ci-required` and the ruleset do not change. Fork PRs,
PRs into `main`, and pushes stay on `ubuntu-latest`. The former trial
workflow `ci-dedibox-trial.yml` was removed once this path landed in `ci.yml`.

| Check | Role |
| --- | --- |
| `ci-required` | Aggregate gate: hygiene + checks + registry-smoke + docs-e2e + docs-smoke |
| `hygiene` | Artifact, tone, private-refs, dependabot, changeset, PR lenses |
| `checks` | typecheck, lint, build, tests, catalog, pack, API reports, ui smoke |
| `registry-smoke` | Registry build + smoke |
| `docs-smoke` | Docs Playwright smoke subset |
| `docs-e2e` | Aggregate gate over the three docs e2e shards |

The matrix jobs `docs-e2e-shard (1/3)` … `(3/3)` run in parallel; `docs-e2e`
fails unless every shard succeeded. `ci-required` then fails unless
`docs-e2e` succeeded. The live ruleset may still list the leaf names and
shard names until an admin applies the settings issue (#950).

`deploy-docs` and `release` run on `main` after merge; they are **not**
required for merging PRs.

CodeQL (`Analyze` jobs) runs on PRs but is not a merge gate today.

## Settings (not in git)

Ruleset parameters (owner / admin):

- Pull request required; **0** approving reviews (merge bot + **MERGE-OK** in
  process).
- **Strict** “up to date with base” is **off** (`strict_required_status_checks_policy: false`).
- Force-push and branch deletion blocked on `main`.
- Administrators can bypass in an emergency (`bypass_actors`: repository
  admin role).

## Rollback

Disable or edit the ruleset in
**Settings → Rules → Rulesets**, or with the API (admin token):

```sh
# Inspect current ruleset (JSON)
gh api repos/zedtech-fr/zedkit/rulesets/26112670

# Disable enforcement (emergency only)
gh api --method PUT repos/zedtech-fr/zedkit/rulesets/26112670 \
  --input - <<'EOF'
{
  "name": "main: required CI checks",
  "target": "branch",
  "enforcement": "disabled",
  "conditions": { "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] } },
  "rules": []
}
EOF
```

Re-enable by restoring the ruleset from the GitHub UI history or from a
saved export of the active configuration.

## Verify

1. Open a throw-away PR; confirm merge is blocked while a required check is
   pending or failed.
2. With all required checks green and **MERGE-OK** at head, confirm
   `gh pr merge --squash --match-head-commit` succeeds.

Refs #604, #616.
