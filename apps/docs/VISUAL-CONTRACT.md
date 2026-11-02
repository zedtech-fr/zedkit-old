# Docs site visual contract (Product Atelier)

Scope: the website frame only (header, sidebar, prose, home, previews' frame). Identities shown inside specimens keep their own type, shape, density and color. The frame never restyles a specimen, and a specimen never restyles the frame.

Order of every page: what it enables, a working example, how to adopt it, then breadth.

## Evidence baseline (dev.zedkit.app, v0.9.4, 1 Nov 2026)

Observed in `.turbo/evidence/before/`: heavy tan border + shadow + radius on search, toggles, sidebar footer, preview frame and every control, so nothing leads; hero copy leaves the left column mostly empty while the demo carries 5+ controls; the Button preview frame is about 370px wide inside a wide column, and its toolbar (style, size, mode) is louder than the buttons; "Who / Use when / Avoid when" are bold labels with large gaps.

## Who owns what

- **Site shell** (stable, pinned in `app/docs-shell-tokens.css` and `docs-typography.css`): type sizes and weights below, reading widths, section rhythm, gutters, nav density, the contrast overrides for chrome.
- **Selected identity** (default Tide, or the visitor's opt-in choice): font family, palette, spacing unit, radius scale, shadows, motion personality. The shell follows it for those; it never changes a size in the table below.
- **Specimens** (`ThemeScope`, the nearest scope wins, also for a nested dark section): their own identity and mode in full. Nothing in the shell restyles them, and they never restyle the shell.

## Roles

Sizes are the implemented tokens (`packages/ui/src/shared-type-scale.css`, applied by `docs-typography.css`). A test pins each; change the token and the test together, with a reason.

| Role | Rule |
|---|---|
| Marketing H1 | `--zk-type-h1-size`: 32px up to 44px (`clamp`), 32px at 390px and below, weight 600, one per page. No second display size. |
| Docs H1 | Same token as marketing H1 (one page title scale). H2 `--zk-type-h2-size` 22-26px, H3 18px, weight 600. Linked headings inherit size and weight. |
| Prose | 15/1.6 (`--zk-type-prose-size`), 64-72ch. Lead paragraph `--zk-type-lead-size` 16-18px, once. |
| Body and dense UI | Body 14/1.55. Dense UI (controls, tabs, example links, table cells, nav) is the kit's `--text-sm`: 13px. Nothing a person must read to act is below 13px. |
| Metadata | 12/1.4 (`--zk-type-label-size`). Counts, captions, eyebrow labels. Never essential copy or a link people need. |
| Code | Mono family of the identity, 13/21 in blocks, inline code follows its sentence. |
| Widths | Marketing 1200 max. Docs shell 1440 max, nav 240, article 720-800, TOC 180 only if it fits. |
| Spacing | 4px base, steps 4/8/12/16/24/32/48/64. Between groups 32-48, between marketing sections 64-96. No blank band without a job. |
| Gutters | 16 mobile, 24 tablet, 32 desktop. |

## Surfaces, borders, elevation

- Three surfaces: page (reading), specimen stage (demonstration), overlay (transient). Nothing else gets a container.
- A border exists where two regions meet or a control is interactive. Divider (quiet) and control border (clear) are different strengths. Grouping alone is never a reason for a border.
- Shadow only on overlays and genuinely raised controls. Sections, fields, code wells and cards in a grid are flat.
- Radius: controls 8, specimens and overlays 12, pills only for compact status/selection.
- Color: one action accent, explicit success/warning/danger. Active text 4.5:1, large 3:1. Dark is a paired hierarchy, not an inversion.

## Controls and hierarchy

- One primary action per view. Secondary is outlined or quiet. Tertiary is a link.
- Destructive: the trigger is outlined (destructive colour on the text or icon) and sits apart from Save and Discard, below a divider or at the end of the row. The solid destructive button appears only inside its confirmation. Anything simulated says so in its outcome message.
- Preview frame: one stage, one quiet toolbar. Stage height follows content. Appearance choices (identity, mode, width) sit in one row under "Display", current values visible, subordinate to the example.
- Touch targets 44px on mobile, separate from the visible control size.

## Motion

Only to explain a change or keep context (overlay in/out, panel following focus, row insert). 120-160ms feedback, 180-220ms panels, transform/opacity. Small state feedback may be instant. Reduced motion removes displacement.

## Home

Proposition + one working fragment (a compact record list the visitor can use), one adoption choice (npm or copy source) with one command, then family discovery. Other packages, agents and identities follow as a short, distinct section each. No repeated card grids; every section has one focal point and a different shape from its neighbors.

Identity examples sell what the kit builds, not how many identities it ships: no count in the title or copy, and each identity shows its own product screen (Maison a bag shop, Press a newsroom, Glass a SaaS app), never one page restyled per identity. Each example uses live kit components and keeps its own identity in full.

## Component page

Title, one purpose sentence, status, example, install (npm or source, both when available), usage, states, behavior and accessibility, kit props first, inherited attributes collapsed, related. Contents list every section.

## Mobile

Compose by priority, not by stacking desktop. The first screen reaches the example or its start. Secondary tools are disclosed. Wide data scrolls in its own region, never clipped.

## Traps (31 Oct–1 Nov 2026)

These broke real previews. Check them before changing home, chrome, specimens or overlays.

- **Frame vs content height.** `min-h-svh` / `min-h-screen` inside a bounded preview (hero card, 40rem stage) leaves empty chrome. The frame owns height; the specimen is `h-full min-h-0`.
- **Identity `--spacing` scales `w-*` / `p-*` / `gap-*`.** A `w-48` sidebar in Tide is not 12rem. Pin chrome that must stay compact, and look at Tide before calling a layout done.
- **Calendar is `role="grid"`.** Do not paint `tbody tr:hover` on it; hover `.rdp-day`.
- **Scroll pin.** `overflow-hidden` on an ancestor kills sticky / scroll-driven scenes. Use `overflow-clip` or do not clip the track. Stage height follows the specimen; a `100svh` centered stage adds empty landing air and clips the card.
- **Overlay is a sibling.** Vaul/Radix scrim sits next to the panel. `backdrop-filter` on the overlay becomes the backdrop root, so the panel blurs the scrim, not the page. Frost with a lighter overlay (`bg-overlay/50` + blur) or put blur on the panel and set the overlay filter to `none` (Glass). `prefers-reduced-transparency`: solid scrim, no filter.
- **Hero scroll.** Keep the proposition outside fading scenes. Phones show one example. Do not `overflow-hidden` a card that must show a full table row. After kit source changes: `pnpm --filter @zedtech/zedkit-ui build` before judging localhost:3100.
- **Fumadocs CSS.** Import the preset as source. A precompiled `style.css` duplicates utilities and can hide responsive variants.
- **Class merging and custom tokens.** `cn()`/tailwind-merge does not know the kit's token utilities (`h-tabs-list-height`): a later `h-auto` leaves both. Use `h-auto!` or fix the primitive, then read the computed height.
- **Nearest scope wins.** Root-identity dark rules skip nodes inside a scope. A nested dark section needs the identity on its own node (`ThemeScope mode="dark"` carries it); verify root Tide to local Press to nested dark.
- **Identity `--spacing` also sizes dots, icons and swatches.** Pin fixed-size marks (`[data-palette-dots]`).
- **Page-specific shell patches** (`tide-fit.css`) are debt: fix the token or primitive instead, and delete the patch when it lands.
- **Identity probes.** Site chrome pins radii/shadows on `:root`. A probe in `main` does not prove a look. Resolve tokens on `[data-identity-scope]`.

## Verifying the render

1. Confirm the stylesheet and fonts loaded before judging a capture: rule count above zero, `document.fonts.ready`, the expected family on the page text. An unstyled capture is a collection failure; diagnose it separately and do not count it as evidence.
2. Compare like with like: same content, viewport, identity, mode and state, before and after.
3. When geometry surprises you, read the computed style of the element, not the class list.
4. Wait for transitions to settle before reading computed colours or shadows.
5. Test provenance and behavior (where a value is declared, what an action changes), not that a name or text appears.
6. Keyboard focus is checked on a keyboard-focused control: a script or pointer focus does not match `:focus-visible`.
7. Every iteration ends with a critique of the strongest remaining visual weakness.

## Honest finish

Every iteration records: what changed, matching before/after screenshots (same content, viewport, identity, mode, state), what still looks weak. Tests passing and a self-assigned score are not evidence of design quality.
