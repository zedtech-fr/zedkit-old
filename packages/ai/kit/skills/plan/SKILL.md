---
name: plan
description: "Single entry point for planning work: verifies the starting facts, writes the spec and tickets at the right size, then challenges the result. Use before implementing anything non-trivial."
---

One command for "plan this". Research first, write the plan at the right
size, then attack it before anyone codes.

## 1. Research

Apply `ground-truth`: open the code, docs, CI and history the plan will rely
on; every claimed fact cites its source. Unverified items stay labelled, never
assumed.

## 2. Write it down

Small task: a short spec via `to-spec`. Multi-step work: `to-spec`, then
`to-tickets` for the ticket list with blocking edges. Work bigger than one
session: map it with `wayfinder` and resolve the decision tickets first.

## 3. Ladder per planned piece (mandatory)

For every file, module, dependency, or script in the plan, add one table
row with the answers to the 7 ladder questions (`ponytail-review`) and
the rung chosen. Stop at the first rung that holds.

| Piece             | 1 Need to exist? | 2 In this codebase? | 3 Standard library? | 4 Native platform feature or a standard tool? | 5 Installed dependency?          | 6 One line? | Rung |
| ----------------- | ---------------- | ------------------- | ------------------- | --------------------------------------------- | -------------------------------- | ----------- | ---- |
| `auth/refresh.ts` | yes              | no                  | no                  | no                                            | no — a token library is overkill | no          | 7    |

A piece hand-made while rung 3–5 could cover it is rewritten, or justified
in one line. Rung 7 is the minimum code that works. A plan without this
table is a draft.

## 4. Challenge

Run `challenge` on the finished plan. A plan that has not survived a challenge
is a draft: fix what it finds, then re-plan only the parts that changed.
