# @zedtech/zedkit-ui

## 1.10.0

### Minor Changes

- cd538d6: Glass look: a clearer fill with a slanted sheen, a lit rim (bright top-left edge, soft bottom-right edge, inner glow) carried by `--zk-glass-highlight` and so by every `--zk-shadow-*` consumer, blur lifted by `saturate` and a new `--zk-glass-brightness`, and stronger colour halos behind the glass. New tokens: `--zk-glass-sheen`, `--zk-glass-brightness`. `--zk-glass-alpha` is lower (0.54 light, 0.5 dark) and still overridable; reduced transparency, no `backdrop-filter` and forced colors stay solid. Cards that bring their own wash keep it.

### Patch Changes

- cd538d6: Add `WordRoll` for inline vertical word cycling with `data-animate="fade-up"` enter and `data-word-roll` exit (`zk-word-roll-exit-up` in `motion.css`). `IdentityScript` emits its bootstrap only during SSR/hydration so Next.js 16 no longer warns about a client-created `<script>`.

## 1.9.1

### Patch Changes

- 8ee6ff5: Add stream status and incremental text primitives for assistant streaming.
- b6703dc: SecretField announces copy success and failure through a polite live region, including when the clipboard API is missing or writing to it fails.

## 1.9.0

### Minor Changes

- 5c75c01: PromptInput polish: icon-sized send/cancel controls with tap-aligned padding, configurable `maxRows` auto-grow cap with scroll, and clearer busy/disabled send behavior.
- 5c75c01: Add `ParallaxSection` / `ParallaxLayer` on `@zedtech/zedkit-ui/motion` (CSS scroll-driven, static fallback) and a `Surface` `depth` wrapper.

### Patch Changes

- c32c3b2: Raise identity assistant timeouts so a reference request can finish.
- 5c75c01: Harden Parallax CSS value parsing against ReDoS (linear-time number/unit regex).
- 5c75c01: Card, Dialog and Popover compose the shared `Surface` host (same tokens as before). `WidgetButton` still applies `surfaceVariants` on the button host.
- 5c75c01: ui: first `useNarrowViewport` paint uses `ssrWhenUnknown` so WizardSteps hydrates without a markup mismatch on desktop.

## 1.8.0

### Minor Changes

- 99bc066: PromptInput polish: icon-sized send/cancel controls with tap-aligned padding, configurable `maxRows` auto-grow cap with scroll, and clearer busy/disabled send behavior.
- 99bc066: Add `ParallaxSection` / `ParallaxLayer` on `@zedtech/zedkit-ui/motion` (CSS scroll-driven, static fallback) and a `Surface` `depth` wrapper.

### Patch Changes

- 99bc066: Harden Parallax CSS value parsing against ReDoS (linear-time number/unit regex).
- 99bc066: Card, Dialog and Popover compose the shared `Surface` host (same tokens as before). `WidgetButton` still applies `surfaceVariants` on the button host.
- 99bc066: ui: first `useNarrowViewport` paint uses `ssrWhenUnknown` so WizardSteps hydrates without a markup mismatch on desktop.

## 1.7.0

### Minor Changes

- be11e7d: Add `PromptInput`: chat-style composer with in-field send control (Enter to send, Shift+Enter for newline).
- be11e7d: Add four brief-routed domain specimens (commerce, SaaS dashboard, editorial, service booking) and `selectSpecimenDomain` on `@zedtech/zedkit-ui/marketing`.
- be11e7d: Add signature type-role utilities, named motion tokens (`motion-reveal` … `motion-feedback`), and decouple `Heading` visual role from semantic level. Document the language in `docs/design/signature.md`.
- be11e7d: Add `StickyAside` (CSS-only sticky two-column layout), snap opt-out for sections that contain it, docs and home Get started migration.
- be11e7d: Add `Surface`, `surfaceVariants`, `surfaceGlassPanelClass`, and `applySurfaceGlassPanel` as the shared panel chrome (solid, popover, and glass via `data-surface="glass"`; elevation 0–3; radius and padding tokens). `Card`, `Dialog`, `Popover`, `Drawer`, and `WidgetButton` compose it. `DrawerContent` accepts `size="sm" | "md" | "lg"` (`lg` about min(600px, 92vw) on desktop). The docs site applies glass panels through the kit helpers instead of site CSS overrides.
- be11e7d: Add a unified `data-animate` / `<Animate>` motion API (appear, scroll, press, longpress, hover, focus) with identity tokens, a tiny SSR-safe runtime, and reduced-motion off.
- be11e7d: Harden `observeAnimate` (one listener set, late nodes, purge, reduced-motion toggle) and add `MotionScript` / `useMotionPreference` so an in-app reduce choice applies before paint.
- be11e7d: Add motion knobs (`--zk-motion-intensity`, derived parallax amplitude, `--zk-pin-top`, mobile factor) as `var(--zk-…, fallback)` reads, with no new identity tokens.
- be11e7d: Floor marketing section rhythm on phones, and add `SectionScroll` plus a Section `snap` prop for proximity scroll-snap (opt out long or sticky bands).

### Patch Changes

- be11e7d: Small `size="sm"` buttons (including `asChild` links) use `py-control-block` so computed block padding matches other controls and home CTAs pass the header-controls consistency spec.
- be11e7d: `Drawer` with `modal={false}` renders a kit inline panel (Surface + portal) instead of Vaul/Radix Dialog, so focus and pointer events reach the page; Escape still closes and focus returns to the trigger.
- a266a42: Drawer: stop remounting the Vaul root when the narrow viewport flag settles, so controlled `open` is not dropped on the first paint.
- be11e7d: Side drawers (left/right) now drag from their handle only by default, so pressing and dragging inside the panel selects text instead of moving or closing it (`handleOnly` still overrides). Buttons, icon buttons included, show the pointer cursor on hover.
- be11e7d: Side drawers (left/right) swipe shut from anywhere on the panel again. Pass `handleOnly` on a panel that is a text surface, where a press-and-drag must select text instead.
- be11e7d: Glass identity: sticky headers are translucent frosted glass. New `--zk-glass-bar-*` tokens (alpha, filter, luminous bottom edge, inset relief highlights; no drop shadow) style `MarketingHeader`, with a near-solid fallback when backdrop-filter is unsupported or less transparency is requested.

  `PageHeader` takes a `back` slot above the title, spaced by the new `--spacing-page-header-back-gap` token.

  `Badge` gains a `meta` variant: caption-size muted mono label with tabular numerals and no surface, for versions and counts.

- be11e7d: New reusable `data-surface="glass"` panel surface: a solid popover panel in every identity, frosted under the glass identity with the same overlay tokens as drawer/dialog panels (tinted wash, 24px blur with saturate, soft shadow, translucent edge; light and dark). Near-solid `@supports` fallback when `backdrop-filter` is unavailable, opaque under forced colors.
- be11e7d: Raise glass overlay panel alpha slightly so site chrome menus meet the documented 0.75 minimum in e2e contrast checks.
- be11e7d: Glass identity: the floating widget pill is near-solid in every theme, so its label keeps AA contrast over busy content.
- be11e7d: Button roots expose `data-variant` and `data-size` for identity chrome. Button-styled anchors from `asChild` keep control padding via size fallbacks; link variants no longer zero horizontal padding before size compounds apply.
- be11e7d: Add `ScrollGallery` for single-row horizontal scroll regions with snap, edge fade, and focus scroll-into-view.
- be11e7d: Drawer and Dialog focus the panel itself on open — never a field, never a text selection — through a shared `focusOverlayInitial` helper. New opt-in `initialFocus` prop (a ref or a selector resolved inside the panel, typed `OverlayInitialFocus`) moves focus to a field with the caret at the end.
- be11e7d: PromptInput: optional `allowEmptySubmit` so a host can resend the last prompt when the field was cleared after a proposal landed.
- be11e7d: PromptInput textarea uses the same focus-ring-control outline as other fields so keyboard focus is visible.
- be11e7d: `PromptInput` gains `sendDisabled`: it blocks sending while the field stays editable, so a draft can be typed (and kept) while the service is off. `disabled` still blocks both.
- be11e7d: Fix `ScrollGallery` row spacing: `--zk-gap-md` track and chip gaps, non-shrinking snap peers, content-sized tab chips with inner padding, and label/sublabel rhythm inside the gallery.
- be11e7d: Declare `@zedtech/zedkit-core` as a runtime dependency: the overlay initial-focus helper imports it, so installs of the package alone failed to resolve it.
- be11e7d: Restore pointer, text, and not-allowed cursors on interactive controls via base CSS and component classes.
- be11e7d: Fix drawer/dialog rendering under the sticky site header: add a z-index token scale (`--z-header` < `--z-dropdown` < `--z-overlay` < `--z-drawer`/`--z-dialog` < `--z-toast`, with `z-*` Tailwind utilities), mount dialog/drawer portals to `document.body` with a scope-look mirror so no consumer stacking context can trap them, and mount dropdown panels opened inside an overlay into that panel.
- be11e7d: Fix abrupt dialog/drawer close: the portals now use a Presence-free `createPortal` mount, so the overlay and panel inner Presences own the exit lifecycle again (closed state, exit animation, unmount on animation end, instant close under reduced motion).

