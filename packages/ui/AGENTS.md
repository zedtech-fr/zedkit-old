# AGENTS.md — @zedtech/zedkit-ui

UI kit. shadcn/ui-based (Radix + Tailwind v4, copied in —
see THIRD_PARTY_NOTICES.md), lucide icons, sonner toasts, TanStack
Table, react-day-picker calendars. Neutral/calm look; no custom
component may replace a mature primitive (ladder rung 5).

Rules:

- New code goes in `src/`, tests in `tests/unit/` (Testing
  Library + jsdom for rendered output, plain vitest otherwise).
- Every public export gets a `## <need>` entry in CATALOG.md
  (format in `docs/catalog/README.md`), then run
  `pnpm catalog:build` from the root.
- `src` ships in the tarball (`files`) on purpose — Tailwind
  scans component sources via the consumer's `@source` line.
  Keep class names literal (no dynamic construction) so the
  scanner finds them.
- `cn()` every `className` prop (conflicts resolve last-wins).
- `.dark`-class theming only; new tokens go in `src/styles.css`
  in both `:root` and `.dark`.
- Spacing (#367): one canonical name per value. Shared values use the
  Tailwind scale (`p-4`, `gap-2`, `size-4`). Semantic `--spacing-*`
  duplicates stay as deprecated aliases (do not delete). Map:
  `scripts/registry/spacing-aliases.json`. New shared sizes that should
  follow identity `--spacing` use `--zk-gap-sm|md|lg`, `--zk-icon-size`,
  `--zk-control-height` (`calc` from `--spacing`; mist matches today's rem).
  `--spacing-control-height*` and `--spacing-control-block*` follow those
  calcs. Leftover rem aliases stay until later #798 migrations.
- React 19 ref-as-prop: `ComponentProps<"el">`, ref is a prop, no
  `forwardRef` (lint in the quality preset). Each exported host sets
  `data-slot` on its root (see `src/button.tsx`).
- Kit chrome strings come from `ZedkitUiProvider` (English default, `zedkitUiMessagesFr`
  for French). A label prop on the host wins. Do not hard-code
  `aria-label` / `title` / `placeholder` literals in `src/`.
- No `any`, no `ts-ignore`; no eslint-disable except with a cited
  upstream reason in the comment (one exists: TanStack's own
  `ColumnDef<TData, any>` for mixed-value columns).
- UI PRs: the PR body carries the four lenses plus a UX pass as a
  lazy, distracted, doubtful end user (can they finish the flow
  half-asleep?), and attaches a gallery screenshot showing the
  change (`pnpm --filter @zedtech/zedkit-ui smoke` writes them to
  test-results/, never committed).
- Overlay (drawer/dialog) is a sibling of the panel. `backdrop-filter`
  on the overlay becomes the backdrop root. Frost the scrim (`bg-overlay/50`
  + `backdrop-blur-sm`) or put blur on the panel and set the overlay
  filter to `none`. `prefers-reduced-transparency`: solid scrim, no filter.
- Calendar month grid is `role="grid"`: hover `.rdp-day`, not `tbody tr`.
- Identity `--spacing` scales width/padding/gap utilities. Check Tide
  before locking chrome widths.
- `overflow-hidden` on a scroll-scenes ancestor breaks the pin; use
  `overflow-clip`. After source changes, rebuild this package before
  judging the docs site.
- Public repo: generic wording only, no private project names
  anywhere (CI denylist enforces it).
