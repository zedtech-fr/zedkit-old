---
schema: 1
default_provider: cursor
# Project overrides only. Unset cells keep kit defaults (`model: inherit`).
# Models live in this providers block. Do not name them in the body.
providers:
  cursor:
    decide:
      trivial: { model: cursor-grok-4.6-high, effort: medium }
      standard: { model: cursor-grok-4.6-high, effort: high }
      sensitive: { model: cursor-grok-4.6-high, effort: high }
      critical: { model: cursor-grok-4.6-high, effort: max }
    design:
      trivial: { model: cursor-grok-4.6-high, effort: medium }
      standard: { model: cursor-grok-4.6-high, effort: high }
      sensitive: { model: cursor-grok-4.6-high, effort: high }
      critical: { model: cursor-grok-4.6-high, effort: max }
    build:
      trivial: { model: cursor-grok-4.6-high, effort: low }
      standard: { model: cursor-grok-4.6-high, effort: medium }
      sensitive: { model: cursor-grok-4.6-high, effort: high }
      critical: { model: cursor-grok-4.6-high, effort: max }
    check:
      trivial: { model: cursor-grok-4.6-high, effort: low }
      standard: { model: cursor-grok-4.6-high, effort: medium }
      sensitive: { model: cursor-grok-4.6-high, effort: high }
      critical: { model: cursor-grok-4.6-high, effort: max }
  muse:
    decide:
      trivial: { model: muse-spark-1.3-contributor, effort: medium }
      standard: { model: muse-spark-1.3-contributor, effort: high }
      sensitive: { model: muse-spark-1.3-contributor, effort: high }
      critical: { model: muse-spark-1.3-contributor, effort: max }
    design:
      trivial: { model: muse-spark-1.3-contributor, effort: medium }
      standard: { model: muse-spark-1.3-contributor, effort: high }
      sensitive: { model: muse-spark-1.3-contributor, effort: high }
      critical: { model: muse-spark-1.3-contributor, effort: max }
    build:
      trivial: { model: muse-spark-1.3-contributor, effort: low }
      standard: { model: muse-spark-1.3-contributor, effort: medium }
      sensitive: { model: muse-spark-1.3-contributor, effort: high }
      critical: { model: muse-spark-1.3-contributor, effort: max }
    check:
      trivial: { model: muse-spark-1.3-contributor, effort: low }
      standard: { model: muse-spark-1.3-contributor, effort: medium }
      sensitive: { model: muse-spark-1.3-contributor, effort: high }
      critical: { model: muse-spark-1.3-contributor, effort: max }
---

# Tokenomics

This file decides which model and effort each kind of work gets, per tool.
Source agents never name a model: they declare a role and default needs, and
the cell for the call (kind x stakes) decides.

## How to change it

- Edit the `model` of a cell in the frontmatter above, nothing else.
- Models are named only in the `providers` block of that frontmatter. This
  prose may explain why a model was chosen.
- Stakes are the main lever. A bug on a payment button is `critical` even if
  the fix is one line. Needs (reasoning, context) only nudge within the stakes.

## Rules that hold

- The cheapest cells never decide. Synthesis, verdicts and anything touching
  money, auth or data loss stay on `sensitive` cells or above.
- `sensitive` work gets a recorded review. `critical` work also gets a second,
  independent review and a human validation line before merge.
- Record the cell used, with its kind and stakes, in the plan and the setup
  log.

## This repo

Cursor is the parent. Every Cursor cell uses the listed Task id. Every Muse
cell uses the listed Contributor id (not inherit). Codex and Claude cells
stay on shipped defaults.