## 1.6.2

### Patch Changes

- 3b34404: Refresh the committed API report: `badgeVariants` variant union is listed in the order the type is emitted. Types are unchanged.

## 1.6.1

### Patch Changes

- 6e81a46: Glass identity: sticky headers are translucent frosted glass. New `--zk-glass-bar-*` tokens (alpha, filter, luminous bottom edge, inset relief highlights; no drop shadow) style `MarketingHeader`, with a near-solid fallback when backdrop-filter is unsupported or less transparency is requested.

  `PageHeader` takes a `back` slot above the title, spaced by the new `--spacing-page-header-back-gap` token.

  `Badge` gains a `meta` variant: caption-size muted mono label with tabular numerals and no surface, for versions and counts.

- a0eb7c4: Restore pointer, text, and not-allowed cursors on interactive controls via base CSS and component classes.

## 1.6.0

### Minor Changes

- a6ca43f: ui: add `ScrollReset` / `useScrollReset` — scroll to top (or the `#hash` anchor) when the route changes, skip back/forward so the browser restores position, instant under reduced motion. The docs site now uses it.

## 1.5.0

### Minor Changes

- 5a8a70e: `OptionCards` can now pick exactly one card: `multiple={false}` renders native radio inputs in a `radiogroup` (round indicator, same visible check) and `onChange` receives `[id]`. `OptionCard` gains `type` (`checkbox` or `radio`) and `name` for custom pick-one groups. The default stays multi-select, so existing callers are unchanged.

## 1.4.0

### Minor Changes

- 5e5fd31: `@zedtech/zedkit-ui/marketing` gains `LogoBand` (a quiet row of logos; each company name is read out instead of the logo) and `Testimonials` (customer quotes as figures with captions on glass surfaces; quotation marks follow the page language).
- 69e6028: `@zedtech/zedkit-ui/marketing` gains `MediaSection`: a use case told as text (title, description, check-marked points, calls to action) beside a framed picture, recording, demo or code sample. `reverse` flips the sides from `lg` up while the text stays first in reading order.
- 8e2e4df: `@zedtech/zedkit-ui/marketing` gains `Pricing` (plans side by side: name, price, period, included features, one call to action each; the highlighted plan carries a visible badge) and `Faq` (questions that open in place, native `details`, no script). The marketing entry now covers a whole public page: header, hero, logos, features, steps, use case, testimonials, pricing, FAQ, closing call to action, footer.

## 1.3.0

### Minor Changes

- 2e4aeac: `@zedtech/zedkit-ui/marketing` gains `MarketingHeader` (compact sticky bar; links and actions open from a native disclosure on phones), `MarketingFooter` (brand, description, labelled link columns, bottom line) and `LocaleSwitch` (one item per language, current one marked, links or buttons). Links are passed as elements, so router links work.

  `ZedkitUiMessages` gains three required keys (`menu`, `mainNavigation`, `language`), filled in `zedkitUiMessagesEn` and `zedkitUiMessagesFr`. Migration: apps that spread a kit bundle (`{ ...zedkitUiMessagesEn, ... }`) need nothing; apps that write a full bundle by hand add the three keys.

## 1.2.0

### Minor Changes

- b8a0f02: `@zedtech/zedkit-ui/marketing` gains `FeatureGrid` (a titled grid of short benefits on glass surfaces, 2 to 4 columns, optional decorative icons) and `HowItWorks` (numbered steps, stacked on phones and in a row from `md`). Both are regions named by their level-2 title, with level-3 item titles; every string is a prop.
- 5525160: `@zedtech/zedkit-ui/marketing` gains `Hero` (promise, description, calls to action, optional media; renders the page heading) and `CtaBand` (closing call to action on a tinted glass surface). Both are labelled regions named by their own heading, take every string as a prop, and stack their actions full width on phones.

## 1.1.0

### Minor Changes

- 5643840: New `@zedtech/zedkit-ui/marketing` entry for public-page sections, starting with `GlassSurface`: a card-coloured surface (`plain`, `raised`, `tinted`; four paddings; renders `div`, `section`, `article` or `li`) that turns into frosted glass under the glass identity and a plain raised card under the others. The entry is separate from the main export, so console-only apps do not load it.

## 1.0.3

### Patch Changes

- a294306: `identityContrastWarnings` now suggests a foreground that actually meets the target on mid-tone backgrounds: the nudge tries darker and lighter and keeps the smallest passing move, instead of picking one direction from the background luminance and stopping at white or black below the target.
- 7a9e44a: `OptionCard` / `OptionCards` now draw a visible check box on each card, filled with a check when selected, so ticked cards no longer look almost like unticked ones. The native checkbox stays the control; the indicator is decorative.

## 1.0.2

### Patch Changes

- 6b77294: `isNamedIdentityId` accepts only `n-` and a plain slug (`a-z`, `0-9`, `-`, up to 120 characters), because the id is written into a `[data-identity="…"]` selector. A saved look whose id could leave that selector is no longer applied.

## 1.0.1

### Patch Changes

- 2fde8ae: Identity tokens: a CSS value with a control character (a newline in a quoted string, for example) is now refused, because it would drop the declaration that follows it.
- 2fde8ae: Catalog entries for Theme, Motion and the TypeScript base now type their adoption (CSS import, CSS directive, utilities, attributes, extended config) instead of listing prose as exports. No code change; the install steps on the docs site are generated from these lines.
- @zedtech/zedkit-i18n@0.2.1

## 1.0.0

### Major Changes

- f283163: Catalog maturity Option B: 60 stable, 39 beta, and 8 alpha needs; docs badges only for alpha (sidebar), beta (page + catalog), and none for stable or on the home gallery.

  **1.0.0** on ui, core, server, nest, seo, quality, and payload-seo marks stable catalog entries under real semver. This release does not change runtime behavior by itself — it is a honesty and labeling step. The semver guarantee applies to **stable** needs only (no badge on the docs site). Alpha and beta entries in the same package can still change in minors with migration notes and are not covered by that guarantee.

  **Consumers:** move dependencies from `~0.x` to `^1.0.0` on the packages you use. Follow each package `CHANGELOG.md` for any migrations you have not applied yet (for example ui 0.8–0.9). Packages that stay on 0.x (ai, observability, flags, devtools, i18n, storage) receive minor bumps for catalog status only.

### Minor Changes

- 41d5374: **POTENTIALLY BREAKING:** `IdentityTokens` light/dark pairs now include `primaryForeground` and `mutedForeground`. JSON exports emit them in CSS; older saved JSON without those keys still parses (both default to `foreground`). Contrast warnings cover primary and muted text pairs; `identityContrastTokenLabel` labels them in UI.
- e59b6ef: Add ThemeScope so overlays inherit the nearest identity and mode. Dark tokens apply on the identity node itself; dialogs, selects, menus, popovers, tooltips and toasts portal into that scope.

### Patch Changes

