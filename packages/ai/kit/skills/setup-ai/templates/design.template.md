# Design and identity

Fictional **Acme Bookings** starter — replace with tokens and components from this repo's code.

## Languages

- **UI copy:** French (FR) primary, English (EN) secondary where the product ships both.
- **Agent replies:** match the language of the user's message unless the repo standard says otherwise.

## Voice

- Plain, reassuring, no blame on cancel/refund flows.
- Prices and deadlines visible before pay (integrator and end-customer personas).

## Tokens (from code)

| Token / variable  | Role            | Where defined           |
| ----------------- | --------------- | ----------------------- |
| `--color-primary` | Primary actions | `src/styles/tokens.css` |
| `--radius-card`   | Booking cards   | design tokens file      |
| `--font-sans`     | Body            | tailwind / CSS vars     |

## Components

| Component    | Use on            | Notes                    |
| ------------ | ----------------- | ------------------------ |
| `SlotPicker` | `/book`           | Shows timezone label     |
| `PriceRow`   | checkout          | Fee breakdown before pay |
| `PolicyLink` | cancel/reschedule | Links studio policy text |

## Do / don't (examples)

- **Do:** Show cancel deadline in the user's locale and studio timezone.
- **Don't:** Use a generic "Loading…" without naming what is loading (see persona bars).

## Do / don't by language (multilingual repos)

Cite real strings from UI code (`file:line`). One pair per language you ship.

| Language | Do (example from repo)                          | Don't (example from repo)              | Source             |
| -------- | ----------------------------------------------- | -------------------------------------- | ------------------ |
| FR       | « Annuler gratuitement jusqu'à 24 h avant »     | « Error » without code                 | `src/i18n/fr.json` |
| EN       | "Free cancellation until 24 hours before start" | "Something went wrong" on payment fail | `src/i18n/en.json` |

## Subagents

- `ui-designer` — layout, hierarchy, tokens, responsive behavior.
- `copywriter` — FR/EN strings, error messages, empty states.
