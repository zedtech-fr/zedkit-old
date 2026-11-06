---
name: parallel-work
description: "Split work across subagents in parallel without losing context or colliding. Use when a task has independent parts: broad codebase exploration, several review lenses, per-package changes, separable implementation tracks. Skip it when the task is small or strictly sequential."
---

# Parallel work

Parallel agents are for **independent** work. Each one starts with an empty context: it knows only what you write in its brief.

## When to fan out

Fan out when all hold:

- Two or more parts do not need each other's output.
- Each part is big enough that doing it inline would flood your context or take long.
- Writers touch disjoint files.

Do not fan out for a small task, one file, or a chain where step 2 needs step 1. One agent that understands the whole task beats three that each see a slice.

## Three safe shapes

1. **Explore in parallel.** Read-only agents, one question each ("where is X produced and consumed?", "which tests cover Y?"). Safe by default. Launch them in one batch.
2. **Review in parallel.** One agent per lens or per unit (security, tests, YAGNI, requirement fit; or one per PR or package). Same input, independent verdicts. You merge.
3. **Implement in parallel.** Only after the shared contract is fixed (types, interfaces, schemas, API shape). Then one track per area with disjoint files.

## Implementation tracks

Agree and write down the contract first. Then a table, in the plan:

| Track | Does                      | Starts after    | Must not touch  | Done when          |
| ----- | ------------------------- | --------------- | --------------- | ------------------ |
| A     | storage layer + its tests | contract agreed | B, C files      | tests T1..T3 green |
| B     | API layer + its tests     | contract agreed | A, C files      | tests T4..T6 green |
| C     | integration tests         | A and B done    | production code | T7 green           |

Sequential by nature: the contract, wiring that needs all pieces, integration tests, anything that edits a shared file.

## The brief

A subagent has no memory of this conversation. Every brief states:

1. **Goal** in one sentence, and why it matters.
2. **Scope**: files or area it may read, files it may write (or "read-only").
3. **Context it needs**: decisions already made, constraints, the contract. Paste them; do not say "as discussed".
4. **Deliverable**: the exact output shape. Findings as `file:line`, a diff, a table, a verdict.
5. **Stop rule**: what to do when blocked or unsure (report, do not guess).
6. **Stakes and kind**: the task's `Stakes:`, how this agent is used (`Kind: decide|design|build|check`) and any `Needs:`. Route the spawn with `zedkit-ai route <agent> --kind <k> --stakes <s>`; a `check` brief says "read-only".

Delegate the question, not the thinking: do not hand off understanding. Say what you already know so it is not rediscovered.

## After they return

- Read the reports. A report is a claim: open the cited lines before acting on it (see `ground-truth`).
- Merge: deduplicate, resolve conflicts between agents, note disagreements.
- Run the integration check yourself. Parallel parts that each pass can still fail together.
- If two writers touched the same file, stop and reconcile before continuing.

## Cost and context

- Pick the cheapest agent that can do the job: exploration and lookups need less capability than design or release decisions. Take the model from `zedkit-ai route` where the tool lets a spawn override it; otherwise pin one only after listing what the tool offers.
- Background agents free you to continue; foreground ones block. Use background for long read-only work you do not need right now.
- More agents is not better. Two or three well-briefed ones usually beat eight.
