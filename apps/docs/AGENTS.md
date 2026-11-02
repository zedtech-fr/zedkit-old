# AGENTS.md — apps/docs

Public documentation site (Next.js). Renders the catalog: generated
pages per need, live kit previews, props tables, maturity badges.
Neutral, professional tone throughout (a CI check bans
self-promotional marketing terms — see scripts/check-tone.sh).

## Purpose and role

Reading surface of the kit: a developer reads a need, sees the live
component, copies the example. Reads `docs/catalog/` + the workspace
packages; owns no component logic. Out of scope: kit components
themselves (live in `packages/ui`), catalog content (lives in each
package `CATALOG.md`).

## Mental model

Manifest-driven: `docs-manifest.json` maps catalog needs to demos;
the generator embeds demos by key; the docs check fails on drift
(missing demo, renamed need). Demos render the REAL workspace
components (same import a consumer writes), inside one shared frame.

## Demo rules (blocking — the `ui` lens fails the review otherwise)

1. One demo = one file in `components/demos/<name>.tsx` (or
   colocated with its doc). Never a grab-bag module. Feature-folder
   examples live under `features/<name>/`, not under `components/demos`;
   they are not kit demos and skip the shared frame and demo registry.
2. Every demo renders inside the shared frame (title, description,
   light/dark preview, shown source, props link) and registers in
   the demo registry (key -> demo). Doc pages import the registry,
   never dozens of components directly.
3. Doc pages stay thin: load content + doc layout only.
4. Zero raw structural HTML, zero ad-hoc styles (`div flex gap…`):
   `Stack`/`Section`/`Heading`/`Text` from the kit, tokens only.
   The same bar as `packages/ui` applies here.
5. The bulk-import ban (lint rule or test) must fail on the grab-bag
   it replaces and pass after — keep that proof green.

## Registry (`/r/*.json`)

Copy-paste install payloads for the official shadcn CLI (#187). `pnpm
registry:build` (root) rewrites `packages/ui` imports into committed
`registry/ui/`, runs `shadcn build`, and writes gitignored JSON under
`public/r/`. Docs `prebuild` runs that step; `registry:check` asserts
sources on disk, rewritten imports, and `shadcn registry validate`. CI job
`registry-smoke` runs `pnpm registry:smoke` (fresh Next + `shadcn add`).
GitHub shorthand: `npx shadcn@latest add zedtech-fr/zedkit/<brick>`.
Home install copy comes from `registry.json` via `content/registry-site.ts`
(`docs:generate`). `check-registry-urls.mjs` and `check-seo-export.mjs`
reject dead `/r/<name>.json` links.

## Work on it

- `pnpm --filter @zedtech/zedkit-docs dev` (or root `pnpm dev`, :3100).
- Gates: `typecheck`, `lint`, `build` on the filter; docs check runs
  in CI (`docs: ok (N pages cover N needs)`).
- Done = gates green + manifest/check in sync + examined screenshots
  for visual changes + a rendered-page critique (strongest remaining
  weaknesses) + demo rules respected. Lint/types/axe/screenshot diffs
  are necessary, not sufficient. A self-assigned score is not done.
  Playwright `toHaveScreenshot` baselines in git are the linux files
  (`*-chromium-linux.png`). Darwin captures stay local (gitignored).
  Reproduce CI exactly with the Playwright image of the lockfile version
  (`docker run --ipc=host -v $PWD:/work -w /work/apps/docs mcr.microsoft.com/playwright:v<version>-noble`
  serving `out/`), read every failing diff, classify it (defect, unstable
  test, intended change) and only then regenerate, there.

## ZedKit art direction (Product Atelier)

Read [VISUAL-CONTRACT.md](./VISUAL-CONTRACT.md) before changing home,
chrome, previews or specimens (traps included).

Scope: this docs site and its specimens. Exception: a specimen that
must match a kit primitive's own look.

- Stable, readable site frame around well-composed working specimens.
- Site styling stays distinct from specimen identities. Each styling
  decision has one owner layer (contract table); fix at the shared layer.
- One surface role per job.
- Color from tokens; no decorative gradients.
- One focal specimen per section, not a uniform rounded-card grid.
- Mobile composes by priority, not by stacking.

## Boundaries

- Always: demo rules above, manifest keys matching catalog needs.
- Ask first: new docs deps, new preview harness, deployment changes.
- Never: component logic here; unexported types promised in props
  tables; weakening the docs check or the bulk-import ban to fit.

## Related

- Root [AGENTS.md](../../AGENTS.md), kit [CATALOG.md](../../packages/ui/CATALOG.md).
- Visual contract: [VISUAL-CONTRACT.md](./VISUAL-CONTRACT.md).
- Lens registry: `packages/ai/kit/skills/review/lenses.md`
  (Frontend rules section — same text, reviewer side).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
