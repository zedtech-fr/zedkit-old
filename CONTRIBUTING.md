# Contributing to zedkit

Setup: Node ≥ 22, pnpm 9, then `pnpm install`.

```sh
pnpm typecheck && pnpm lint && pnpm build && pnpm test
```

Rules:

- Small PRs from fresh `main`, one package per PR, never stacked.
- Each PR adds a Changeset file (`.changeset/<name>.md`); CI runs
  typecheck, lint, test, build, and the public-safety checks.
- Merge on green CI (squash) after a reviewer posts **MERGE-OK** on the
  latest commit. PRs carry 1–3 meaningful reviews proportionate to risk
  (findings with evidence, or explicit reservations); review tools and
  lenses are aids only. No force-push to `main`.
- **`main` is protected:** required checks and merge rules are documented in
  [docs/ci-branch-protection.md](docs/ci-branch-protection.md).
- TypeScript strict, ESM + types, vitest. Raw `try`/`catch` is banned —
  use `tryCatch` from `@zedtech/zedkit-core`.
- Public repo: no secrets, no customer data, no internal URLs, no
  private names or domain terms from other projects. Third-party
  material needs its licence file plus a row in the package's
  `THIRD_PARTY_NOTICES.md`.
- Adding a helper? Read [docs/contributing.md](docs/contributing.md)
  first: generic only, one domain, tests, catalog entry, thin wrappers.

## Versioning (published)

The catalog `Status` field of a need is the promise: `alpha`/`beta` may
change in a minor, `stable` follows semver strictly. A package below 1.0
breaks in a minor; at 1.0 and above, breaking a `stable` need is a major.
Breaking changes are never silent:

1. Ship them as a `minor` changeset (`major` for a `stable` need) with a
   one-line migration note (`OldThing -> NewThing`).
2. Never remove outright: first mark the export `deprecated` in its
   package catalog status (name the replacement).
3. Consumers pin `~x.y.z` and bump deliberately.

Label such PRs `breaking`: CI fails the PR unless it carries a
minor-or-major changeset with a migration note
(`scripts/check-breaking-changeset.sh`).
