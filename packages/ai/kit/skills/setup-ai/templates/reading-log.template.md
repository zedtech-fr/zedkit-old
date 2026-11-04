# Reading log

Written in phase B to `.agents/setup-log/reading.md` after the readers report. `npx zedkit-ai validate --setup` checks it (axis D1): one numbered row per reader, scaled to the repo (see `npx zedkit-ai scan`), plus `file:line` evidence.

**Repo size:** {small|medium|large} ({n} files) — {n} readers, one per slice (from `npx zedkit-ai scan`).
**Tier:** readers ran on the **scout** tier ({model or `inherit`}); synthesis on the **lead** tier. See `.agents/model-routing.md`.

| Slice | Reader paths       | Tier  | Rules | Spot-checked                  | Conflicts | Gaps |
| ----- | ------------------ | ----- | ----- | ----------------------------- | --------- | ---- |
| 1     | `apps/web`         | scout | 14    | 3/3 opened, 3 held            | 1         | 2    |
| 2     | `packages/billing` | scout | 9     | 3/3 opened, 2 held, 1 dropped | 0         | 1    |

## Merged rules

Rules the lead kept after dedupe and spot-checks. These feed `.agents/domain/*.md`, `.agents/design.md`, nested `AGENTS.md` files and `AGENTS.md`.

| ID   | Lane   | Status  | Rule                                       | Evidence                            | Lands in                    |
| ---- | ------ | ------- | ------------------------------------------ | ----------------------------------- | --------------------------- |
| R2-1 | domain | current | Refunds are capped at the captured amount. | `packages/billing/src/refund.ts:31` | `.agents/domain/billing.md` |

## Interview gaps

Only what the code did not answer. Each interview question cites one of these.

| Gap   | Why the code cannot answer                                         | Question                                 |
| ----- | ------------------------------------------------------------------ | ---------------------------------------- |
| R2-G1 | docs say 24h, code says 48h (`README.md:40` vs `src/cancel.ts:12`) | Which cancellation window is the policy? |

## Found in code, confirm

Rules shown to the owner as "found in code — confirm?" in the same message as the interview (not counted as questions).

- R1-3 — {rule} — `file:line`
