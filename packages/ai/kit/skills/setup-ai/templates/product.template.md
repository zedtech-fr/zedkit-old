# Product summary

Fictional example below — replace every line with this repo's facts and evidence.

<!-- setup-ai: copy to `.agents/product.md` when the repo has a real product surface -->

## Offer

**Acme Bookings** sells online appointment slots for independent studios (yoga, beauty, coaching). Customers pay at booking time; studios receive payouts minus a platform fee.

## Who pays and why

| Payer        | Gets                                                                    | Evidence                                 |
| ------------ | ----------------------------------------------------------------------- | ---------------------------------------- |
| End customer | A confirmed slot, reminders, self-serve cancel/reschedule within policy | `source: owner` — README "For customers" |
| Studio       | Calendar sync, no-show protection, payout reports                       | `src/routes/studio/`                     |

## Key journeys

1. **Book a slot** — search availability → pick time → pay → confirmation email.
2. **Cancel or reschedule** — self-serve before cutoff; refund rules apply after payment.
3. **Studio onboarding** — connect payout account → publish services → go live.

## Success signals

- Booking completes without support contact.
- Refund/cancel policy matches what checkout shows (no surprise charges).

## Non-goals

- Marketplace discovery across studios (each studio is its own storefront).
- Offline-only bookings without payment capture.

## Open questions

- List conflicts between docs and code here with `file:line` links.
