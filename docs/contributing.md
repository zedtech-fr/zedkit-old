# Contributing a helper

Short rule for adding a helper to zedkit:

1. **Generic only.** No secrets, no private names, no consumer domain
   terms. If it only serves one consumer, it does not belong here.
2. **One domain.** The helper goes in exactly one package — the package
   whose domain matches the need. New domain, new package (with its own
   README, AGENTS.md, and CATALOG.md).
3. **Tests.** Vitest unit tests through the public interface, deterministic,
   no network.
4. **Catalog entry.** Document the need in the package `CATALOG.md`
   (format: [catalog index](catalog/README.md)), starting at Status
   `alpha`, regenerate `catalog.json` (`pnpm catalog:build`), and link
   the catalog from the [catalog index](catalog/README.md).
5. **Wrap, don't embed.** Follow the [golden rule](golden-rule.md): a
   mature npm package underneath gets a thin wrapper, never a direct
   import scattered through consumers.

Only truly reusable libraries become versioned packages. Templates are
meant to become project-owned code, and tiny dependency-free modules may
be source-copied by consumers instead of installed — MIT allows it, and
each package README says when copying is the saner option. No product is
ever required to use zedkit.

Small PRs from fresh `main`, one package per PR, each with a Changeset
file. `code-review` + `ponytail-review` before merge; merge on green CI.

## Public API reports

`packages/*/etc/*.api.md` are the committed export surfaces (quality
also ships `zedkit-quality-eslint.api.md` for the `./eslint` subpath). CI
runs `bash scripts/check-api-report.sh` after build and fails when a
report drifts. `server` dumps the `tsc` `.d.ts` graph (Extractor 7.60
cannot follow `Buffer` with its bundled TypeScript 6); other packages
use API Extractor.

After adding, removing or renaming a public export:

1. `pnpm exec turbo run build` (skip for `quality`, it ships source).
2. `bash scripts/check-api-report.sh --write`
3. Add a Changeset for that package. A removed or renamed export is
   a `minor` bump below 1.0 or for an `alpha`/`beta` need, a `major` for a
   `stable` one (see Versioning in CONTRIBUTING.md). Additions can be
   `patch`.
