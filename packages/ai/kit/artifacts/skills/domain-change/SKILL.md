---
name: domain-change
description: "Change business rules, policies, or domain language in this repo. Use when refund, cancel, pricing, or state-machine behavior changes."
---

# Domain change

Always read `.agents/domain/` before editing code. This workflow enforces a **rules check** before merge.

## Rules check (required)

1. List every **rule id** affected (from domain docs) or add new ids.
2. For each change, cite **evidence**: `file:line` in code, test name, or `source: owner` for policy the owner confirmed in setup.
3. Update `.agents/domain/<area>.md` in the **same PR** as the code (or first, if additive).
4. Update `.agents/glossary.md` / `GLOSSARY.md` when terms shift.
5. If no automated test exists, add one or mark the rule row **no test — flag** with reason.

## Steps

1. **Interview diff** — what user-visible behavior changes? who is affected?
2. **Personas** — run `persona-review` on the UX/copy impact.
3. **Implement** — smallest change; prefer feature flags if the repo uses them.
4. **Verify** — run gates; exercise cancel/refund/limit paths manually if automated coverage is thin.
5. **Retro** — if setup missed this area, add a line to `.agents/setup-log.md`.

## Done when

- Domain tables and code agree; contradictions listed in `product.md` open questions are cleared or explicitly deferred.
