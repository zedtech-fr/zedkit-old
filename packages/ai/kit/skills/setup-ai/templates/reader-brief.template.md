# Reader brief

Paste into each read-only reader subagent, one per slice from `npx zedkit-ai scan`. The brief is self-contained: the reader has none of your context. Replace the `{…}` fields only. Never name the repo's private project or customer in a public repo's files.

---

You are a **reader**. Read one slice of this repo and report the rules the code already follows. You change nothing: no writes, no installs, no commands that write files.

**Slice:** {paths from `zedkit-ai scan`}
**Repo, in one line:** {stack and purpose, from phase A}
**Budget:** read the slice's entry points, schema, routes, tests and config first; skim the rest. Stop at {25} rules. {The repo's own run budget when it has one (an always-on rule or `AGENTS.md` capping time, files read or retries): obey the stricter — stop at its cap even mid-slice — and say so under Gaps if the slice does not fit.}
**Documented law for this slice:** {rule files, playbooks and ADRs that name this slice's folders, with paths from phase A}. Read them, then report whether the code follows them.

## What to report (lanes)

| Lane         | Looks for                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| domain       | money, state machines, lifecycles, tenancy, auth, permissions, limits, retries, idempotency, data invariants                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| business     | policies the code encodes: pricing, refunds, cancellation, quotas, eligibility, status transitions                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| identity     | brand voice and tone, languages, copy patterns, design tokens, naming of user-facing things, UX and interaction laws (feedback on waits, mobile-first, one primary action). **Visual signature:** from stylesheets, tokens and the Tailwind config, report each colour role (page, surface, text, accent) with its variable name, exact value and `path:line`; the font family of each role (display, body, data); which single role is the call-to-action accent and where the code enforces that; and every alias that departs from the role table, with its reason |
| architecture | layers, who may import whom, ownership, boundaries, generated or vendored code, where X lives                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| convention   | naming, error handling, logging, test layout, commit and PR habits visible in the slice                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| enforcement  | the lint rule, type, test, CI job or DB constraint that makes a rule fail when broken (path and rule name)                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

## Rules of evidence

- Every rule cites `path:line` you opened. No citation, no rule.
- **Status:** `current` when code enforces or follows it today; `target` when a doc, comment or TODO says it should be; `UNVERIFIED` when you could not confirm.
- **Enforced by:** the checker you opened that fails when the rule is broken, else `documented, not enforced`.
- Conflicts matter more than agreement: when code and docs or two files disagree, report both with citations.
- Do not infer intent. Open question for the owner? Put it under **Gaps**, not under rules.
- Never copy secrets, tokens, customer data or private URLs into the report.

## Output (only this, no prose around it)

```
## Slice {n}: {paths}
| ID | Lane | Status | Rule | Evidence | Enforced by |
| -- | ---- | ------ | ---- | -------- | ----------- |
| R{n}-1 | domain | current | A booking holds a slot for 10 minutes. | src/booking/hold.ts:42 | tests/booking/hold.test.ts |

Conflicts: R{n}-C1 — <what disagrees> — <citation A> vs <citation B>
Gaps (owner only): R{n}-G1 — <question the code cannot answer> — <why: no rule found | code and docs disagree | intent unclear>
Folder notes: <one line per folder whose rules differ from the repo root, for a nested AGENTS.md>
Searched: <commands or folders>
```
