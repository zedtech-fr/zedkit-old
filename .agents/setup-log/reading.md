# Reading log

Written in phase B after readers reported. Lead spot-checked citations and ran a second checker on sequencing rules.

**Repo size:** medium (1696 files) — 9 readers, one per slice (from `node packages/ai/dist/bin.js scan`).
**Cell:** readers ran as `check` at `standard` (`cursor-grok-4.6-high`); synthesis as `decide` at `sensitive` (parent). See `.agents/tokenomics.md`.
**Budget:** none found — every reader stayed within the brief cap (25 rules; entry points first). The only overrun allowed is owner-approved, one line under **Budget exceptions**.
**Budget exceptions:** none.

| Slice | Reader paths | Kind | Rules | Spot-checked | Conflicts | Gaps |
| ----- | ------------ | ---- | ----- | ------------ | --------- | ---- |
| 1 | `packages` | check | 25 | 3/3 opened, 3 held (R1-5 rewritten) | 3 | 3 |
| 2 | `apps` | check | 25 | 3/3 opened, 3 held | 4 | 2 |
| 3 | `scripts` | check | 25 | 3/3 opened, 3 held | 3 | 2 |
| 4 | `registry` | check | 25 | 3/3 opened, 3 held | 2 | 4 |
| 5 | `deploy` | check | 12 | 3/3 opened, sequencing rewritten | 5 | 2 |
| 6 | `.changeset` | check | 15 | 3/3 opened, 3 held | 2 | 2 |
| 7 | `.` | check | 15 | 3/3 opened, R7-C1 dropped (symlink) | 2 | 2 |
| 8 | `docs` | check | 15 | 3/3 opened, 3 held | 3 | 2 |
| 9 | `.github` + `.changeset-hold` | check | 15 | 3/3 opened, 3 held | 3 | 3 |

## Rule map

Every rule or skill file the repo already owns for one provider. Never copy the law: one law, one owner.

| File | Scope (globs or folder) | Decision | Where other providers find it |
| ---- | ----------------------- | -------- | ----------------------------- |
| `.cursor/rules/zedkit.mdc` | alwaysApply | not a rule: one-line pointer at root `AGENTS.md` | `AGENTS.md` |
| `.cursor/rules/packages-ai.mdc` | `packages/ai/**` | not a rule: one-line pointer at nested AGENTS.md | `packages/ai/AGENTS.md` |
| `.cursor/rules/packages-core.mdc` | `packages/core/**` | not a rule: one-line pointer at nested AGENTS.md | `packages/core/AGENTS.md` |
| `.cursor/rules/packages-nest.mdc` | `packages/nest/**` | not a rule: one-line pointer at nested AGENTS.md | `packages/nest/AGENTS.md` |
| `.cursor/rules/packages-server.mdc` | `packages/server/**` | not a rule: one-line pointer at nested AGENTS.md | `packages/server/AGENTS.md` |

rule-map: refreshed after phase C (0 rows changed; nested files already existed; domain pointers added in place, mdc files still pointers not law)

## Policy docs

| Doc | Lands in | Or |
| --- | -------- | --- |
| `AGENTS.md` (non-negotiables) | `.agents/domain/public-hygiene.md`, `.agents/domain/publishing.md` | |
| `CONTRIBUTING.md` | `.agents/domain/publishing.md` | |
| `docs/publishing.md` | `.agents/domain/publishing.md` | |
| `docs/golden-rule.md` | `.agents/domain/public-hygiene.md` | advice, not law |
| `docs/catalog/README.md` | `.agents/domain/publishing.md` (Status) | |
| `docs/design/signature.md` | `.agents/design.md` (signature tokens) | |
| `apps/docs/VISUAL-CONTRACT.md` | `.agents/design.md` (docs chrome first paint Glass; Tide opt-in) | |
| `deploy/AGENTS.md` | `.agents/domain/identity-suggest.md` | |
| `packages/ai/AGENTS.md` | `.agents/domain/ai-kit.md` | |
| `docs/agents-catalog.md` | | not a rule: kit catalog, not this product's domain |
| `docs/ci-branch-protection.md` | `.agents/domain/publishing.md` (MERGE-OK / main) | stale `dedibox` label vs `zedkit` in `ci.yml` (conflict) |

## Merged rules

