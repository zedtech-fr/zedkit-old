# Domain — identity suggest

Operator-bounded spend for the docs identity assistant. **Not** a customer
checkout. This product has no payments. `source: owner`

## Rules

| ID | Status | Rule | Source | Test | Enforced by |
| -- | ------ | ---- | ------ | ---- | ----------- |
| S-01 | current | Output is data, never code: no `url()`, at-rules, braces, comments, executable CSS/HTML. | `deploy/AGENTS.md:13-15`; `deploy/suggest/tokens.mjs:59` | `deploy/suggest/tokens.parity.test.mjs:36` | `parseIdentityTokens` / tokens port |
| S-02 | current | One schema at both ends (`parseIdentityTokens` and `suggest/tokens.mjs`). Never loosen one side. | `deploy/AGENTS.md:16-19` | `deploy/suggest/tokens.parity.test.mjs:16` | parity test |
| S-03 | current | References: public addresses only; each hop re-checked; never https→http; no cookies. First hop may be `http` when `allowHttp`. | `deploy/suggest/references.mjs:96`; `deploy/suggest/references.mjs:532` | `deploy/suggest/references.test.mjs:72` | hostname-guard + references |
| S-04 | current | Paid generation is off until the operator sets the switch, an approved budget, and model prices. No default budget or price. | `deploy/AGENTS.md:29-31`; `deploy/suggest/config.mjs:5`; `deploy/suggest/config.mjs:97-102` | `deploy/suggest/server.test.mjs:94` | config + server |
| S-05 | current | Reservation is made **before** paid work, inside one `BEGIN IMMEDIATE`; refuse writes nothing. | `deploy/suggest/ledger.mjs:8-14`; `deploy/suggest/ledger.mjs:123`; `deploy/suggest/server.mjs:335` | `deploy/suggest/ledger.test.mjs:38-48` | ledger |
| S-06 | current | At most primary then fallback once, plus one no-effort retry on that provider after a non-429 4xx when `provider.effort` is set; invalid output is not re-asked. | `deploy/suggest/server.mjs:188-227`; `deploy/suggest/server.mjs:231` | `deploy/suggest/server.test.mjs:318`; `deploy/suggest/server.test.mjs:339`; `deploy/suggest/server.test.mjs:648` | server `generate` / `interpret` |
| S-07 | current | `DISABLED` in the state volume is the kill switch, read on every request. | `deploy/AGENTS.md:34`; `deploy/suggest/ledger.mjs:251` | `deploy/suggest/server.test.mjs:118` | `killed()` |
| S-08 | current | Unsettled job charged in full at TTL; 5xx/408 may be billable; 4xx/429 are not. | `deploy/suggest/ledger.mjs:8-14`; `deploy/suggest/provider.mjs:109` | `deploy/suggest/ledger.test.mjs:130-136`; `deploy/suggest/server.test.mjs:515` | ledger + provider |
| S-09 | current | Logs name no brief, URL or address (one JSON line: outcome, ms, costMicro, calls, refs). | `deploy/AGENTS.md:36`; `deploy/suggest/server.mjs:393` | no test — flag | documented, not enforced (no test asserts omitted fields) |
| S-10 | current | A failed generation is a named non-`ok` kind; the session reducer sets `notice` and does not apply tokens (draft / last proposal stays). | `apps/docs/lib/identity-assistant.ts:153`; `apps/docs/lib/identity-creator-session.ts:88-102` | `apps/docs/tests/identity-state-matrix.spec.ts` (error/quota on screen; docs-e2e, not this slice) | client reducer |

## Invariants

- Identity CSS values cannot carry code. Same refine on kit and suggest.
- Spend is integer micro-dollars. Operator opt-in only.

## Edge cases

| Scenario | Expected behavior |
| -------- | ----------------- |
| Flag off / missing budget / missing price | 503 `disabled` / `not-configured`; provider not called |
| Invalid model JSON | Charged if work ran; no repair loop |
| Docs AGENTS "four stylesheets" vs `MAX_STYLESHEETS = 8` | Code wins (`deploy/suggest/references.mjs:357`); AGENTS.md overstates the cap |

## Related

`deploy/AGENTS.md`, `apps/docs/AGENTS.md` (client). Design / identity: `.agents/design.md`. Docs chrome: `apps/docs/VISUAL-CONTRACT.md` / `docs/design/signature.md`.
