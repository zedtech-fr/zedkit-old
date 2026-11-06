# Project personas (v2)

Placeholder rows for fictional **Acme Bookings** — **replace in phase C**.
Used by `persona-review`. Each row is a **named audience**, not a job title
alone. Keep evidence links.

| Persona                          | Goals                                             | Jobs to be done                                   | Frustrations                      | Key journeys (routes or code paths)       | Journey tests                    | Partial coverage                                                             | Evidence                                          |
| -------------------------------- | ------------------------------------------------- | ------------------------------------------------- | --------------------------------- | ----------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------- |
| **Rushed booker** (end customer) | Book the next available slot in under two minutes | Pick service → time → pay → done                  | Hidden fees, unclear cancel rules | `/book`, `/checkout`, `/confirm`          | `tests/booking/checkout.test.ts` | —                                                                            | README audience; `source: owner` on cancel policy |
| **Studio owner** (operator)      | Fill the calendar without manual DMs              | Publish services, set cancel policy, view payouts | Payout delays, no-show losses     | `/studio/calendar`, `/studio/payouts`     | no test — flag                   | `tests/e2e/payout-view.test.ts` observed, not recommended; calendar untested | `src/routes/studio/`                              |
| **Integrating developer**        | Ship a booking widget from docs alone             | Read API, handle webhooks, test sandbox           | Undocumented error codes          | `/docs/api`, webhook handler tests        | `tests/api/webhooks.test.ts`     | —                                                                            | OpenAPI + example app                             |
| **On-call operator**             | Recover from a bad deploy without data loss       | Replay webhooks, issue manual refund              | Opaque logs                       | `/admin/orders`, runbook in `docs/ops.md` | no test — flag                   | `tests/api/refund.test.ts` covers the API; runbook untested                  | `source: owner` on refund playbook                |
| **New contributor**              | Land a first PR that passes CI                    | Find commands, boundaries, review checklist       | Scattered conventions             | local dev, PR template                    | `tests/ci/smoke.test.ts`         | —                                                                            | root `AGENTS.md`, CI workflow                     |

## Review bars (unchanged from kit)

Keep the high bars from the installed `personas.md` template (loading states, mobile, security) where they apply to this product's UI. Link each bar to routes or tests when you customize.

**Journey tests column:** a file path here must cover the **whole** **Key journeys** row after you open the test; otherwise write **`no test — flag`** exactly, and say what the nearest test does cover under **Partial coverage**. The path is **observed coverage**, not a recommendation to add E2E. A journey may be a code path (`import → call → assert`) exercised by unit tests, not only a route exercised by e2e — the whole-journey rule still applies.
