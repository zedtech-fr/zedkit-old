---
name: add-capability
description: "Add a new user-facing capability end to end in this repo. Use when shipping a feature that touches routes, API, data model, and tests together."
---

# Add capability

Repo-specific workflow — paths and commands below are **placeholders**. `setup-ai` copies this from the kit catalog and replaces them with verified facts.

## Before you start

- Read `.agents/product.md` and the relevant `.agents/domain/*.md` rules.
- Confirm the capability is in the plan tier **must** or **should** (not a one-off).

## Steps

1. **Spec the slice** — one journey, acceptance criteria, non-goals (link `product.md`).
2. **Domain check** — list rules touched; add rows to domain docs if policy changes (`source: owner` when the owner confirmed).
3. **Implement** — follow repo boundaries; smallest diff.
4. **Prove** — run the repo gate commands from root `AGENTS.md`; add or extend tests for new rules.
5. **Review** — run `/review` or the repo's review skill before opening a PR.

## Done when

- Gates green (or skipped with reason in the PR).
- Domain rules cite `file:line` or `source: owner`.
- No dangling references in `.agents/`.
