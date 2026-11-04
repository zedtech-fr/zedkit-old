# Domain — booking and slots

Fictional **Acme Bookings** example. Copy to `.agents/domain/<area>.md` (rename `<area>` to match this repo: booking, billing, auth, …).

Rules come from the readers' `domain` and `business` lanes (`.agents/setup-log/reading.md`) after the lead spot-checked their citations, plus owner answers. One file per state-bearing area; a rule nobody can cite does not belong here.

## Scope

Rules for **slot lifecycle**, **cancellation**, **refunds**, and **studio payout timing**. Money-bearing: every rule cites code or `source: owner`.

**Status column:** `current` means the rule applies today. Do not mark a rule **`current`** while listing the same prose only under **Unenforced rules** — use **`current (documented, not enforced)`** in **Status** (or **`target`**) until a test or linter enforces it.

**Enforced by column:** the checker that makes the rule true — a test, linter rule, or constraint the lead opened — or `documented, not enforced`. Status and Enforced by must agree.

## Rules

| ID   | Status  | Rule                                                                                        | Source                            | Test                                  | Enforced by                        |
| ---- | ------- | ------------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------- | ---------------------------------- |
| B-01 | current | A slot is **held** for 10 minutes during checkout; after that it returns to inventory.      | `src/booking/hold.ts:42`          | `tests/booking/hold.test.ts`          | `src/booking/hold.ts` expiry sweep |
| B-02 | current | **Cancel free** until 24h before start; inside 24h, cancel fee applies per studio policy.   | `source: owner`                   | `tests/booking/cancel-policy.test.ts` | `src/booking/cancel.ts` fee branch |
| B-03 | target  | **Partial refund** only when the studio policy allows; platform fee is non-refundable.      | `src/billing/refund.ts:88`        | no test — flag                        | documented, not enforced           |
| B-04 | current | **Double booking** is impossible: one confirmed booking per slot id (DB unique constraint). | `migrations/014_slots_unique.sql` | `tests/booking/unique-slot.test.ts`   | DB unique constraint               |

## Invariants

- A confirmed booking always has `paid_at` set before `confirmed_at`.
- Studio timezone is the source of truth for "start time" shown to customers.

## Edge cases

| Scenario                        | Expected behavior                            |
| ------------------------------- | -------------------------------------------- |
| Customer closes tab during hold | Hold expires; slot released without charge   |
| Studio deletes service mid-hold | Checkout fails with a clear, localized error |
| Refund after no-show dispute    | Operator workflow; not automatic in v1       |

## Related glossary terms

See `.agents/glossary.md` — **Slot**, **Hold**, **Cancellation window**, **Platform fee**.
