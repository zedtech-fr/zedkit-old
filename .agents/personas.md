# Project personas — zedkit

Named audiences for `persona-review`. The skill picks 2–4 per change and
requires evidence (command, screenshot, `file:line`) for every verdict.

Keep the high bars from the installed table (loading states, mobile, security)
where they apply to this product's UI.

| Persona | Goals | Jobs to be done | Frustrations | Key journeys (routes or code paths) | Journey tests | Partial coverage | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Stressed user (rushed, anxious) | Get through a flow fast without losing work | Use docs identity dock / kit UI without blank waits | Naked spinners, lost input | Identity creator states (idle, loading, success, error, quota, resume) | no test — flag | `apps/docs/tests/identity-state-matrix.spec.ts` covers those states in docs-e2e (out of this slice) | `apps/docs/AGENTS.md:111`; existing bar table |
| Lazy end client (distracted, doubtful) | Finish the task the kit UI serves, interrupted | Resume a brief; see a named wait | Expired links, double submit | Identity dock persist + reload | no test — flag | `apps/docs/tests/identity-state-matrix.spec.ts` resume tests; `apps/docs/lib/identity-dock-persist.ts:8` | existing bar table |
| Integrating developer | Adopt a kit package from README + catalog alone | `pnpm add @zedtech/zedkit-*`, copy a brick | Hidden setup, unclear errors | Install a package; copy a component | no test — flag | `scripts/adoption-smoke.mjs` / registry smoke are CI, not the README snippet alone | `README.md:53`; `source: owner` |
| Coding agent | Consume catalog, skills, agents programmatically | `zedkit-ai setup` / `sync` / `validate` | Drift between providers | setup → sync → validate | no test — flag | `packages/ai/tests/unit/sync.test.ts` and `validate` tests cover pieces, not one journey | `README.md:73`; `source: owner` |
| Maintainer / operator | Publish, debug, roll back | Changesets, CI, suggest kill switch | Opaque CI, unbounded spend | Version PR (not this slice); `DISABLED` kill switch | no test — flag | `deploy/suggest/server.test.mjs:118` covers kill switch | `CONTRIBUTING.md:14`; `deploy/AGENTS.md:34` |
| New contributor | Land a first kit PR | Find commands, PR checklist, tests | Scattered conventions | local `pnpm typecheck && lint && test`; PR template | no test — flag | no single test of the PR checklist | `CONTRIBUTING.md:11`; `.github/pull_request_template.md:1` |
| Security reviewer | Verify isolation, secrets, public hygiene | Denylist, redaction, suggest SSRF guards | Trust-me steps | public-hygiene + identity-suggest | no test — flag | hygiene scripts in CI; `deploy/suggest/references.test.mjs` | `AGENTS.md:8`; `packages/server/src/redaction.ts:16` |
| Business owner | Judge delivery | One paragraph: problem, adoption cost | Unkept README promises | README offer vs catalog | no test — flag | `scripts/catalog.mjs` README table check | `README.md:11`; `source: owner` |

## Review bars (unchanged from the installed table)

| Persona | Task | Bar |
|---|---|---|
| Stressed user (rushed, anxious) | get through the flow fast without losing or breaking anything, and know it is saved | zero naked spinners, zero generic 'loading': every wait named and localized (what loads, what updates), visible save feedback, faithful skeletons, no blank screens, no layout shift, no lost input, retry that keeps state; gentle motion reassures and shows where you are |
| Lazy end client (distracted, doubtful) | complete the task the kit UI serves, half-attentive, interrupted, on flaky network | reassured, choices prefilled, clear next step, price/duration/guarantees visible, state kept in URL; interrupted: progress auto-saved, resume exactly where left off on any device (URL state + server draft), no re-entering data, clear 'continue where you left off' entry, links that do not expire quickly; flaky network: reload always safe (idempotent actions, no double submit), offline/slow state visible with plain reassurance, pending actions queued and retried, skeletons not blank screens, retry never loses form state; gentle motion reassures and shows where you are |
| Integrating developer | adopt a kit package from README + catalog alone | install works, contract and errors clear without reading the implementation |
| Coding agent | consume the kit (catalog, skills, agents) programmatically | machine-readable catalog.json, stable names, examples that run, AGENTS.md predictive |
| Maintainer / operator | publish, debug, roll back | changesets flow, CI gates explain failures, rollback documented |
| New contributor | land a first kit PR | conventions discoverable, tests runnable, PR checklist clear |
| Security reviewer | verify isolation, auth and secrets | verifiable from tests + code, no trust-me steps |
| Business owner | judge delivery | stated problem solved, adoption cost stated, big picture in one paragraph |

**Journey tests column:** a file path here must cover the **whole** **Key journeys** row after you open the test; otherwise write **`no test — flag`** exactly, and say what the nearest test does cover under **Partial coverage**.
