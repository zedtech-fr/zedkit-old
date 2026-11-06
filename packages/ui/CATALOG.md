# Catalog — @zedtech/zedkit-ui

- Keywords: react, react-components, ui-kit, design-system, dashboard, tailwindcss, tailwind-v4, radix-ui, shadcn, dark-mode, accessible, nextjs, sites
- Audience: Teams building React 19 + Tailwind v4 UIs — sites, apps, dashboards, and admin tools.
- Purpose: Ship a calm React UI fast: dark/light design tokens plus accessible building blocks (data tables, forms, dialogs, toasts).


## Theme an admin app (dark/light included)

- Import: `@zedtech/zedkit-ui/styles.css` (stylesheet, not a JavaScript module)
- CSS import: `@zedtech/zedkit-ui/styles.css`
- CSS directive: `@source "../../node_modules/@zedtech/zedkit-ui/src/**/*.{ts,tsx}"`
- Also install: `next-themes`
- Example file: `src/app/layout.tsx`
- Wraps: `tailwindcss` (v4 CSS-first) plus `next-themes` for the toggle
- Status: stable
- Derived from: shadcn/ui (theme)
- Short name: Theme
- Audience: Teams starting a React 19 + Tailwind v4 admin app who want dark/light design tokens without setup.
- Purpose: One CSS import plus a source line gives the full token set; `next-themes` (install it alongside the kit) toggles the `dark` class.
- When to use: As the first install in every app using the kit.
- When not to use: For apps with their own design system — use your tokens instead of fighting these.
- See also: `Merge class names without conflicts`
- Examples: Set up the theme, Globals CSS, Tokens in your own component, Dark theme button
- A11y: Text and control colours keep at least 4.5:1 contrast (3:1 for focus rings and borders) in light and dark, and the checks run on each preview. Dark mode is chosen by the `dark` class, so it follows the setting you store, not only the system. Use the semantic utilities (`text-muted-foreground`, `text-destructive`), never a fixed colour, so both themes keep their contrast. Do not rely on colour alone: the status words in the examples ("Deployed", "Rolled back") carry the meaning.
- Troubleshooting: Components render unstyled — the `@source` line is missing in `globals.css`, so Tailwind never scans the kit. Dark mode does nothing — the `dark` class must be on `<html>` (next-themes `attribute="class"`), not on `<body>`. A flash of the wrong theme on load — keep `suppressHydrationWarning` on `<html>` and let `ThemeProvider` set the class before paint. Utilities such as `bg-primary` have no effect — `globals.css` drifted from the Globals CSS snippet below; restore its three lines in order. A colour looks wrong in dark — a fixed colour (`text-gray-500`) was used; switch to a semantic token.

```ts
import "./globals.css";
import { ThemeProvider } from "next-themes";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

```css
@import "tailwindcss";
@import "@zedtech/zedkit-ui/styles.css";
@source "../../node_modules/@zedtech/zedkit-ui/src/**/*.{ts,tsx}";
```

```ts
import { ArrowUpRight } from "lucide-react";
import { Badge, Text } from "@zedtech/zedkit-ui";

export function ReleaseRow({ name }: { name: string }) {
  return (
    <li className="flex items-center justify-between gap-3 border-b border-border bg-muted px-3 py-2 text-sm">
      <Text as="span" className="min-w-0 truncate">{name}</Text>
      <Badge variant="success" className="gap-1">
        <ArrowUpRight className="size-3" aria-hidden />
        Deployed
      </Badge>
    </li>
  );
}
```

```ts
"use client";

import { useTheme } from "next-themes";
import { Button } from "@zedtech/zedkit-ui";

export function DarkThemeButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  return (
    <Button variant="outline" aria-pressed={dark} onClick={() => setTheme(dark ? "light" : "dark")}>
      Dark theme
    </Button>
  );
}
```

## Localize kit chrome in English or French

- Import: `@zedtech/zedkit-ui` — `ZedkitUiProvider`, `useUiMessages`, `zedkitUiMessagesEn`, `zedkitUiMessagesFr`, `ZedkitUiMessages`
- Wraps: `(none)`
- Status: beta
- Short name: ZedkitUiProvider
- Audience: Apps that ship the kit in English or French and need Close, Filter, empty, and loading labels to follow the page language.
- Purpose: One provider plus typed en/fr bundles for kit chrome; backed by `createMessagesContext` from `@zedtech/zedkit-i18n/react`. A per-host label prop still wins.
- When to use: Around the tree when the UI language is not English, or when you pass your own copy.
- When not to use: For app copy (page titles, form labels, empty-state stories) — keep those in your own messages.
- See also: `Confirm destructive actions`, `Show a sortable, filterable, paginated data table`
- Examples: French bundle, Override one string
- Troubleshooting: English still shows — the provider is missing above that host, or a label prop is set. A custom bundle must keep every key (`locale` included) so `UpdatedAgo` can pick `Intl.RelativeTimeFormat`.

```ts
import { Button, ZedkitUiProvider, zedkitUiMessagesFr } from "@zedtech/zedkit-ui";

<ZedkitUiProvider messages={zedkitUiMessagesFr}>
  <Button>Enregistrer</Button>
</ZedkitUiProvider>
```

```ts
import { ConfirmDialog } from "@zedtech/zedkit-ui";

<ConfirmDialog trigger={trigger} title="Delete?" description="Gone." confirmLabel="Remove" onConfirm={remove} />
```

## Merge class names without conflicts

- Import: `@zedtech/zedkit-ui` — `cn`
- Wraps: `clsx`, `tailwind-merge`
- Status: stable
- Derived from: shadcn/ui (utils)
- Short name: cn
- Audience: Developers composing conditional Tailwind classes.
- Purpose: Merge class lists so conflicting utilities resolve to the last one.
- When to use: Whenever classes are conditional or come from props.
- When not to use: For static class strings — write them directly instead.

```ts
import { cn } from "@zedtech/zedkit-ui";
cn("px-4", isActive && "bg-accent"); // "px-4 bg-accent"
cn("px-4", "px-2"); // "px-2" — last conflicting utility wins
```

## Animate entrances and hover feedback with CSS utilities

- Import: `@zedtech/zedkit-ui/styles.css` (stylesheet, not a JavaScript module)
- CSS import: `@zedtech/zedkit-ui/styles.css`
- CSS directive: `@source "../../node_modules/@zedtech/zedkit-ui/src/**/*.{ts,tsx}"`
- Utilities: `animate-fade-up`, `animate-fade-in`, `animate-pop-in`, `stagger-*`, `hover-lift`, `hover-press`, `button-press`, `hit-target`, `marquee-track`
- Attributes: `data-reveal`, `data-stagger`
- Wraps: `tailwindcss` (v4 `@utility` and `@theme`)
- Status: alpha
- Short name: Motion
- Audience: Developers adding calm entrance and hover motion to kit pages.
- Purpose: Token-driven entrance, stagger, hover and marquee utilities that switch off under reduced motion.
- When to use: For first-paint entrances, staggered lists, card lift and button press feedback.
- When not to use: For gesture or layout animation (drag, shared-element transitions) — use a motion library instead.
- See also: `Theme an admin app (dark/light included)`, `Group content in a card section`, `Reveal and react with motion on any element`
- Examples: Entrance with stagger, Hover feedback, Staggered children
- A11y: Every utility and attribute is switched off under `prefers-reduced-motion: reduce`, with content left visible and in place. Hover lift only applies on devices that hover, so it never sticks after a tap.
- Troubleshooting: Nothing animates — check the OS reduced-motion setting first. Content stays hidden — `data-reveal="pending"` and `data-stagger="pending"` hide content until your code sets them to `"in"`. Stagger has no delay — `stagger-*` delays an animation class (`animate-fade-up stagger-2`), not a transition. Parallax travel follows `--zk-motion-intensity` (default 1, `0` = no shift) times `--zk-motion-mobile` (`0.5` under 40rem); override on a subtree (`.hero { --zk-motion-intensity: 0.3 }`), not as an identity token. Derived amplitude is `min(calc(var(--zk-reveal-distance) * 8), var(--zk-parallax-max-shift, 120px))` (x-axis cap `12vw`). Sticky offset is `--zk-pin-top` (`calc(var(--zk-header-height) + 1rem)`).

```ts
import { Card } from "@zedtech/zedkit-ui";

<Card className="animate-fade-up stagger-1">First</Card>
<Card className="animate-fade-up stagger-2">Second</Card>
```

```ts
<Card className="hover-lift">Lifts on hover (devices that hover)</Card>
<Button className="hover-press">Presses down on click</Button>
```

```ts
// Children enter one after another; set "pending" first to hide them
// until they scroll into view, then switch to "in".
<Stack data-stagger="in">
  <Text>One</Text>
  <Text>Two</Text>
</Stack>
```

## Reveal and react with motion on any element

- Import: `@zedtech/zedkit-ui` — `Animate`, `AnimateObserver`, `AnimateProps`, `AnimateOn`, `AnimatePreset`, `AnimateTrigger`, `AnimateMotion`, `observeAnimate`, `ANIMATE_PRESETS`, `ANIMATE_TRIGGERS`, `MotionScript`, `MotionScriptProps`, `useMotionPreference`, `applyMotionPreference`, `isMotionReduced`, `MotionPreference`, `MOTION_STORAGE_KEY`, `MOTION_CHANGE_EVENT`
- Attributes: `data-animate`, `data-animate-appear`, `data-animate-scroll`, `data-animate-press`, `data-animate-longpress`, `data-animate-hover`, `data-animate-focus`, `data-animate-delay`, `data-animate-stagger`
- Wraps: `(none)`
- Status: alpha
- Short name: Animate
- Audience: Developers adding appear, scroll, press, longpress, hover or focus motion to any kit element.
- Purpose: One typed attribute and wrapper API for identity-token motion, with a tiny SSR-safe runtime.
- When to use: When a card, section or control should move on appear, scroll progress, press, longpress, hover or focus.
- When not to use: For pinned scene crossfades use `ScrollScenes`. For section snap/smooth-scroll use `SectionScroll`. For first-paint class utilities see `Animate entrances and hover feedback with CSS utilities`. For section-shared parallax layers use `ParallaxSection` from `@zedtech/zedkit-ui/motion`.
- See also: `Animate entrances and hover feedback with CSS utilities`, `Add depth with parallax layers`, `Pin a stage and change scene as the page scrolls`, `Stack content and group titled sections`
- Examples: Attribute on a card, Wrapper with several triggers, Stagger children
- A11y: `prefers-reduced-motion: reduce` leaves content visible and in place. Hover is gated to hover-capable pointers. Focus uses `:focus-visible`. Press ignores disabled. Longpress is decorative, never the only action. Appear does not set `aria-hidden`.
- Troubleshooting: Nothing appears to move — mount `<AnimateObserver />` once near the app root (or call `observeAnimate()`), then check reduced motion and `data-motion` on `<html>`. Content stays visible without JS by design. Scroll parallax needs `animation-timeline: view()` or the runtime fallback. In-app reduce flashes on load — render `<MotionScript />` in `<head>` (same pattern as `IdentityScript`) so `data-motion="reduce"` is set before paint; `useMotionPreference()` is `"reduce"` on the server.

```ts
import { AnimateObserver, Card } from "@zedtech/zedkit-ui";

<AnimateObserver />
<Card data-animate="fade-up" data-animate-delay="100" data-animate-press="scale-down">
  Invoice
</Card>
```

```ts
import { Animate } from "@zedtech/zedkit-ui";

<Animate on={{ appear: "fade-up", press: "scale-down", longpress: "pulse", scroll: "parallax" }}>
  Band
</Animate>
```

```ts
import { Animate, Stack, Text } from "@zedtech/zedkit-ui";

<Animate on={{ appear: "fade-up" }} stagger>
  <Stack>
    <Text>One</Text>
    <Text>Two</Text>
  </Stack>
</Animate>
```

## Cycle a word in a clipped slot

- Import: `@zedtech/zedkit-ui` — `WordRoll`, `WordRollProps`
- Attributes: `data-word-roll`, `data-word-roll="exit"` (on the outgoing layer, styled in `motion.css`)
- Wraps: `(none)` — composes with `data-animate="fade-up"` on the incoming span (mount `AnimateObserver` / `observeAnimate` once for appear)
- Status: alpha
- Short name: Word roll
- Audience: Headlines or inline labels that rotate a single word without remount-only fades.
- Purpose: Stable-height clipped slot with padded block axis so descenders and underline stay visible; outgoing glides up (`zk-word-roll-exit-up`), incoming uses the standard appear contract (`fade-up` from below).
- When to use: Cycling provider names, emphasis words, or short tokens next to static copy.
- When not to use: Full sentences or list carousels — use content-specific layout. For scroll reveal only, use `data-reveal` / `data-animate` without WordRoll.
- See also: `Reveal and react with motion on any element`
- Examples: Inline in a heading
- A11y: Treat the roll as decorative when the full phrase is provided via `aria-label` on the heading; set `aria-hidden` on `WordRoll`. Under reduced motion, prefer a static inclusive string instead of cycling.
- Troubleshooting: Incoming stays invisible — ensure `observeAnimate()` runs (same as any `data-animate` appear). Exit does not move — check `prefers-reduced-motion` and `data-motion="reduce"`.

```ts
import { Heading, WordRoll } from "@zedtech/zedkit-ui";

const words = ["Cursor", "Muse", "Claude"] as const;

<Heading level={1} typeRole="title" aria-label={`Set up in ${words.join(", ")}`}>
  Set up in{" "}
  <WordRoll words={words} value={words[0]} dwellMs={300} aria-hidden />
</Heading>
```

## Trigger actions with buttons

- Import: `@zedtech/zedkit-ui` — `Button`, `buttonVariants`, `ButtonProps`
- Wraps: `@radix-ui/react-slot`, `class-variance-authority`
- Status: stable
- Short name: Button
- Registry: button
- Audience: Anyone placing actions in an admin UI.
- Purpose: Accessible buttons with variants (default, destructive, outline, ghost) and sizes.
- When to use: For every clickable action, including links styled as buttons.
- When not to use: For navigation menus — use links or tabs instead.
- See also: `Confirm destructive actions`
- Examples: Usage, Variants and sizes
- A11y: Native `button` (or `asChild` onto a link). Sizes `sm` / default / `lg` use Tailwind `px-3` / `px-4` / `px-8`; `--spacing-button-inline-lg` remains as a deprecated alias. Height still follows `--spacing` control tokens.
- Troubleshooting: Wrong variant colours in dark mode — ensure `.dark` is on the document root. Link styled as a button — use `asChild` with an anchor and keep visible link text. Icon-only control — pass `aria-label` (or use `IconButton` when the label should not appear as text).

```ts
import { Button } from "@zedtech/zedkit-ui";
<Button>Save</Button>
<Button variant="destructive" size="sm">Delete</Button>
<Button variant="outline" size="icon" aria-label="Close">×</Button>
<Button asChild variant="secondary">
  <a href="/docs">Read the docs</a>
