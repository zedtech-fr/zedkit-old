---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

Refuse a missing or unchallenged plan: run `challenge` (or `plan`, when there is nothing yet) first.

If the user passes a ticket reference, fetch it from the issue tracker and state its title before starting. If the reference is ambiguous, ask.

Before writing code, climb the `ponytail-review` ladder for every new piece
of code, file, or dependency — need to exist? in this codebase? standard
library? native platform feature or a standard tool? installed dependency?
one line? else the minimum code that works — and stop at the first rung that
holds. Stop and replan any piece where a higher rung holds.

Call the Skill tool with "tdd" where possible, at pre-agreed seams. Without a Skill tool, open that skill's `SKILL.md` under `.agents/skills/` and follow its steps in this conversation (same for repo-added skills; explicit-only skills still need an explicit user call).

<!-- if:skill=compose-ui -->
If the work composes, restyles or personalises UI, run `/compose-ui` first:
client business → personas → the client's customers → their personas → UI
choices. Do not edit UI until that brief exists.
<!-- /if -->

Run typechecking regularly, single test files regularly, and the unit plus integration suites once at the end — never the end-to-end battery unless a critical path justifies it.

Then pass `definition-of-done`, and call the Skill tool with "review" to review the work. Without a Skill tool, open that skill's `SKILL.md` under `.agents/skills/` and follow its steps in this conversation (same for repo-added skills; explicit-only skills still need an explicit user call).

Carry the ticket's `Stakes:` into the PR body, never lower it. Before each
spawn run `zedkit-ai route <agent> --kind <how it is used now> --stakes <s>`,
adding `--reasoning <r>` or `--context <c>` when the step has a `Needs:` line.
If the tool lets a spawn override the model, pass the one it prints; if not,
the stakes still decide the gates. `sensitive` or higher makes `review`
mandatory, and `critical` also needs a second independent review and a
`Human validation:` line.

Commit your work to the current branch.
