# Docs site visual contract (Product Atelier)

Scope: the website frame only (header, sidebar, prose, home, previews' frame). Identities shown inside specimens keep their own type, shape, density and color. The frame never restyles a specimen, and a specimen never restyles the frame.

Order of every page: what it enables, a working example, how to adopt it, then breadth.

## Evidence baseline (dev.zedkit.app, v0.9.4, 1 Nov 2026)

Observed in `.turbo/evidence/before/`: heavy tan border + shadow + radius on search, toggles, sidebar footer, preview frame and every control, so nothing leads; hero copy leaves the left column mostly empty while the demo carries 5+ controls; the Button preview frame is about 370px wide inside a wide column, and its toolbar (style, size, mode) is louder than the buttons; "Who / Use when / Avoid when" are bold labels with large gaps.

## Who owns what

One decision, one owner. Fix a repeated problem at the lowest layer that shares it, never in the layer where you noticed it.

| Layer | Owns | Lives in | Fix here when |
|---|---|---|---|
| Token | A value every consumer reads: sizes, spacing, radii, colours, shadows, motion | `packages/ui/src/identities*.css`, `shared-type-scale.css`, `styles.css` | Two components or two looks disagree on a value |
| Primitive | One component's states and structure (focus ring, hit area, containment) | `packages/ui/src/*.tsx` | The same control misbehaves on two pages |
| Composed component | A recurring arrangement of primitives | `apps/docs/components`, `apps/docs/ui` | The arrangement repeats and has its own states |
| Docs shell | The site's own chrome: header, nav, prose, tables, code, gutters | `app/docs-*.css`, `app/home-*.css` | It is the site's presentation, on every page |
| Identity scope | The look a specimen wears, resolved on its own `ThemeScope` node | `packages/ui/src/identities/*.css` | A look's token or the boundary between looks is wrong |
| Page | Order, spacing and content of one composition | the route and its view | Nothing else shares it |

Choosing the shared fix: (1) name the owner of the *value* that is wrong; (2) look for a second place that has the same problem (another identity, viewport, page); (3) if there is one, fix the token or primitive and delete the local patch; (4) a selector that mentions a page id, an element class of another layer, or `!important` to beat a token is a symptom, not a fix. `tide-fit.css` was one: a phone rule that restyled every Tide specimen to make one hero fit. The cure was recomposing the hero, not compressing tokens.

**Invariant across identities** (the shell and the tests pin these): the type size table below, the 13px floor for anything a person reads to act, 44px touch targets on phones, a focus indicator of at least 2px and 3:1 added by focus itself, AA text contrast in both modes, motion caps, the DOM and its semantics, the placement of the destructive action, and the content of a shared comparison task.

**Free to vary per identity**: font family and weight flavour, tracking, spacing unit, radius scale, border width, shadow and depth, the paired light/dark palette, motion personality, texture. "In full" for a specimen means these, not a different size table.

The three owners of a render, in order of precedence:

- **Specimens** (`ThemeScope`, the nearest scope wins, also for a nested dark section): their own identity and mode. Nothing in the shell restyles them (headings, spacing and text sizes included), and they never restyle the shell. A site rule that must not reach a specimen says so: `:not([data-identity-scope] *)`.
- **Selected identity** (default Glass, or the visitor's opt-in choice): what the site's own chrome wears for the variables above. It never changes a size in the table below. Runtime default is `DEFAULT_IDENTITY` in `apps/docs/lib/default-identity.ts`.
- **Site shell** (pinned in `app/docs-shell-tokens.css` and `docs-typography.css`): sizes and weights below, reading widths, section rhythm, gutters, nav density, the contrast overrides for chrome.

## Roles

Sizes are the implemented tokens (`packages/ui/src/shared-type-scale.css`, applied by `docs-typography.css`). A test pins each; change the token and the test together, with a reason.

| Role | Rule |
|---|---|
| Marketing H1 | `--zk-type-h1-size`: 32px up to 44px (`clamp`), 32px at 390px and below, weight 600, one per page. No second display size. |
| Docs H1 | `--zk-type-doc-h1-size`: 2rem, 1.75rem below 48rem (not the marketing clamp). H2 `--zk-type-h2-size` 22-26px, H3 18px, weight 600. Linked headings inherit size and weight. |
| Prose | 15/1.6 (`--zk-type-prose-size`), 64-72ch. Lead paragraph `--zk-type-lead-size` 16-18px, once. |
| Body and dense UI | Body 14/1.55. Dense UI (controls, tabs, example links, table cells, nav) is the kit's `--text-sm`: 13px. Nothing a person must read to act is below 13px. |
| Metadata | 12/1.4 (`--zk-type-label-size`). Counts, captions, eyebrow labels, timestamps. Never essential copy or a link people need. |
| Code | Mono family of the identity, 13/21 in blocks, inline code follows its sentence. |
| Dense looks | Density is rhythm (row height, gaps, rules), not smaller type. Volt's activity rows are 13px: the event is what a person reads to act. Only the timestamp column may be metadata. Decision, 2 Nov 2026: the 13px floor wins over a 12px mono row. |
| Widths | Marketing 1200 max. Docs shell 1440 max, nav 240, article 720-800, TOC 180 only if it fits. |
| Spacing | 4px base, steps 4/8/12/16/24/32/48/64. Between groups 32-48, between marketing sections 64-96. No blank band without a job. |
| Gutters | 16 mobile, 24 tablet, 32 desktop. |

## Surfaces, borders, elevation

- Three surfaces: page (reading), specimen stage (demonstration), overlay (transient). Nothing else gets a container.
- A border exists where two regions meet or a control is interactive. Divider (quiet) and control border (clear) are different strengths. Grouping alone is never a reason for a border.
- Shadow only on overlays and genuinely raised controls. Sections, fields, code wells and cards in a grid are flat.
- Radius: controls 8, specimens and overlays 12, pills only for compact status/selection.
- Color: one action accent, explicit success/warning/danger. Active text 4.5:1, large 3:1. Dark is a paired hierarchy, not an inversion.
- Glass (the default look) may carry decorative colour halos and a lit rim: it is a material, defined in [signature.md](../../docs/design/signature.md#glass-material). No other look and no other surface gets decorative gradients.

## Controls and hierarchy

- One primary action per view. Secondary is outlined or quiet. Tertiary is a link.
- Destructive: the trigger is outlined (destructive colour on the text or icon) and sits apart from Save and Discard, below a divider or at the end of the row. The solid destructive button appears only inside its confirmation. Anything simulated says so in its outcome message.
- Preview frame: one stage, one quiet toolbar. Stage height follows content. Appearance choices (identity, mode, width) sit in one row under "Display", current values visible, subordinate to the example.
- Touch targets 44px on mobile, separate from the visible control size.

## States and overflow

- A specimen shows the states its task has. A data table has loading, empty, error and ready; a form has invalid and pending; a reading page, a code block or a static example has none of them, and nothing is added to say so. When a state is omitted, the example's own sentence says why.
- Code blocks and data tables may scroll sideways inside their own region. That region is keyboard-reachable and named; the page itself never scrolls sideways. Anything else that overflows is a layout bug: wrap, recompose or truncate with the full text one tap away.

## Motion

Only to explain a change or keep context (overlay in/out, panel following focus, row insert). 120-160ms feedback, 180-220ms panels, transform/opacity. Small state feedback may be instant. Reduced motion removes displacement.

The home page has one scene that is allowed to do more, because it is the first impression and each motion shows the kit working:

- **Hero window** (`app/home-hero.css`): the window assembles on load (frame, sidebar, page blocks), each page rebuilds the same way when shown, a guided cursor uses the real controls until the visitor touches the frame (it also presses the Display row to show the same app in Glass and Maison; a new look fades in, opacity only), and two decorative cards over the window's edges follow the pointer and drift with the scroll. Entrances are finite (460-640ms, `backwards` fill, nothing left applied); only the decorative cards loop or follow the page.

It obeys reduced motion completely (no animation, no tour, final numbers), never takes over scrolling, and never put a running transform, filter or mask on anything that holds a toast, a dialog or a portaled menu (see the traps).

## Home

Promise and one working example (hero: the proposition, which names both the UI and the one-prompt AI setup, beside one small working app whose pages are the examples, no scroll pinning of the hero), then the AI setup (the copyable prompt, what the kit installs, and the real file tree it leaves, all derived from the `zedkit-ai` kit manifest), then three looks, each doing the job it suits (one product screen per look in one stage, switched by tab, built from the same components, never one page restyled per look; nothing is pinned, the page scrolls normally), then adoption (npm or copy source, one command), then finding a component by family, then the rest of the kit. Each band has one focal point, one next action and a different shape from its neighbours. A band that repeats another (two blocks about coding agents) is removed.

Identity examples sell what the kit builds, not how many identities it ships: no count in the title or copy, and each look shows its own product screen (Mist a dev console, Press a newsroom, Maison a bag shop; the hero and the page itself carry Glass), never one page restyled per identity. Each example uses live kit components and keeps its own identity in full.

## Component page

Title, one purpose sentence, status, example, install (npm or source, both when available), usage, states, behavior and accessibility, kit props first, inherited attributes collapsed, related. Contents list every section.

## Mobile

Compose by priority, not by stacking desktop. The first screen reaches the example or its start. Secondary tools are disclosed. Wide data scrolls in its own region, never clipped.

Recompose (change the order or the arrangement, not the tokens) when any of these holds at 390px: the first action sits below the first screen; a control group wraps onto a second row of equal weight; two columns become two unreadable ones. Order with one DOM and CSS `order`, or with a slot (the editor's `afterShape`); never render a control twice and hide one. Compressing a look's spacing or type to make a phone fit changes the specimen and is not recomposition.

## Traps (31 Oct–1 Nov 2026)

These broke real previews. Check them before changing home, chrome, specimens or overlays.

- **Frame vs content height.** `min-h-svh` / `min-h-screen` inside a bounded preview (hero card, 40rem stage) leaves empty chrome. The frame owns height; the specimen is `h-full min-h-0`.
- **Identity `--spacing` scales `w-*` / `p-*` / `gap-*`.** A `w-48` sidebar in Tide is not 12rem. Pin chrome that must stay compact, and look at Tide before calling a layout done.
- **Calendar is `role="grid"`.** Do not paint `tbody tr:hover` on it; hover `.rdp-day`.
- **Fixed containing blocks.** A running animation of `transform`, `translate`, `scale`, `rotate` (even to `none`), a `filter` or `will-change` on an ancestor makes it the containing block of its `position: fixed` descendants: a toast or a floating bar inside is laid out against that ancestor, not the viewport, and can sit on the controls it reports on. Animate opacity, or keep fixed content out of the animated subtree. Check with a real toast at 1280x720.
- **Scroll pinning loses the example in use.** A scroll-driven fade ends the example it is fading when a click scrolls the page by a few hundred pixels. The hero is a tablist for that reason, and the looks band is plain tabs with no pin. A scene that must pin keeps one rule: the scroll position is the only thing that picks the example, and nothing the visitor does inside it scrolls the page.
- **Overlay is a sibling.** Vaul/Radix scrim sits next to the panel. `backdrop-filter` on the overlay becomes the backdrop root, so the panel blurs the scrim, not the page. Frost with a lighter overlay (`bg-overlay/50` + blur) or put blur on the panel and set the overlay filter to `none` (Glass). `prefers-reduced-transparency`: solid scrim, no filter.
- **Hero.** The proposition stays outside the examples. Examples share one grid cell so the frame keeps one height; inactive ones are `invisible`, not unmounted (state survives), and not `display: none` (they would resize the frame). After kit source changes: `pnpm --filter @zedtech/zedkit-ui build` before judging localhost:3100.
- **Hero motion and fixed positioning.** A toast (`position: fixed`) inside the window sits against the viewport only if no ancestor has a running `transform`, `filter` or `mask`. The window and its pages run finite entrances only; loops and scroll-driven motion live on the decorative cards, which wrap nothing interactive. Check with a toast raised after the entrance.
- **One `main` per page.** The window is not the kit's `AppShell`: that renders `main`, `aside` and `header`, and the home page already has its own `main` (specs and axe assume one). `HeroShell` uses the same tokens with plain blocks. Move to `AppShell` if the kit ever offers an embedded mode.
- **Fumadocs CSS.** Import the preset as source. A precompiled `style.css` duplicates utilities and can hide responsive variants.
- **Class merging and custom tokens.** `cn()`/tailwind-merge does not know the kit's token utilities (`h-tabs-list-height`): a later `h-auto` leaves both. Use `h-auto!` or fix the primitive, then read the computed height.
- **Nearest scope wins.** A look's dark rule for plain `.dark` sections skips anything inside a deeper scope of another look (root Tide to local Press to nested dark; scope Tide to scope Press to nested dark). Load order must never decide: `identity-nested-dark.spec.ts` compares all outer/inner pairs against the inner look pinned dark. Alternating chains deeper than one look change need `ThemeScope mode="dark"`, which carries the identity on its own node.
- **Identity `--spacing` also sizes dots, icons and swatches.** Pin fixed-size marks (`[data-palette-dots]`).
- **Page-specific shell patches** (`tide-fit.css`) are debt: they made a Tide specimen differ with the site's identity. Fix the token, primitive or composition, then delete the patch.
- **Site rules reach specimens.** `#home-page h3` set every heading in every look to 18px and -0.02em. A site selector that targets elements (headings, text, controls) excludes scopes: `:not([data-identity-scope] *)`. Probe a heading inside a specimen, not only one in the page.
- **The pointer is part of a screenshot.** The click that opens an overlay leaves the pointer where the trigger was; the overlay opens under it and whichever button lands there is painted hovered. Park the pointer before capturing a surface; test hover on its own.
- **Dates and the reader's zone.** A `Date` built in a server component is a UTC instant fixed on the build host. Build dates where they are shown (a client component), or format with an explicit time zone. Hydration error #418 is the symptom, and CI (UTC to UTC) cannot show it: the test reads the page from other zones.
- **Identity probes.** Site chrome pins radii/shadows on `:root`. A probe in `main` does not prove a look. Resolve tokens on `[data-identity-scope]`.

## Verifying the render

1. Confirm the stylesheet and fonts loaded before judging a capture: rule count above zero, `document.fonts.ready`, the expected family on the page text. An unstyled capture is a collection failure; diagnose it separately and do not count it as evidence.
2. Compare like with like: same content, viewport, identity, mode and state, before and after. A captured baseline is only a reference once someone has opened it and judged it right; one that shows a defect (a chip overlapping a toggle) is not.
3. When geometry surprises you, read the computed style of the element, not the class list.
4. Wait for transitions to settle before reading computed colours or shadows.
5. Test provenance and behavior (where a value is declared, what an action changes), not that a name or text appears.
6. A failing screenshot diff is read, not accepted: open expected, actual and diff, then classify it as a product defect, an unstable test (pointer, timing, content behind a translucent surface), or an intended change. Only the last two justify touching the baseline, and the commit says which. Regenerate baselines in the CI environment (Linux, same Playwright), never from a local capture on another OS.
7. **Cascade boundaries**: resolve tokens on the specimen's own node, in light and dark, inside every nesting that is supported (look in look, dark in look, portalled overlay), against the same look pinned alone.
8. **Focus**: focus the control with the keyboard (a script or pointer focus does not match `:focus-visible`). The indicator must be added by focus (an outline that never changes is decoration), at least 2px, 3:1 against what is behind it, unclipped by an ancestor, and still drawn under `forced-colors`. Also check where focus goes after an overlay closes.
9. **Contrast**: computed colours on the settled state, both modes, every look the page can wear; large text 3:1, other text 4.5:1.
10. **Overflow**: `documentElement.scrollWidth` at 320, 360, 390, 768, 1024, 1440 and 1920, then 200% zoom; long labels and dense data; the only regions allowed to scroll sideways are code and data tables.
11. **Motion**: with and without `prefers-reduced-motion`; look at an intermediate state, not only the ends; an animated ancestor must not change where fixed content lands.
12. Every iteration ends with a critique of the strongest remaining visual weakness.

## Honest finish

Every iteration records: what changed, matching before/after screenshots (same content, viewport, identity, mode, state), what still looks weak. Tests passing and a self-assigned score are not evidence of design quality.

Sufficient visual evidence for a change:

- Each distinct template and each changed shared component, rendered and opened at 390 and 1440; the home, the editor and one table page also at the other widths of step 10.
- A shared component or token change: every look in both modes, including a specimen whose mode differs from the site's.
- Before and after under the same conditions, with the interaction exercised (pointer and keyboard) and its failure case.
- A test that is red on the base and green on the change. A test that cannot fail proves nothing.
- Anything not covered is listed as untested, never implied.
