---
name: review
description: "Single entry point for reviewing a change: pins the diff once, runs the right review lenses in parallel subagents, dedupes and returns one verdict. Use when asked to review a branch, PR, commit range or work-in-progress."
---

One command for "review this". It picks the lenses, pins the diff once, fans
out, then merges everything into a single report with one verdict.

## 1. Pin the diff

Resolve the fixed point the user gave (commit, branch, tag, `HEAD~N`; ask when
missing) and capture it once: `git diff <fixed-point>...HEAD` plus
`git log <fixed-point>..HEAD --oneline`. Fail fast here on a bad ref or an
empty diff — never inside the subagents.

## 2. Pick the lenses (route over `lenses.md`)

Read the registry in `lenses.md` (same folder). Minimum on every review:
`code`<!-- if:skill=ponytail -->, `ponytail`<!-- /if -->, `persona`, `quality gate`. Add each lens whose Trigger
matches the pinned diff (e.g. `packages/ui/**` -> `ui` + `a11y` + `copy`;
`package.json`/lockfile -> `dependencies`; public API -> `release`).
A lens whose runner is `planned` reports skipped-planned (not a blocker);
skipping a mandatory lens whose runner exists IS a blocker — say so.

## 3. Fan out

One subagent per lens, all in parallel (see `parallel-work` for the pattern;
skip the fan-out and run inline when the diff is a few lines). Route each spawn
with `zedkit-ai route <agent> --kind check --stakes <s>` (the change's `Stakes:`; gates in `lenses.md`)
and pass its model if the tool allows an override. A `check` spawn is read-only:
say so and compare `git status --porcelain` before and after. Every brief is
self-contained: the diff command, the lens skill to apply, and the evidence
rule from `ground-truth` — every finding cites `file:line`, or it is not a
finding. When the change implements a plan with a ladder table, verify the
table against the diff<!-- if:skill=code-review --> (brief `code-review`)<!-- /if -->.

## 4. Merge

Dedupe across lenses (same location and issue keep the strongest wording),
rank by severity, and end with exactly one verdict: ship, fix-then-ship (list
the blockers), or rework. One report, no per-lens sections — but it opens
with the lenses-run table (every lens: ran or skipped + reason), so a
missing mandatory lens is visible at a glance:

```
| Lens | Ran? | Evidence |
| code | yes | <top finding or "clean"> |
| ui | skipped, no UI paths | — |
```

## 5. Turn the miss into a rule

Every miss becomes a rule, so it never returns. For each finding ask what
automatic rule would have caught it: a lint rule, a test, or an AGENTS.md
line, in that order — prefer what runs by itself. Propose the smallest such
rule with each fix; file it or add it in the same change when it is trivial.
A fix without its rule is incomplete until the rule exists or is filed as an
issue.