- 0130dc4: Docs-only catalog update for the unified component page template (Button reference).
- 12f006a: A plain `.dark` section inside a look (Press, Tide, Volt, Maison, Glass) keeps that look and only adds its dark tokens, instead of falling back to the stock dark palette.
- 4da0034: DataTable renders loading, error, and empty states outside the horizontal scroller; filter misses show a clear-filters action and differ from an empty dataset (`emptyMessage` / `emptyAction`).
- 3973542: Dialog and drawer overlay chrome uses one transparent surface (D5): aligned header copy, footer action spacing, calmer close control focus, and initial focus on the panel without a heavy ring.
- 09b83e9: Fix button contrast inside destructive alerts, switch thumb geometry across identity density, and DataTable sort header semantics (`aria-sort` plus labelled sort controls).
- 47f0f7c: The focus ring is now an outline instead of a box-shadow, so component shadows (`shadow-none`, the active-tab shadow) can no longer erase it on tabs and selects, and forced-colors mode keeps drawing it. Tide's text on its coral highlight reaches 4.5:1.
- e384671: A plain `.dark` section inside an identity scope follows the nearest scope even when a deeper scope of another look sits between them (Tide scope to Press scope to dark used to resolve to Tide, by file order). Two looks nested alternately (X in Y in X) need `ThemeScope mode="dark"`, which carries the look on its own node and is exact at any depth.

  `parseIdentityTokens` takes only plain CSS values from pasted recipes and shared links: braces, semicolons, comments, at-rules, `url()`, unbalanced brackets or quotes are rejected, and a value is capped at 400 characters. Real font stacks, shadows and `calc()`/`var()` values still pass. Rejected values are ones that wrote past their declaration into the stylesheet.

  `ScrollScenes` fades scenes with opacity only: an animated `translate` made the scene the containing block of its `position: fixed` content, so a toast inside it was laid out against the scene.

  `SecretField` with `multiline` wraps, as its docs always said: it was `white-space: nowrap` inside a textarea that scrolled sideways, so a long install command did not read in full on a phone.

  `TabsTrigger` draws its focus ring inside the trigger: `TabsList` scrolls sideways, which clipped a ring drawn outside its 4px padding.

- 8a49360: `PageHeader` accepts `titleAs="h2"` for headers shown inside a page that already has an `h1`. Combobox and MultiSelect no longer log a downshift ref warning while closed.
- 3d30c9a: Quiet button ghost, outline, and link hover states (muted tint or underline only, no accent fill). Adds a `link` variant and pressed styling for outline controls.
- 219861e: Soften inline code and registry command fields: quiet tinted chips without heavy borders, and horizontal scroll for long shadcn add commands on narrow screens.
- 8dcbf60: Table rows tint with 12% of the identity accent on hover instead of the full accent fill, so Tide and Volt no longer flash a saturated row.
- cc87ac0: `ThemeScope` composes a consumer `ref` (object or callback, cleanup included) with its internal one, so overlays keep mounting in the scope. A scope that only pins a mode inside another scope keeps that scope's identity, and a page-root identity no longer overrides the dark section of a nearer identity. The scoped Mist reset follows the Inter family Mist is documented to use. Adds A11y guidance for SecretField, Form, Stack, Select and Checkbox/Switch.
- 9ad2249: IdentityScript accepts an optional opt-in storage key so a site can default one look until the visitor explicitly opts in. applyCustomIdentity accepts a separate persist key when applying a named preset to a custom storage slot.
- a874bf8: Tide light accent returns to the 3:1 brand coral so the shipped presets pass the identity contrast guard again, and the compact token table matches the CSS.
- acf38b7: Align Tide `--zk-type-h1-weight` with the shared P0 site scale (600) and set dark `--zk-subtle-foreground` for contrast on metadata copy.
- 4a53526: Clamp identity heading tracking to −0.02em and add `--zk-subtle-foreground` for label/meta tiers.
- 9b3a5be: WizardSteps shows a compact step summary and progress bar below the `sm` breakpoint; the horizontal step list is unchanged from `sm` up.
- @zedtech/zedkit-i18n@0.2.1

## 0.9.4

### Patch Changes

- c67595c: Maison and Press use hairline tinted borders, softer shadows, and no drawn ink edges on Press controls.
- 2173809: Modal drawers now move focus inside on open by default so keyboard users stay in the focus trap; non-modal drawers keep the previous behavior.

## 0.9.3

### Patch Changes

- fa7ce48: Declare `engines.node` (`>=22`) on every published package; CI blocks tarballs that omit it (reliability R33).
- Updated dependencies [fa7ce48]
  - @zedtech/zedkit-i18n@0.2.1

## 0.9.2

### Patch Changes

- 45657b6: Unify the site type scale across identities: shared `--text-*` steps (12/13/14px ladder, 15px prose) and semantic `--zk-type-*` roles. **16px is for form controls on mobile only** (`--zk-input-font-size`), not body copy. Identities keep font family, colour, and tracking only.

## 0.9.1

### Patch Changes

- 0d2c6f2: Add Playwright visual regression baselines for the UI gallery smoke tests.

## 0.9.0

### Minor Changes

- c4d1155: useValidatedForm ties form values to zod schema input and submit payload to schema output. Migration: drop the manual generic — `useValidatedForm(schema)` instead of `useValidatedForm<MyFields>(schema)`.

### Patch Changes

- ffc4639: Controlled DatePicker and DateRangePicker respect a parent clearing `value` instead of falling back to internal state.

## 0.8.2

### Patch Changes

- bd933e1: MultiSelect honors disabled on chip removal and emits one value change per removal.
- 2ba2950: Pagination Previous and Next use `type="button"` so they no longer submit an enclosing form.

## 0.8.1

### Patch Changes

- d6c58ea: Publish the prop types for input, popover, tooltip, dropdown menu, fieldset, select, textarea, and checkbox so their doc pages can list them.
- 9b70bcd: Let Stack use gaps 5 and 7, the steps that were missing between 4, 6, and 8.

## 0.8.0

### Minor Changes

- b8cb610: Additive type exports `DialogProps` and `FormFieldProps`, naming the props
  `Dialog` and `FormField` already accepted (same pattern as `TabsProps`).
  They let the docs generator render Props tables for the modal-dialogs and
  validated-forms pages, which shipped without one.
- 0bdc423: Preset switches no longer destroy custom identity work: `applyIdentity`
  parks the stored custom sheet (it is scoped to one look, so it stays inert
  under other looks and applies again on switch-back, matching the boot
  script after reload) instead of deleting it. Explicit resets use the new
  `discardCustomIdentity` export. A look-less `applyCustomIdentity` now
  scopes its sheet to the `custom` look instead of writing unscoped `:root`
  CSS.
- 548daca: Add layout tokens and primitives: container width tokens (narrow, reading, default, wide), identity-derived page gutter and section spacing steps, a `Container` component, and a full-bleed mode on `Section` (edge-to-edge band, optional muted tone, capped inner content). Existing `Section` rendering is unchanged without the new props.
- 00d57d4: Add a `multiline` prop to SecretField: the value renders wrapped in an
  auto-growing read-only textarea so long values (install commands, short
  snippets) read in full on narrow screens instead of truncating mid-token.
  Default rendering is unchanged. Also registers the spacing-token min-height
  utilities as one conflict group in `cn`, so token min-height overrides win
  like stock ones.

### Patch Changes

- 8bbe961: Apply compact identity colours to sidebar, card and muted chrome, not only page background.
- 5c23276: Show a named identity (`n-…`) as the selected option in IdentitySwitcher and IdentityPicker when it is not already in the list, so the control stays named.
- f50e3f4: Restore a stored named identity id with its custom sheet, and apply named looks without clearing that sheet.
- ea32cde: Keep destructive buttons and destructive text at WCAG AA contrast in every identity, light and dark.
- e725040: Name a Section from a string title (`aria-label`) and still render `description` when there is no title.

## 0.7.3

### Patch Changes

- 3605166: Apply the editor look as the site identity (light and dark) and overlay compact token edits.
- ac2f27f: Apply compact identity tokens to the whole page (`applyCustomIdentity`) and restore them before paint.
- 86460fb: WCAG 1.4.11 non-text contrast warnings for identity accent and border vs background.
- caaaab4: Nudge shipped identity accent and border lightness to 3:1 against background.
- a2711ad: WCAG AA contrast warnings for identity foreground/background pairs in light and dark.
- b846361: Keep a manual dark identity colour when a later light edit rewrites the pair.
- 0ab08f4: Derive an AA dark colour pair from identity light colours.
- 87d1912: Identity token schema (light and dark colour pair) and a CSS variable writer for a scoped look.
- 9f63ac8: Glass `--zk-border-width` is 0.5px (Mist stays 1px). Glass `--zk-shadow-xs` is a float, not a 1px contact lift. Maison `--zk-shadow-md` is a 1px ink line, not a soft drop. Tide, Press, and Volt borders stay. Volt/Maison stay thin so the phone search sheet still fits its results.
- 636aae6: Maison `--zk-body-leading` is no longer next to Mist (1.6). Maison is 2. Glass stays 1.85. Tide stays 1.35. Mist is unchanged.
- e512b87: Input is kit-authored. Height, block padding, and font size still use `--spacing` control tokens. Inline padding stays Tailwind `px-3`. `py-control-block` is unchanged (identity-aware and shared with other controls).
- 06c490d: Press `--zk-body-leading` is no longer next to Tide (1.35). Press is 1.12. Volt stays 1.25. Mist is unchanged.
- b302956: Press `--spacing` is no longer next to Mist (0.25rem). Press is 0.2rem. Volt stays 0.225rem. Tide stays 0.28rem. Mist is unchanged.
- 43a4c10: Tide `--zk-body-leading` is no longer next to Mist (1.6). Tide is 1.35. Press stays 1.45. Mist is unchanged.
- ffc470f: Volt `--zk-body-leading` is no longer next to Mist (1.6). Volt is 1.22, between Press 1.12 and Tide 1.35. Mist is unchanged.
- 50422ce: Volt `--zk-body-leading` is no longer next to Press (1.12). Volt is 1.48. Press stays 1.12. Tide stays 1.35. Mist is unchanged.
- d4bcba8: Volt `--zk-heading-tracking` is no longer next to Tide (-0.035em). Volt is -0.08em. Tide stays -0.035em. Mist is unchanged.
- ef7e2fb: Volt `--text-sm` is no longer next to Press (0.8rem). Volt is 0.75rem. Mist stays 0.875rem. The Volt type scale still increases xs→5xl.
- @zedtech/zedkit-i18n@0.2.0