</Button>
```

```ts
import { Button } from "@zedtech/zedkit-ui";
<Button size="sm">Small</Button>
<Button>Default</Button>
<Button size="lg">Large</Button>
<Button disabled>Saving…</Button>
```

## Icon-only actions with a visible name

- Import: `@zedtech/zedkit-ui` — `IconButton`, `IconButtonProps`
- Wraps: `Button` (same variants and sizes; `size` defaults to `icon`)
- Status: stable
- Short name: IconButton
- Audience: Developers adding icon-only header or toolbar controls in an admin UI.
- Purpose: Icon-only controls with matching `aria-label` and `title` from one `label` prop.
- When to use: Toolbar or header controls where the glyph alone is not enough for screen readers.
- When not to use: Actions with visible text — use `Button` instead.
- Registry: icon-button
- Examples: Project toolbar, Row actions in a list
- A11y: `label` becomes both `aria-label` and `title`, so screen readers and hover/long-press tooltips read the same name. Native `button` with `type="button"` (never submits a form by accident); a visible focus ring shows on keyboard focus. Decorative glyphs inside should be icons, not text the reader would announce twice.
- Troubleshooting: A TypeScript error about a missing `label` — it is required on purpose, an icon-only control without a name is unusable with a screen reader. Several identical buttons in a list — put the row name in the label (`Delete ${task.title}`) so each is distinct. Button feels too big for a dense toolbar — the size defaults to `icon`; pass `size="sm"` for a compact one (the glyph keeps the kit icon size). The button submits a form — it should not (`type="button"`); pass `type="submit"` explicitly if you really want that.

```ts
import { Archive, RefreshCw, Share2 } from "lucide-react";
import { IconButton } from "@zedtech/zedkit-ui";

<IconButton label="Refresh tasks" variant="ghost" onClick={() => {}}><RefreshCw /></IconButton>
<IconButton label="Share project" variant="ghost" onClick={() => {}}><Share2 /></IconButton>
<IconButton label="Archive project" variant="outline" onClick={() => {}}><Archive /></IconButton>
```

```ts
import { Copy, Pencil, Trash2 } from "lucide-react";
import { IconButton } from "@zedtech/zedkit-ui";

{tasks.map((task) => (
  <li key={task.id}>
    {task.title}
    <IconButton label={`Edit ${task.title}`} variant="ghost"><Pencil /></IconButton>
    <IconButton label={`Duplicate ${task.title}`} variant="ghost"><Copy /></IconButton>
    <IconButton label={`Delete ${task.title}`} variant="ghost" onClick={() => remove(task.id)}><Trash2 /></IconButton>
  </li>
))}
```

## Show a status or count badge

- Import: `@zedtech/zedkit-ui` — `Badge`, `badgeVariants`, `BadgeProps`
- Wraps: `class-variance-authority`
- Status: stable
- Registry: badge
- Short name: Badge
- Audience: Developers flagging state or counts inline (lists, headers, tables).
- Purpose: Small status/count pills with semantic variants.
- When to use: For short labels next to the thing they describe.
- When not to use: For long text or actions — use Text or Button instead.
- See also: `Indicate status with a dot`
- Examples: Simple, Variants, In a table row, As a link (asChild)
- A11y: Default badge is a `div` (not a live region). Use `asChild` with an anchor or button for links; `focus-ring` applies on keyboard focus. Keep labels short. Corners follow identity `--radius-md` via `rounded-md`; identity label tracking already keys off `px-badge-inline`.
- Troubleshooting: Wrong colors in dark mode — ensure `.dark` is on the document root. `BadgeProps` is defined in `badge.tsx` for typing; import types from the same module when using the registry copy.

```ts
import { Badge } from "@zedtech/zedkit-ui";
<Badge>live</Badge>
```

```ts
import { Badge } from "@zedtech/zedkit-ui";
<Badge variant="outline">3 retries</Badge>
<Badge variant="destructive">failed</Badge>
```

```ts
import { Badge } from "@zedtech/zedkit-ui";
<tr>
  <td>sync</td>
  <td><Badge variant="secondary">queued</Badge></td>
</tr>
```

```ts
import { Badge } from "@zedtech/zedkit-ui";
<Badge asChild variant="secondary">
  <a href="/status">all systems go</a>
</Badge>
```

## Label a form control

- Import: `@zedtech/zedkit-ui` — `Label`, `LabelProps`
- Wraps: `@radix-ui/react-label`
- Status: stable
- Short name: Label
- Audience: Developers naming inputs accessibly.
- Purpose: Accessible labels that pair with any control via `htmlFor`.
- When to use: For every visible input name.
- When not to use: For placeholder-only inputs — use `aria-label` instead; for headings — use Heading.
- See also: `Collect text input with a label`, `Build validated forms with labels, errors, and pending state`
- Examples: Simple, Required mark, Label a native input
- A11y: Pairs with a control via `htmlFor` plus a matching `id`; clicking the label focuses the control (native behavior). A disabled peer dims the label via `peer-disabled`. Size is `text-sm`; identity `--zk-label-transform` stays on badges and table heads.
- Registry: label
- Troubleshooting: Clicking the label does nothing — the control needs a matching `id` for `htmlFor`. Label not dimming with a disabled control — `peer-disabled` needs the control as a preceding `peer` sibling.

```ts
import { Input, Label } from "@zedtech/zedkit-ui";
<Label htmlFor="name">Name</Label>
<Input id="name" placeholder="Ada" />
```

```ts
import { Input, Label } from "@zedtech/zedkit-ui";
<Label htmlFor="email">Email <span aria-hidden="true">*</span></Label>
<Input id="email" required />
```

```ts
import { Label } from "@zedtech/zedkit-ui";
<Label htmlFor="city">City</Label>
<input id="city" className="rounded-md border border-border px-3 py-2" />
```

## Collect text input with a label

- Import: `@zedtech/zedkit-ui` — `Input`, `InputProps`, `Label`
- Wraps: `@radix-ui/react-label`
- Status: stable
- Short name: Input
- Audience: Form builders collecting single-line text.
- Purpose: Labelled text input with consistent styling and focus states.
- When to use: For names, emails, search boxes and other single-line values.
- When not to use: For long text — use Textarea instead.
- See also: `Collect multi-line text input`, `Build validated forms with labels, errors, and pending state`
- A11y: Pair with `Label` or `aria-label`; `focus-ring-control` matches Button keyboard focus. A disabled peer dims the label to `opacity-50`, the kit-wide disabled convention. Height and block padding follow `--spacing` (`h-control-height`, `py-control-block`); inline padding is Tailwind `px-3`.

```ts
import { Input, Label } from "@zedtech/zedkit-ui";
<Label htmlFor="name">Name</Label>
<Input id="name" placeholder="Ada" />
```

## Separate content horizontally or vertically

- Import: `@zedtech/zedkit-ui` — `Separator`, `SeparatorProps`
- Wraps: `@radix-ui/react-separator`
- Status: stable
- Short name: Separator
- Audience: Developers dividing stacked or inline content.
- Purpose: Accessible horizontal/vertical divider lines.
- When to use: Between sections, menu groups, or inline items.
- When not to use: For spacing alone — use Stack gap instead.
- See also: `Stack content and group titled sections`
- Examples: Horizontal rule, Vertical divider
- A11y: Decorative by default (`role="none"`); pass `decorative={false}` with an accessible name when it separates named regions. Line weight follows `--zk-border-width` (mist 1px).
- Registry: separator
- Troubleshooting: Vertical divider invisible — it needs a bounded height from the parent (`h-6`, flex stretch). Announced as separator — set `decorative` explicitly; unnamed non-decorative separators confuse screen readers.

```ts
import { Separator } from "@zedtech/zedkit-ui";
<Separator />
```

```ts
import { Separator } from "@zedtech/zedkit-ui";
<Separator orientation="vertical" className="h-6" />
```

## Show loading placeholder blocks

- Import: `@zedtech/zedkit-ui` — `Skeleton`, `SkeletonProps`
- Wraps: `(none)`
- Status: beta
- Short name: Skeleton
- Audience: Developers covering loading states without layout shift.
- Purpose: Animated placeholder blocks that hold layout while data loads.
- When to use: For content areas with known approximate shape.
- When not to use: For progress with a known percentage — use ProgressBar instead.
- See also: `Show determinate progress`
- Examples: Simple, Text lines
- A11y: Renders a plain `div` with no semantics — empty blocks are ignored by assistive tech; set `aria-busy` on the loading container. Corners follow identity `--radius-md` via `rounded-md`.
- Registry: skeleton
- Troubleshooting: No pulse — the pulse is `motion-safe:animate-pulse`: static under reduced-motion, and it needs Tailwind's default theme. Wrong shape — size comes only from your `className`; the brick ships no dimensions.

```ts
import { Skeleton } from "@zedtech/zedkit-ui";
<Skeleton className="h-4 w-24" />
```

```ts
import { Skeleton } from "@zedtech/zedkit-ui";
<Skeleton className="h-4 w-full" /> // stack lines for text blocks; shape is all className
```

## Indicate status with a dot

- Import: `@zedtech/zedkit-ui` — `StatusDot`, `StatusDotProps`, `StatusDotTone`
- Wraps: `(none)`
- Status: stable
- Registry: status-dot
- Short name: StatusDot
- Audience: Developers showing compact live state (lists, headers, realtime panels).
- Purpose: A small status dot with semantic tones (active, idle, success, warning, danger).
- When to use: Beside a label that names the state (the dot is decorative).
- When not to use: As the only state signal — pair it with text, never color alone.
- A11y: `aria-hidden` by design — the paired text carries the meaning. Size is `size-2` (0.5rem, Tailwind default scale); `--spacing-status-dot` remains as a deprecated alias. Tones map to semantic color tokens.
- See also: `Show a status or count badge`, `Show key-value details and a live indicator`
- Examples: Single tone, All tones with labels, Static ping override
- Troubleshooting: Dot invisible — the paired text must carry the state (never color alone). Pinging when it should not — ongoing tones (`active`, `warning`, `danger`) ping by default; pass `pulse={false}`.

```ts
import { StatusDot } from "@zedtech/zedkit-ui";
<StatusDot tone="active" /> // active | idle | success | warning | danger; decorative, pair with text
```

```ts
import { StatusDot } from "@zedtech/zedkit-ui";
<StatusDot tone="success" /> // Saved
<StatusDot tone="warning" /> // Retrying…
<StatusDot tone="danger" /> // Failed
```

```ts
import { StatusDot } from "@zedtech/zedkit-ui";
<StatusDot tone="active" pulse={false} /> // static dot, no ping
```

## Compose a chat prompt

- Import: `@zedtech/zedkit-ui` — `PromptInput`, `PromptInputProps`
- Wraps: native `<form>` + `<textarea>` + `IconButton`
- Status: stable
- Short name: PromptInput
- Audience: Developers building assistant or messaging UIs.
- Purpose: One rounded surface with an auto-growing field and an in-field send control; Enter sends, Shift+Enter adds a line.
- When to use: Chat-style briefs where the send affordance sits inside the composer.
- When not to use: Plain forms with a separate submit row — use `Field` + `Textarea` + `Button`.
- See also: `Collect multi-line text input`, `Icon-only actions with a visible name`
- Examples: Simple, Complete
- A11y: Pass `sendLabel` (and `cancelLabel` when using cancel); the field keeps a visible label via `aria-label` or associated `FieldLabel`. Send and cancel use `size="icon"` tap targets aligned with `--spacing-control-height`.
- Troubleshooting: Send stays disabled — value is trimmed; whitespace-only counts as empty. Field does not grow past `maxRows` (default 8) — it scrolls inside the composer. Consumers need `field-sizing-content` (Tailwind v4) on the stylesheet.

```ts
import { PromptInput } from "@zedtech/zedkit-ui";
<PromptInput sendLabel="Send" defaultValue="Summarize this page" onSubmit={() => {}} placeholder="Ask anything" aria-label="Message" />
```

```ts
import { PromptInput } from "@zedtech/zedkit-ui";
<PromptInput
  id="chat"
  sendLabel="Send"
  value={text}
  onChange={(e) => setText(e.target.value)}
  onSubmit={send}
  busy={pending}
  onCancel={stop}
  cancelLabel="Stop"
  rows={1}
  maxLength={2000}
  aria-label="Message"
/>
```

## Show determinate progress

- Import: `@zedtech/zedkit-ui` — `ProgressBar`, `ProgressBarProps`
- Wraps: `(none)`
- Status: stable
- Short name: ProgressBar
- Audience: Developers reporting measurable progress (uploads, jobs, wizards).
- Purpose: An accessible progressbar with clamped value and label.
- When to use: When you can report a percentage or fraction done.
- When not to use: For unknown-shape loading — use Skeleton instead.
- See also: `Show loading placeholder blocks`
- Examples: Simple, Complete
- A11y: Root carries `role="progressbar"` with clamped value; keep the label screen-only and pair with visible text.
- Registry: progress-bar
- Troubleshooting: Bar looks empty — `NaN` and out-of-range values clamp (negative to 0, over max to full). Screen reader silent — the bar is a plain progressbar; announce milestones with a `StatusLabel` beside it.

```ts
import { ProgressBar } from "@zedtech/zedkit-ui";
<ProgressBar value={40} label="Uploading report" /> // role=progressbar, value clamped to 0..max
```

```ts
import { ProgressBar } from "@zedtech/zedkit-ui";
<ProgressBar value={100} label="Upload complete" />
```

## Quiet icon beside inline text

- Import: `@zedtech/zedkit-ui` — `IconLabel`, `IconLabelProps`
- Wraps: `lucide-react` (icon slot)
- Status: stable
- Short name: IconLabel
- Audience: Developers pairing a small decorative icon with a text label (chips, table cells).
- Purpose: Fixed-size muted icon + label row; icon is `aria-hidden`, label stays readable.
- When to use: Recognition hints next to names or actions, not in running prose.
- When not to use: Standalone icons — use the Lucide component directly; primary actions — use `Button`.
- See also: `Celebrate completion with a checkmark`
- A11y: Icon is decorative (`aria-hidden`, not focusable); put the readable name in `children`. The muted colour keeps normal text contrast on every identity, but do not rely on the icon alone to carry meaning — the state or name must also be written.
- Registry: icon-label
- Examples: Project details, In an order list, Home areas
- Troubleshooting: The icon does not appear — pass the component itself (`icon={Calendar}`), not an element (`icon={<Calendar />}`). Icon too small or too large — the size is `size-4` (1rem, Tailwind default scale); override with `className`. `--spacing-icon-control` remains as a deprecated alias. Long text overflows a narrow cell — the label shrinks inside flex parents, give the parent a width or let the row wrap (`flex-wrap`). Meaning is lost for a screen reader — the icon is hidden on purpose, so write the state in the text.

```ts
import { Calendar, FolderOpen, MessageSquare, Users } from "lucide-react";
import { IconLabel } from "@zedtech/zedkit-ui";

<IconLabel icon={FolderOpen}>Harbor Studio</IconLabel>
<IconLabel icon={Calendar}>Due Nov 14</IconLabel>
<IconLabel icon={Users}>4 members</IconLabel>
<IconLabel icon={MessageSquare}>12 comments</IconLabel>
```

```ts
import { Package, RotateCcw, Truck } from "lucide-react";
import { IconLabel } from "@zedtech/zedkit-ui";

<IconLabel icon={Truck}>Shipped Oct 25</IconLabel>
<IconLabel icon={Package}>Packing</IconLabel>
<IconLabel icon={RotateCcw}>Return requested</IconLabel>
```

```ts
import { Bot, LayoutDashboard, Server, TrendingUp } from "lucide-react";
import { IconLabel } from "@zedtech/zedkit-ui";

