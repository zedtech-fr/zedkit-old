# Design and identity

Fictional **Acme Bookings** starter — replace with tokens and components from this repo's code.

## Languages

- **UI copy:** French (FR) primary, English (EN) secondary where the product ships both.
- **Agent replies:** match the language of the user's message unless the repo standard says otherwise.

## Voice

- Plain, reassuring, no blame on cancel/refund flows.
- Prices and deadlines visible before pay (integrator and end-customer personas).

## Identity rules (brand invariants)

Rules the code already follows about how the product looks, sounds and names things. Take them from the readers' `identity` lane (`.agents/setup-log/reading.md`), not from taste. Same **Status** column as the domain files.

| ID   | Status  | Rule                                                                     | Source                   | Test / check                  |
| ---- | ------- | ------------------------------------------------------------------------ | ------------------------ | ----------------------------- |
| I-01 | current | Prices always show the currency and the tax mention next to the amount.  | `src/ui/PriceRow.tsx:18` | `tests/ui/price-row.test.tsx` |
| I-02 | current | Customer-facing errors name what failed and the next step, never a code. | `src/i18n/en.json:12`    | no test — flag                |

## Signature (visual invariants)

Written only when the repo's stylesheets or token files define colours and fonts. Read from the CSS, tokens or Tailwind config, never from taste: copy the exact variable names and values with `file:line`. A later run in improve mode keeps these rows as written; changing one is an owner decision, not a cleanup. The fictional **Acme Bookings** palette below is a stand-in.

**Colour roles** (one row per role the code defines; the role is what the colour does, not its name)

| Role            | Token / alias       | Value              | Source                    |
| --------------- | ------------------- | ------------------ | ------------------------- |
| page            | `--color-cream`     | `hsl(40 45% 96%)`  | `src/styles/tokens.css:4` |
| surface         | `--color-mauve-100` | `hsl(300 18% 90%)` | `src/styles/tokens.css:5` |
| text            | `--color-pine-900`  | `hsl(160 40% 12%)` | `src/styles/tokens.css:6` |
| accent (action) | `--color-pine-600`  | `hsl(160 55% 28%)` | `src/styles/tokens.css:7` |

**Font families by role**

| Role    | Family         | Fallback stack  | Source                    |
| ------- | -------------- | --------------- | ------------------------- |
| display | Fraunces       | Georgia, serif  | `src/styles/fonts.css:2`  |
| body    | Work Sans      | system-ui, sans | `src/styles/fonts.css:9`  |
| data    | JetBrains Mono | ui-monospace    | `src/styles/fonts.css:16` |

**Accent:** one saturated colour, `--color-pine-600`, is the primary call to action and nothing else (`src/ui/Button.tsx:21`). Secondary actions use the surface role.

**Alias exceptions** (exact, with the reason; any alias not listed here must resolve to a role above)

| Alias          | Resolves to           | Why it is allowed     | Source                     |
| -------------- | --------------------- | --------------------- | -------------------------- |
| `--color-link` | text role, underlined | links are not actions | `src/styles/tokens.css:12` |

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
