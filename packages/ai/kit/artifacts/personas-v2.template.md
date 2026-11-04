# Project personas (v2)

Used by `persona-review`. Each row is a **named audience**, not a job title alone. Replace the fictional **Acme Bookings** names with this repo's users; keep evidence links.

| Persona                          | Goals                                             | Jobs to be done                                   | Frustrations                      | Key journeys (routes)                     | Evidence                                          |
| -------------------------------- | ------------------------------------------------- | ------------------------------------------------- | --------------------------------- | ----------------------------------------- | ------------------------------------------------- |
| **Rushed booker** (end customer) | Book the next available slot in under two minutes | Pick service → time → pay → done                  | Hidden fees, unclear cancel rules | `/book`, `/checkout`, `/confirm`          | README audience; `source: owner` on cancel policy |
| **Studio owner** (operator)      | Fill the calendar without manual DMs              | Publish services, set cancel policy, view payouts | Payout delays, no-show losses     | `/studio/calendar`, `/studio/payouts`     | `src/routes/studio/`                              |
| **Integrating developer**        | Ship a booking widget from docs alone             | Read API, handle webhooks, test sandbox           | Undocumented error codes          | `/docs/api`, webhook handler tests        | OpenAPI + example app                             |
| **On-call operator**             | Recover from a bad deploy without data loss       | Replay webhooks, issue manual refund              | Opaque logs                       | `/admin/orders`, runbook in `docs/ops.md` | `source: owner` on refund playbook                |
| **New contributor**              | Land a first PR that passes CI                    | Find commands, boundaries, review checklist       | Scattered conventions             | local dev, PR template                    | root `AGENTS.md`, CI workflow                     |

## Review bars (unchanged from kit)

Keep the high bars from the installed `personas.md` template (loading states, mobile, security) where they apply to this product's UI. Link each bar to routes or tests when you customize.