<IconLabel icon={LayoutDashboard}>Build a UI</IconLabel>
<IconLabel icon={Server}>Core & server</IconLabel>
<IconLabel icon={TrendingUp}>Improve SEO</IconLabel>
<IconLabel icon={Bot}>Set up coding agents</IconLabel>
```

## Celebrate completion with a checkmark

- Import: `@zedtech/zedkit-ui` — `Checkmark`, `CheckmarkProps`
- Wraps: `(none)`
- Status: stable
- Short name: Checkmark
- Audience: Developers confirming a completed action (saved, sent, done).
- Purpose: An animated checkmark that draws once (static under reduced motion).
- When to use: For success confirmations right after the action completes.
- When not to use: As a persistent status icon — use StatusDot or Badge instead.
- See also: `Show toast notifications`
- Examples: Simple, Decorative
- A11y: Draws once under `motion-safe` (static full check under reduced motion); omit `label` when decorative.
- Registry: checkmark
- Troubleshooting: No draw animation — the path animates only under `motion-safe`; reduced motion shows the static check by design. Announced twice — pass `label` once (it names the `role="img"`); nearby text should not repeat it. Registry copies without the theme show the static check (the `zk-check-draw` keyframes live in `styles.css`).

```ts
import { Checkmark } from "@zedtech/zedkit-ui";
<Checkmark label="Saved" /> // draws once, static under reduced motion; omit label when decorative
```

```ts
import { Checkmark } from "@zedtech/zedkit-ui";
<Checkmark /> // decorative, pair with visible text
```

## Load each zone with a faithful skeleton

- Import: `@zedtech/zedkit-ui` — `CardSkeleton`, `CardSkeletonProps`, `DataTableSkeleton`, `DataTableSkeletonProps`, `DetailPanelSkeleton`, `DetailPanelSkeletonProps`, `PageHeaderSkeleton`, `PageHeaderSkeletonProps`
- Wraps: `(none)`
- Status: stable
- Short name: Skeletons
- Audience: Developers loading async zones without layout shift (pages, cards, tables, panels).
- Purpose: One faithful loading skeleton per kit component shape, each a named live zone.
- When to use: As a `Suspense` fallback matching the component that will land.
- When not to use: For freeform blocks — use a plain `Skeleton`; for named operations — use `StatusLabel`.
- See also: `Show loading placeholder blocks`
- Examples: In Suspense, Standalone
- A11y: `role="status"` with `aria-label` from the `label` prop (default "Loading") — screen readers announce the zone; the label is never shown visually.
- Registry: card-skeleton
- Troubleshooting: Generic announcement — pass a specific `label` per zone (default is "Loading"). Layout shifts when content lands — the skeleton mirrors card padding/stack tokens, but a mismatched container width still shifts.

```ts
import { Suspense } from "react";
import { Card, CardContent, CardSkeleton } from "@zedtech/zedkit-ui";
<Suspense fallback={<CardSkeleton label="Loading report" />}>
  <Card><CardContent>Annual report.</CardContent></Card>
</Suspense>
```

```ts
import { CardSkeleton } from "@zedtech/zedkit-ui";
{loading ? <CardSkeleton label="Loading report" /> : <ReportCard />}
```

## Name an operation in progress

- Import: `@zedtech/zedkit-ui` — `StatusLabel`, `StatusLabelProps`, `StatusLabelTone`, `StreamStatus`, `StreamStatusProps`, `StreamText`, `StreamTextProps`, `ASSISTANT_STREAM_STAGES`, `consumeSseStream`, `isAssistantStreamStage`, `pullSseFrames`, `readAssistantStreamEvent`, `AssistantStreamEvent`, `AssistantStreamStage`, `SseFrame`
- Wraps: `(none)`
- Status: stable
- Short name: StatusLabel
- Audience: Developers naming a background or foreground operation for the user.
- Purpose: A named live-region label for the current operation state (loading, saved, error…).
- When to use: Next to the content an operation affects, while it runs or right after.
- When not to use: For bare spinners without a name — use `ProgressBar`; for data age — use `UpdatedAgo`.
- A11y: `role=status` announces the named operation; icon/text gap is `gap-1.5`; `--spacing-status-label-gap` remains as a deprecated alias.
- See also: `Stamp data with its age`
- Examples: Loading operation, Saved and error states, Offline state
- Registry: status-label
- Troubleshooting: Announcement spam — one live label per operation; unmount or repurpose it when done. Wrong tone icon — `loading`/`updating`/`syncing` share the active dot; only `saved` shows the check.

```ts
import { StatusLabel } from "@zedtech/zedkit-ui";
<StatusLabel tone="loading">Saving report…</StatusLabel> // loading|updating|syncing|saved|retry|error|offline, role=status
```

```ts
import { StatusLabel } from "@zedtech/zedkit-ui";
<StatusLabel tone="saved">All changes saved</StatusLabel>
<StatusLabel tone="error">Could not save</StatusLabel>
```

```ts
import { StatusLabel } from "@zedtech/zedkit-ui";
<StatusLabel tone="offline">You are offline</StatusLabel>
```

## Stamp data with its age

- Import: `@zedtech/zedkit-ui` — `UpdatedAgo`, `UpdatedAgoProps`
- Wraps: `(none)`
- Status: beta
- Short name: UpdatedAgo
- Audience: Developers stamping cached or polled data with its freshness.
- Purpose: A relative "Updated N minutes ago" stamp via `Intl.RelativeTimeFormat`, no date library.
- When to use: Under data that refreshes (polling, SWR, manual refetch).
- When not to use: For absolute timestamps — render a `<time dateTime>` instead.
- A11y: Static text (not a live region) — screen readers meet it while reading; re-render when the data refreshes. Styled with `text-xs text-muted-foreground` only.
- See also: `Name an operation in progress`
- Examples: Simple, Custom prefix
- Registry: updated-ago
- Troubleshooting: Stamp never changes — it renders once per render; re-render from your polling tick or SWR refresh. Future dates read as “just now” (clamped, never “in 5 minutes”).

```ts
import { UpdatedAgo } from "@zedtech/zedkit-ui";
<UpdatedAgo date={Date.now() - 3 * 60 * 1000} /> {/* "Updated 3 minutes ago" via Intl.RelativeTimeFormat */}
```

```ts
import { UpdatedAgo } from "@zedtech/zedkit-ui";
<UpdatedAgo date={syncedAt} prefix="Synced" />
```

## Flag offline state with a live note

- Import: `@zedtech/zedkit-ui` — `OfflineNote`, `OfflineNoteProps`, `useOnlineStatus`
- Wraps: `(none)`
- Status: beta
- Short name: OfflineNote
- Audience: Developers telling the user the app lost connectivity.
- Purpose: A hook reporting browser online state plus an alert-style note with overridable wording.
- When to use: At the top of a page or panel when `useOnlineStatus()` is false.
- When not to use: For inline operation states — use `StatusLabel`.
- A11y: `role=alert` announces the note as soon as it appears, so render it only when the state changes, not on every page load. The wifi icon is hidden from assistive technology (`aria-hidden`); the title and the text carry the message, so write both. Say what is kept and what to do next ("Your cart is saved on this device. Reconnect to pay.") and disable the actions that cannot work offline so a keyboard user does not trigger a failing request. Icon positioning comes from `--spacing-alert-*` theme tokens.
- See also: `Name an operation in progress`
- Registry: offline-note
- Examples: Offline note, Wired to online state, Custom wording
- Troubleshooting: The note never shows — `useOnlineStatus()` starts `true` and syncs after mount, so it stays hidden during server render and on a connected device; test with the browser devtools Offline switch. The note shows nothing on a device with a dead server — `navigator.onLine` only reports whether a network interface is up (a captive portal still reads online), so also handle failed requests. The note is announced twice — it already has `role="alert"`; do not wrap it in another live region. The hook is used in a server component — it needs a client component (`"use client"`). Default wording does not fit — pass `title` and `children` (or only one of them).

```ts
import { Heading, OfflineNote } from "@zedtech/zedkit-ui";

<OfflineNote />
<Heading level={3}>Invoice drafts</Heading>
// …the list of drafts, each marked "Waiting to sync"
```

```ts
"use client";

import { Button, OfflineNote, useOnlineStatus } from "@zedtech/zedkit-ui";

export function DeliveryNote({ onSave }: { onSave: () => void }) {
  const online = useOnlineStatus();
  return (
    <>
      {online ? null : <OfflineNote title="No connection">Try again when you are back.</OfflineNote>}
      <Button disabled={!online} onClick={onSave}>
        Save note
      </Button>
    </>
  );
}
```

```ts
import { Button, OfflineNote } from "@zedtech/zedkit-ui";

<OfflineNote title="No connection">Your cart is saved on this device. Reconnect to pay.</OfflineNote>
```

## Show an empty zone with a next step

- Import: `@zedtech/zedkit-ui` — `EmptyState`, `EmptyStateProps`
- Wraps: `(none)`
- Status: beta
- Short name: EmptyState
- Audience: Developers filling a list or panel when there is nothing to show.
- Purpose: Name what is missing and put the next step in `actions`.
- When to use: For a page or panel with zero rows.
- When not to use: For an empty table body inside `DataTable` — use `DataTableEmpty`.
- See also: `Show a sortable, filterable, paginated data table`, `Call out a notice or an error state`
- Examples: Empty list, With a next step
- A11y: The title is a heading. Write the description as what is missing plus the next step; put that step in `actions` so keyboard users can take it. Do not rely on colour alone.
- Registry: empty-state
- Troubleshooting: The heading is missing — pass `title`. The next step is only in the description — pass it as `actions` so it is a control. A table cell is empty — use `DataTableEmpty` inside the table, not this host.

```ts
import { EmptyState } from "@zedtech/zedkit-ui";
<EmptyState title="No invoices" description="Create an invoice to send to a client." />
```

```ts
import { Button, EmptyState } from "@zedtech/zedkit-ui";
<EmptyState
  title="No invoices"
  description="Create an invoice to send to a client."
  actions={<Button>New invoice</Button>}
/>
```

## Show what broke and a next step

- Import: `@zedtech/zedkit-ui` — `ErrorState`, `ErrorStateProps`
- Wraps: `(none)`
- Status: beta
- Short name: ErrorState
- Audience: Developers showing a failed load or save on the page.
- Purpose: Say what broke and put retry or back in `actions`.
- When to use: When a page or panel failed to load or save.
- When not to use: For a field error — use `FieldError`. For a brief confirmation — use Toaster.
- See also: `Call out a notice or an error state`, `Show an empty zone with a next step`
- Examples: Load error, With retry
- A11y: Root is an alert (`role="alert"`). Render it when the failure appears, not on every page load. Title plus description carry the meaning; `actions` is the next step.
- Registry: error-state
- Troubleshooting: The alert is announced twice — do not wrap it in another live region. The retry control is only in the text — pass it as `actions`. A single field failed — use `FieldError` on that field.

```ts
import { ErrorState } from "@zedtech/zedkit-ui";
<ErrorState
  title="Could not load invoices"
  description="Check your connection and try again."
/>
```

```ts
import { Button, ErrorState } from "@zedtech/zedkit-ui";
<ErrorState
  title="Could not load invoices"
  description="Check your connection and try again."
  actions={<Button variant="outline">Try again</Button>}
/>
```

## Name a spinner while something loads

- Import: `@zedtech/zedkit-ui` — `Spinner`, `SpinnerProps`
- Wraps: `lucide-react`
- Status: beta
- Short name: Spinner
- Audience: Developers naming a short wait next to a label.
- Purpose: A spinning icon with an accessible name from the kit messages (`loading`).
- When to use: Next to visible copy that names what is loading.
- When not to use: For a zone with a known shape — use Skeleton. For a known percent — use ProgressBar.
- See also: `Show loading placeholder blocks`, `Show determinate progress`
- Examples: Default name, Named wait
- A11y: `role="status"` plus `aria-label`. The icon is `aria-hidden`. Keep visible text next to it that names the wait; a `label` prop overrides the kit `loading` string. The spin uses `motion-safe:animate-spin`.
- Registry: spinner
- Troubleshooting: Screen readers say only "Loading" — pass `label` that names the operation, or keep visible text beside the spinner. The icon does not spin — `motion-safe:animate-spin` is static under reduced motion. Used as a full-page placeholder — prefer Skeleton so layout does not jump.

```ts
import { Spinner } from "@zedtech/zedkit-ui";
<Spinner />
```

```ts
import { Spinner, Text } from "@zedtech/zedkit-ui";
<Spinner label="Saving invoices" />
<Text>Saving invoices</Text>
```

## Fill a list's loading, empty, error and success states

- Import: `@zedtech/zedkit-ui` — `Spinner`, `EmptyState`, `ErrorState`, `DataTable`, `Button`, `Text`, `createDataTableColumns`
- Wraps: `(none)`
- Status: beta
- Short name: FourStates
- Audience: Developers swapping a list between wait, nothing, failure, and rows.
- Purpose: One host per state: Spinner, EmptyState, ErrorState, then the filled list.
- When to use: On a list page that loads from the network.
- When not to use: For an empty row inside a table body — use `DataTableEmpty`. For a field error — use `FieldError`.
- See also: `Name a spinner while something loads`, `Show an empty zone with a next step`, `Show what broke and a next step`, `Show a sortable, filterable, paginated data table`
- Examples: Loading, Empty, Error, Success
- A11y: Render one state at a time. Spinner is `role="status"`; EmptyState uses a heading; ErrorState is `role="alert"`. Keep the next step in `actions`.
- Troubleshooting: Two live regions at once — do not nest ErrorState inside another alert. The spinner has no visible name — keep text beside it or pass `label`.

```ts
import { Spinner, Text } from "@zedtech/zedkit-ui";
<Spinner label="Loading invoices" />
<Text>Loading invoices</Text>
```

```ts
import { Button, EmptyState } from "@zedtech/zedkit-ui";
<EmptyState
  title="No invoices"
  description="Create an invoice to send to a client."
  actions={<Button>New invoice</Button>}
/>
```

```ts
import { Button, ErrorState } from "@zedtech/zedkit-ui";
<ErrorState
  title="Could not load invoices"
  description="Check your connection and try again."
  actions={<Button variant="outline">Try again</Button>}
/>
```

```ts
import { DataTable, createDataTableColumns } from "@zedtech/zedkit-ui";
const helper = createDataTableColumns<{ name: string; age: number }>();
const columns = [helper.accessor("name", { header: "Name" })];
<DataTable columns={columns} data={[{ name: "Ada", age: 36 }]} />
```

## Open modal dialogs

- Import: `@zedtech/zedkit-ui` — `Dialog`, `DialogProps`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`, `DialogOverlay`, `DialogPortal`, `OverlayInitialFocus`
- Wraps: `@radix-ui/react-dialog`
- Status: stable
- Derived from: shadcn/ui (dialog)
- Short name: Dialog
- Audience: Developers interrupting the flow for focused input or decisions.
- Purpose: Accessible modal dialogs (trigger, content, title, footer) with focus trap and Escape.
- When to use: For short tasks that need full attention (confirm, edit one thing).
- When not to use: For destructive one-click confirms — use ConfirmDialog instead; for long forms use a page.
- Registry: dialog
- Examples: Order details, Tall content
- A11y: Focus trap and Escape come from Radix; opening moves focus to the panel (no heavy ring, never inside a field, never a text selection) before tabbing to actions. `initialFocus` (a ref or a selector) opts a field in, with the caret at the end. Header and footer share the content surface (transparent chrome on glass and solid identities). Content centers via the `dialog-center` utility (`--spacing-dialog-center`) and elevates with `--shadow-overlay`. Slots, close offset, and overlay stacking come from `--spacing-dialog-*` / `--z-index-overlay`; the close control is a 44px (`size-overlay-touch-target`) hit area with `focus-ring-control`, aligned to the title row. Tall content scrolls inside `max-h-dialog-max-height`, further capped to the visual viewport when the software keyboard is open, with `overscroll-behavior: contain`. Header copy is left-aligned; footer actions are right-aligned with token gaps; footer clears `env(safe-area-inset-bottom)`.
- Troubleshooting: A footer button does not close the dialog unless it is `DialogClose`. Nested overlays need their own `Dialog` root. Tall content scrolls inside the panel (`max-h-dialog-max-height`), not the page behind it.
- See also: `Confirm destructive actions`, `Slide in a drawer panel`, `Float extra content next to a control`, `Open a menu of actions from a button`

```ts
import { Button, Dialog, DialogContent, DialogTitle, DialogTrigger } from "@zedtech/zedkit-ui";
<Dialog>
  <DialogTrigger asChild><Button>Open</Button></DialogTrigger>
  <DialogContent><DialogTitle>Details</DialogTitle></DialogContent>
</Dialog>
```

