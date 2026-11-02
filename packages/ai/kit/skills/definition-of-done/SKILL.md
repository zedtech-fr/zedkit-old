---
name: definition-of-done
description: "Checklist to pass before calling a code change done: real gates on the final state, tests for every changed file, no weakened tests, refactor parity, a cold second review, and a rendered-page critique for visual work. Use at the end of any code change and before opening a PR."
---

# Definition of done

Done is a claim. This list is the evidence. If one box cannot be ticked, say which and why. Never tick from memory.

## Gates

- [ ] The project's own gates ran **after the last edit**: typecheck, lint, tests, build (read the commands in the manifest). A fix made after the run means run again.
- [ ] Output was read, not assumed. A failure you cannot explain is not done.
- [ ] Nothing generated, built or cached is staged: check `git status` and `git diff --stat HEAD`. Never `git add -A` blindly.
- [ ] No secrets, tokens or personal data in code, tests, logs, fixtures or errors.

## Tests

- [ ] Every changed behavior has a test. Bug fix: a regression test that fails without the fix. Use `tdd`; for edge cases use `adversarial-tests`.
- [ ] **No test deleted, skipped or weakened to make the change pass.** If one had to change, list each (name, why) in the PR description. A test edited to match new behavior proves nothing unless the old behavior was verified wrong.
- [ ] Tests assert behavior through the public interface, not internals.

## Refactors and rewiring

"No behavior change" holds only if you compared what the code does, not what it is called.

- [ ] Wherever a caller now points at something else, open both the old implementation (`git show <base>:<path>`) and the new one and compare what they do: synchronous or queued, what they write, what side effects and errors they have.
- [ ] Checks and validations still run before the side effects they protect, in the same order.
- [ ] Rewritten tests assert the **original** behavior, diffed against the base branch, not against the new code.

## Contracts and data

- [ ] Public API, event or schema changes are additive, or versioned with a stated migration path. List the consumers you searched.
- [ ] Persisted-data changes: old data still readable, rollout order safe (new code reads old data, old code survives new data).
- [ ] Docs, examples and catalogs that describe the changed surface are updated.

## Size

- [ ] The change is small enough to review in one sitting. If it keeps growing past your first estimate, stop and propose a split before going on. Ignore lockfiles and generated files when counting.
- [ ] Each PR is mergeable alone, never a broken intermediate state. Split along seams: contract, implementation, wiring, tests with their code.

## Visual work

Applies when the change is a page, view, component, style or preview.
Exception: a non-visual change (N/A).

- [ ] Lint, types, axe and screenshot diffs ran on the final state. Necessary, not sufficient.
- [ ] A rendered-page critique names the strongest remaining weaknesses (composition, hierarchy, type roles, density, rhythm). A self-assigned score is not done.
- [ ] Screenshots were opened and described (matching content/viewport/identity/mode, before vs after). `UNSEEN` if not looked at. Generated-but-unread shots do not count.
- [ ] agent `ui-designer` verdict in hand.

## Review: two independent passes

Run both after the work, over every changed file, as if seeing it for the first time.

1. **Correctness and boundaries**: logic, edge cases, null and empty handling, module boundaries, contract compatibility, concurrency and retry safety.
2. **Maintainability and risk**, read again from scratch: can a newcomer follow it, is there coupling nobody mentioned, which error paths have no test, what leaks, and what did the first pass wave through.

For large changes run the `verifier` agent once per package or PR in parallel (see `parallel-work`) and merge the findings. The implementer's own pass is never enough alone.

## Report

End the task with: what changed, which gates ran and their result, what was **not** verified, any known risk. Keep it short.
