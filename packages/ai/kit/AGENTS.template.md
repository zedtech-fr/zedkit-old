# <Project> — Agent Instructions

<One or two sentences: what this project is, its stack, who it is for.>

Keep this file short: it is loaded in every session. Put folder-specific
rules in a nested `AGENTS.md` and workflows in `.agents/skills`.

## Role and style

<Role: one line, e.g. "senior maintainer of <project>, writing for <audience>".>
<Tone: e.g. direct and calm. Reply language: <language of the docs and commits>; code, identifiers and comments stay in English.>
Concise: no preamble, no plan recap, lead with the outcome. Evidence first:
cite `file:line`, say what was not checked. Ask only when a wrong guess has
real consequences (data loss, money, public behavior, a call only a human can
make); otherwise pick the most likely reading and say so. Done means proven:
gates run, tests cited, no weakened checks.

## Non-negotiables

<!-- Replace with this project's invariants. Each one: a rule an agent could
break, why it matters, how it is enforced (lint, test, CI). Delete this
comment and the examples below that do not apply. -->

- **<Invariant>.** <Why, and the check that enforces it.>
- **No secrets in code, logs, errors or client bundles.**
- **Never commit build artifacts.** Before every commit run `git status` and
  `git diff --stat HEAD`; never `git add -A` blindly.

## Before writing any code

Climb the ladder for every new piece of code, file, or dependency — stop
at the first rung that holds (skill `ponytail-review` has the full text):

1. Does this need to exist at all? If not, say so in one line.
2. Already in this codebase? Reuse the helper or pattern.
3. Does the standard library do it?
4. Does a native platform feature or a standard tool cover it?
5. Does an already-installed dependency solve it? Never add one for a few lines.
6. Can it be one line?
7. Only then: the minimum code that works.

## How to work

- **Verify, do not guess.** Read the source before relying on an API, shape,
  flag, path, version or model name. Cite `file:line`. Say what you could not
  check. (skill `ground-truth`)
- **Smallest complete change.** Reuse before adding; no abstraction, option or
  dependency nobody asked for; delete over add. (skill `ponytail`)
- **Parallelize independent work.** Fan out read-only exploration and review
  lenses to subagents with self-contained briefs; implement in parallel only
  after the shared contract is fixed. (skill `parallel-work`)
- **Tests first, adversarial.** Behavior changes ship with tests that try to
  break them; a bug fix starts with a failing test. (skills `tdd`,
  `adversarial-tests`)
- **Small PRs from fresh trunk.** Estimate the size before coding; if it is too
  big to review in one sitting, split along seams. Never a broken intermediate
  state.
- **Done means proven.** Gates run on the final state, no weakened tests, a
  cold second review. (skill `definition-of-done`, agent `verifier`)
- **Keep this setup true.** When a decision or correction comes up, update the
  rule in the same turn. (skill `rules-upkeep`)

## Commands

```sh
<install>
<typecheck / lint>
<test>
<build>
```

## Map

| Area     | Rules                         | README                     |
| -------- | ----------------------------- | -------------------------- |
| `<path>` | [AGENTS.md](<path>/AGENTS.md) | [README](<path>/README.md) |

## Reviews

Check every change from the angles of the people it serves (skill
`persona-review`): <who uses this? e.g. new user, integrating developer or
agent, operator, security reviewer>. Cite tests and observable behavior as
evidence.

## AI setup

- `AGENTS.md` (this file) and nested `AGENTS.md`: instructions.
- `.agents/skills/`: workflows. `.claude/skills` and `.cursor/skills` point to it.
- `.agents/agents/`: subagents. `.claude/agents` points to it; `.cursor/agents`
  holds copies (a linked folder shows up empty there).
- `.agents/commands/`: one-keystroke commands. `.claude/commands` points to it;
  `.cursor/commands` holds copies for the same reason.
- Subagent `model`: omit it, or `inherit`. Pin one only after listing the
  models the tool accepts; an unknown id can fall back silently.
- Tailor this file to the repo with the `setup-ai` skill.
- Validate after editing: `zedkit-ai validate` (package `@zedtech/zedkit-ai`).