```ts
import { Button, Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Text } from "@zedtech/zedkit-ui";
<Dialog>
  <DialogTrigger asChild><Button>Activity</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader><DialogTitle>Order activity</DialogTitle></DialogHeader>
    {["Packed", "Shipped", "Out for delivery"].map((line) => <Text key={line}>{line}</Text>)}
    <DialogFooter><DialogClose asChild><Button>Done</Button></DialogClose></DialogFooter>
  </DialogContent>
</Dialog>
```

## Confirm destructive actions

- Import: `@zedtech/zedkit-ui` — `ConfirmDialog`, `ConfirmDialogProps`
- Wraps: `@radix-ui/react-dialog` (via Dialog)
- Status: stable
- Registry: confirm-dialog
- Short name: ConfirmDialog
- Audience: Developers guarding delete/revoke/remove actions.
- Purpose: A one-call destructive confirmation (trigger, title, description, onConfirm).
- When to use: Before any irreversible action.
- When not to use: For reversible or trivial actions — do it and offer undo (toast) instead.
- See also: `Open modal dialogs`
- Examples: Delete confirmation, Custom button labels
- A11y: Opens a Radix dialog (`role="dialog"`) with `DialogTitle` and `DialogDescription`; focus stays inside while open; Escape and Cancel dismiss without calling `onConfirm`. vitest-axe covers the open state in `packages/ui/tests/unit/a11y.test.tsx` ("confirm dialog after opening").
- Troubleshooting: `onConfirm` runs synchronously then closes — start async work inside the handler if needed. `trigger` must be one element (use `Button` asChild target). Registry install lists `button` and `dialog` as shadcn dependencies — use `pnpm add @zedtech/zedkit-ui` when you want one dependency graph.

```ts
import { Button, ConfirmDialog } from "@zedtech/zedkit-ui";
<ConfirmDialog trigger={<Button>Delete</Button>} title="Delete item?"
  description="This cannot be undone." onConfirm={() => {}} />
```

```ts
import { Button, ConfirmDialog } from "@zedtech/zedkit-ui";
<ConfirmDialog
  trigger={<Button variant="outline">Revoke</Button>}
  title="Revoke access?"
  description="API keys stop working immediately."
  confirmLabel="Revoke"
  cancelLabel="Keep access"
  onConfirm={() => revoke()}
/>
```

## Slide in a drawer panel

- Import: `@zedtech/zedkit-ui` — `Drawer`, `DrawerProps`, `DrawerSize`, `DrawerTrigger`, `DrawerContent`, `DrawerHeader`, `DrawerTitle`, `DrawerDescription`, `DrawerBody`, `DrawerFooter`, `DrawerHandle`, `DrawerClose`, `DrawerCloseButton`, `DrawerOverlay`, `DrawerPortal`
- Wraps: `vaul`
- Status: beta
- Derived from: shadcn/ui (drawer)
- Registry: drawer
- Short name: Drawer
- Audience: Developers showing detail views beside a list without navigation.
- Purpose: Slide-in panels from any edge: right-side detail on desktop, bottom sheet on mobile; size sm, md or lg.
- When to use: For list-detail previews and short side forms. Panel chrome (border, fill, edge shadow) comes from `Surface` elevation 3 (`shadow-overlay`); `size="sm" | "md" | "lg"` on `DrawerContent` sets desktop side width (`md` is the default 28rem; `lg` is about min(600px, 92vw)).
- When not to use: For multi-step flows — use a full page or wizard instead.
- See also: `Open modal dialogs`, `Show key-value details and a live indicator`
- Examples: Right detail panel, Bottom sheet, Side panel on every screen
- A11y: Modal drawers use Vaul / Radix Dialog: focus lands on the panel itself on open (never a field, never a text selection) so the focus trap engages; `initialFocus` (a ref or a selector) opts a field in, with the caret at the end. Escape to close and focus returns to the trigger; rest of the page is hidden from assistive tech while open (`role="dialog"`). `modal={false}` (and matching `DrawerContent`) renders a kit inline panel with Surface styling—not Vaul/Radix—so the page stays pointer- and keyboard-reachable, without `aria-hidden` on siblings; mount autofocus stays off, Escape still closes and returns focus to the trigger. Provide `DrawerTitle` (and `DrawerDescription` when the panel needs context). Use `DrawerCloseButton` (44px touch target) plus `DrawerHandle` for swipe-down; the handle hides itself on left and right drawers and moves to the bottom edge of a top drawer. Every direction closes by dragging toward its edge, tapping the dimmed area, or pressing Escape on modal drawers. Safe-area insets are respected, and fields inside a drawer stay at 16px on touch screens. Sticky `DrawerHeader` / `DrawerFooter` keep title and actions visible; `DrawerBody` scrolls with `overscroll-behavior: contain`.
- Troubleshooting: Dim overlay missing after `shadcn add` — install the drawer registry item (it injects the `--overlay` token) or add the token to your theme. `direction="right"` with default `mobile="sheet"` becomes a bottom sheet under 640px; pass `mobile="side"` to keep a full-height side panel on phones (up to 90% of the width, so the dimmed page stays tappable).

```ts
import { Button, Drawer, DrawerClose, DrawerContent, DrawerTitle, DrawerTrigger } from "@zedtech/zedkit-ui";
<Drawer direction="right">
  <DrawerTrigger asChild><Button>Open</Button></DrawerTrigger>
  <DrawerContent>
    <DrawerClose asChild><Button variant="ghost" size="sm">Close</Button></DrawerClose>
    <DrawerTitle>Details</DrawerTitle>
  </DrawerContent>
</Drawer>
```

```ts
import { Button, Drawer, DrawerContent, DrawerHandle, DrawerTitle, DrawerTrigger } from "@zedtech/zedkit-ui";
<Drawer>
  <DrawerTrigger asChild><Button variant="outline">Filters</Button></DrawerTrigger>
  <DrawerContent>
    <DrawerHandle />
    <DrawerTitle>Filters</DrawerTitle>
  </DrawerContent>
</Drawer>
```

```ts
import { Button, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@zedtech/zedkit-ui";
<Drawer direction="left" mobile="side">
  <DrawerTrigger asChild><Button variant="outline">Menu</Button></DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Menu</DrawerTitle>
      <DrawerCloseButton />
    </DrawerHeader>
    <DrawerBody>Links</DrawerBody>
  </DrawerContent>
</Drawer>
```

## Float extra content next to a control

- Import: `@zedtech/zedkit-ui` — `Popover`, `PopoverProps`, `PopoverTrigger`, `PopoverContent`, `PopoverAnchor`
- Wraps: `@radix-ui/react-popover`
- Status: beta
- Derived from: shadcn/ui (popover)
- Short name: Popover
- Audience: Developers showing a small panel next to a button without leaving the page.
- Purpose: Anchored panel (trigger + content) that stays while the reader looks, then closes on Escape or outside click.
- When to use: For filters, a short form, or extra context that must stay on screen.
- When not to use: For a list of actions — use the action menu. For a task that needs full attention — use a dialog.
- See also: `Open modal dialogs`, `Open a menu of actions from a button`, `Name a control on hover`, `Pick a date from a popover`
- A11y: Content is `role="dialog"`. Give it a name (`aria-label` or a heading). Focus is not trapped (unlike Dialog). Escape and outside click dismiss.

```ts
import { Button, Heading, Popover, PopoverContent, PopoverTrigger, Text } from "@zedtech/zedkit-ui";
<Popover>
  <PopoverTrigger asChild><Button variant="outline">Filters</Button></PopoverTrigger>
  <PopoverContent aria-label="Filters">
    <Heading level={3}>Filters</Heading>
    <Text>Status: open invoices only.</Text>
  </PopoverContent>
</Popover>
```

## Name a control on hover

- Import: `@zedtech/zedkit-ui` — `Tooltip`, `TooltipProps`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider`
- Wraps: `@radix-ui/react-tooltip`
- Status: beta
- Derived from: shadcn/ui (tooltip)
- Short name: Tooltip
- Audience: Developers adding a short extra name that appears on hover or focus.
- Purpose: Instant hover/focus hint. Each Tooltip ships its own provider (`delayDuration` 0).
- When to use: For a one-line hint on a control that already has a visible name.
- When not to use: For an icon-only button — pass `label` on `IconButton`. For text the reader must keep — use a popover.
- See also: `Icon-only actions with a visible name`, `Float extra content next to a control`
- A11y: Content is `role="tooltip"` and tied to the trigger. Keep the sentence short. Keyboard focus shows it as well as hover.

```ts
import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@zedtech/zedkit-ui";
<Tooltip>
  <TooltipTrigger asChild><Button>Save</Button></TooltipTrigger>
  <TooltipContent>Saves the invoice</TooltipContent>
</Tooltip>
```

## Open a menu of actions from a button

- Import: `@zedtech/zedkit-ui` — `DropdownMenu`, `DropdownMenuProps`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`
- Wraps: `@radix-ui/react-dropdown-menu`
- Status: beta
- Derived from: shadcn/ui (dropdown-menu)
- Short name: DropdownMenu
- Audience: Developers grouping a few actions behind one button.
- Purpose: Action menu (trigger + items) with keyboard and axe coverage. Not a form select.
- When to use: For Duplicate, Archive, and similar verbs on one row or page.
- When not to use: For choosing one form value — use Select. For a destructive confirm — use ConfirmDialog after the item is chosen.
- See also: `Pick one option from a dropdown`, `Confirm destructive actions`, `Open modal dialogs`
- A11y: Content is `role="menu"`; items are `role="menuitem"`. Arrow keys move, Enter chooses, Escape closes. The trigger name should say what the menu is (Actions), not a verb that sounds like it already ran.

```ts
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@zedtech/zedkit-ui";
<DropdownMenu>
  <DropdownMenuTrigger asChild><Button variant="outline">Actions</Button></DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Duplicate invoice</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Archive invoice</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## Pick a day on a calendar

- Import: `@zedtech/zedkit-ui` — `Calendar`, `CalendarProps`
- Wraps: `react-day-picker`
- Status: beta
- Short name: Calendar
- Audience: Developers showing a month grid the reader can pick from.
- Purpose: Token-styled month grid. Locale and prev/next names follow the kit messages.
- When to use: When the calendar stays on the page (a booking widget, a dashboard).
- When not to use: For a compact form field — use the date picker in a popover.
- See also: `Pick a date from a popover`, `Pick a start and end date`
- A11y: Prev/next come from kit messages. Days are buttons in a grid. Pair with a visible heading when the grid is the main task.

```ts
import { Calendar } from "@zedtech/zedkit-ui";
<Calendar />
```

## Pick a date from a popover

- Import: `@zedtech/zedkit-ui` — `DatePicker`, `DatePickerProps`
- Wraps: `react-day-picker`, `@radix-ui/react-popover`
- Status: beta
- Short name: DatePicker
- Audience: Developers collecting one day in a form field.
- Purpose: Button that opens a calendar in a popover. `id` pairs with `FieldLabel`.
- When to use: For a due date, a start date, or any single day in a form.
- When not to use: For a range — use the start-and-end picker. For a calendar that stays on the page — use Calendar.
- See also: `Lay out fieldsets, fields, and error lists`, `Pick a start and end date`, `Float extra content next to a control`
- A11y: The popover is `role="dialog"` and takes its name from the placeholder (kit message by default). Selection is announced in a live region. Pass `disabledDays`, `startMonth`, and `endMonth` for limits.

```ts
import { DatePicker, Field, FieldLabel } from "@zedtech/zedkit-ui";
const [due, setDue] = useState<Date | undefined>();
<Field>
  <FieldLabel htmlFor="due">Due date</FieldLabel>
  <DatePicker id="due" value={due} onValueChange={setDue} />
</Field>
```

## Pick a start and end date

- Import: `@zedtech/zedkit-ui` — `DateRangePicker`, `DateRangePickerProps`
- Wraps: `react-day-picker`, `@radix-ui/react-popover`
- Status: beta
- Short name: DateRangePicker
- Audience: Developers collecting a from/to span in a form field.
- Purpose: Button that opens a range calendar in a popover. Closes when both days are set.
- When to use: For leave, a report window, or any start-and-end pair.
- When not to use: For one day — use the date picker.
- See also: `Pick a date from a popover`, `Lay out fieldsets, fields, and error lists`
- A11y: Same dialog name and live region as the single-day picker. Limits use `disabledDays`, `startMonth`, and `endMonth`. The popover stays open until start and end are different days.

```ts
import { DateRangePicker, Field, FieldLabel, type DateRangePickerProps } from "@zedtech/zedkit-ui";
const [span, setSpan] = useState<DateRangePickerProps["value"]>();
<Field>
  <FieldLabel htmlFor="leave">Leave</FieldLabel>
  <DateRangePicker id="leave" value={span} onValueChange={setSpan} />
</Field>
```


## Render a route as a modal over the list

- Import: `@zedtech/zedkit-ui` — `RouteModal`, `RouteModalProps`, `RouteModalDirection`, `RouteModalSize`, `RouteModalVariant`, `closeRoute`, `CloseRouteOptions`
- Wraps: `(none)`
- Status: stable
- Short name: RouteModal
- Audience: Developers opening list details in an overlay with a shareable URL (Next.js parallel/intercepting routes).
- Purpose: A route-driven modal (right drawer or centered dialog) that plays its exit before navigating back, with a list fallback.
- When to use: Inside an intercepting `@modal` slot, with `onClose` wired to `closeRoute`.
- When not to use: For state-driven modals — use `Dialog`/`Drawer` directly with local state.
- Examples: Order in a drawer, Centered dialog
- A11y: Inherits the Dialog/Drawer focus trap and Escape handling; exit plays before `onClose` navigates (immediate under reduced motion). Widths come from `--container-route-modal-*` tokens; exit timing reads `--motion-slow`/`--motion-base` live. The drawer variant uses `DrawerHandle`, sticky header, `DrawerBody` scroll, and `DrawerCloseButton` (44px). The dialog variant inherits Dialog's visual-viewport cap, sticky chrome, and 44px close.
- Composition: Variant props kept deliberately — the variant selects between two Radix roots sharing one exit orchestration, which slots cannot express; custom layouts compose `Dialog`/`Drawer` directly.
- See also: `Slide in a drawer panel`, `Open modal dialogs`, `Confirm destructive actions`

```ts
import { RouteModal, closeRoute } from "@zedtech/zedkit-ui";
import { useRouter } from "next/navigation";
const router = useRouter();
<RouteModal title="Delivery" onClose={() => closeRoute({ ...router, fallback: "/items" })}>
  <DetailView />
</RouteModal>
```

```ts
import { RouteModal, closeRoute } from "@zedtech/zedkit-ui";
<RouteModal title="Invoice" variant="dialog" onClose={() => closeRoute({ ...router, fallback: "/invoices" })}>
  <DetailView />
</RouteModal>
```

## Reset scroll on route change

- Import: `@zedtech/zedkit-ui` — `ScrollReset`, `ScrollResetProps`, `useScrollReset`, `ScrollResetOptions`
- Wraps: `(none)`
- Status: beta
- Short name: ScrollReset
- Audience: Developers whose client-side navigation keeps the previous page's scroll position.
- Purpose: Scrolls to the top (or to the `#hash` anchor) when the route key changes, leaving back/forward restoration to the browser.
- When to use: Once near the root of the app, fed the router pathname (`usePathname()` in Next.js).
- When not to use: For in-page anchor links or scroll spies — the browser already handles those.
- Examples: Next.js root, Inner scroll container
- A11y: Jumps instantly by default and always under `prefers-reduced-motion: reduce`; `behavior="smooth"` only applies when motion is allowed. Does not move focus. Back/forward (popstate) navigations are skipped so the browser restores the previous position.
- Composition: Renders nothing; `useScrollReset` is the same behaviour as a hook. Router-agnostic — the app passes the route key.
- See also: `Render a route as a modal over the list`

