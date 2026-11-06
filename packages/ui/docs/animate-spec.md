# Animate — spec

Typed motion on any element. CSS does the look; a tiny runtime covers
what CSS cannot. Tokens come from the active identity
(`--zk-reveal-*`, `--zk-stagger-step`, `--zk-lift-*`, `--zk-press-*`,
`--zk-longpress-ms`). Displacement is transform/opacity only (no layout
shift). Scroll-snap belongs to `Section` (other work); pinned scene
crossfades belong to `ScrollScenes`. This API does neither.

Existing class utilities (`animate-fade-up`, `hover-lift`, `hover-press`,
`data-reveal`) stay. `data-animate` is the published attribute API.

No runtime dependency on AOS or anime.js (both MIT). Ideas below are
the bar, not copied source.

## Comparison

**AOS** ([michalsnik/aos](https://github.com/michalsnik/aos) v2.3.4,
MIT) is the bar for _declarative data-attribute scroll-reveal_.
`data-aos="fade-up"` plus `data-aos-offset` (default 120px),
`data-aos-delay`, `data-aos-duration` (50–3000, CSS tables),
`data-aos-easing`, `data-aos-once` (default `false` — re-hide on
scroll up), `data-aos-anchor` / `data-aos-anchor-placement`. CSS
starts hidden (`[data-aos^=fade]{opacity:0}`) until `.aos-animate`.
Engine: throttled `scroll` + lodash, plus `AOS.init()`.

**anime.js** ([juliangarnier/anime](https://github.com/juliangarnier/anime)
v4, MIT) is the bar for _quality and composition_. JS API:
`animate(targets, { duration, delay: stagger(65), ease, loop })`,
`createTimeline()`, `spring({ bounce, stiffness, damping })`,
`onScroll({ sync: true })`. WAAPI path ~3KB vs JS `animate` ~10KB;
full toolbox ~24.5KB. Not an attribute API.

|                                   | AOS                  | anime.js                   | This kit                           |
| --------------------------------- | -------------------- | -------------------------- | ---------------------------------- |
| Primary API                       | `data-aos`           | `animate()` / timeline     | `data-animate-*` + `<Animate on>`  |
| Appear                            | scroll hide/show     | `onScroll` trigger         | IntersectionObserver, once         |
| Scroll progress                   | no                   | `onScroll({ sync })`       | CSS `view()` + rAF fallback        |
| Press / hover / focus / longpress | no                   | JS playback                | CSS, plus JS longpress             |
| Delay                             | `data-aos-delay`     | `delay` / `stagger()`      | `data-animate-delay` + CSS stagger |
| Duration / ease                   | per element          | per tween / spring         | identity `--zk-reveal-*`           |
| Offset / anchor                   | per element          | scroll observer thresholds | one `rootMargin: 0 0 -10% 0`       |
| Once vs mirror                    | default mirror       | playback settings          | always once (unobserve)            |
| SSR                               | CSS hides without JS | n/a                        | visible until JS sets `pending`    |
| Reduced motion                    | `disable` option     | Scope / media              | total CSS + runtime kill           |
| 3D / flip / SVG / spring          | flip presets         | yes                        | no (transform/opacity only)        |

We take AOS’s attribute ergonomics (preset name + delay + once) and
anime’s composition (`on` maps several triggers, stagger, named
easings via tokens), then stop. Duration, distance and easing are
identity tokens so a look change retunes motion without per-node
attributes. Mirror, 3D flip, timelines, spring and SVG are out of
scope (VISUAL-CONTRACT: calm, no layout shift, no extra JS engine).

## Types

```ts
type AnimateTrigger =
  "appear" | "scroll" | "press" | "longpress" | "hover" | "focus";

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

**Word roll.** `<WordRoll>` composes two layers: incoming `span`
`data-animate="fade-up"` (appear) and outgoing `span` `data-word-roll="exit"`.
The exit animation is `zk-word-roll-exit-up` in `motion.css` (translate up +
fade out, same duration/ease tokens as reveal). The host is
`data-word-roll=""`.

## Attribute grammar

| Attribute                   | Value                | Trigger                           |
| --------------------------- | -------------------- | --------------------------------- |
| `data-animate`              | motion name          | appear (shorthand)                |
| `data-animate-appear`       | motion name          | appear (wins over `data-animate`) |
| `data-animate-scroll`       | motion name          | scroll                            |
| `data-animate-press`        | motion name          | press                             |
| `data-animate-longpress`    | motion name          | longpress                         |
| `data-animate-hover`        | motion name          | hover                             |
| `data-animate-focus`        | motion name          | focus                             |
| `data-animate-delay`        | integer milliseconds | appear delay                      |
| `data-animate-stagger`      | present              | stagger children on appear        |
| `data-animate-state`        | `pending` \| `in`    | runtime, appear only              |
| `data-animate-longpress-on` | present              | runtime, longpress held           |

Bare `data-animate="fade-up"` is appear. Combine freely:

```html
<Card
  data-animate="fade-up"
  data-animate-delay="100"
  data-animate-press="scale-down"
/>
```

`<Animate>` writes the same attributes:

```tsx
<Animate
  on={{
    appear: "fade-up",
    press: "scale-down",
    longpress: "pulse",
    scroll: "parallax",
  }}
  delay={100}
/>
```

Custom motion: any kebab-case name that is not a preset is used as
`animation-name`. Define `@keyframes that-name` in the app stylesheet.

## Presets

| Name         | Properties                         | Typical trigger |
| ------------ | ---------------------------------- | --------------- |
| `fade-up`    | opacity + translateY(distance)     | appear          |
| `fade-in`    | opacity                            | appear          |
| `fade-down`  | opacity + translateY(−distance)    | appear          |
| `pop-in`     | opacity + scale 0.96→1             | appear          |
| `lift`       | translateY(lift)                   | hover, focus    |
| `scale-down` | scale `--zk-press-scale`           | press           |
| `scale-up`   | scale 1.03                         | hover           |
| `pulse`      | scale 1↔1.03 loop                  | longpress       |
| `parallax`   | translateY linked to view progress | scroll          |

A preset can be used on any trigger; the trigger only decides _when_.

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
One global listener set (several mounts share it). Late nodes and
`prefers-reduced-motion` / `data-motion` changes are picked up. No-op
on the server; stays mounted under reduced motion so a later change
can start it.

`<AnimateObserver />` — client component, calls `observeAnimate(document)`
once near the app root (same seat as `ScrollReset`).

`<MotionScript />` — static `<head>` tag (no `use client`). Reads
`localStorage["zk-motion"]` and sets `data-motion="reduce"` before paint.

`useMotionPreference()` — `"reduce"` on the server; follows the OS
media query and `data-motion` after hydration.

`<Animate>` is a server-safe host: attributes only, `data-slot="animate"`.
Mount `AnimateObserver` (or call `observeAnimate`) for appear / scroll
fallback / longpress.
