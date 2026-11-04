# Animate — spec

Typed motion on any element. CSS does the look; a tiny runtime covers
what CSS cannot. Tokens come from the active identity
(`--zk-reveal-*`, `--zk-stagger-step`, `--zk-lift-*`, `--zk-press-*`,
`--zk-longpress-ms`). Displacement is transform/opacity only (no layout
shift). Scroll-snap belongs to `Section` (other work); pinned scene
crossfades belong to `ScrollScenes`. This API does neither.

Existing class utilities (`animate-fade-up`, `hover-lift`, `hover-press`,
`data-reveal`) stay. `data-animate` is the published attribute API.

## Types

```ts
type AnimateTrigger = "appear" | "scroll" | "press" | "longpress" | "hover" | "focus";

type AnimatePreset =
  | "fade-up"
  | "fade-in"
  | "fade-down"
  | "pop-in"
  | "lift"
  | "scale-down"
  | "scale-up"
  | "pulse"
  | "parallax";

/** Any other kebab-case token is a custom `@keyframes` name. */
type AnimateMotion = AnimatePreset | (string & {});

type AnimateOn = Partial<Record<AnimateTrigger, AnimateMotion>>;

interface AnimateProps extends React.ComponentProps<"div"> {
  on?: AnimateOn;
  /** Appear delay in milliseconds. */
  delay?: number;
  /** Stagger children when `appear` runs. */
  stagger?: boolean;
}
```

Public exports: `Animate`, `AnimateObserver`, `observeAnimate`,
`ANIMATE_PRESETS`, `ANIMATE_TRIGGERS`, the types above.

## Attribute grammar

| Attribute | Value | Trigger |
| --- | --- | --- |
| `data-animate` | motion name | appear (shorthand) |
| `data-animate-appear` | motion name | appear (wins over `data-animate`) |
| `data-animate-scroll` | motion name | scroll |
| `data-animate-press` | motion name | press |
| `data-animate-longpress` | motion name | longpress |
| `data-animate-hover` | motion name | hover |
| `data-animate-focus` | motion name | focus |
| `data-animate-delay` | integer milliseconds | appear delay |
| `data-animate-stagger` | present | stagger children on appear |
| `data-animate-state` | `pending` \| `in` | runtime, appear only |
| `data-animate-longpress-on` | present | runtime, longpress held |

Bare `data-animate="fade-up"` is appear. Combine freely:

```html
<Card data-animate="fade-up" data-animate-delay="100" data-animate-press="scale-down" />
```

`<Animate>` writes the same attributes:

```tsx
<Animate on={{ appear: "fade-up", press: "scale-down", longpress: "pulse", scroll: "parallax" }} delay={100} />
```

Custom motion: any kebab-case name that is not a preset is used as
`animation-name`. Define `@keyframes that-name` in the app stylesheet.

## Presets

| Name | Properties | Typical trigger |
| --- | --- | --- |
| `fade-up` | opacity + translateY(distance) | appear |
| `fade-in` | opacity | appear |
| `fade-down` | opacity + translateY(−distance) | appear |
| `pop-in` | opacity + scale 0.96→1 | appear |
| `lift` | translateY(lift) | hover, focus |
| `scale-down` | scale `--zk-press-scale` | press |
| `scale-up` | scale 1.03 | hover |
| `pulse` | scale 1↔1.03 loop | longpress |
| `parallax` | translateY linked to view progress | scroll |

A preset can be used on any trigger; the trigger only decides *when*.

## Trigger semantics

**appear.** Once, when the element enters the viewport. Runtime uses
`IntersectionObserver`. First callback intersecting → `in` without
hiding first (already on screen, no flash). Not intersecting →
`pending` (opacity/translate only), then `in` on intersect, then
unobserve. No JS → no state attribute → content visible at rest.
Stagger: children of `[data-animate-stagger]` delay by
`n * --zk-stagger-step` plus `data-animate-delay`.

**scroll.** Progress-linked (0 enter → 1 exit), not a one-shot. Prefer
CSS `animation-timeline: view()` inside
`@supports (animation-timeline: view())` and
`prefers-reduced-motion: no-preference`. Fallback: rAF writes
`--zk-animate-progress` (0–1) when `view()` is missing. Not
`ScrollScenes` (no pin, no hijack).

**press.** CSS `:active:not(:disabled):not([aria-disabled="true"])`.
No JS. Keyboard `:active` on real buttons/links.

**longpress.** Pointer held for `--zk-longpress-ms` (stock 500ms).
Runtime sets `data-animate-longpress-on` until pointerup/cancel.
Decorative; never the only way to reach an action.

**hover.** CSS `@media (hover: hover) { &:hover }`. No sticky lift after
a tap.

**focus.** CSS `:focus-visible` only (not `:focus`).

## Reduced motion

`prefers-reduced-motion: reduce` kills every kit animation and
transition this API adds, leaves content visible and in place, and
makes the runtime a no-op (no pending, no parallax, no longpress).

## SSR and layout

- Content is visible without JavaScript.
- Only `opacity`, `translate`, and `scale` change. No width/height/top.
- Do not put `data-animate` on an ancestor of `position: fixed` UI
  (toast, dialog): a running transform becomes a containing block.
  See VISUAL-CONTRACT.md.

## A11y

- Hover gated to hover-capable pointers.
- Focus uses `:focus-visible`.
- Press ignores disabled.
- Longpress is not an action affordance.
- Appear hide is visual only (no `aria-hidden`, no `inert`).
- Reduced motion is total, not a slower variant.

## Runtime

`observeAnimate(root?: ParentNode): () => void` — appear observer,
scroll fallback, longpress listeners, MutationObserver for new nodes.
No-op on the server and under reduced motion.

`<AnimateObserver />` — client component, calls `observeAnimate(document)`
once near the app root (same seat as `ScrollReset`).

`<Animate>` is a server-safe host: attributes only, `data-slot="animate"`.
Mount `AnimateObserver` (or call `observeAnimate`) for appear / scroll
fallback / longpress.