```ts
"use client";
import { ScrollReset } from "@zedtech/zedkit-ui";
import { usePathname } from "next/navigation";
export function RouteScroll() {
  return <ScrollReset routeKey={usePathname()} />;
}
```

```ts
import { useScrollReset } from "@zedtech/zedkit-ui";
const getMain = useCallback(() => document.querySelector<HTMLElement>("main"), []);
useScrollReset(pathname, { target: getMain });
```

## Show toast notifications

- Import: `@zedtech/zedkit-ui` — `Toaster`, `ToasterProps`, `toast`
- Wraps: `sonner`
- Status: stable
- Derived from: shadcn/ui (sonner)
- Short name: Toaster
- Audience: Developers confirming background outcomes (saved, failed, copied).
- Purpose: A root toaster plus toast() calls for transient notifications.
- When to use: For outcomes that do not need the user's reply.
- When not to use: For errors needing action — use Alert or Dialog instead.
- A11y: The viewport announces via an `aria-live` polite region — keep toasts short, one outcome each. Styling maps toast slots to theme tokens only.
- See also: `Call out a notice or an error state`
- Examples: Simple, Error toast
- Registry: sonner
- Troubleshooting: No toast appears — render `<Toaster />` once near the app root, then call `toast()`. Wrong colors — toast slots map to semantic theme tokens, so the theme stylesheet must be loaded.

```ts
import { Toaster, toast } from "@zedtech/zedkit-ui";
<Toaster /> // once near the root, then toast("Saved") anywhere
```

```ts
import { toast } from "@zedtech/zedkit-ui";
toast.error("Upload failed"); // typed variants: success | error | info | warning
```

## Display a shown-once secret with copy

- Import: `@zedtech/zedkit-ui` — `SecretField`, `SecretFieldProps`
- Wraps: `lucide-react`
- Status: stable
- Short name: SecretField
- Audience: Developers displaying API keys and tokens shown only once.
- Purpose: A read-only shown-once value with one-click copy; `multiline` wraps long values (install commands, snippets) so they read in full on a phone.
- When to use: Right after creating a credential the user must store.
- When not to use: For passwords the user typed — use a password Input instead.
- See also: `Collect text input with a label`
- A11y: The value is a read-only input (a read-only textarea with `multiline`), so it can be focused and selected with the keyboard. Name it: point a `Label` at `id`, or pass `aria-label`; the kit does not add one. The copy button is a real button named by `copyLabel` (a localized default otherwise). The copied state is a 2-second icon swap plus a polite live announcement. When the clipboard API is missing or writing to it fails, the same live region announces that copy failed.

```ts
import { Label, SecretField } from "@zedtech/zedkit-ui";
<Label htmlFor="key">API key (shown once)</Label>
<SecretField id="key" value="zk_live_example_secret" />
```

## Show a sortable, filterable, paginated data table

- Import: `@zedtech/zedkit-ui` — `DataTable`, `DataTableProps`, `DataTableColumn`, `createDataTableColumns`, `DataTablePagination`, `DataTablePaginationProps`, `DataTableEmpty`, `DataTableEmptyProps`, `DataTableToolbar`, `DataTableToolbarProps`, `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`
- Wraps: `@tanstack/react-table`
- Status: stable
- Short name: DataTable
- Audience: Developers listing queryable records (deliveries, users, orders).
- Purpose: Tables with sorting, filtering, pagination plus loading/error/empty states.
- When to use: For record lists over ~20 rows or needing search.
- When not to use: For a handful of static rows — map a simple table instead.
- Props: `emptyMessage` + optional `emptyAction` when `data` is empty; `noResultsMessage` overrides the filter-miss copy (default kit `empty`). Filter miss shows **Clear filters** automatically. Error, loading, and empty zones render outside the horizontal table scroller; `DataTableEmpty` remains for custom table bodies.
- A11y: Native table semantics (column headers associate by position); head/cell/caption spacing comes from `--spacing-table-*` theme tokens.
- See also: `Show key-value details and a live indicator`
- Examples: Simple, Standalone pagination, Standalone empty row, Standalone toolbar

```ts
import { DataTable, createDataTableColumns } from "@zedtech/zedkit-ui";
const helper = createDataTableColumns<Item>();
const columns = [helper.accessor("name", { header: "Name" })];
<DataTable columns={columns} data={items} loading={isLoading}
  error={error} emptyMessage="No orders yet." emptyAction={<Button>Add order</Button>}
  pageSize={20} />
```

```ts
import { DataTablePagination } from "@zedtech/zedkit-ui";
const [page, setPage] = useState(2);
<DataTablePagination page={page} pageCount={4}
  canPrevious={page > 1} canNext={page < 4}
  onPrevious={() => setPage(page - 1)} onNext={() => setPage(page + 1)} />
```

```ts
import { DataTableEmpty, Table, TableBody } from "@zedtech/zedkit-ui";
<Table><TableBody>
  <DataTableEmpty colSpan={3} message="Nothing here." />
</TableBody></Table>
```

```ts
import { DataTableToolbar } from "@zedtech/zedkit-ui";
const [query, setQuery] = useState("");
<DataTableToolbar value={query} onChange={setQuery} />
```

## Lay out an admin page (sidebar + topbar + header)

- Import: `@zedtech/zedkit-ui` — `AppShell`, `AppShellProps`, `PageHeader`, `PageHeaderProps`
- Wraps: none (theme tokens only)
- Status: stable
- Short name: AppShell
- Audience: Teams scaffolding a consistent admin layout.
- Purpose: Sidebar + topbar shell with page header (title, description, actions).
- When to use: As the frame of every admin page.
- When not to use: For public marketing pages — use your site layout instead.
- A11y: Landmark structure (`aside`/`header`/`main`) comes free; sidebar width and main padding come from `--spacing-app-shell-*` theme tokens.
- See also: `Group content in a card section`
- Examples: Simple, Without topbar
- Registry: app-shell
- Troubleshooting: Sidebar missing on narrow screens — it renders from the `md` breakpoint up by design. Cramped content — main padding is `p-4` / `md:p-app-shell-padding-md`. `--spacing-app-shell-padding` remains as a deprecated alias.

```ts
import { AppShell, PageHeader } from "@zedtech/zedkit-ui";
<AppShell sidebar={<OrgNav />} topbar={<UserMenu />}>
  <PageHeader title="Items" description="All items." />
</AppShell>
```

```ts
import { AppShell } from "@zedtech/zedkit-ui";
<AppShell sidebar={<nav aria-label="Primary"><a href="#">Overview</a></nav>}> {/* topbar is optional */}
  <p>Content.</p>
</AppShell>
```

## Guide a multi-step flow with selectable option cards

- Import: `@zedtech/zedkit-ui` — `WizardSteps`, `WizardStepsProps`, `Wizard`, `WizardProps`, `WizardStep`, `WizardStepProps`, `WizardStepState`, `OptionCards`, `OptionCardsProps`, `OptionCard`, `OptionCardProps`, `OptionCardData`
- Wraps: none (native inputs + theme tokens)
- Status: stable
- Short name: WizardSteps
- Audience: Developers building onboarding, setup, or checkout flows.
- Purpose: Step indicator plus selectable option cards with state.
- When to use: For 2–6 step flows with choices per step.
- When not to use: For single forms — use Form instead of inventing steps.
- See also: `Build validated forms with labels, errors, and pending state`
- Examples: Simple, Composed steps, Solo card, Pick one
- A11y: List carries `aria-label="Progress"`; current step gets `aria-current="step"`. Cards are native checkboxes in labels; with `multiple={false}` they are native radios in a `radiogroup`, one name per group, arrow keys move the choice.
- Mobile: Below `sm`, `WizardSteps` shows `Step {n} of {count} · {title}` plus a progress bar; the horizontal step list stays visible from `sm` up.
- Registry: wizard-steps
- Troubleshooting: Steps stuck done/todo — `current` is a 0-based index; past the last step everything reads done. Missing connector — composed `WizardStep` rows show one only with `showConnector` (automatic in `WizardSteps`).

```ts
import { OptionCards, WizardSteps } from "@zedtech/zedkit-ui";
const [picked, setPicked] = useState(["a", "b"]);
<WizardSteps steps={["Pick", "Configure", "Test"]} current={0} />
<OptionCards options={options} selected={picked} onChange={setPicked} />
```

```ts
import { Wizard, WizardStep } from "@zedtech/zedkit-ui";
<Wizard>
  <WizardStep step="Pick" index={0} state="done" showConnector />
  <WizardStep step="Configure" index={1} state="current" />
</Wizard>
```

```ts
import { OptionCard } from "@zedtech/zedkit-ui";
const [solo, setSolo] = useState(false);
<OptionCard title="Solo option" checked={solo} onChange={() => setSolo(!solo)} />
```

```ts
import { OptionCards } from "@zedtech/zedkit-ui";
const [delivery, setDelivery] = useState(["standard"]); // always one id
<OptionCards multiple={false} label="Delivery" options={options} selected={delivery} onChange={setDelivery} />
```

## Show key-value details and a live indicator

- Import: `@zedtech/zedkit-ui` — `DetailPanel`, `DetailPanelProps`, `DetailItem`, `DetailPanelRow`, `DetailPanelRowProps`, `LivePulse`, `LivePulseProps`
- Wraps: none (theme tokens only)
- Status: stable
- Short name: DetailPanel
- Audience: Developers rendering record details (drawers, side panels, headers).
- Purpose: Key-value detail lists plus an optional live pulse.
- When to use: For read-only record summaries next to the list.
- When not to use: For editable records — use Form instead.
- See also: `Show a sortable, filterable, paginated data table`, `Slide in a drawer panel`
- Examples: Simple, Composed rows
- A11y: Native `dl`/`dt`/`dd` semantics; rows read in order.
- Registry: detail-panel
- Troubleshooting: Custom row content — compose `DetailPanelRow` inside your own `<dl>` (see Composed rows); `DetailPanel` only covers the plain `items[]` case. Cramped rows — inline padding is `px-4`; block padding is `py-3`. `--spacing-detail-panel-inline` and `--spacing-detail-panel-block` remain as deprecated aliases.

```ts
import { DetailPanel, LivePulse, PageHeader } from "@zedtech/zedkit-ui";
<PageHeader title="Server" actions={<LivePulse />} />
<DetailPanel items={[{ label: "Region", value: "eu" }]} />
```

```ts
import { DetailPanelRow } from "@zedtech/zedkit-ui";
<dl>
  <DetailPanelRow label="Region" value="eu" />
</dl>
```

## Build validated forms with labels, errors, and pending state

- Import: `@zedtech/zedkit-ui` — `Form`, `FormField`, `FormFieldProps`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`, `useFormField`, `useValidatedForm`, `FormSubmit`, `FormSubmitProps`
- Wraps: `react-hook-form`, `@hookform/resolvers`, `zod`
- Status: beta
- Derived from: shadcn/ui (form); kit (useValidatedForm, FormSubmit)
- Short name: Form
- Audience: Developers collecting validated input with accessible errors.
- Purpose: Validated forms (schema, field errors, pending submit) on react-hook-form + zod.
- When to use: For any form needing validation or async submit.
- When not to use: For a single search box — use Input directly instead.
- See also: `Lay out fieldsets, fields, and error lists`, `Collect text input with a label`
- A11y: `FormLabel` targets the control through `htmlFor`; `FormControl` sets `aria-invalid` and links the description and the error message with `aria-describedby`. `FormMessage` is plain text and is not a live region: after a failed submit react-hook-form moves focus to the first invalid field (`shouldFocusError`, on by default), which is what makes the error reach screen-reader users. `FormSubmit` is disabled while submitting, so do not rely on it for the only error path.

```ts
import { Form, FormField, FormSubmit, Input, useValidatedForm } from "@zedtech/zedkit-ui";
const form = useValidatedForm<Values>(schemaFromContracts, { defaultValues });
// <Form {...form}><form onSubmit={form.handleSubmit(save)}>
// <FormField control={form.control} name="name" render={...} />
// <FormMessage /> shows the error; <FormSubmit pendingLabel={t.saving}>
```

## Lay out fieldsets, fields, and error lists

- Import: `@zedtech/zedkit-ui` — `FieldSet`, `FieldSetProps`, `FieldLegend`, `FieldGroup`, `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldSeparator`, `FieldContent`, `FieldTitle`
- Wraps: none (presentational over `Label`, `Separator`)
- Status: stable
- Derived from: shadcn/ui (field)
- Short name: FieldSet
- Audience: Developers structuring long or grouped forms.
- Purpose: Fieldsets, field rows, labels, descriptions and error lists.
- When to use: To group related fields with legends and per-field errors.
- When not to use: For validation logic itself — pair with Form instead.
- See also: `Build validated forms with labels, errors, and pending state`, `Pick a date from a popover`
- A11y: `FieldError` uses `role="alert"`. Field row gap is `gap-3`; `--spacing-field` remains as a deprecated alias. FieldContent stack gap is `gap-1.5`; `--spacing-field-content` remains as a deprecated alias.

```ts
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSet } from "@zedtech/zedkit-ui";
<FieldSet><FieldGroup><Field>
<FieldLabel>Name</FieldLabel><FieldDescription>Public.</FieldDescription>
<FieldError errors={[{ message: "Too short." }]} />
</Field></FieldGroup></FieldSet>
```

## Shared panel surface (border, shadow, glass)

- Import: `@zedtech/zedkit-ui` — `Surface`, `surfaceVariants`, `SurfaceProps`, `surfaceGlassPanelClass`, `applySurfaceGlassPanel`, `WidgetButton`, `WidgetButtonProps`
- Wraps: none (`surface.css` frosts `variant="glass"` under the glass identity)
- Status: alpha
- Short name: Surface
- Audience: Developers building floating panels or composing kit overlays.
- Purpose: One panel surface: solid card, popover or glass, elevation `0`–`3` with token shadows, border, radius and optional padding.
- When to use: Custom panels that should match Dialog, Drawer, Card, and Popover chrome; floating assistant triggers via `WidgetButton`. Pass `depth` (not with glass) to wrap the panel in a parallax layer.
- When not to use: Marketing page sections — use `@zedtech/zedkit-ui/marketing` `GlassSurface` instead.
- See also: `Group content in a card section`, `Slide in a drawer panel`, `Open modal dialogs`, `Add depth with parallax layers`
- A11y: Presentational wrapper — name regions with headings or `aria-label`. `WidgetButton` is a normal button (outline variant) with pill radius and card elevation.
- Examples: Solid card panel, Glass popover hook, Widget trigger
- Registry: surface
- Troubleshooting: Glass looks solid — frost applies only under the glass identity (`data-identity="glass"`). Dialog, Drawer and Card copy-paste payloads pull this brick in; add `surface` on its own for a custom panel.

```ts
import { Surface } from "@zedtech/zedkit-ui";
<Surface variant="solid" elevation={2} radius="xl" padding="md">Summary</Surface>
```

## Group content in a card section

- Import: `@zedtech/zedkit-ui` — `Card`, `CardProps`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- Wraps: none (presentational, theme tokens only)
- Status: stable
- Short name: Card
- Audience: Developers grouping related content in bordered sections.
- Purpose: Cards with header/title/description/content/footer slots.
- When to use: For self-contained blocks (panels, summaries, previews).
- When not to use: For page-level layout — use AppShell and Stack instead.
- A11y: Slots are plain containers — put headings and labels inside. Spacing comes from `--spacing-card-*` theme tokens; elevation is Surface level 2 (`shadow-md`, `--zk-shadow-md` per identity). `CardSkeleton` mirrors the same tokens so async content lands without shifting.
- See also: `Stack content and group titled sections`
- Examples: Simple, With footer
- Registry: card
- Troubleshooting: Cramped content — inner padding comes from the `--spacing-card-padding` theme token (`pt-0` on content/footer avoids doubling it). Title not announced as a heading — slots are plain `div`s; put a real heading element inside `CardTitle` when the card needs one.

```ts
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@zedtech/zedkit-ui";
<Card><CardHeader><CardTitle>Server</CardTitle>
<CardDescription>Connection details.</CardDescription></CardHeader>
<CardContent>Body.</CardContent></Card>
```

```ts
import { Card, CardContent, CardFooter } from "@zedtech/zedkit-ui";
<Card><CardContent>Body.</CardContent>
<CardFooter>Actions go here.</CardFooter></Card>
```

## Stack content and group titled sections

- Import: `@zedtech/zedkit-ui` — `Stack`, `stackVariants`, `StackProps`, `Section`, `SectionProps`, `SectionScroll`, `SectionScrollProps`
- Wraps: none (flex/gap utilities over `Heading`, `Text`)
- Status: stable
- Short name: Stack
- Audience: Developers laying out kit pages without raw divs.
- Purpose: Gap-based vertical/horizontal stacks plus titled sections, with optional proximity scroll-snap.
- When to use: For all kit-page layout instead of hand-written flex.
- When not to use: For complex grids — use CSS grid directly instead. For motion/enter animations, use the motion utilities, not `SectionScroll`.
- See also: `Render headings and body text without raw tags`, `Group content in a card section`, `Constrain page width and run sections edge to edge`
- A11y: `Stack` renders a plain `div` with no role. `Section` renders a `section` landmark named by its string `title`, with that title as a level-2 heading: use one `title` per region, keep heading levels in order, and do not repeat a title that a nearby landmark already uses. `SectionScroll` is a plain `div`; snap and smooth scrolling apply only when `prefers-reduced-motion` is `no-preference`.

```ts
import { Section, SectionScroll, Stack } from "@zedtech/zedkit-ui";
<SectionScroll>
  <Section title="Team" description="Who can access.">
    <Stack direction="horizontal" gap={2}>...</Stack>
  </Section>
  <Section snap="none" title="Long band">...</Section>
