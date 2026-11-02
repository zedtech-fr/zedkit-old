# zedkit — Agent Instructions

Public TypeScript monorepo (pnpm workspaces): small generic packages. See
[README.md](README.md) for the package index.

## Non-negotiables

- **Public repo.** No secrets, customer data, internal URLs, or private
  names/endpoints/domain terms from other projects. Check every ported file
  for them before committing. Never name a private project anywhere (code,
  docs, comments, PRs, issues); say "an upstream consumer". Enforced by
  `scripts/check-no-private-refs.sh` in CI. Never name internal review
  lanes, actor spellings, or private workflow labels in titles, PR bodies,
  comments, commits, or files; sign verdicts without lane tags (kit
  `--provider` ids stay). Enforced by `scripts/check-tone.sh`.
- **No raw try/catch.** Use `tryCatch`/`tryCatchAsync` from
  `@zedtech/zedkit-core` (sole exception: core's own implementation). Enforced by
  the `no-restricted-syntax` ban in [eslint.config.mjs](eslint.config.mjs).
- **No deep relative imports.** Inside a package use its `#*` subpath
  import; `../../*` and deeper are banned by `no-restricted-imports`.
- **Thin wrappers over mature packages.** Before writing a util, check
  whether a mature npm package already does it and wrap it thinly instead.
- **No empty packages.** A package exists only when real code backs it now.
- **Never commit build artifacts.** Before every commit and PR: run
  `git status` and `git diff --stat`, never `git add -A` blindly, and
  confirm no binaries, caches, build output, or files over 200KB are
  staged. CI enforces this via `scripts/check-no-artifacts.sh`; if you
  extend `.gitignore`, extend the script to match.
- **Publishing is live.** Changesets version the packages; merging a
  Version PR publishes public packages to npm via the release workflow.
  Never publish from a laptop (`npm publish` by hand).

## Layout

- `packages/*` — one publishable package per usage domain, each with its
  own README, AGENTS.md, tests, and exports map (ESM + types).
- `packages/ai/kit` — the AI kit and the single source of truth for this
  repo's own skills and subagents: `.agents/skills` and `.agents/agents`
  symlink into it, `.claude/` and `.cursor/` symlink to `.agents/`, and
  `CLAUDE.md` links to this file. Edit skills there; the `@zedtech/zedkit-ai`
  tests validate them and prove the links resolve.
- `apps/docs` — docs site: [AGENTS.md](apps/docs/AGENTS.md), looks and CSS:
  [VISUAL-CONTRACT.md](apps/docs/VISUAL-CONTRACT.md).
- `deploy/` — hosting and the identity suggest service
  ([AGENTS.md](deploy/suggest/AGENTS.md)); maintainer switches:
  [deploy/README.md](deploy/README.md).
- `registry/`, `scripts/` — shadcn copy-source payloads; repo checks.

## How to work

- Small PRs from fresh `main`, never stacked. One package per PR.
- Each package PR updates the root README package table, adds a
  Changeset file, records the module's origin in the package README
  ("original work by the same author" — never a project name or path),
  documents every need in `packages/<pkg>/CATALOG.md`, regenerates
  `catalog.json` (`pnpm catalog:build`), and links the catalog from the
  [catalog index](docs/catalog/README.md).
- Advice, not law: the [golden rule](docs/golden-rule.md) (wrap
  third-party libraries thinly) and the
  [use-zedkit skill](.agents/skills/use-zedkit/SKILL.md) ("check zedkit
  first, then npm, and wrap what you adopt").
- Ladder before any code (`ponytail-review`): needed at all? already here?
  standard library? native feature or tool? installed dependency? one line?
  Only then the minimum code.
- Styling: fix at the layer that owns the value (token, primitive, composed
  component, docs shell, identity scope, page). The owner table and traps
  are in [VISUAL-CONTRACT.md](apps/docs/VISUAL-CONTRACT.md): link, never copy.
- Keep the root minimal (README, LICENSE, AGENTS.md, llms.txt, config);
  docs go under `docs/` or inside the package they concern.
- Review with the `review` skill (`code-review` + `ponytail-review` + the
  lenses the diff triggers); merge on green CI and **MERGE-OK**. PR tables
  and 0.x versioning: [CONTRIBUTING.md](CONTRIBUTING.md).
- New modules ship with vitest unit tests; deterministic, no network.
  Repo scripts and `deploy/` use `node:test`.

## Commands

```sh
pnpm install                # install (CI uses --frozen-lockfile)
pnpm dev                    # catalog build + docs site at http://localhost:3100 (alias: pnpm docs)
pnpm typecheck              # turbo: tsc --noEmit everywhere
pnpm lint                   # turbo: eslint everywhere
pnpm build                  # turbo: build everywhere (docs: static export in apps/docs/out)
pnpm test                   # turbo: vitest in every package; not the line below
pnpm test:registry          # node:test: scripts/, deploy/ (incl. suggest), apps/docs/scripts
pnpm changeset:status       # versioning dry-run (no publish)
pnpm catalog:build          # regenerate docs/catalog/catalog.json
pnpm catalog:check          # catalog + docs check (demo registry, previews, /r/ urls)
bash scripts/check-no-artifacts.sh
bash scripts/check-no-private-refs.sh
bash scripts/check-tone.sh
```

CI runs all of these plus the rest of [ci.yml](.github/workflows/ci.yml)
(`pnpm exec eslint .`, API reports, registry smoke, docs e2e). A fresh clone
has no `dist/`: `pnpm --filter <pkg> test|typecheck` and `pnpm catalog:check`
fail until sibling packages are built. Build once
(`pnpm exec turbo run build --filter='!@zedtech/zedkit-docs'`) or let turbo
do it (`pnpm exec turbo run test --filter=<pkg>`). Docs browser tests:
[apps/docs/AGENTS.md](apps/docs/AGENTS.md).
