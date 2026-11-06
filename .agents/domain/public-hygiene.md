# Domain — public hygiene

Rules for what may appear in this **public** repo. No customer tenancy.
Money-bearing customer payments: none. `source: owner`

**Status column:** `current` means the rule applies today. Use
`current (documented, not enforced)` when prose-only.

## Rules

| ID | Status | Rule | Source | Test | Enforced by |
| -- | ------ | ---- | ------ | ---- | ----------- |
| H-01 | current | No secrets, customer data, internal URLs, or private names; say "an upstream consumer". | `AGENTS.md:8-12`; `source: owner` | no test — flag | `scripts/check-no-private-refs.sh` (opened; CI `.github/workflows/ci.yml:101`) |
| H-02 | current | No internal review-lane names, actor spellings, or private workflow labels in titles, PRs, comments, commits, or files (`--provider` ids stay). | `AGENTS.md:12-16` | no test — flag | `scripts/check-tone.sh` (opened; CI `.github/workflows/ci.yml:102`) |
| H-03 | current | No raw `try`/`catch`; use `tryCatch`/`tryCatchAsync` from `@zedtech/zedkit-core`. Sole exception: `packages/core/src/try-catch.ts`. | `eslint.config.mjs:44-60`; `packages/core/src/try-catch.ts:2-4` | `packages/core/tests/unit/try-catch.test.ts`; `packages/quality/tests/unit/eslint.test.mjs:44` | eslint `TryStatement` |
| H-04 | current | No deep relative imports (`../../*`); inside a package use `#*` subpath imports. | `eslint.config.mjs:6-8`; `eslint.config.mjs:54` | `packages/quality/tests/unit/eslint.test.mjs:35` | eslint `no-restricted-imports` |
| H-05 | current | Never commit build artifacts, caches, or files over 200KB. | `AGENTS.md:25-29`; `scripts/check-no-artifacts.sh:29-37` | no test — flag | `scripts/check-no-artifacts.sh` (CI `.github/workflows/ci.yml:100`) |
| H-06 | current (documented, not enforced) | Thin wrappers over mature packages (advice, not law). | `AGENTS.md:22-23`; `docs/golden-rule.md:3-7` | no test — flag | documented, not enforced |
| H-07 | current (documented, not enforced) | No empty packages; real code must back a package now. | `AGENTS.md:24`; `README.md:42` | no test — flag | documented, not enforced |

## Invariants

- Public surface names no private project. `source: owner`
- English for this repo's agent and product copy. `source: owner`

## Edge cases

| Scenario | Expected behavior |
| -------- | ----------------- |
| Porting a file from an upstream consumer | Strip private names before commit; denylist fails CI |
| `packages/core/src/try-catch.ts` | Raw `try` is allowed; eslint override `eslint.config.mjs:59` |
| `packages/nest` / `packages/live` with no `#*` `imports` | H-04 still bans `../..`; they have no subpath map today (reader conflict) |

## Related

Root `AGENTS.md`. Checkers live under `scripts/` and `eslint.config.mjs`.
