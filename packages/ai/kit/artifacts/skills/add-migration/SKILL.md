---
name: add-migration
description: "Add and ship a database or schema migration safely in this repo. Use when changing persisted shape, indexes, or backfill jobs."
---

# Add migration

Repo-specific workflow — replace placeholders with this repo's migration tool and paths.

## Before you start

- Read `.agents/domain/*.md` for invariants that migrations must preserve.
- Prefer a throwaway worktree or local DB when the main gate writes data.

## Steps

1. **Plan** — forward + rollback story; estimate lock time; note tables with money or PII.
2. **Write migration** — follow existing naming and folder layout under the repo's migrations path.
3. **Backfill** — idempotent script or staged job; document in the PR if manual steps exist.
4. **Test** — run migration up/down on a fresh DB in CI or locally; cite the command you ran.
5. **Deploy note** — order of operations (app vs migration) for operators.

## Done when

- Migration is reversible or the PR states why not.
- Domain doc updated if new states or policies appear.
- Main gate includes migration check if the repo defines one.
