# Third-party notices — vendored agent skills

The skills named below are copies from their upstream
repositories (verified by diff at vendoring time; changes are listed under Modifications). Every other skill and
every subagent in this kit is first-party zedkit work (MIT) and is not
covered here: `audit`, `ground-truth`, `parallel-work`, `definition-of-done`,
`adversarial-tests`, `rules-upkeep`, `persona-review`, `setup-ai`, `use-zedkit`,
`use-signature`, `compose-ui`, `review`, `plan`, `challenge`, `orchestrate`,
`evidence-grounded-analysis`. Each upstream's licence file is kept next to the skills: see
`skills/LICENSE-*-*`.

## Ponytail skills (6) — MIT

- Author: Dietrich Gebert
- Upstream: https://github.com/DietrichGebert/ponytail
- Licence: MIT, Copyright (c) 2026 DietrichGebert
  (`skills/LICENSE-ponytail-MIT`, copy of upstream `LICENSE`)
- Skills: `ponytail`, `ponytail-audit`, `ponytail-debt`, `ponytail-gain`,
  `ponytail-help`, `ponytail-review` (upstream `skills/ponytail*`)
- Modifications: `ponytail/SKILL.md`: the "smallest complete change" list
  is the 7-rung ladder (the upstream stdlib-or-platform rung is split into
  standard library, then native platform feature or standard tool).
  `ponytail-review/SKILL.md` prepends that 7-rung ladder as its first
  section; the reviewer names the first rung that holds for every new
  piece of code, file, or dependency. Everything else is verbatim.

## Matt Pocock engineering skills (19) — MIT

- Author: Matt Pocock
- Upstream: https://github.com/mattpocock/skills
- Licence: MIT, Copyright (c) 2026 Matt Pocock
  (`skills/LICENSE-mattpocock-skills-MIT`, copy of upstream `LICENSE`)
- Skills: `code-review`, `codebase-design`, `diagnosing-bugs`,
  `domain-modeling`, `handoff`, `implement`, `implement-spec`,
  `improve-codebase-architecture`, `pr`, `research`, `retro`,
  `setup-matt-pocock-skills`, `setup-ts-deep-modules`, `tdd`, `to-spec`,
  `to-tickets`, `triage`, `wayfinder`, `writing-for-agents`
  (upstream `skills/engineering/*`, `skills/productivity/*`,
  `skills/in-progress/setup-ts-deep-modules`)
- Modifications: three example passages are reworded to name no vendor or business domain (this repo bans them): `domain-modeling/ADR-FORMAT.md`, `domain-modeling/GLOSSARY-FORMAT.md` (invoice example), `setup-matt-pocock-skills/SKILL.md`. `code-review/SKILL.md`: the Standards axis applies the `ponytail-review` skill instead of the upstream smell baseline (one reusable review, referenced not copied), and its ladder is now part of that checklist by reference. `implement/SKILL.md`: refuses an unchallenged plan (runs `challenge`/`plan` first), climbs the `ponytail-review` ladder before writing code, then passes `definition-of-done` and calls `review` instead of `code-review`, and carries the ticket's stakes into the PR and routes each spawn through `zedkit-ai route`. `implement-spec/SKILL.md`: implementer subagents re-ask the ladder before writing each piece. `wayfinder/SKILL.md`: prototype and grilling stay ticket labels; the skill calls `domain-modeling` instead of upstream grilling and prototype (not shipped here), and it no longer tells the user to run `setup-matt-pocock-skills` when that skill is outside the installed preset. `code-review/SKILL.md`, `to-spec/SKILL.md` and `to-tickets/SKILL.md`: ask where issues are tracked instead of running `setup-matt-pocock-skills`. `triage/SKILL.md` and `improve-codebase-architecture/SKILL.md`: the grilling step calls `domain-modeling`, or just asks, instead of upstream grilling (not shipped here). Everything else is verbatim.

## Borrowed excerpt inside `pr` — Apache-2.0

- The `pr` skill's Summary visuals menu is adapted from Dex Horthy's
  `show-me` skill (https://github.com/humanlayer/humanlayer), as recorded
  in `skills/pr/CREDITS.md` (kept verbatim).
- Licence: Apache License 2.0
  (`skills/LICENSE-humanlayer-Apache-2.0`, copy of upstream `LICENSE`).

## Deliberately not vendored

- `ask-matt` (upstream `skills/engineering/ask-matt`, MIT — redistribution
  would be allowed with credits): excluded on purpose. It routes over skills
  that are not vendored here (`grill-with-docs`, `grill-me`, `grilling`,
  `prototype`), so it would be a broken router. Install from upstream if
  needed: https://github.com/mattpocock/skills
- `grilling` (upstream `skills/productivity/grilling`) and `prototype`
  (upstream `skills/engineering/prototype`): not vendored. Vendored skills
  that used to call them now call `domain-modeling` or just ask the user
  (see Modifications), so a preset never points at a skill this kit does
  not ship.
