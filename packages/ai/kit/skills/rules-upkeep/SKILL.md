---
name: rules-upkeep
description: "Keep AGENTS.md, skills and subagents in sync with decisions made in a session, and in valid format. Use at the end of a coding task when a decision, correction or convention came up, and whenever creating or editing agent instructions."
---

# Rules upkeep

The AI setup (`AGENTS.md`, `.agents/skills`, `.agents/agents`) is code: it drifts unless you maintain it. Future sessions only know what is written there.

## When to run

At the end of any coding task, and when one of these happened:

- A design choice was settled or clarified: where a boundary sits, which pattern wins, which exception is allowed.
- A review showed that the current rules **allow** a bad pattern.
- You were corrected twice on the same thing.
- A new convention was adopted (naming, testing, wiring).
- A shortcut with a stated limit was left in code and will recur.

## What to do

1. Locate the gap: which file says nothing, is out of date, or disagrees with the decision?
2. Make the **smallest additive edit** in the same turn, in the natural home. Do not ask first. Do not create a new file when an existing one fits.
3. Change every file the decision touches, and no more. Link to the canonical text instead of copying it.
4. Removing a rule needs the user's confirmation.
5. Finish with one line: `Rules: none` or `Rules: <file> — <what changed>`.

## Where things go

| Content                                           | Home                                                 |
| ------------------------------------------------- | ---------------------------------------------------- |
| Non-negotiables for the whole repo, commands, map | root `AGENTS.md`, short (it is always loaded)        |
| Rules for one folder                              | `AGENTS.md` in that folder (read when working there) |
| A repeatable workflow with steps                  | a skill                                              |
| A persona with a narrow job and fresh context     | a subagent                                           |

Do not write down what the code already shows (file lists, signatures). Write only what a reader cannot get from the code: the why, the limits, the traps.

## Formats that fail silently

| Artifact         | Required                                           | Otherwise                                                                                     |
| ---------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Skill            | folder `<name>/SKILL.md`, `name` equals the folder | may never be loaded                                                                           |
| Subagent         | file `<name>.md`, `description` on a single line   | a folded or block description can be shown as `>` and the agent cannot decide when to be used |
| Any file         | LF line endings                                    | a trailing `\r` breaks YAML values                                                            |
| Subagent `model` | omit it, or `inherit`                              | an unknown model id can fall back silently; never name one here, see `.agents/tokenomics.md`  |

Run `zedkit-ai validate` (package `@zedtech/zedkit-ai`, or the repo's equivalent) after editing. It checks these.

## Writing for agents

- Imperative, concrete, short. One rule per bullet. Examples beat adjectives.
- Put the trigger in the skill `description`: "Use when ...". That line decides whether it is ever loaded.
- Large reference material goes in a sibling file, linked from the skill, not in `SKILL.md`.
- Never put secrets, customer names or internal URLs in instructions.
