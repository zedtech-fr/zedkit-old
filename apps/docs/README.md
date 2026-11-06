# @zedtech/zedkit-docs

Public documentation site for the kit ([zedkit.app](https://zedkit.app)).
Next.js + Fumadocs; catalog pages are generated from
`docs/catalog/catalog.json`, with live `@zedtech/zedkit-ui` previews,
props tables, and CI coverage checks. First paint uses Glass
(`DEFAULT_IDENTITY` in `lib/default-identity.ts`); Tide is an opt-in look.

## Local dev

From the repo root:

```sh
pnpm dev          # catalog build + docs on http://localhost:3100
```

From this package:

```sh
pnpm --filter @zedtech/zedkit-docs dev
pnpm docs:generate   # regenerate content/docs from catalog + prose
pnpm docs:check      # coverage, prose rules, gallery, guides
```

`apps/docs/content/` is generated on install and build — edit sources under
`prose/`, `docs-manifest.json`, and the scripts in `scripts/`, not the output.

## Page types

| Kind | Doc |
| --- | --- |
| Catalog need (default) | [PAGE-TEMPLATE.md](./PAGE-TEMPLATE.md) |
| UI registry brick (`registry` in manifest) | [COMPONENT-PAGE.md](./COMPONENT-PAGE.md) |
| Standalone guides (`prose/guides/`) | PAGE-TEMPLATE.md § Guide pages |

Agent workflow: [AGENTS.md](./AGENTS.md).

Framework choice record (historical): [docs/spike-docs-framework.md](../../docs/spike-docs-framework.md).
