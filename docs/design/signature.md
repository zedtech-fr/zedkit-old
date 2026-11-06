# zedkit signature

The reference site's visual language on top of **Glass** (default identity; decision D3 — no alternate default identity): editorial type rhythm, calm composition, named motion, and selective elevation. Specimens inside `ThemeScope` keep their own look; the frame uses these rules only. Tide is an opt-in look, not first paint (`DEFAULT_IDENTITY` in `apps/docs/lib/default-identity.ts`).

Approved product context: [reference-decisions.md](./reference-decisions.md) (D1–D4).

## Type: semantic level vs visual role

- **Semantic level** (`h1`–`h4`, or `Heading level={…}`) is for document outline and accessibility only.
- **Visual role** is a named token set (`--zk-type-*`) applied with kit utilities (`text-zk-type-*`) or `Heading` / `Text` `typeRole` props.

| Visual role | Token prefix | Typical use |
|---|---|---|
| display | `--zk-type-h1-*` | One marketing title per page |
| section | `--zk-type-h2-*` | Band titles, docs page sections |
| band | `--zk-type-h3-*` | Subsections, home card titles |
| cardTitle | `--zk-type-card-title-*` | Dense card headers |
| lead | `--zk-type-lead-*` | One intro paragraph |
| prose | `--zk-type-prose-*` | Long-form docs body (15px) |
| body | `--zk-type-body-*` | UI and marketing persuasion (14px) |
| small | `--zk-type-small-*` | Secondary UI copy |
| label | `--zk-type-label-*` | Metadata, eyebrows (12px floor) |
| nav | `--zk-type-nav-*` | Header links |

**16px** is for form controls on narrow viewports (`--zk-input-font-size`), not body copy.

Implementation: `packages/ui/src/shared-type-scale.css` (tokens), `type-roles.css` (utilities), `typography.tsx` (React API), `type-roles.ts` (class name constants).

## Composition grid

Based on the docs [visual contract](../apps/docs/VISUAL-CONTRACT.md):

- **Widths**: marketing content max ~1200px; docs shell 1440px; article 720–800px.
- **Gutters**: 16px mobile, 24px tablet, 32px desktop (`--zk-page-gutter`).
- **Spacing steps**: 4px base; groups 32–48px; marketing bands 64–96px via section spacing.
- **One focal point per band**; neighbours differ in shape (not a uniform card grid).
- **Three surface roles**: page (reading), specimen stage, overlay. Borders only at region edges or on interactive controls; shadows only on overlays and raised controls (Glass sheen is the exception for site chrome cards, not specimen grids).

## Motion vocabulary

Five named motions (tokens in `signature-motion.css`; utilities `motion-*`). Identities tune duration/ease via `--zk-reveal-*` and `--motion-*`; apps reference names only.

| Name | Utility | When | Default duration |
|---|---|---|---|
| **reveal** | `motion-reveal` | Enter from below (sections, lists) | `--zk-motion-reveal-duration` |
| **settle** | `motion-settle` | Opacity-only enter (bands, chrome) | `--zk-motion-settle-duration` |
| **emphasis** | `motion-emphasis` | Pop-in for small highlights | `--zk-motion-emphasis-duration` |
| **glide** | `motion-glide` | Panels, sheets, layout shift | `--zk-motion-glide-duration` |
| **feedback** | `motion-feedback` | Hover, press, colour transitions | `--zk-motion-feedback-duration` |

Domain preview compositions (D4): commerce, SaaS dashboard, editorial, booking — see `@zedtech/zedkit-ui/marketing` (`BriefSpecimen`, `selectSpecimenDomain`).

Scroll reveals and hero choreography also use `motion.css` (`animate-fade-up`, `hover-lift`, `hover-press`). **`prefers-reduced-motion: reduce`** disables displacement and loops everywhere.

Constants: `signatureMotionClass` in `@zedtech/zedkit-ui`.

## Interaction idioms

- **One primary** action per view; secondary outlined or quiet; tertiary link.
- **Press**: buttons use tokenized shrink (`--zk-press-scale`) behind `motion-safe:`.
- **Lift**: cards that invite exploration use `hover-lift` (translate + shadow), not ever-present elevation.
- **Focus**: visible ring, 2px minimum; full keyboard paths on overlays and the identity widget (see state matrix, L4).
- **Non-modal panels** return focus on dismiss; no focus trap on site chrome.

## Selective elevation

- Flat: section backgrounds, field groups, code wells, data tables at rest.
- Raised: dialogs, drawers, toasts, primary floating controls.
- Glass site chrome may use layered soft shadow + sheen on **site-owned** cards (header actions, marketing code blocks), never as a default grid on specimens.

## Category cue (home)

The home hero separates product class from promise: a **label** line (`UI/AI kit ·`, `data-home-hero-category`) then the **display** `h1`. The category is not styled as part of the display scale.

## Adoption

New UI in apps/docs uses type roles and motion utilities from `@zedtech/zedkit-ui`, not raw `font-size` or `transition-duration`. Raw-value lint lands in L5.

## Glass material

Glass is the default look, so its material is a token layer (`packages/ui/src/identities/glass.css`), not a site patch. Real glass needs three things, and a blur alone is none of them:

- **Something behind it.** Saturated colour halos (`--zk-bg-pattern`) and, on the home hero, a few soft shapes at the window edges. Blurring a flat pastel shows nothing.
- **A lit edge.** `--zk-glass-highlight`: bright top-left rim, soft bottom-right rim, inner glow. Every `--zk-shadow-*` carries it, so cards, popovers, dialogs and drawers share it.
- **A clear fill with light on it.** `--zk-glass-alpha` (floor 0.5 light, 0.45 dark so text keeps its contrast), `--zk-glass-sheen` (slanted light, plain cards only), and `blur + saturate + brightness`.

Fallbacks stay solid: `prefers-reduced-transparency`, no `backdrop-filter`, forced colors, and any scope of another look inside a Glass page. No lensing: `backdrop-filter: url()` is Chromium-only and loses the blur where it parses but is ignored.