</SectionScroll>
```

## Constrain page width and run sections edge to edge

- Import: `@zedtech/zedkit-ui` — `Container`, `containerVariants`, `ContainerProps`, `Section`
- Wraps: `class-variance-authority`
- Status: alpha
- Short name: Container
- Audience: Developers building marketing and docs pages with capped measures and full-bleed bands.
- Purpose: Named container widths and edge-to-edge section bands from the layout token scale.
- When to use: For page shells and banded landing sections instead of hand-written max-width, gutter and section-padding strings.
- When not to use: For app chrome with sidebars — use the app shell; for component-internal widths — use the spacing scale.
- See also: `Stack content and group titled sections`, `Group content in a card section`
- A11y: Bleed sections keep the heading outline inside the capped container; do not nest landmarks inside the band. A string `title` names the `<section>` (`aria-label`); a `description` still renders when there is no title.

```ts
import { Container, Section } from "@zedtech/zedkit-ui";
<Section bleed tone="muted" spacing="lg" title="Pricing" description="What each plan includes.">...</Section>
<Container width="wide">...</Container>
```

## Render headings and body text without raw tags

- Import: `@zedtech/zedkit-ui` — `Heading`, `HeadingProps`, `headingVariants`, `Text`, `TextProps`, `textVariants`, `typeRoleClass`, `signatureMotionClass`, `headingLevelDefaultRole`, `TypeRole`, `SignatureMotion`
- Wraps: `class-variance-authority` (styles follow the documented shadcn typography recipes; no registry item exists)
- Status: stable
- Short name: Typography
- Audience: Developers writing kit pages with consistent type.
- Purpose: Heading levels and Text variants with theme-aware styles; visual roles decouple size from semantic level (`typeRole` / `typeRoleClass`).
- When to use: For every heading and paragraph in kit UI.
- When not to use: For raw HTML emails or markdown — style those separately.
- See also: `Stack content and group titled sections`
- Examples: Simple, Heading styles on a link (asChild)
- A11y: Keep one `h1` per page; `asChild` merges styles onto the child — keep the outline meaningful.
- Registry: typography
- Utilities: `text-zk-type-*`, `motion-reveal`, `motion-settle`, `motion-emphasis`, `motion-glide`, `motion-feedback` (class names in `styles.css`, not JS imports)
- Troubleshooting: Wrong tag in the outline — `level` picks the size but `as` picks the tag; set both when they differ. Anchor hidden under a sticky header — heading scroll margin comes from the `--spacing-heading-scroll` theme token.

```ts
import {
  Heading,
  Text,
  typeRoleClass,
  signatureMotionClass,
  headingLevelDefaultRole,
  type TypeRole,
  type SignatureMotion,
} from "@zedtech/zedkit-ui";
<Heading level={1} typeRole="display">Page title</Heading>
<Heading level={2} typeRole="title">Section title</Heading>
<Heading level={3} typeRole="heading">Band heading</Heading>
<Text typeRole="body">Body copy.</Text>
<Text typeRole="caption">Caption</Text>
```

```ts
import { Heading } from "@zedtech/zedkit-ui";
<Heading level={2} asChild>
  <a href="#section">Section title as a link</a>
</Heading>
```

## Call out a notice or an error state

- Import: `@zedtech/zedkit-ui` — `Alert`, `AlertTitle`, `AlertDescription`, `alertVariants`, `AlertProps`
- Wraps: `class-variance-authority`
- Status: stable
- Short name: Alert
- Audience: Developers surfacing notices, warnings and errors inline.
- Purpose: Notice/error callouts with title and description.
- When to use: For states tied to page content (load errors, warnings).
- When not to use: For transient confirmations — use Toaster instead.
- See also: `Show toast notifications`
- Examples: Simple, As a section (asChild)
- A11y: Root carries `role="alert"` (announced assertively). Use `asChild` to render another element; keep one title plus one description.
- Registry: alert
- Troubleshooting: Icon misaligned — the svg slot expects one `lucide-react` icon as the first child (positioned with `top-4` / `left-4`). `--spacing-alert-icon-offset` remains as a deprecated alias. Block padding is `py-3`; `--spacing-alert-block` remains as a deprecated alias. Double announcement — one `role="alert"` per notice; repeated renders re-announce.

```ts
import { Alert, AlertDescription, AlertTitle } from "@zedtech/zedkit-ui";
<Alert><AlertTitle>Heads up</AlertTitle>
<AlertDescription>Something worth knowing.</AlertDescription></Alert>
<Alert variant="destructive"><AlertTitle>Failed</AlertTitle>
<AlertDescription>Something went wrong.</AlertDescription></Alert>
```

```ts
import { Alert, AlertDescription, AlertTitle } from "@zedtech/zedkit-ui";
<Alert asChild>
  <section aria-label="Maintenance notice">
    <AlertTitle>Scheduled maintenance</AlertTitle>
    <AlertDescription>Sunday 02:00–03:00 UTC.</AlertDescription>
  </section>
</Alert>
```

## Show your brand logo

- Import: `@zedtech/zedkit-ui` — `BrandLogo`, `BrandLogoProps`, `Logo`, `LogoProps`
- Wraps: none (inline SVG)
- Status: beta
- Short name: BrandLogo
- Audience: Teams building a header, a footer or a share image for their own site.
- Purpose: Render your own logo as an inline SVG that paints with `currentColor`, so it follows the text colour in light, dark and every visual identity.
- When to use: Next to your product name in a site header or footer, or as the mark of a share image.
- When not to use: For the zedkit mark — `Logo` is zedkit's own mark, used by the zedkit docs site; do not ship it as yours.
- See also: `Switch the visual identity with one attribute`
- Examples: Simple, Header link to the home page
- A11y: named image (the brand name) when the mark stands alone; pass `title=""` to hide it when the name is written next to it, and let the link text label the link.

```ts
import { BrandLogo } from "@zedtech/zedkit-ui";
<BrandLogo title="Harbor Studio" viewBox="0 0 32 24" className="h-6 text-primary">
  <path d="M16 1 25 15H7Z" />
  <path d="M0 19c4 0 4 3 8 3s4-3 8-3 4 3 8 3 4-3 8-3v5H0Z" />
</BrandLogo>
```

```ts
import { BrandLogo } from "@zedtech/zedkit-ui";
<a href="/" className="flex items-center gap-2 text-foreground">
  <BrandLogo title="" viewBox="0 0 32 24" className="h-6 text-primary">
    <path d="M16 1 25 15H7Z" />
  </BrandLogo>
  Harbor Studio
</a>
```

## Pick one option from a dropdown

- Import: `@zedtech/zedkit-ui` — `Select`, `SelectProps`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectGroup`, `SelectLabel`, `SelectItem`, `SelectSeparator`, `SelectScrollUpButton`, `SelectScrollDownButton`
- Wraps: `@radix-ui/react-select`
- Status: stable
- Derived from: shadcn/ui (select)
- Short name: Select
- Audience: Form builders offering 4+ exclusive options in little space.
- Purpose: Accessible dropdown select with trigger, value and items; empty lists render a disabled message item.
- When to use: For long option lists where radio groups would sprawl.
- When not to use: For 2–3 visible options — use radio inputs or OptionCards instead.
- See also: `Toggle a checkbox or a switch`, `Guide a multi-step flow with selectable option cards`
- A11y: Built on Radix Select: the trigger has `role="combobox"`, opens with Enter, Space, ArrowUp or ArrowDown, and options are chosen with the arrows, typeahead and Enter; Escape closes it and returns focus to the trigger. Typing a letter on the closed trigger changes the value without opening it. The trigger needs a name: pair it with a `Label` whose `htmlFor` matches the trigger `id`, or pass `aria-label`. The list renders in a portal, so inside a scoped theme wrap it in `ThemeScope` to keep its tokens.

```ts
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@zedtech/zedkit-ui";
const items = regions.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>);
<Select onValueChange={setRegion}>
<SelectTrigger><SelectValue placeholder="Pick a region" /></SelectTrigger>
<SelectContent>{items.length === 0 ? <SelectItem value="none" disabled>No regions available</SelectItem> : items}</SelectContent>
```

## Search and pick one option

- Import: `@zedtech/zedkit-ui` — `Combobox`, `ComboboxOption`, `ComboboxProps`
- Wraps: `downshift`, `@radix-ui/react-popover`
- Status: beta
- Short name: Combobox
- Audience: Form builders with long lists where typing to filter beats scrolling a select.
- Purpose: Searchable single-select combobox with popover list, empty and loading rows, keyboard navigation.
- When to use: When users know part of the label (city, SKU, assignee).
- When not to use: For a fixed short list with no search — use Select.
- See also: `Pick one option from a dropdown`, `Pick many searchable options`
- A11y: Text input with listbox popup; arrow keys highlight, Enter selects, Escape closes.
- Troubleshooting: Menu stays empty — check `options` labels match the typed filter. Selection does not stick — control `value` and `onValueChange` together.

```ts
import { Combobox, type ComboboxOption } from "@zedtech/zedkit-ui";
const options: ComboboxOption[] = [{ value: "eu", label: "Europe" }];
<Combobox options={options} value={region} onValueChange={setRegion} aria-label="Region" />;
```

## Pick many searchable options

- Import: `@zedtech/zedkit-ui` — `MultiSelect`, `MultiSelectProps`, `ComboboxOption`
- Wraps: `downshift`, `@radix-ui/react-popover`
- Status: beta
- Short name: MultiSelect
- Audience: Filters and tag pickers where several values apply.
- Purpose: Searchable multi-select with removable chips, shared empty/loading states, keyboard support.
- When to use: Tag filters, multi-assignee fields, facet pickers.
- When not to use: For a single value — use Combobox or Select.
- See also: `Search and pick one option`, `Toggle a checkbox or a switch`
- A11y: Selected values appear as chips with remove buttons; listbox behaves like Combobox for adding.
- Troubleshooting: Duplicate chips — the same `value` is already selected. Chips missing labels — every option needs a stable `value` and human `label`.

```ts
import { MultiSelect, type ComboboxOption } from "@zedtech/zedkit-ui";
const tags: ComboboxOption[] = [{ value: "docs", label: "Docs" }];
<MultiSelect options={tags} value={picked} onValueChange={setPicked} aria-label="Tags" />;
```

## Collect multi-line text input

- Import: `@zedtech/zedkit-ui` — `Textarea`, `TextareaProps`
- Wraps: none (styled native `textarea`)
- Status: stable
- Derived from: shadcn/ui (textarea)
- Short name: Textarea
- Audience: Form builders collecting paragraphs (bios, notes, messages).
- Purpose: Labelled multi-line textarea with consistent styling.
- When to use: For free text longer than one line.
- When not to use: For single-line values — use Input instead.
- See also: `Collect text input with a label`
- A11y: `min-h-textarea-min-height` from theme tokens; `focus-ring-control` on keyboard focus.

```ts
import { Label, Textarea } from "@zedtech/zedkit-ui";
<Label htmlFor="bio">Bio</Label>
<Textarea id="bio" placeholder="A few words." />
```

## Toggle a checkbox or a switch

- Import: `@zedtech/zedkit-ui` — `Checkbox`, `CheckboxProps`, `Switch`
- Wraps: `@radix-ui/react-checkbox`, `@radix-ui/react-switch`
- Status: stable
- Derived from: shadcn/ui (checkbox, switch)
- Short name: Checkbox
- Audience: Form builders collecting booleans and on/off settings.
- Purpose: Accessible checkbox and switch toggles.
- When to use: Checkbox for agreements and multi-picks, switch for instant on/off settings.
- When not to use: For exclusive choices — use Select or radio inputs instead.
- See also: `Pick one option from a dropdown`
- A11y: Built on Radix: `Checkbox` has `role="checkbox"` and `Switch` has `role="switch"`, both toggled with Space (Enter also toggles a `Switch`, not a `Checkbox`) and exposing their state through `aria-checked`. Neither has a visible name of its own: pair each with a `Label` using `htmlFor`/`id`, or pass `aria-label`. Use `Switch` only for settings that apply immediately.

```ts
import { Checkbox, Label, Switch } from "@zedtech/zedkit-ui";
<Checkbox id="terms" />
<Label htmlFor="terms">Accept the terms</Label>
<Switch id="notify" aria-label="Notify me" />
```

## Switch between tabbed panels

- Import: `@zedtech/zedkit-ui` — `Tabs`, `TabsProps`, `TabsList`, `TabsTrigger`, `TabsContent`
- Wraps: `@radix-ui/react-tabs`
- Status: stable
- Derived from: shadcn/ui (tabs)
- Short name: Tabs
- Audience: Developers grouping related panels under one heading.
- Purpose: Accessible tabs (list, triggers, content panels).
- When to use: For sibling views that share context (settings groups, code variants).
- When not to use: For sequential steps — use WizardSteps instead.
- See also: `Guide a multi-step flow with selectable option cards`
- Examples: Simple, Controlled
- A11y: Arrow keys move between triggers (Radix roving tabindex); keep trigger text short so accessible names stay clear.
- Registry: tabs
- Troubleshooting: Panels not switching — each `TabsTrigger`/`TabsContent` pair shares one `value`; the root needs `defaultValue` (uncontrolled) or `value` + `onValueChange` (controlled). Focus ring missing — triggers use the `focus-ring` utility shipped in the brick css.

```ts
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@zedtech/zedkit-ui";
<Tabs defaultValue="one"><TabsList>
<TabsTrigger value="one">First</TabsTrigger>
</TabsList><TabsContent value="one">First panel.</TabsContent></Tabs>
```

```ts
import { Tabs } from "@zedtech/zedkit-ui";
<Tabs value={tab} onValueChange={setTab}> // controlled: you own the state
```

