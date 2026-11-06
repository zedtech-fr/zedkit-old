# Product summary

zedkit is a public TypeScript kit: small generic npm packages and a docs
site, not a hosted app with customer tenancy. `source: owner`

## Offer

**zedkit** publishes `@zedtech/zedkit-*` packages (UI, AI setup, server,
SEO, quality, …) and a docs site that renders the catalog, live previews,
and shadcn copy-source. Open source, MIT. (`README.md:11-13`, `README.md:100-115`)

## Who pays and why

| Payer | Gets | Evidence |
| ----- | ---- | -------- |
| Nobody at checkout | There is no customer tenancy and no payments product | `source: owner`; no `/checkout` or Stripe SDK in `apps/docs/app` |
| App teams (integrators) | Install `@zedtech/zedkit-*` from npm or copy UI via the registry | `README.md:53-62`; `packages/ui/README.md:15` |
| Maintainers | Changesets → Version PR → npm from CI | `AGENTS.md:29-31`; `docs/publishing.md:11-15` |

Say **"an upstream consumer"** — never a private project name. `source: owner`

## Key journeys

1. **Install a package** — `pnpm add @zedtech/zedkit-ui` (or sibling) and import from the public entry. (`README.md:56-62`) `source: owner`
2. **Copy a component** — `npx shadcn@latest add` a brick from the registry (`apps/docs/AGENTS.md:35-43`). `source: owner`
3. **AI setup** — `zedkit-ai setup` / `sync` / `validate` against this repo's kit (`README.md:73-79`; `packages/ai/README.md:69`). `source: owner`

## Success signals

- A package installs from its README without reading the implementation.
- `zedkit-ai validate` prints `ok` after setup/sync.
- Catalog check stays green (`pnpm catalog:check`).

## Non-goals

- Version PR, npm publish, docs-e2e in this setup slice. `source: owner`
- Customer tenancy, bookings, refunds, or a paid checkout. `source: owner`

## Open questions

- **Glass vs Tide:** runtime first paint is Glass (`apps/docs/lib/default-identity.ts:7`, `apps/docs/app/layout.tsx:53`). Specimens keep their own identity (`docs/design/reference-decisions.md:9` D3). Tide is opt-in, not the site default. Recorded in `.agents/design.md`.
- **docs/publishing.md first-cut (ui 0.1.0)** vs live `README.md` table (ui 1.9.0): hold folder is README-only now (`.changeset-hold/README.md`).
- Operator-only identity-suggest spend (deploy) is not a customer payment — recorded in `.agents/domain/identity-suggest.md`.
