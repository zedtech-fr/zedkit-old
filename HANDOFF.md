# ci-affected HANDOFF (2026-11-05 Paris) — SPEED FIRST

Lane: `ci-affected` | Worktree: `/data/work/lanes/ci-affected` | Branch: `ci/affected-only` from `origin/dev`
Model: `claude-sonnet-5-5-high` (Sonnet 5.5 High — NEVER Sonnet 5).
Restart: `ZK_MODEL=claude-sonnet-5-5-high bash /data/work/.goals/zk-ci-affected-lane.sh`

## PRIORITY (Romain): ship ASAP

**Ship a minimal affected-only PR to `dev` immediately.** Get **rv-kit** review under normal rules (no `--admin`), then merge into `dev` right away once MERGE-OK. Further CI quick wins go in **follow-up PRs** — do not block the first PR on them.

### Minimal v1 (this PR only)

1. Affected filter: typecheck/lint/unit via turbo `--filter=...[origin/<base>]` for changed packages + dependents (PRs into **dev**).
2. Path filters to skip heavy jobs when irrelevant: docs e2e shards/routes, registry/quickstart/adoption smokes, docs-smoke.
3. `concurrency` cancel-in-progress per PR.
4. `ci-required` aggregate treats **skipped as pass**.
5. Apply to both `ci` (hosted) and `ci-dedibox-trial`.

### Full CI scope (Romain)

- **FULL CI ONLY on PRs targeting `main`.**
- All PRs to **dev** (including lockfile / root package.json / turbo.json / tsconfig base / `.github/workflows` changes) stay on affected-only path — do **not** escalate those to full CI.

### Defer to follow-ups

Other quick wins (docs-only skip polish, job merge/parallelize, artifact sharing, shallow clones, e2e shard rebalance, redundant-step drops, faster runner flags, before/after timing tables beyond a short note) → later PRs. First PR body: brief note that UI-only PRs should skip heavy jobs + concurrency cancel; optional rough timing if cheap, do not delay for measurements.

### Constraints

- Base on `origin/dev`. Keep diffs minimal vs any overlapping CI work (caches already landed via #1481).
- Changeset if the gate requires it.
- Never `--admin`. No force-push except own branch. Never print secrets. Don’t touch prod. Don’t merge to main.
- Ask **rv-kit** for review/MERGE-OK under normal rules; merge to **dev** only after that (or leave merge to ref-mgr if that’s the house process — still get rv-kit MERGE-OK).

### First actions if idle/restarting

Inspect workflows → implement minimal v1 → push → open PR to dev → request rv-kit review → proceed to follow-up quick-win PRs after merge.