## Horizontal scroll gallery row

- Import: `@zedtech/zedkit-ui` — `ScrollGallery`, `ScrollGalleryProps`
- Wraps: none (layout + focus scroll)
- Status: alpha
- Short name: ScrollGallery
- Audience: Developers showing a row of peers (identity chips, filter pills, thumbnail strips) that must stay on one line on phones.
- Purpose: One snap-aligned horizontal scroll row with thin scrollbar, edge fade, and focused items scrolled into view.
- When to use: More items than fit at once; keyboard tabs or links inside the row.
- When not to use: Primary navigation that should wrap — use a vertical stack.
- See also: `Pin a stage and change scene as the page scrolls`, `Switch between tabbed panels`
- Examples: Identity picker row, Filter chips, Toolbar peers
- A11y: Keep real controls inside the track (tabs, links, buttons); focused items scroll into view. Edge fades are decorative only.
- Troubleshooting: Items wrap to two lines — the track child should be `inline-flex flex-nowrap` (for example `TabsList`). Nothing scrolls — confirm the row is wider than the viewport and `overflow-x-auto` is not blocked by a parent `overflow: hidden`.

```ts
import { ScrollGallery, Tabs, TabsList, TabsTrigger } from "@zedtech/zedkit-ui";

<Tabs value="a">
  <ScrollGallery className="w-full">
    <TabsList className="inline-flex w-max flex-nowrap">
      <TabsTrigger value="a">One</TabsTrigger>
      <TabsTrigger value="b">Two</TabsTrigger>
    </TabsList>
  </ScrollGallery>
</Tabs>
```

```ts
import { ScrollGallery } from "@zedtech/zedkit-ui";

<ScrollGallery className="max-w-sm">
  <div className="flex w-max gap-2">
    <a className="shrink-0 snap-start rounded-md border px-3 py-2" href="#a">
      Alpha
    </a>
    <a className="shrink-0 snap-start rounded-md border px-3 py-2" href="#b">
      Beta
    </a>
  </div>
</ScrollGallery>
```

## Keep a side panel in view

- Import: `@zedtech/zedkit-ui` — `StickyAside`, `StickyAsideMain`, `StickyAsideAside`, `StickyAsideProps`, `StickyAsideMainProps`, `StickyAsideAsideProps`, `StickyAsideSide`, `StickyAsideFrom`, `StickyAsideGap`, `StickyAsideMobile`, `StickyAsideRatioPreset`
- Wraps: none (CSS `position: sticky`)
- Status: alpha
- Short name: StickyAside
- Attributes: `data-sticky-aside`, `data-sticky-aside-main`, `data-sticky-aside-aside`, `data-side`, `data-from`, `data-gap`, `data-mobile`, `data-ratio`, `data-scrollable`
- Audience: Developers building docs, onboarding, or pricing pages where steps scroll on one side and a summary or preview should stay visible until the section ends.
- Purpose: Main column scrolls; aside sticks under the header until the section ends. Pure CSS, server components, no scroll hijacking.
- When to use: Long step lists beside a short preview, install instructions beside a rendered example, or any section where reading order is main then aside.
- When not to use: Pinning a single stage that crossfades through scenes — use `ScrollScenes`. A sticky bar that spans the whole viewport outside a section — use your shell header. Tall aside content without `scrollable` when you need the full block visible at once on small viewports — stack on mobile or shorten the aside.
- See also: `Stack content and group titled sections`, `Pin a stage and change scene as the page scrolls`, `Add depth with parallax layers`
- Examples: Get started steps with live preview, Doc page with summary card, Pricing tiers with recap
- A11y: DOM order is always main then aside; use `mobile="before"` only when the aside should appear first visually on phones. Put headings and steps in the main column; label specimen previews (for example with `role="group"` and `aria-label`). In-section links in the main column get `scroll-margin-top` from `--zk-pin-top`. With `scrollable`, the aside scrolls internally — keep focusable controls reachable.
- Troubleshooting: Aside never sticks — check that `data-from` matches your breakpoint, the section is tall enough to scroll, and no ancestor between this root and the viewport uses `overflow: hidden|auto|scroll` or a transform. Aside hides under the site header — set `--zk-sticky-top` (or `--zk-pin-top` globally) to the header offset. Columns too narrow — pass `ratio="1/2"` or `--zk-sticky-cols`. Aside taller than the window — pass `scrollable` so it keeps sticky with an internal scroll area. Snap fights a long section — parent sections that contain `StickyAside` disable scroll-snap when `SectionScroll` is active.

```ts
import { StickyAside, Stack, Text } from "@zedtech/zedkit-ui";
import { GlassSurface } from "@zedtech/zedkit-ui/marketing";

<StickyAside side="right" ratio="1/3" className="[--zk-sticky-top:7rem]">
  <StickyAside.Main>
    <Stack gap={4}>{/* numbered steps */}</Stack>
  </StickyAside.Main>
  <StickyAside.Aside asChild>
    <GlassSurface padding="md">
      <Text>Rendered example</Text>
    </GlassSurface>
  </StickyAside.Aside>
</StickyAside>
```

```ts
import { Card, CardContent, StickyAside, Text } from "@zedtech/zedkit-ui";

// Aside on the left from the md breakpoint; stack main first on phones.
<StickyAside side="left" from="md" mobile="stack-after">
  <StickyAside.Main>
    <Text>Form fields…</Text>
  </StickyAside.Main>
  <StickyAside.Aside scrollable>
    <Card>
      <CardContent>Order summary</CardContent>
    </Card>
  </StickyAside.Aside>
</StickyAside>
```

```html
<div data-sticky-aside data-side="right" data-from="lg" data-gap="md" data-mobile="after">
  <div data-sticky-aside-main>…</div>
  <aside data-sticky-aside-aside>…</aside>
</div>
```

## Add depth with parallax layers

- Import: `@zedtech/zedkit-ui/motion` — `ParallaxSection`, `ParallaxLayer`, `ParallaxSectionProps`, `ParallaxLayerProps`, `ParallaxDepth`, `ParallaxDepthName`, `ParallaxAxis`, `ParallaxRange`, `ParallaxOff`, `ParallaxFade`, `ParallaxSectionTag`, `PARALLAX_AXES`, `PARALLAX_DEPTH_NAMES`, `PARALLAX_RANGES`, `PARALLAX_OFF`, `PARALLAX_FADES`, `PARALLAX_SECTION_TAGS`, `MotionScript`, `MotionScriptProps`; `@zedtech/zedkit-ui/motion/runtime` — `observeAnimate`
- CSS import: `@zedtech/zedkit-ui/motion.css`
- Attributes: `data-parallax`, `data-parallax-layer`, `data-parallax-depth`, `data-parallax-axis`, `data-parallax-range`, `data-parallax-off`, `data-parallax-preset`, `data-parallax-move`, `data-parallax-zoom`, `data-parallax-fade`
- Wraps: `(none)`
- Status: alpha
- Short name: Parallax
- Audience: Developers adding scroll depth to a hero or section without a JavaScript animation library.
- Purpose: Section-shared CSS view timeline; layers move with depth, axis, zoom, fade, and range. Static without scroll timelines.
- When to use: Background and deco layers that should drift as the section scrolls. Keep copy and controls outside a moving layer, or at `depth={0}`.
- When not to use: Node-local scroll presets on a single element — `data-animate-scroll="parallax"` stays. Pinned scene crossfades — `ScrollScenes`. Sticky columns — `StickyAside`.
- See also: `Reveal and react with motion on any element`, `Keep a side panel in view`, `Pin a stage and change scene as the page scrolls`
- Examples: Hero with far background, Named depth layer, HTML attributes
- A11y: Moving, zooming, or fading layers are `aria-hidden` and `inert`. `prefers-reduced-motion: reduce` and `data-motion="reduce"` leave layers in place. Do not put buttons, links, toasts, or `Surface variant="glass"` in a moving layer. `Surface depth` wraps without `aria-hidden` so a non-interactive visual panel can still sit on a layer.
- Troubleshooting: Nothing moves — the browser needs `animation-timeline: view()`; otherwise layers stay put (v1 static fallback). Intensity is `--zk-motion-intensity` (0 = no shift). A toast jumps with the section — the toast host was transformed; keep `position: fixed` toasts outside layers. Edges flash — the layer box extends by its travel (`inset-block`). Vanilla observers import `@zedtech/zedkit-ui/motion/runtime`.

```ts
import { ParallaxLayer, ParallaxSection } from "@zedtech/zedkit-ui/motion";

<ParallaxSection range="page">
  <ParallaxLayer depth="far" className="absolute inset-0" />
  <div className="relative"><h1>Title</h1></div>
  <ParallaxLayer depth="near" className="absolute right-8 top-20" />
</ParallaxSection>
```

```ts
import { ParallaxLayer, ParallaxSection } from "@zedtech/zedkit-ui/motion";

<ParallaxSection axis="y" intensity={0.5} off="below-md">
  <ParallaxLayer depth={0.25} zoom={[1, 1.08]} />
</ParallaxSection>
```

```html
<section data-parallax data-parallax-axis="y" data-parallax-range="cover">
  <div data-parallax-layer data-parallax-depth="far" data-parallax-move></div>
  <div>Copy stays still</div>
</section>
```

## Pin a stage and change scene as the page scrolls

- Import: `@zedtech/zedkit-ui` — `ScrollScenes`, `ScrollScene`, `ScrollScenesProps`, `SCROLL_SCENES_MAX`
- Wraps: none (CSS scroll-driven animation)
- Status: alpha
- Short name: ScrollScenes
- Audience: Developers telling a story in a few steps (one product shown in several looks, a feature tour, before/after) on a marketing or docs page.
- Purpose: Pin one stage under the header while the page scrolls; scenes fade in and out in turn. Pure CSS, native scrolling.
- When to use: Two to eight (`SCROLL_SCENES_MAX`) short scenes that read well one at a time and where scrolling is the natural way to move on.
- When not to use: Long content, forms or anything focusable inside a scene — invisible scenes stay in the accessibility tree, so keep scene visuals non-interactive (`aria-hidden` and `inert`); steps the user must pick themselves — use `Tabs` or `WizardSteps`.
- See also: `Switch between tabbed panels`
- Examples: Pinned feature tour, Before and after, Same product in three looks, Pricing walkthrough
- A11y: Captions are real text in a fixed order and are never hidden (opacity only), so put the message in the caption and treat the visual as decoration: mark it `aria-hidden="true"` and `inert` so it adds no tab stop and no duplicate announcement. Under `prefers-reduced-motion: reduce`, in browsers without scroll timelines (Firefox, Safari before 26) and in very short windows, the scenes are plain blocks one under the other with the same content. A decorative progress rail is `aria-hidden`. Give each caption a heading one level under the section title so screen reader users can jump scene by scene.
- Troubleshooting: Nothing is pinned — you need two to eight scenes, the browser needs `animation-timeline: view()` and the window at least 34rem tall; otherwise you get the stacked layout by design. Stage hides under a fixed header — set `--zk-scenes-top` to the header height. Scenes change too fast or slowly — set `--zk-scenes-step` (scroll distance per scene, default 60svh). Content cut at the bottom — the stage is one screen tall; shorten the scene or hide secondary parts on small screens. Pinning stops inside a box — a parent with `overflow: hidden` or `auto` becomes the scroll container; keep the component in the normal page flow. The scenes stack in your own preview — `prefers-reduced-motion: reduce` is on in the OS or the browser; this is the intended fallback.

```ts
import { Heading, ProgressBar, ScrollScenes, Stack, Text } from "@zedtech/zedkit-ui";

const steps = [
  { id: "plan", title: "Plan the week", text: "One list: what has to ship, and who owns it.", value: 0 },
  { id: "track", title: "Track the work", text: "Progress updates as people tick tasks.", value: 55 },
  { id: "ship", title: "Ship with confidence", text: "Everything is green: publish in one click.", value: 100 },
];

// The caption says it all; the visual is decoration, hidden from assistive tech.
<ScrollScenes
  className="[--zk-scenes-top:4.5rem]"
  scenes={steps.map((step, index) => ({
    id: step.id,
    caption: (
      <Stack gap={2}>
        <Text variant="muted">Step {index + 1} of {steps.length}</Text>
        <Heading level={3}>{step.title}</Heading>
        <Text variant="muted">{step.text}</Text>
      </Stack>
    ),
    children: (
      <Stack aria-hidden="true" inert>
        <ProgressBar value={step.value} label="Week 43 progress" />
      </Stack>
    ),
  }))}
/>
```

```ts
import { Heading, ProgressBar, ScrollScenes, Stack, Text } from "@zedtech/zedkit-ui";

// Two scenes, a shorter scroll per scene (default 60svh), header 4.5rem tall.
<ScrollScenes
  className="[--zk-scenes-step:45svh] [--zk-scenes-top:4.5rem]"
  scenes={[
    {
      id: "before",
      caption: <Heading level={3}>Before: one long form</Heading>,
      children: (
        <Stack aria-hidden="true" inert>
          <ProgressBar value={18} label="Completed sign-ups" />
          <Text variant="muted">18% of visitors finished the form.</Text>
        </Stack>
      ),
    },
    {
      id: "after",
      caption: <Heading level={3}>After: three short steps</Heading>,
      children: (
        <Stack aria-hidden="true" inert>
          <ProgressBar value={64} label="Completed sign-ups" />
          <Text variant="muted">64% of visitors finished the steps.</Text>
        </Stack>
      ),
    },
  ]}
/>
```

```ts
import { Heading, ScrollScenes, Stack, Text, ThemeScope } from "@zedtech/zedkit-ui";

const looks = [
  { id: "mist", title: "Mist", text: "The stock look: quiet chrome, Inter." },
  { id: "press", title: "Press", text: "Editorial type for a reading product." },
  { id: "tide", title: "Tide", text: "Warm colour and a bit more space." },
];

<ScrollScenes
  className="[--zk-scenes-top:4.5rem]"
  scenes={looks.map((look) => ({
    id: look.id,
    caption: (
      <Stack gap={2}>
        <Heading level={3}>{look.title}</Heading>
        <Text variant="muted">{look.text}</Text>
      </Stack>
    ),
    children: (
      <ThemeScope identity={look.id} aria-hidden="true" inert>
        <Text className="font-semibold">Harbor Studio</Text>
        <Text variant="muted">Project tracker</Text>
      </ThemeScope>
    ),
  }))}
/>
```

```ts
import { Heading, ScrollScenes, Stack, Text } from "@zedtech/zedkit-ui";

const plans = [
  { id: "solo", title: "Solo", text: "One person, one project.", price: "$0" },
  { id: "crew", title: "Crew", text: "A small team, one workspace.", price: "$29" },
  { id: "studio", title: "Studio", text: "Every workspace, with SSO.", price: "$99" },
];

<ScrollScenes
  className="[--zk-scenes-top:4.5rem]"
  scenes={plans.map((plan) => ({
    id: plan.id,
    caption: (
      <Stack gap={2}>
        <Heading level={3}>{plan.title}</Heading>
        <Text variant="muted">{plan.text}</Text>
      </Stack>
    ),
    children: (
      <Stack aria-hidden="true" inert>
        <Text className="text-3xl font-semibold">{plan.price}</Text>
        <Text variant="muted">per month</Text>
      </Stack>
    ),
  }))}
/>
```

## Switch the visual identity with one attribute