| ID | Lane | Status | Rule | Evidence | Lands in |
| -- | ---- | ------ | ---- | -------- | -------- |
| R1-4 | convention | current | Raw `try`/`catch` banned except `packages/core/src/try-catch.ts`. | `eslint.config.mjs:44`; `packages/core/src/try-catch.ts:17` | `.agents/domain/public-hygiene.md` H-03 |
| R1-5 | convention | current | `tryCatch` maps throws through `normalizeThrown`: Error as-is; anything else Error with cause. | `packages/core/src/try-catch.ts:16-22` | `.agents/domain/public-hygiene.md` H-03 |
| R1-6 | convention | current | Deep `../..` imports banned; packages declare `#*` when they have an `imports` map. | `eslint.config.mjs:6`; `packages/core/package.json:33` | `.agents/domain/public-hygiene.md` H-04 |
| R1-16 | architecture | current | Existing user files are skipped on install; AGENTS.md without the ladder is appended; kit-marked generated agent files are rewritten by sync. | `packages/ai/src/install.ts:544`; `packages/ai/src/sync.ts:117` | `.agents/domain/ai-kit.md` A-03 |
| R3-1 | domain | current | Private names/terms fail CI (`check-no-private-refs.sh`). | `scripts/check-no-private-refs.sh:2`; `.github/workflows/ci.yml:101` | `.agents/domain/public-hygiene.md` H-01 |
| R5-5 | business | current | Paid generation off until switch, budget, and prices; no default budget. | `deploy/suggest/config.mjs:5`; `deploy/suggest/server.test.mjs:94` | `.agents/domain/identity-suggest.md` S-04 |
| R5-6 | domain | current | Reservation is made before paid work, inside one `BEGIN IMMEDIATE`. | `deploy/suggest/ledger.mjs:8`; `deploy/suggest/ledger.mjs:123` | `.agents/domain/identity-suggest.md` S-05 |
| R5-7 | domain | current | At most primary then fallback once, plus one no-effort retry on that provider after a non-429 4xx when `provider.effort` is set; invalid output is not re-asked. | `deploy/suggest/server.mjs:188-227` | `.agents/domain/identity-suggest.md` S-06 |
| R7-1 | domain | current | Public repo: no secrets, customer data, internal URLs, or private names. | `AGENTS.md:8-16` | `.agents/domain/public-hygiene.md` H-01 |
| R7-7 | domain | current | Merging a Version PR publishes; never `npm publish` by hand. | `AGENTS.md:29-31` | `.agents/domain/publishing.md` P-01 |
| R2-13 | identity | current | Failed generation is a named non-ok kind; reducer does not apply tokens. | `apps/docs/lib/identity-assistant.ts:153`; `apps/docs/lib/identity-creator-session.ts:88-102` | `.agents/domain/identity-suggest.md` S-10 |

## Meaning check

| ID | Verdict | Code does | Resolution |
| -- | ------- | --------- | ---------- |
| R1-5 | partial | Error instances returned unchanged; non-Error wrapped with cause | rewritten |
| R1-16 | partial | skip user files; append AGENTS.md ladder; rewrite marked generated agents | rewritten |
| R5-6 | match | `reserve` in `BEGIN IMMEDIATE` before `generate` | |
| R5-7 | partial | primary+fallback (max 2) plus same-provider no-effort retry on non-429 4xx | rewritten |
| R5-8 | match | `killed()` is `existsSync(DISABLED)` per request | |
| R5-11 | match | expireStale charges full amount; 5xx/408 billable | |
| R2-13 | match | non-ok sets `notice`, does not write `proposal` tokens | |

## Interview gaps

Closed by owner answers in the run prompt (`source: owner`). Each question cites a gap.

| Gap | Why the code cannot answer | Question |
| --- | -------------------------- | -------- |
| R-G1 | README describes packages, not who pays | Business model — who pays? |
| R-G2 | No customer persona in code | Primary customers? |
| R-G3 | Three journeys not named as such in one place | Top journeys? |
| R-G4 | Invariants mixed across AGENTS + eslint | Confirm must-never-break? |
| R-G5 | Suggest has operator spend; no checkout | Money / refunds? |
| R-G6 | UI strings EN+FR in kit; repo voice? | Brand language? |
| R-G7 | Signature vs Tide/Glass conflict | Resolved: first paint Glass (`default-identity.ts:7`, `layout.tsx:53`); Tide opt-in |
| R-G8 | Publishing is live in docs | Non-goals this slice? |

## Found in code, confirm

- R7-1 — Public repo, no secrets/private names — `AGENTS.md:8` (owner confirmed)
- R1-4 — tryCatch, not raw try/catch — `eslint.config.mjs:44` (owner confirmed)
- R1-6 — no deep relative imports — `eslint.config.mjs:6` (owner confirmed)
- R7-7 — no laptop npm publish — `AGENTS.md:29` (owner: no Version PR / publish this slice)
- R5-5 — no customer payments; suggest spend is operator opt-in — `deploy/suggest/server.test.mjs:94` (owner: no payments)
