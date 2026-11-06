# Domain — publishing

How `@zedtech/zedkit-*` versions reach npm. This repo has **no customer
payments**. `source: owner`

## Rules

| ID | Status | Rule | Source | Test | Enforced by |
| -- | ------ | ---- | ------ | ---- | ----------- |
| P-01 | current | Publishing is live: merging a Version PR publishes from CI. Never `npm publish` from a laptop. | `AGENTS.md:29-31`; `docs/publishing.md:5`; `docs/publishing.md:14-15` | no test — flag | `.github/workflows/release.yml:73-81` (`changesets/action`, provenance) |
| P-02 | current | Feature PRs that version a public package carry a Changeset; docs/tooling-only PRs do not name a private package. | `scripts/check-changeset-packages.sh:2`; `docs/publishing.md:10` | no test — flag | `scripts/check-changeset-packages.sh` (CI `.github/workflows/ci.yml:109`) |
| P-03 | current | A PR labelled `breaking` needs a minor-or-major changeset and a one-line migration note. | `CONTRIBUTING.md:42-44`; `scripts/check-breaking-changeset.sh:2` | no test — flag | `scripts/check-breaking-changeset.sh` (CI `.github/workflows/ci.yml:106`) |
| P-04 | current | Catalog `Status`: `alpha`/`beta` may change in a minor; `stable` follows semver; below 1.0 a break is a minor. | `CONTRIBUTING.md:31-33`; `docs/catalog/README.md:94-110` | no test — flag | `scripts/check-breaking-changeset.sh` (label path only); catalog check for Status values |
| P-05 | current | Small PRs from fresh `main`, one package per PR, never stacked; squash after **MERGE-OK** and green CI. | `AGENTS.md:51`; `CONTRIBUTING.md:11-17`; `.github/pull_request_template.md:1` | no test — flag | documented, not enforced (process); CI `ci-required` is the green-CI half |
| P-06 | current | Packages publish `publishConfig.access: public`; Changesets `access: public`. | `packages/core/package.json:4-5`; `.changeset/config.json:6` | no test — flag | pack/changeset hygiene |

## Invariants

- No direct `npm publish`. Token lives in CI (`NPM_TOKEN`), not in the tree.
- This setup slice does not open a Version PR or publish. `source: owner`

## Edge cases

| Scenario | Expected behavior |
| -------- | ----------------- |
| Docs-only PR | No changeset naming `@zedtech/zedkit-docs` (private) |
| Version PR branch `changeset-release/main` | Changeset status job skipped (`.github/workflows/ci.yml:308-315`) |

## Related

`docs/publishing.md`, `.github/workflows/release.yml`.