- Import: `@zedtech/zedkit-ui` — `IdentityScript`, `IdentityScriptProps`, `IdentitySwitcher`, `IdentitySwitcherProps`, `IdentityPicker`, `IdentityPickerProps`, `IdentityOption`, `identities`, `applyIdentity`, `discardCustomIdentity`, `applyCustomIdentity`, `useIdentity`, `ThemeScope`, `ThemeScopeProps`, `usePortalContainer`, `CUSTOM_IDENTITY_ID`, `IDENTITY_STORAGE_KEY`, `IDENTITY_CUSTOM_STORAGE_KEY`, `IDENTITY_CHANGE_EVENT`, `NAMED_IDENTITY_PREFIX`, `isNamedIdentityId`, `identityTokenSchema`, `IdentityTokens`, `IdentityId`, `identityPresets`, `isPresetId`, `tokensToCss`, `tokensToCssVars`, `parseIdentityTokens`, `suggestIdentityTokens`, `applyIdentityTokenSheet`, `identityContrastWarnings`, `identityContrastTokenLabel`, `withIdentityDarkPair`, `keepIdentityDarkKeys`, `IdentityContrastWarning`
- Wraps: `zod` (token schema); CSS variables in `identities.css`
- Status: beta
- Short name: Identities
- Audience: Teams that want to change the whole look of an app, or offer a choice, without touching components.
- Purpose: `data-identity` on the root swaps the identity tokens next to light and dark (type size, tracking, shadow, spacing unit, body line-height, border width, colour-transition duration, radius, motion); a head script applies the stored choice before first paint and a labelled switcher or touch picker lets people choose. `applyCustomIdentity` writes compact tokens onto `:root` (id `custom`, CSS in `IDENTITY_CUSTOM_STORAGE_KEY`) or onto a preset/named look id (`n-…` via `isNamedIdentityId`) and the same script reapplies that sheet before paint, keeping the stored id even when it is not in the built-in list. Mist keeps the kit defaults; no two looks share the same type size, tracking, shadow, or spacing unit.
- When to use: To rebrand or offer several looks from one set of components.
- When not to use: For a single fixed brand — edit the base tokens in `styles.css` instead.
- See also: `Theme an admin app (dark/light included)`
- Examples: Header switcher, Same card in each look, Touch picker, Live token sheet
- A11y: `IdentitySwitcher` is a native labelled `select` (visible label with `showLabel`, otherwise screen-reader only); `IdentityPicker` is a 44px trigger opening a sheet with a labelled radio group. Both render nothing when there is no identity to choose. While a custom sheet is active they show `Custom` (`CUSTOM_IDENTITY_ID`); a named look (`n-acme`) that is not in `identities` still appears as a selected option (label is the slug after `n-`) so the control never has a value missing from the list. Pass saved looks in `identities` to show their real labels. Picking a built-in look parks the custom sheet — it stays stored, scoped to its look, until `discardCustomIdentity` drops it. A choice applies at once and the new look keeps the kit's contrast pairs in light and dark; announce the change in your own status line (`role="status"`) if you show one. Keep the trigger name stable (`label`), because the current identity is read from the value.
- Troubleshooting: The look flashes on load — render `<IdentityScript />` inside `<head>` with the same ids and storage key as the switcher, and `suppressHydrationWarning` on `<html>`. A stored id is ignored — it must be in `ids`. A stored custom sheet (`IDENTITY_CUSTOM_STORAGE_KEY`) wins over a built-in id. Built-in ids: `mist`, `press`, `tide`, `volt`, `maison`, `glass`; pass your own list to the script and the switcher to offer other looks. The whole page changed but you wanted one card — wrap it in `<ThemeScope identity="…" className="dark">` (or put `data-identity-scope` and `data-identity` on that node and add `.dark` on the same node). Dark tokens apply only when `.dark` is on the identity node, not on an ancestor. Overlays (dialog, select, menu, popover, tooltip, toast) portal into the nearest ThemeScope so they keep that identity and mode; without a scope they still mount on `document.body`. Two switchers disagree — give them the same `storageKey`; they follow each other through `IDENTITY_CHANGE_EVENT`. Switching looks parks a custom sheet (it is scoped to one look); call `discardCustomIdentity` to drop it for good.

```ts
import { IdentityScript, IdentitySwitcher } from "@zedtech/zedkit-ui";

// Root layout: the script applies the stored look before first paint.
<html lang="en" suppressHydrationWarning>
  <head>
    <IdentityScript storageKey="harbor-identity" defaultIdentity="mist" />
  </head>
  <body>
    <header>
      <span>Harbor Studio</span>
      <IdentitySwitcher storageKey="harbor-identity" showLabel label="Look" />
    </header>
    {children}
  </body>
</html>
```

```ts
import { Badge, Button, Heading, Text, ThemeScope, identities } from "@zedtech/zedkit-ui";

// Preview every look at once: the scope changes this subtree only, never <html>.
{identities.map((look) => (
  <ThemeScope
    key={look.id}
    identity={look.id}
    className="rounded-xl border border-border bg-background p-4 shadow-md"
  >
    <Heading level={3}>{look.label}</Heading>
    <Badge variant="secondary">New</Badge>
    <Text variant="muted">{look.description}</Text>
    <Button size="sm">Save</Button>
  </ThemeScope>
))}
```

```ts
"use client";

import { useState } from "react";
import { IdentityPicker, identities } from "@zedtech/zedkit-ui";

// A short custom list on a phone header; the page behind the sheet is the live preview.
const looks = identities.filter((look) => ["mist", "press", "tide"].includes(look.id));

export function MobileLookPicker() {
  const [last, setLast] = useState<string | null>(null);
  return (
    <>
      <IdentityPicker label="Look" identities={looks} onIdentityChange={setLast} />
      <p role="status">{last ? `Chosen: ${last}` : "Nothing chosen yet."}</p>
    </>
  );
}
```

```ts
import { identityPresets, suggestIdentityTokens, tokensToCss } from "@zedtech/zedkit-ui";

const tokens = suggestIdentityTokens("calm editorial, rounded, warm");
const css = tokensToCss(tokens, '[data-identity-scope][data-identity="draft"]');
void identityPresets.mist;
void css;
```

## Design your identity

- Import: `@zedtech/zedkit-ui` — `applyIdentityTokenSheet`, `applyCustomIdentity`, `identityPresets`, `parseIdentityTokens`, `suggestIdentityTokens`, `IdentityTokens`, `IdentityId`, `isPresetId`, `isNamedIdentityId`, `NAMED_IDENTITY_PREFIX`, `identityContrastWarnings`, `identityContrastTokenLabel`, `withIdentityDarkPair`, `keepIdentityDarkKeys`, `IdentityContrastWarning`
- Wraps: `zod` (token schema); CSS variables from `applyIdentityTokenSheet`
- Status: beta
- Short name: Draft look
- Audience: Teams that want to try spacing, borders, type and colour on a live card before copying tokens.
- Purpose: Design your own look — colour, radius, spacing, type — on a live card, then apply it to the whole site.
- When to use: To try a look on one card, with contrast warnings and an automatic AA dark pair, then apply that draft to the whole page identity.
- When not to use: To switch a published built-in look — use `IdentitySwitcher` or `data-identity` on the root instead.
- See also: `Switch the visual identity with one attribute`
- Examples: Write a draft sheet
- A11y: Every field has a visible label. Reset, Dark, Suggest, Apply, Discard and Apply to the whole site are named buttons (`aria-pressed` on Dark). The draft card is a live preview of the tokens. Colour fields accept HSL channels (`H S% L%`). Each exportable text pair (body, primary, muted) must reach 4.5:1 against its surface; accent and border need 3:1 against the background — warnings show inline with a Fix that nudges lightness. Copy CSS/JSON stays behind an explicit confirm while any pair fails. Suggest never writes tokens until Apply. While a custom identity is active, a status bar offers Reset to default.
- Troubleshooting: The whole docs page changed — Apply to the whole site wrote `:root`; Reset to default clears `IDENTITY_CUSTOM_STORAGE_KEY`; picking a built-in identity only parks the sheet. A field snaps back — the value failed the token schema (HSL, leading, or tracking). A refresh loses the draft — the address bar holds only fields that differ from the chosen look, plus `theme=dark` when the dark preview is on. Suggest shows a keyword match — the HTTP service is off, rate-limited, or the response failed the token schema.

```ts
import { applyIdentityTokenSheet, identityPresets } from "@zedtech/zedkit-ui";

applyIdentityTokenSheet(
  identityPresets.mist,
  '[data-identity-scope][data-identity="draft"]',
);
```



## Compose a public marketing page

- Import: `@zedtech/zedkit-ui/marketing` — `GlassSurface`, `glassSurfaceVariants`, `GlassSurfaceProps`, `BriefSpecimen`, `BriefSpecimenProps`, `selectSpecimenDomain`, `CommerceSpecimen`, `SaasDashboardSpecimen`, `EditorialSpecimen`, `ServiceBookingSpecimen`, `specimenMessagesEn`, `SpecimenDomain`, `Hero`, `HeroProps`, `CtaBand`, `CtaBandProps`, `FeatureGrid`, `FeatureGridProps`, `FeatureItem`, `HowItWorks`, `HowItWorksProps`, `HowItWorksStep`, `MarketingHeader`, `MarketingHeaderProps`, `MarketingFooter`, `MarketingFooterProps`, `MarketingFooterColumn`, `LocaleSwitch`, `LocaleSwitchProps`, `LocaleOption`, `MediaSection`, `MediaSectionProps`, `LogoBand`, `LogoBandProps`, `LogoBandItem`, `Testimonials`, `TestimonialsProps`, `Testimonial`, `Pricing`, `PricingProps`, `PricingPlan`, `Faq`, `FaqProps`, `FaqItem`
- Wraps: none (theme tokens, `class-variance-authority`)
- Status: alpha
- Short name: Marketing
- Audience: Teams building a public landing page or identity preview on the same tokens and identities as their app.
- Purpose: Marketing sections and brief-routed domain specimens (commerce, SaaS dashboard, editorial, booking). Glass stays the default identity; strings are props.
- When to use: For a signed-out home, pricing page, or in-`ThemeScope` preview while refining an identity.
- When not to use: For app screens — use `Card`, `PageHeader` and `Section` instead; for full-page bands use `Section` with `bleed`.
- See also: `Theme an admin app (dark/light included)`, `Render headings and body text without raw tags`
- Examples: Simple, Brief specimen, Hero, Closing call to action, Feature grid, Steps, Header and footer, Language switch, Use case, Logo band, Testimonials, Pricing, Questions
- A11y: `Hero` and `CtaBand` are `section` regions named by their own heading (`Hero` renders the page `h1`; pass `headingLevel={2}` when the page already has one); calls to action are links or buttons you pass in, full width on phones. `FeatureGrid` and `HowItWorks` are regions named by a level-2 title with level-3 item titles; feature icons are decorative (`aria-hidden`), steps are an ordered list whose numbers are added for you. `MarketingHeader` is a `banner` with a named main navigation; below `md` its links and actions open from a native `details` disclosure (a 44px `summary` labelled by `menu`). `MarketingFooter` gives each link column its own labelled navigation. `MediaSection` is a region named by its level-2 title: text first in reading order, the framed media after it (`reverse` only changes the visual side from `lg`); pass `alt` text or a caption with the media. `LogoBand` reads each company name instead of its logo (the logo is `aria-hidden`). `Testimonials` renders each quote as a `figure` with a `figcaption`; quotation marks come from the browser for the page `lang`. Only pass quotes you may publish. `Pricing` lists plans as a list of surfaces: each name is a level-3 heading, features are a list, and the highlighted plan carries a visible `badge` (never colour alone). `Faq` uses native `details`/`summary`: keyboard and screen readers work without script, and browser find-in-page opens matches; add `FAQPage` structured data with `@zedtech/zedkit-seo` if the page should carry it. `LocaleSwitch` is a named navigation whose items carry `lang`, with `aria-current` on the active language. Brief-routed specimens expose labelled lists, tables, and status regions. Surfaces render a plain element (`div`, `section`, `article` or `li`); pass `aria-label` or a heading inside when it is a landmark. Text sits on the card colour, so contrast follows the identity tokens; under `prefers-reduced-transparency` the glass identity turns surfaces near-solid.
- Troubleshooting: Menu, navigation and language labels stay English — wrap the tree in `ZedkitUiProvider` with `zedkitUiMessagesFr` (or your own bundle). Router links reload the page — pass your router's link elements in `links`, they are rendered as given. Surfaces look flat — the identity in use is not `glass`; set `data-identity="glass"` on `<html>`. Classes missing — the `@source` line must scan the kit's `src/**` (the marketing folder is included).

```ts
import { GlassSurface } from "@zedtech/zedkit-ui/marketing";

<GlassSurface as="section" aria-label="Plans" tone="raised" padding="lg">
  Plans
</GlassSurface>;
```

```ts
import { BriefSpecimen, selectSpecimenDomain } from "@zedtech/zedkit-ui/marketing";

selectSpecimenDomain("Hair salon booking"); // booking (D4)

<BriefSpecimen brief="Independent newsroom" />;
```

```ts
import { Hero } from "@zedtech/zedkit-ui/marketing";

<Hero
  title="Keep your shop. Add live updates."
  description="Stock, orders and offers update without a refresh."
  actions={<a href="/signup">Create an account</a>}
/>;
```

```ts
import { CtaBand } from "@zedtech/zedkit-ui/marketing";

<CtaBand
  title="Try it on a staging key"
  actions={<a href="/signup">Create an account</a>}
/>;
```

```ts
import { FeatureGrid } from "@zedtech/zedkit-ui/marketing";

<FeatureGrid
  title="Built for the shop you already run"
  features={[
    { title: "Live stock", description: "Counts follow every sale." },
    { title: "Personal offers", description: "Each visitor sees what fits." },
  ]}
/>;
```

```ts
import { HowItWorks } from "@zedtech/zedkit-ui/marketing";

<HowItWorks
  title="Live in three steps"
  steps={[{ title: "Create an account" }, { title: "Create a key" }, { title: "See your first event" }]}
/>;
```

```ts
import { MarketingFooter, MarketingHeader } from "@zedtech/zedkit-ui/marketing";

<MarketingHeader
  brand={<a href="/">Harbor</a>}
  links={[<a key="docs" href="/docs">Docs</a>]}
  actions={<a href="/signup">Create an account</a>}
/>;
<MarketingFooter brand="Harbor" columns={[{ title: "Product", links: [<a key="docs" href="/docs">Docs</a>] }]} />;
```

```ts
import { MediaSection } from "@zedtech/zedkit-ui/marketing";

<MediaSection
  title="An assistant that knows your catalog"
  points={["Reads your products", "Never changes an order"]}
  media={<img src="/assistant.png" alt="The assistant answering a question about stock" />}
/>;
```

```ts
import { LogoBand } from "@zedtech/zedkit-ui/marketing";

<LogoBand
  title="Works with the shops you know"
  logos={[{ name: "Harbor Studio", logo: <img src="/harbor.svg" alt="" /> }]}
/>;
```

```ts
import { Testimonials } from "@zedtech/zedkit-ui/marketing";

<Testimonials
  title="What shops say"
  items={[{ quote: "We launched a new offer in a day.", name: "Ada Lovelace", role: "Head of e-commerce" }]}
/>;
```

```ts
import { Pricing } from "@zedtech/zedkit-ui/marketing";

<Pricing
  title="Simple pricing"
  plans={[
    { name: "Starter", price: "€0", period: "per month", features: ["1 staging key"], action: <a href="/signup">Start free</a> },
    { name: "Growth", price: "€29", period: "per month", features: ["5 keys"], highlighted: true, badge: "Most popular" },
  ]}
/>;
```

```ts
import { Faq } from "@zedtech/zedkit-ui/marketing";

<Faq
  title="Questions"
  items={[{ question: "Do I need to change my shop?", answer: "No. It runs next to it." }]}
/>;
```

```ts
import { LocaleSwitch } from "@zedtech/zedkit-ui/marketing";

<LocaleSwitch
  current="en"
  locales={[
    { code: "en", label: "English", href: "/en" },
    { code: "fr", label: "Français", href: "/fr" },
  ]}
/>;
```
