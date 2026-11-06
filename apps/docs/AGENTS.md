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

The rules are Frontend rules 1-5 in `packages/ai/kit/skills/review/lenses.md`
(one demo per file, shared frame and registry, thin pages, kit layout
modules and tokens only, no bulk imports); they are not restated here.
`apps/docs/scripts/check.mjs` enforces them (`pnpm catalog:check`): pages
import demos only through `components/demos/registry`, no namespace imports,
no raw `<div>`/`<span>` in demos or the frame. Demos live in
`components/demos/<name>.tsx` or beside their doc. Feature-folder examples
live under `features/<name>/`: they are not kit demos and skip the shared
frame and the demo registry.

## Registry (`/r/*.json`)

Copy-paste install payloads for the official shadcn CLI (#187). `pnpm
registry:build` (root) rewrites `packages/ui` imports into committed
`registry/ui/`, runs `shadcn build`, and writes gitignored JSON under
`public/r/`. Docs `prebuild` runs that step; `registry:check` asserts
sources on disk, rewritten imports, and `shadcn registry validate`. CI job
`registry-smoke` runs the two Next smokes in parallel (`pnpm registry:smoke` locally: fresh Next + `shadcn add`).
GitHub shorthand: `npx shadcn@latest add zedtech-fr/zedkit/<brick>`.
Home install copy comes from `registry.json` via `content/registry-site.ts`
(`docs:generate`). `check-registry-urls.mjs` and `check-seo-export.mjs`
reject dead `/r/<name>.json` links.

## Work on it

- **Local loop** (every edit): reuse :3100 if it is up
  (`pnpm --filter @zedtech/zedkit-docs dev`, or root `pnpm dev`). Then
  `pnpm --filter @zedtech/zedkit-docs typecheck &&
  pnpm --filter @zedtech/zedkit-docs lint` and the Playwright
  spec that covers the files you touched, against that :3100 (relative
  paths; origin is `baseURL` in `playwright.config.ts`). One foreground
  command.
- **PR / CI:** browser proof is `smoke` only (home, search, catalog, a
  component page, getting-started). Unit tests, `catalog:check`, the SEO
  export check and the first-load budget cover the rest. `pnpm e2e` is
  local-only, never a merge gate. A new spec must be listed in the
  `smoke` or `e2e` script; specs must not embed `127.0.0.1` or
  `localhost:` (`scripts/check-e2e-registered.sh`). Screenshots land in
  `test-results/`.
- **Reproducing a failed `docs-smoke` job:** CI already built `out/`
  (`docs-build`). Locally, only when :3100 is free — or set
  `DOCS_E2E_BASE_URL` to the port `serve` actually bound:

  ```sh
  pnpm exec turbo run build --filter=@zedtech/zedkit-docs   # writes apps/docs/out
  pnpm dlx serve@14.2.6 apps/docs/out -l 3100 &
  pnpm exec playwright install chromium
  pnpm --filter @zedtech/zedkit-docs run smoke
  ```
- Done = Local loop green + manifest/check in sync for catalog edits +
  examined screenshots for visual changes + a rendered-page critique
  (strongest remaining weaknesses) + demo rules respected. A
  self-assigned score is not done. Playwright `toHaveScreenshot`
  baselines in git are the linux files (`*-chromium-linux.png`). Darwin
  captures stay local (gitignored). Reproduce a screenshot failure with
  the Playwright image of the lockfile version
  (`docker run --ipc=host -v $PWD:/work -w /work/apps/docs mcr.microsoft.com/playwright:v<version>-noble`
  serving `out/`). Open expected, actual and diff, classify each (defect,
  unstable test, intended change) and only then regenerate, there; a
  baseline nobody has opened and judged is not a reference
  ([VISUAL-CONTRACT.md](./VISUAL-CONTRACT.md), "Verifying the render").

## Install and copy instructions

Never hand-write an install or copy snippet in a page, prose file or
component. They come from the typed adoption contract: the catalog `adoption`
field (`docs/catalog/README.md`) feeding `apps/docs/lib/adoption-plan.mjs`,
which the home and every component page render, and
`scripts/adoption-smoke.mjs` replays the result in a clean Next.js project
(plus the `pnpm add` lines on getting-started that those cases do not cover).
A stylesheet or config need says so in its catalog entry, not in prose.
Guide snippets (`prose/guides/snippets/`) are run by the `verify-*-tutorial.mjs`
scripts inside `pnpm catalog:check`.

## Identity editor and creator

- Identity data is constrained tokens, never code: no executable code, free
  CSS or HTML. One schema (`parseIdentityTokens`,
  `packages/ui/src/identity-tokens.ts`) validates in the browser and in the
  suggest service ([deploy/AGENTS.md](../../deploy/AGENTS.md)).
  The page's client is `lib/identity-assistant.ts`: it parses whatever the
  service returns and turns every failure into a named outcome (`unavailable`
  with its reason, shown by `UnavailableBanner`). There is no silent keyword
  fallback: a failed generation says so and leaves the draft untouched.
- Saved looks are local recipes (`lib/named-identities.ts`): re-validated on
  every read, no server copy. Changing the stored shape needs a version and a
  migration.
- Applying a look to the whole site is the visitor's explicit choice and
  reversible (`lib/site-identity-storage.ts`: opt-in key, `clearDocsSiteIdentity`).
  Quotas, references and cost controls are server rules; the client never
  works around them.
- Secondary states (idle, loading, success, error, quota, resume) stay on
  screen at 320, 390 and 1440. Quota copy names a real retry time, never a
  daily allowance. An unfinished brief is kept in `zk-identity-dock-v2`
  (`lib/identity-dock-persist.ts`) so a reload restores it. The floating dock
  opens with Control or Meta+I, closes with Escape, and on a phone is a bottom
  sheet. Using a look
  from the dock paints demo specimens only, never the site chrome. Brief-routed
  specimens are commerce, saas-dashboard, editorial and service-booking.
  Proof: `tests/identity-state-matrix.spec.ts`. Export CSS applied to a blank
  page matches the editor specimen and the dock proposal:
  `tests/identity-export-preview-parity.spec.ts`.

## ZedKit art direction (Product Atelier)

Read [VISUAL-CONTRACT.md](./VISUAL-CONTRACT.md) before changing home,
chrome, previews or specimens (traps included). Type, motion,
composition and elevation: [docs/design/signature.md](../../docs/design/signature.md)
(named type roles and motions, not raw `font-size` or duration). Identity
states: the matrix above. Skill `use-signature`.

Scope: this docs site and its specimens. Exception: a specimen that
must match a kit primitive's own look.

- Stable, readable site frame around well-composed working specimens.
- Site styling stays distinct from specimen identities. Each styling
  decision has one owner layer (contract table); fix at the shared layer.
- One surface role per job.
- Color from tokens; no decorative gradients (the Glass material is the one exception, see signature.md).
- One focal specimen per section, not a uniform rounded-card grid.
- Mobile composes by priority, not by stacking.

## Boundaries

- Always: demo rules above, manifest keys matching catalog needs.
- Ask first: new docs deps, new preview harness, deployment changes.
- Never: component logic here; unexported types promised in props
  tables; weakening the docs check to fit.

## Related

- Root [AGENTS.md](../../AGENTS.md), kit [CATALOG.md](../../packages/ui/CATALOG.md).
- Visual contract: [VISUAL-CONTRACT.md](./VISUAL-CONTRACT.md).
- Signature: [docs/design/signature.md](../../docs/design/signature.md).
- Domain: [identity-suggest.md](../../.agents/domain/identity-suggest.md),
  [public-hygiene.md](../../.agents/domain/public-hygiene.md).
- Design / identity: [design.md](../../.agents/design.md).
- Lens registry: `packages/ai/kit/skills/review/lenses.md`
  (Frontend rules: the authoritative demo rules).
- Page layouts: [PAGE-TEMPLATE.md](./PAGE-TEMPLATE.md),
  [COMPONENT-PAGE.md](./COMPONENT-PAGE.md).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
