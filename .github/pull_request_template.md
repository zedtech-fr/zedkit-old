<!--- One concern per PR, from fresh main, never stacked. CI must be green. -->

## What

## Lenses run

| Lens | Ran? | Evidence |
|---|---|---|
| code | | |
| ponytail | | |
| persona | | |
| quality gate | | |

<!-- Add triggered lenses from packages/ai/kit/skills/review/lenses.md (ui, a11y, copy, security,
adversarial-tests, dependencies, docs, seo, release, skeptic, research).
Every lens: ran or skipped + reason. Skipping a mandatory lens blocks. -->

## Personas

<!-- Mandatory for docs/UI/README/registry PRs: one verdict each (OK / reservations /
blocking — not n/a) with proof (screenshot light/dark/mobile or executed command).
At least five filled rows. A blocking persona blocks the merge. Other PRs: delete
the rows that do not apply, keep the rest. -->

| Persona | Verdict | Proof |
|---|---|---|
| Senior skeptic (no slop, no unkept promises) | | |
| First-time dev (component running in <5 min from copy-pasted commands) | | |
| Lazy/doubtful end user (prefilled, obvious next step) | | |
| Keyboard / screen reader / color-blind (keyboard, focus, ARIA, contrast, reduced motion) | | |
| Mobile (readable, no sideways scroll, measured weight) | | |
| Coding agent (install + use from llms.txt/AGENTS.md/registry alone) | | |
| Open-source maintainer (readable PR, tests, changelog, stable API) | | |

## Merge

Squash merge only after **MERGE-OK** on the latest PR head commit and CI is
green. A blocking lens or persona blocks MERGE-OK.