## 0.7.2

### Patch Changes

- 6810343: Docs: lazy-load catalog results list chunk (#618).
- d603474: Docs: tree-shake tailwind-merge on docs app (#618).
- 27ca979: Docs: defer non-Inter identity Fontsource CSS until after hydration (#618).
- 36cb810: Docs: code-split home hero module from home view entry (#618).
- 1a8e09a: Docs: idle-load home hero preview chunk (#618).
- 60d0ca9: Control height and `py-control-block` aliases now follow `--spacing`. Mist stays 0.25rem / 2.25rem. Other looks get denser or roomier fields (Volt 32px, Maison 43px on desktop). Coarse/narrow viewports still clamp height to the 44px tap min. Leftover rem aliases (`px-button-inline*`, `gap-button-gap`, …) still do not follow `--spacing`.
- 703bc22: Glass `--zk-body-leading` is no longer next to Mist (1.6). Glass is 1.85. Maison stays 1.7. Mist is unchanged.
- 99a8bea: Glass `--zk-heading-leading` no longer sits next to Maison (1.12). Glass is 1.16. Maison stays 1.12. Mist is unchanged.
- f471583: Glass `--radius-xl` no longer sits 4px from Tide (1.75rem vs 1.5rem). Glass cards are 2rem. Tide stays 1.5rem. Mist is unchanged.
- f936e20: Glass `--spacing` no longer sits 0.01rem from Tide (0.27 vs 0.28). Glass is 0.32rem. Tide stays 0.28rem. Mist is unchanged. Tailwind `p-*` / `gap-*` on Glass open up; rem aliases from #798 still do not follow `--spacing`.
- 8b7086e: Alert is kit-authored. CVA variants, `role="alert"`, and `asChild` stay. Block padding stays `py-3` / `px-4`. Icon geometry still uses `--spacing-alert-icon-nudge` and `--spacing-alert-content-indent`.
- fd8f651: Badge is kit-authored. CVA variants (including `success` / `warning`) and public `badgeVariants` stay. Padding stays `px-badge-inline` / `py-badge-block`.
- 025ac6a: Button is kit-authored. CVA variants and `asChild` stay. Large size inline padding uses Tailwind `px-8`. `--spacing-button-inline-lg` stays as a deprecated alias. Control height tokens are unchanged.
- 34c67ca: Card is kit-authored. Slots still use `--spacing-card-padding` and `--spacing-card-stack`. Corners stay `rounded-xl`; elevation stays `shadow-md`.
- 4a9a937: Label is kit-authored. Radix still provides `htmlFor` / click-to-focus. Classes stay `text-sm leading-none font-medium` plus the disabled-peer convention. Public `LabelProps` is unchanged.
- dace979: Separator is kit-authored. Thickness follows the identity `--zk-border-width` token (mist stays 1px; other identities use their border weight). Radix still provides the accessible primitive. `--spacing-separator-thickness` stays as a deprecated alias for Select and DropdownMenu separators.
- 65302ff: Skeleton is kit-authored. Corners still use `rounded-md` (identity `--radius-md`). Pulse stays `motion-safe:animate-pulse`. Public `div` props are unchanged.
- 2140d94: FieldContent stack gap uses Tailwind `gap-1.5` (0.375rem). `--spacing-field-content` stays as a deprecated alias so existing class names still work.
- d2433fa: StatusLabel icon/text gap uses Tailwind `gap-1.5` (0.375rem). `--spacing-status-label-gap` stays as a deprecated alias so existing class names still work.
- 13342fa: Tide dark `--zk-shadow-xs` no longer copies Glass's `0 1px 2px` drop. Tide is `0 1px 3px` plus a coral halo. Mist is unchanged.
- edf58b1: Volt `--zk-body-leading` is no longer next to Press (1.45). Volt is 1.25. Body leading and `--zk-shadow-lg` are unique across all six looks. Mist is unchanged. Tracking was already unique.

## 0.7.1

### Patch Changes

- 3cb15c8: Docs: fix getting started Quickstart intro for paths A–E (#794).
- cea8e6b: Docs: UI scenario plus scenario order matches choose-package table (#301). Supersedes open #839.
- 2ca6ffb: Docs: UI package row links to Quickstart path B (#301).
- 224db06: Docs: lazy-load home sections below use cases (#618).
- 91eae2c: Docs: code-split home hero preview and below-hero sections (#618).
- f46cab8: Docs: restore eager /catalog UI (#856 hurt LCP); defer hero admin scene and home gallery demo chunks (#618).
- 42c63e6: Docs: split home use-cases scroll chunk and widen optimizePackageImports (#618).
- e3d4842: Docs: optimizePackageImports on the public site for smaller client JS (#618).
- d5b4083: Docs e2e: smoke every published `/r/<brick>.json` URL (sync with registry.json).
- bc37bac: `Card` and `CardSkeleton` use `shadow-md`, so they pick up each identity's `--zk-shadow-md` (press stays flat; tide/glass read as deeper). Mist cards are one step stronger than the old `shadow` utility.
- 6921e0c: Glass `--zk-border-width` is a finer hairline (0.75px), no longer Mist's 1px. Maison still 1px. Mist is unchanged.
- e6f4bb3: Glass dark `--zk-shadow-xs` is no longer `none` (Maison keeps that). Dark glass now uses a faint drop plus the glass highlight. Tracking was already unique. Mist is unchanged.
- a99d702: Glass light `--zk-shadow-xs` no longer matches Tide's 1px/2px shape. Glass is `0 1px 3px` at 0.07. Tracking uniqueness now covers heading and label too. Mist is unchanged.
- c844ebb: Glass `--radius-2xl` no longer sits next to Tide's 2rem. Glass is 2.25rem. Tide stays 2rem. Mist is unchanged.
- 6e8634f: Glass `--radius-sm` / `--radius-md` no longer match Tide (0.5rem / 0.75rem). Glass is 0.625rem / 0.875rem. Buttons (`rounded-md`) follow. Mist is unchanged.
- 22e568c: Glass no longer shares Tide's `--radius: 1rem`. Glass corners are 1.25rem (xl 1.75rem). Tide stays 1rem / xl 1.5rem. Mist is unchanged.
- 686d03e: Glass no longer copies Mist's `--text-3xl` / `--text-5xl` or Press's heading line-height. Glass is 2rem / 3.125rem / 1.14. Mist is unchanged.
- d96dbda: Glass colour transitions are 220ms so they no longer match maison's 200ms. Mist stays at 150ms.
- b4a015e: Press, tide, and glass each have their own `--spacing` unit (0.24 / 0.28 / 0.27rem). Mist stays at 0.25rem; volt and maison keep 0.225rem and 0.3rem. No two looks share the spacing scale.
- 81ff3a0: Per-identity `--zk-body-leading`, `--zk-border-width`, and `--zk-color-duration` (`transition-colors` follows the last). Mist stays at 1.6 / 1px / 150ms. Press is firmer and faster (2px, 1.45, 80ms); maison and glass more open and slower; tide and volt each their own. Unused `--zk-density` and `--zk-control-scale` are removed (`--spacing` is the density knob).
- e2e5e83: Each identity now has its own type size, tracking, and shadow. Mist stays on the kit defaults (0.875rem / −0.025em / the stock shadow). Press, maison, glass, tide and volt no longer share those values with each other or with mist.
- 6e61844: Maison `--zk-border-width` is no longer Mist's 1px hairline. Maison is 1.75px (between Tide 1.5px and Press 2px). Mist is unchanged.
- 39643fa: Maison `--radius-xs` is no longer `0px` (Press keeps that). Maison xs is 0.5px, still below `--radius-sm` 1px. Mist is unchanged.
- 0f0f526: Maison light `--zk-shadow-overlay` no longer sits on the same 24px lift as Glass. Maison is a paper contact edge plus `0 20px 44px`, like its other depth steps. Mist is unchanged.
- 8207cf1: Press heading line-height no longer matches Mist's 1.1 fallback. Press `--zk-heading-leading` is 1.06. Tracking was already unique. Mist is unchanged.
- 63603ac: Press `--text-xs` is no longer Mist/Volt's 0.75rem (12px). Press is 0.6875rem. Tracking and body leading were already unique. Mist is unchanged.
- c03a996: Adds `--zk-gap-sm`, `--zk-gap-md`, `--zk-gap-lg`, `--zk-icon-size`, and `--zk-control-height`, each `calc()` from `--spacing` (mist matches today's rem). No component classes change in this release; deprecated `--spacing-*` aliases keep their rem values.
- ab21d41: Alert block padding uses Tailwind `py-3` (0.75rem). `--spacing-alert-block` stays as a deprecated alias so existing class names still work.
- b520640: Button icon/label gap uses Tailwind `gap-2` (0.5rem). `--spacing-button-gap` stays as a deprecated alias so existing class names still work.
- db3dbb4: Button `sm` inline padding uses Tailwind `px-3` (0.75rem). `--spacing-button-inline-sm` stays as a deprecated alias so existing class names still work.
- a34e7e9: Button, select trigger, and textarea block padding uses Tailwind `py-2` (0.5rem). `--spacing-control-block-lg` stays as a deprecated alias so existing class names still work.
- 59eec73: Combobox menu row padding uses Tailwind `px-3` (0.75rem). `--spacing-control-inline` stays as a deprecated alias so existing class names still work.
- 13fccd5: Input inline padding uses Tailwind `px-3` (0.75rem). `--spacing-control-inline` stays as a deprecated alias so existing class names still work.
- 204ddcc: MultiSelect menu row padding uses Tailwind `px-3` (0.75rem). `--spacing-control-inline` stays as a deprecated alias so existing class names still work.
- 0ec8894: SelectTrigger inline padding uses Tailwind `px-3` (0.75rem). `--spacing-control-inline` stays as a deprecated alias so existing class names still work.
- 38fbe4e: Textarea inline padding uses Tailwind `px-3` (0.75rem). `--spacing-control-inline` stays as a deprecated alias so existing class names still work.
- b6cdd7b: TooltipContent inline padding uses Tailwind `px-3` (0.75rem). `--spacing-control-inline` stays as a deprecated alias so existing class names still work.
- e7db2a8: DetailPanel row block padding uses Tailwind `py-3` (0.75rem). `--spacing-detail-panel-block` stays as a deprecated alias so existing class names still work.
- cc10626: DialogFooter row gap uses Tailwind `sm:space-x-2` (0.5rem). `--spacing-dialog-footer-gap` stays as a deprecated alias so existing class names still work.
- 46240f4: DropdownMenu item block padding uses Tailwind `py-1.5` (0.375rem). `--spacing-select-item-block` stays as a deprecated alias so existing class names still work.
- 3717f63: FieldSet/FieldGroup compact gap uses Tailwind `gap-3` (0.75rem). `--spacing-field-group-compact` stays as a deprecated alias so existing class names still work.
- e8054f4: FieldLegend bottom margin uses Tailwind `mb-3` (0.75rem). `--spacing-field-legend-bottom` stays as a deprecated alias so existing class names still work.
- cf63cce: Field row gap uses Tailwind `gap-3` (0.75rem). `--spacing-field` stays as a deprecated alias so existing class names still work.
- 631f165: OptionCard inner gap uses Tailwind `gap-3` (0.75rem). `--spacing-option-card-gap` stays as a deprecated alias so existing class names still work.
- 884175f: OptionCards group gap uses Tailwind `gap-3` (0.75rem). `--spacing-option-cards-gap` stays as a deprecated alias so existing class names still work.
- dbf7460: Combobox and MultiSelect toggle offset uses Tailwind `right-3` (0.75rem). `--spacing-control-inline` stays as a deprecated alias so existing class names still work.
- b38e737: Select label and item block padding uses Tailwind `py-1.5` (0.375rem). `--spacing-select-item-block` stays as a deprecated alias so existing class names still work.
- dce3744: Select and dropdown item inline padding uses Tailwind `px-2` / `pl-2` / `right-2` (0.5rem). `--spacing-select-item-inline` stays as a deprecated alias so existing class names still work.
- c8fd922: Table head/cell padding uses Tailwind `px-2` / `p-2` (0.5rem). `--spacing-table-cell` stays as a deprecated alias so existing class names still work.
- 4c58d29: TabsTrigger inline padding uses Tailwind `px-3` (0.75rem). `--spacing-tabs-trigger-inline` stays as a deprecated alias so existing class names still work.
- b80840e: WizardStep badge/label gap uses Tailwind `gap-2` (0.5rem). `--spacing-wizard-step-gap` stays as a deprecated alias so existing class names still work.
- 0accfb1: WizardSteps column gap uses Tailwind `gap-x-3` (0.75rem). `--spacing-wizard-steps-gap` stays as a deprecated alias so existing class names still work.
- 4a21865: WizardSteps wrap gap uses Tailwind `gap-y-2` (0.5rem). `--spacing-wizard-steps-row-gap` stays as a deprecated alias so existing class names still work.
- 07ba439: Tide `--zk-border-width` is no longer the 1px hairline shared with Mist. Tide is 1.5px. Press stays 2px. Mist is unchanged.
- 439b6f9: Tide light `--zk-shadow-overlay` no longer sits on the same 24px lift as Glass. Tide is `0 28px 72px` plus a coral halo, matching its other depth steps. Mist is unchanged.
- c5485d3: Tide light `--zk-shadow-sm` no longer sits on the same 2px lift as Glass. Tide is `0 3px 10px` plus a slightly stronger coral halo. Body leading and tracking were already unique. Mist is unchanged.
- de7efe6: Tide light `--zk-shadow-xl` no longer starts with Maison's `0 1px 2px` contact layer. Tide is `0 32px 80px` plus a coral halo, matching its other depth steps. Mist is unchanged.
- 0ee3821: Tide `--text-2xl` no longer matches Maison (2rem). Tide is 2.125rem. Mist is unchanged.
- baeef50: Volt `--zk-border-width` is no longer the 1px hairline. Volt is 1.25px. Tide stays 1.5px, Press 2px, Mist 1px.
- 063861d: Volt `--text-4xl` no longer matches Mist (2.25rem). Volt is 2.125rem, still between 3xl and 5xl. Mist is unchanged.
- 83a831f: Volt `--text-xs` is no longer Mist's 0.75rem (12px). Volt is 0.625rem (10px). Every identity now has a distinct xs size. Mist is unchanged.
- @zedtech/zedkit-i18n@0.2.0

## 0.7.0

### Minor Changes

- d601632: Add `BrandLogo`: render your own brand mark as an inline SVG that follows `currentColor`, with a required accessible name. `Logo` stays the zedkit mark used by the docs site.
- fdccf34: Adds `Calendar`, `DatePicker`, and `DateRangePicker` as thin wrappers over react-day-picker. Pickers open in the existing Popover. Locale and prev/next names follow `ZedkitUiProvider`.
- 3053f13: Add `Combobox` and `MultiSelect` (downshift + popover), export `PopoverAnchor`, docs demos, and tests.
- a4927e3: Adds `EmptyState`, `ErrorState`, and `Spinner`. Pass `description` and `actions` (no aliases). Spinner reads its accessible name from `ZedkitUiProvider` (`loading`); a `label` prop wins.
- cd1a0ff: Kit chrome (Close, Filter…, empty, loading) reads from `ZedkitUiProvider`. English is the default; pass `zedkitUiMessagesFr` or your own copy. A per-host label prop still wins. Upgrade notes: docs/migrations/ui-ref-and-messages.md.
- 58ec8cd: Adds `Popover`, `Tooltip`, and `DropdownMenu` as thin Radix wrappers. Tooltip delay is 0 unless you pass `delayDuration` on `TooltipProvider`.
- d074cfd: UI hosts take `ref` as a prop (`ComponentProps<"el">`) and set `data-slot` on each exported root. The quality preset flags `forwardRef` and points at `packages/ui/src/button.tsx`. Upgrade notes: docs/migrations/ui-ref-and-messages.md.

### Patch Changes

- fdac792: AppShell: the sidebar is hidden below md with `max-md:hidden`, so it shows on desktop in every Tailwind build order.
- 57ddf89: Docs: state core/server/nest are npm-only on getting started (#419).
- b62afe9: IconLabel catalog gains a home-areas example. Docs home cards use the same quiet decorative icons.
- e94d789: Docs: FAQ and FAQPage JSON-LD on zedkit-and-shadcn; llms-full.txt; install-or-copy in meta, llms, and READMEs (#419 PR2).
- 19ecc69: Docs: hero link to install-or-copy; getting started aligns install/copy intro with home (#419).
- 4b10808: Docs: finish #769 registry brick IconLabel coverage (test traceability).
- 2a57dc1: Docs: document @zedkit registry namespace for composed copy-path bricks (#761).
- a10ad9e: Add `@zedtech/zedkit-i18n` (`formatMessage`, `createMessagesContext`). The UI kit depends on it for `ZedkitUiProvider` and pagination templates.
- 0d3dddb: Drop unused `next-themes` (docs owns the theme provider) and unused `axe-core` (comes in through vitest-axe).
- ae82829: Darken the light success fill (stock theme and scoped mist) so the success Badge text reaches 4.5:1 (it was 3.15:1).
- 13bae80: Registry copy: card-skeleton family uses kit skeleton URL. Refs #420.
- 466f853: Docs: registry update story and GitHub `zedtech-fr/zedkit/<brick>` shorthand; commit `registry/ui` sources (#420).
- 2392ac5: Status registry copy family: kit sibling URLs and theme css for status-dot/checkmark/status-label. Refs #420.
- 7bd16b7: Registry copy path: theme item plus kit button/dialog URLs for composed bricks (#420).
- 085da29: Promote RouteModal to beta (tested, documented, reviewed, a11y-covered)
- 8c43fd8: Route Combobox/MultiSelect list and chip chrome through kit messages; document downshift in THIRD_PARTY_NOTICES. Refs #740.
- 3b893de: Dialog caps against the visual viewport, sticks title and footer, and keeps Close above the chrome so the keyboard cannot cover them.
- 735ce47: Control icons use Tailwind `size-4` (1rem). `--spacing-icon-control` stays as a deprecated alias so existing class names still work.
- 55f0cea: `IdentityScript` reads configuration from `data-*` attributes on a fixed bootstrap snippet (no dynamic inline script assembly). Behaviour unchanged for consumers.
- 892a099: `IdentityScript` is a static `<head>` tag (no client module). The stored look still applies before first paint; React no longer hydrates the bootstrap.
- e87f7e5: Dialog content scrolls inside a 90dvh max height. RouteModal uses the drawer sheet chrome (handle, body scroll, 44px close).
- 49e60a6: RouteModal's dialog variant has a live preview. Mobile overlay checks cover Dialog, ConfirmDialog, and RouteModal.
- c32f41b: Shared 1rem spacing aliases use Tailwind scale 4 (`p-4`, `px-4`, `gap-4`, `size-4`). The `--spacing-*` tokens stay as deprecated aliases so existing class names still work.
- 79dce37: CardSkeleton body lines use Tailwind `space-y-2` (0.5rem). `--spacing-card-lines` stays as a deprecated alias so existing class names still work.
- 87e2f05: DataTablePagination row gap uses Tailwind `gap-2` (0.5rem). `--spacing-data-table-pagination-gap` stays as a deprecated alias so existing class names still work.
- f450ae7: DrawerFooter stack gap uses Tailwind `gap-2` (0.5rem). `--spacing-drawer-footer-gap` stays as a deprecated alias so existing class names still work.
- 10d7fa7: FieldLabel and FieldTitle inline gap uses Tailwind `gap-2` (0.5rem). `--spacing-field-inline` stays as a deprecated alias so existing class names still work.
- 7f64985: FieldSeparator label padding uses Tailwind `px-2` (0.5rem). `--spacing-field-separator-inline` stays as a deprecated alias so existing class names still work.
- b22737c: FormItem stack gap uses Tailwind `space-y-2` (0.5rem). `--spacing-form-item-gap` stays as a deprecated alias so existing class names still work.
- 1d41978: PageHeader action row gap uses Tailwind `gap-2` (0.5rem). `--spacing-page-header-actions-gap` stays as a deprecated alias so existing class names still work.
- d6fde97: Shared 1.25rem spacing aliases use Tailwind scale 5 (`h-5`). The `--spacing-*` tokens stay as deprecated aliases so existing class names still work.
- d3dda74: SecretField row gap uses Tailwind `gap-2` (0.5rem). `--spacing-secret-field-gap` stays as a deprecated alias so existing class names still work.
- dec6869: StatusDot uses Tailwind `size-2` (0.5rem). `--spacing-status-dot` stays as a deprecated alias so existing class names still work.
- 42687ee: TabsContent top gap uses Tailwind `mt-2` (0.5rem). `--spacing-tabs-content-gap` stays as a deprecated alias so existing class names still work.
- Updated dependencies [a10ad9e]
  - @zedtech/zedkit-i18n@0.2.0

## 0.6.4

### Patch Changes

- 63b1f39: fix(route-modal): restore trigger focus at unmount only

## 0.6.3

### Patch Changes

- 2df4776: IdentitySwitcher and IdentityPicker mark the identity passed as `defaultIdentity` ("(default)" in the select, "Default" in the sheet), so a site that applies a default through IdentityScript can say so.

## 0.6.2

### Patch Changes

- 7b86dba: Drop the `@custom-variant hover` redefinition: it emitted malformed CSS that broke consumer builds, and Tailwind v4's default hover variant is already hover-gated.

## 0.6.1

### Patch Changes

- af05b51: Glass identity: drawer and dialog panels are translucent, tinted and blurred, with a lighter scrim; they fall back to near-solid without backdrop-filter, with reduced transparency, or in forced colors. Drawer and dialog parts carry data-slot hooks.
- 001f6aa: Catalog: ten UI needs move from alpha to beta (metadata only, no code change).

## 0.6.0

### Minor Changes

- d3d6a8c: Add ScrollScenes (alpha): a pinned stage that fades from scene to scene as the page scrolls, in pure CSS with native scrolling. Scenes sit one under the other under reduced motion and where scroll timelines are unsupported.

## 0.5.1

### Patch Changes

- 71c7513: RouteModal drawer returns focus to the trigger on close (WCAG 2.4.3) instead of dropping it on body.
- 905202a: DetailPanelRow values wrap inside the grid instead of spilling past their boxes (grid blowout on long unbreakable ids).

## 0.5.0

### Minor Changes

- 5398c86: Drawer: mobile bottom sheet (`mobile` prop), sheet height and safe-area tokens, `DrawerBody`, `DrawerCloseButton`, sticky chrome, and overlay motion tuned for phones. Left, right and top drawers now fit phones too: side panels are full height up to 90% of the width, the handle hides on sides and sits at the bottom of a top drawer, and safe-area insets are respected on every edge.
- 1ea4b9c: Add `IconLabel`: quiet inline icon + label with theme size, gap, and muted color tokens.
- c25c03e: OptionCards: card geometry uses theme tokens; adds composable `OptionCard` (data API unchanged). Migration: the `OptionCard` data interface is renamed to `OptionCardData` (name taken by the component) — replace the type name, no runtime change.
- d23d33f: List the six identities (`mist`, `press`, `tide`, `volt`, `maison`, `glass`) in the built-in `identities`: `IdentityScript`, `IdentitySwitcher` and `IdentityPicker` now offer them by default, and a stored built-in id is applied before first paint. No identity is applied until someone chooses one. Pass `identities={[]}` (or your own list) to keep the previous behaviour.
- 035ff81: Add the identity token foundation: `identities.css` (stock `--zk-*` tokens and the bridge that lets an identity restyle Tailwind utilities) and `motion.css` (reveal, stagger, hover lift and press utilities), both imported by `styles.css`. Body copy uses `leading-body` (1.6), hover styles only apply on devices that hover, and the focus ring is darker and 2px on controls.
- e5a617d: Add the `glass` identity: frosted translucent cards, popovers and code blocks over soft colour halos, hairline edges, generous radii. Surfaces turn near-solid without backdrop-filter support or when less transparency is requested. Inert until `data-identity="glass"` is set.
- c077015: Add the `maison` identity: airy ivory, Cormorant display over a Jost body, very fine borders, small radii, generous spacing, with metric-aligned fallback faces. Interactions stay within the motion caps; the slow feel is reserved for reveals. Inert until `data-identity="maison"` is set.
- 8d4b140: Add the `mist` identity: the stock look set in Inter (with a metric-aligned fallback face so the font swap does not shift the layout) and a visible text selection. Set `data-identity="mist"` on `<html>` to use it.
- 1802d22: Add the `press` identity: editorial paper and ink, square corners, 1px rules, no soft shadows, Newsreader display over a Space Grotesk body, with metric-aligned fallback faces. Inert until `data-identity="press"` is set.
- 68eb7fe: Add the identity provider and selectors: `IdentityScript` applies a stored `data-identity` before first paint, `IdentitySwitcher` (labelled select) and `IdentityPicker` (touch sheet) let people choose and persist the choice, and `applyIdentity` / `useIdentity` drive it from your own UI. The kit ships no identity yet: pass your own list, matching your `[data-identity]` CSS. Nothing changes until an identity is set.
- a600adf: Add the `tide` identity: navy and coral, Inter at heavy weights, large radii, soft glows, long eased reveals within the motion caps. Inert until `data-identity="tide"` is set.
- 974b112: Add the `volt` identity: dense near-black, Geist with a 12px xs body, hairline borders, layered depth, one acid accent, with a metric-aligned fallback face. Inert until `data-identity="volt"` is set.
- a2c8e06: Add `Logo`: the zedkit mark as an inline SVG that paints with `currentColor`, so it follows light, dark and every identity. Named image by default; pass `title=""` when the name is written next to it.
- a1c163f: Adds `useOnlineStatus` + `OfflineNote` (offline presence, part of #169).
- 32148d1: Touch-friendly controls: on touch or narrow screens, inputs, selects, textareas, buttons and tab lists reach a 44px tap height, and checkbox and switch carry an invisible 44px hit area while keeping their visible size. Mouse users keep compact heights. Dialogs keep a side gutter on phones and their close button is a full tap target, buttons get a subtle press feedback (skipped with reduced motion), invalid fields show a destructive border, wide tables fade the cut-off edge, and the data table resets to the first page when filtering and hides pagination when empty.

### Patch Changes

- f781d8a: Checkbox: token-driven size and focus ring, hidden check icon (no visual or API change).
- c6bc90e: Checkmark: size from canonical scale (`size-4`, value-identical 1rem, part of #367).
- 8aab3c2: Checkmark: size and draw animation use theme tokens; dash setup is path geometry (no visual or API change).
- bc62768: Docs: catalog fields for ConfirmDialog registry component pages (no API change).
- 77e8d1e: ConfirmDialog: keeps the props-bag API over Dialog (no styles of its own); trigger slot pinned by test.
- 293df49: DataTable: chrome geometry (stack, filter, sort, loading, pagination) uses theme tokens (no visual or API change).
- b1d317b: DataTable: adds composable `DataTableEmpty` (table output unchanged).
- 475ed85: Hide `DataTable` pagination when all rows fit on a single page.
- cb72a3c: DataTable: adds composable `DataTablePagination` (table output unchanged).
- 1664292: DataTable: adds composable `DataTableToolbar` (table output unchanged).
- ef23c2a: DetailPanel: row geometry uses theme tokens; adds composable `DetailPanelRow` (data API unchanged).
- 863f78c: Add `IconButton`, maturity-oriented `Badge` variants (`success`, `warning`), and darker `muted-foreground` in light mode for WCAG AA contrast.
- f890516: Export `BadgeProps` from the UI barrel so docs can reference the props type on registry component pages.
- 4a1b579: docs: accurate npm descriptions — UI kit is not admin-only; core is not backend-only.
- 7213de5: Export DrawerProps and catalog fields for the drawer registry doc page (part of #187).
- 5398c86: Drawer: content composed without `DrawerHeader`, `DrawerBody`, or `DrawerFooter` (a bare form, text, a list) now keeps the shared side gutters and clears the bottom safe area instead of touching the sheet edges. The slots carry `data-slot` markers. The admin dashboard demo and guide snippet compose the sheet with a handle, header, body, and footer.
- b7590da: Tokens: consolidate the three 0.875rem icon aliases into shared `--spacing-icon-sm` (no visual change).
- 7314c22: LivePulse: gap from canonical scale (`gap-1.5`, value-identical 0.375rem, part of #367).
- 9a0a2ec: Tokens: consolidate dialog/route-modal close offsets into shared `--spacing-overlay-close-offset` (no visual change).
- f9ba522: ProgressBar: segment gap and height use theme tokens (no visual or API change).
- 6ddbc95: `registry:check` now fails when `registry.json` theme `cssVars` / `css` drift from `packages/ui/src/styles.css`.
- 5f0e85d: RouteModal drawer variant: move focus inside on open so the focus trap engages (previously focus stayed on the trigger and Tab walked the background page). Matches the dialog variant; no API change.
- 3c11e6d: Consolidate the select item indicator box onto the shared `icon-sm` size token (same 0.875rem value, zero visual change, refs #367).
- ee95f6b: Switch: token-driven size, thumb travel, and focus ring (no visual or API change).
- ed3cd93: TabsList: scroll horizontally (`max-w-full overflow-x-auto`) instead of clipping on narrow widths.
- d501234: Tabs: list, trigger, and content geometry use theme tokens; focus ring uses the shared `focus-ring` utility (no visual or API change).
- e0e0625: Typography: add `asChild` composition to `Heading` and `Text`; heading anchor offset uses a theme token (`scroll-m-heading-scroll`).
- 88edb30: Alert: add `asChild` composition; padding and icon geometry use shared theme tokens (`px-alert-inline`, `top-alert-icon-offset`, `pl-alert-content-indent`).
- 747ec24: AppShell: sidebar width and main padding from `--spacing-app-shell-*` theme tokens (same rendered values — no visual change).
- 499d0b3: Badge: add `asChild` composition; padding and focus ring use shared theme tokens (`px-badge-inline`, `focus-ring`).
- ffbb1cf: Button: icon gap and default block padding use theme tokens (`gap-button-gap`, `py-control-block-lg`) instead of raw `gap-2` / `py-2` (same values).
- c1774ca: Button: control-height/button spacing theme tokens; `focus-ring-control` (1px, same keyboard focus as before — not Badge’s 2px `focus-ring`); fix `className` merge with `cn`.
- 0e501e7: Export the `CardProps` type for typed card overrides and generated docs.
- 5805d75: Card: header/content/footer/skeleton spacing from `--spacing-card-*` theme tokens (same rendered values — no visual change).
- da75051: Darken the light-theme `destructive` token so white text meets 4.5:1 contrast (was 3.6:1, failing axe color-contrast on destructive buttons and badges).
- 8c84a8d: Dialog: content centering from the `dialog-center` utility (`--spacing-dialog-center`) and elevation from `--shadow-overlay` (same rendered values — no visual change; replaces the `top-[50%]`/`translate-[-50%]`/`shadow-lg` literals).
- 525a365: Dialog: slot spacing, close offset, and overlay stacking from `--spacing-dialog-*` / `--z-index-overlay` tokens; close button uses the shared `focus-ring` and the kit `opacity-50` resting dim (was `opacity-70`). Same layout otherwise.
- dd17a5b: Drawer: stacking and content sizing use shared theme tokens (`z-overlay`, `max-h-drawer-max-height`, `sm:max-w-drawer-side`) instead of raw `z-50` / `max-h-[96dvh]` / `sm:max-w-md`.
- 863cd9e: Drawer: handle, header, and footer spacing use shared theme tokens instead of raw `mt-4` / `h-1.5 w-12` / `gap-*` / `p-4`.
- 4c3eece: Field compound layout: spacing via `gap-field-*` / `p-field-*` theme tokens (replaces raw `gap-6`, `gap-7`, `p-4`, etc.).
- 9ccec27: Form: item gap and description/message text size use shared theme tokens instead of raw `space-y-2` / `text-[0.8rem]`.
- 81cd2f2: Keep text fields at 16px or larger on touch and phone-width screens so iOS Safari no longer zooms the page when an `Input`, `Textarea`, `Select` trigger, `SecretField` or `DataTable` filter gets focus. Fields now read the new `--zk-input-font-size` token through the `text-control` utility; desktop keeps 14px.
- 0734dda: Input and Textarea: theme tokens for height, padding, and min-height; `focus-ring-control` (1px, unchanged from prior `ring-1`).
- e01face: Label: disabled peer dims to `opacity-50`, matching the kit-wide disabled convention (was `opacity-70`).
- 546c7b8: Export the `LabelProps` type for typed label overrides and generated docs.
- a9b8098: LivePulse: dot/label gap uses the shared theme token (`gap-live-pulse-gap`) instead of raw `gap-1.5`.
- 5f2215f: PageHeader and PageHeaderSkeleton: chrome spacing uses page-header tokens instead of raw `mb-6` / `gap-4` / `gap-2` (same values).
- db0a023: PageHeader: title/description stack uses the shared theme token (`space-y-page-header-title-gap`) instead of raw `space-y-1`.
- 7d9b0cf: RouteModal: drawer/dialog size props and close-button geometry use shared theme tokens instead of raw `max-w-*` / `top-4` / `h-4 w-4`.
- fa4d7e9: RouteModal: exit timing reads `--motion-slow`/`--motion-base` live instead of hand-mirrored constants, so themed motion durations stay in sync with the exit animation (same defaults otherwise).
- 09c501b: A scoped mist subtree (`data-identity-scope` with `data-identity="mist"`) now renders with the stock tokens under any page identity: colours (light and dark), radii, spacing, type scale, depth and motion no longer leak in from the page identity.
- 6cf491b: SecretField: row gap and copy/check icon size use shared theme tokens (`gap-secret-field-gap`, `size-icon-control`) instead of raw `gap-2` / `h-4 w-4`.
- ab35928: Select: content min-width uses the shared container token instead of arbitrary `min-w-[8rem]`.
- a4031d1: Select: label/item/separator spacing and indicator geometry use shared theme tokens instead of raw `px-2` / `py-1.5` / `pr-8` / `h-3.5 w-3.5` / `mx-1 my-1 h-px`.
- 3d43cc8: Select: content stacks on the shared `--z-index-overlay` token (`z-overlay`) instead of raw `z-50`; Radix runtime-var arbitraries documented as the allowed exception.
- b9aec64: Select: trigger and scroll buttons reuse the existing control tokens (`h-control-height`, `px-control-inline`, `py-control-block-lg`, `py-control-block`, `size-icon-control`, `focus-ring-control`) — no new tokens. Focus ring is now keyboard-only like the input pilot.
- aaeb113: Select: viewport padding and popper offsets reuse the select spacing token instead of raw `p-1` / `translate-*-1`.
- ff93465: Export the `SeparatorProps` type for typed separator overrides and generated docs.
- e60da25: Separator: thickness uses the shared theme token (`h-separator-thickness` / `w-separator-thickness`) instead of arbitrary `h-[1px]` / `w-[1px]`.
- 3c755c1: Export the `SkeletonProps` type for typed skeleton overrides and generated docs.
- afeaa6a: Toaster: re-export `toast` from the kit so docs and consumers need no direct `sonner` import; toast theme stays mapped to theme tokens.
- d8e69b7: StatusDot: dot size from the `--spacing-status-dot` theme token (same rendered value — no visual change). Tones already map to semantic color tokens.
- 05a5aed: StatusLabel: icon/text spacing from `--spacing-status-label-*` theme tokens (same rendered values — no visual change).
- bbaa116: Table: cell padding, head height, checkbox nudge and caption gap use shared theme tokens; structural selectors documented as the allowed arbitraries.
- 277069a: Export the `TabsProps` type for typed tabs overrides and generated docs.
- 160c50c: Export the `ToasterProps` type (re-exported from `sonner`) for typed toaster overrides and generated docs.
- d9ef8ae: Test that destructive and muted text pairs keep WCAG AA contrast (4.5:1) in both themes, so a token tweak cannot silently re-break downstream axe scans.
- 67d1ac8: UpdatedAgo: already token-driven (muted text tokens only); adds a live docs demo.
- d03a639: WizardSteps: geometry uses theme tokens; adds composable `Wizard` + `WizardStep` (data API unchanged).

## 0.4.0

### Minor Changes

- e50d5ef: Add `RouteModal` (route-driven drawer/dialog that plays its exit before navigating back) and `closeRoute` (back-or-fallback close action for parallel/intercepting routes).

## 0.3.0

### Minor Changes

- 1ee655e: Add faithful loading skeletons (`PageHeaderSkeleton`, `CardSkeleton`, `DataTableSkeleton`, `DetailPanelSkeleton`, each a named `role=status` zone) and pulse the base `Skeleton` only when motion is safe.
- a884cb5: Add `StatusLabel` (named inline operation status, `role=status`) and `UpdatedAgo` (stale-while-revalidate age stamp via `Intl.RelativeTimeFormat`).

### Patch Changes

- 03cacd0: Catalog: every need documents its short name, audience, purpose, when to (not) use it, and related needs (single-sourced from CATALOG.md, enforced by `pnpm catalog:check`), feeding the doc pages.
- b2c3c0f: Animate overlays by default: Dialog fades/scales in and out, Drawer slides on kit motion tokens with a reduced-motion guard. No API change.

## 0.2.0

### Minor Changes

- 5e9305e: Add `Drawer` (slide-in panel, `direction` top/right/bottom/left, side drawers full-width on mobile) wrapping `vaul` with the shadcn/ui drawer shape.
- 48fa6d8: Add state icons: `StatusDot` (motion-safe status dot), `ProgressBar` (determinate, `role=progressbar`), `Checkmark` (draw-once success check, static under reduced motion). `LivePulse` is rebased on `StatusDot` with identical output plus the reduced-motion guard.

### Patch Changes

- 59a12be: Discoverability: benefit-oriented descriptions, 8–12 npm keywords, homepage and bugs links per package (single-sourced from the CATALOG.md header, enforced by `pnpm catalog:check`), plus README badges and Install/Usage/When-to-use sections.
- c9c35aa: Mark shadcn-derived files (provenance header comments) and catalog entries (`Derived from:` flag, also in catalog.json); unmarked files are kit-authored.

## 0.1.1

### Patch Changes

- 889d207: Re-release with build output: 0.1.0 shipped without dist/ (the release job published before building) and is unusable; use 0.1.1.

## 0.1.0

### Minor Changes

- b664c35: Add the Alert family (Alert + Title/Description, default/destructive, shadcn source).
- bc6de49: Add AppShell (sidebar + topbar + main slots) and PageHeader (title + description + actions).
- f914184: Add the Card family (Card + Header/Title/Description/Content/Footer, shadcn source).
- 7d25f0e: Add DataTable filter input and pagination footer (TanStack global filter + pagination features).
- 617b596: Add DataTable (sortable TanStack Table wrapper with empty/loading/error states) and Table primitives.
- 9f6b122: Add DetailPanel (key-value rows) and LivePulse (live indicator), plus success/warning theme tokens.
- 18b1712: Add the Form brick: shadcn form (RHF wiring) + field primitives, useValidatedForm (zod schema from shared contracts), FormSubmit with pending state.
- e0d6de6: Initial release: admin UI kit scaffold — design tokens + dark/light theme CSS, cn() util, shadcn/ui-based toolchain (Radix, Tailwind v4, CVA, lucide, sonner, TanStack Table).
- 2db26ac: Add the layout helper family: Stack (direction + gap) + Section (titled content block).
- 0f7b3a0: Overlays slice: Dialog set, ConfirmDialog, themed Toaster, shown-once SecretField with copy.
- cec8f13: Primitives slice: Button, Badge, Input, Label, Separator, Skeleton (shadcn/ui-based).
- 878fec6: Add the Select family (Radix select primitives, shadcn source).
- 1c7256f: Add the Tabs family (Radix tabs primitives, shadcn source).
- 709b69f: Add the Textarea family (styled native textarea, shadcn source).
- 4b5209f: Add the Checkbox/Switch family (Radix primitives, shadcn sources).
- 5d8581d: Add the Typography family: Heading (levels 1-4, tag override) + Text (body/muted), following the documented shadcn typography recipes.
- fa382f5: Add WizardSteps (step indicator) and OptionCards (multi-select checkbox cards).

### Patch Changes

- cb519d1: Accessibility: SecretField accepts aria-label for its input; DataTable loading state uses aria-busy plus a labeled table instead of labeled skeleton divs.
- 0529e23: Consistent Tailwind class order; dialog overlay uses the new overlay theme token (same rendering).
- 16b564d: DataTable footer never shows page 0 (empty tables read Page 1 of 1).
- 781348a: Add "use client" to client-only modules so React Server Component adopters (Next.js) build: without it the server graph resolves client-only stubs (react-hook-form react-server) and fails.
