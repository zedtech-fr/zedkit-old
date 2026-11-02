# Catalog — find by need

"I want X, what do you have to do it?" Each package keeps a `CATALOG.md`
next to its code, organized by need in plain words. This page indexes them;
[`catalog.json`](catalog.json) is the machine-readable aggregate, generated
from the package catalogs — never edit it by hand.

New here? Read the [golden rule](../golden-rule.md) first: it is one
paragraph of advice that explains why every catalog entry wraps something.

## Packages

Each package PR adds its row here, following
[contributing a helper](../contributing.md).

| Package | Domain | Catalog |
|---|---|---|
| `@zedtech/zedkit-core` | results, error handling, IDs | [packages/core/CATALOG.md](../../packages/core/CATALOG.md) |
| `@zedtech/zedkit-server` | rate limiting, redaction, backoff, webhook signatures | [packages/server/CATALOG.md](../../packages/server/CATALOG.md) |
| `@zedtech/zedkit-nest` | NestJS bootstrap factory | [packages/nest/CATALOG.md](../../packages/nest/CATALOG.md) |
| `@zedtech/zedkit-ai` | AI agent setup: instructions, skills, subagents | [packages/ai/CATALOG.md](../../packages/ai/CATALOG.md) |
| `@zedtech/zedkit-ui` | UI kit: tokens, theme, components | [packages/ui/CATALOG.md](../../packages/ui/CATALOG.md) |
| `@zedtech/zedkit-seo` | robots, sitemaps, JSON-LD, metadata, llms.txt, slugs | [packages/seo/CATALOG.md](../../packages/seo/CATALOG.md) |
| `@zedtech/zedkit-payload-seo` | Payload SEO group field | [packages/payload-seo/CATALOG.md](../../packages/payload-seo/CATALOG.md) |
| `@zedtech/zedkit-quality` | UI lint preset, layer boundaries, strict tsconfig | [packages/quality/CATALOG.md](../../packages/quality/CATALOG.md) |

## Entry format

Every `## <need>` section in a package `CATALOG.md` carries the same
fields plus a short example. This is the contract the generator parses —
keep it exact (one line per field, before the example):

```md
## Do X without Y

- Import: `@zedtech/zedkit-core` — `a`, `b`
- Wraps: `some-npm-package`
- Status: beta
- Short name: ShortName
- Audience: Who the need is for, in plain words.
- Purpose: The problem it solves, in one sentence.
- When to use: When to reach for it.
- When not to use: When to avoid it (+ the alternative).
- See also: `Other need`, `Another need`

\`\`\`ts
import { a } from "@zedtech/zedkit-core";
// ...5-line example...
\`\`\`
```

- **Import** names the package (and subpath, if any) plus the symbols the
  need uses. Every public export of the package must appear here — CI
  checks it (`pnpm catalog:check`).
- UI component exports also need a four-state entry in
  [`packages/ui/four-states.json`](../../packages/ui/four-states.json)
  (`none`, or loading/empty/error/success plus fixture, vitest and axe
  paths). Loading/empty/error fixtures must use `Spinner` / `EmptyState` /
  `ErrorState`. A missing entry fails with a pointer to
  `packages/ui/tests/unit/four-states.fixture.tsx`.
- **Wraps** names the mature npm package underneath, or `(none)` when the
  module is dependency-free by design.
- **Status** is one of `planned | alpha | beta | stable | deprecated`
  (CI validates the value; see Maturity below). A deprecated entry also
  carries `- Replaced by: ...` naming the replacement.
- **Short name** is the compact display name (doc sidebar, cards).
- **Audience**, **Purpose**, **When to use**, **When not to use** feed the
  "what is this for" block on the doc page; all four are required and CI
  fails when one is missing.
- **See also** is optional; each backticked target must name a real
  catalog need heading (any package) — CI fails on unknown targets.
- The example is TypeScript, about five lines, copy-paste runnable.

## Maturity

Every need carries a maturity label in [`catalog.json`](catalog.json) as
`status` (for docs, agents, and the README package table). New entries
start at `alpha`; promotion is a deliberate small PR that re-checks the
criteria below. **Stable entries have no badge** on the docs site; the
semver guarantee applies to them only (see **Maturity and compatibility**
on the published docs).

- `planned` — documented shape, not implemented yet. No code, no tests.
- `alpha` — works, but the API can change in any release. Not covered by
  the semver guarantee. Proof can still be thin (missing tests, docs, or
  review).
- `beta` — tested through the public API, documented with an example, and
  reviewed. UI entries are also accessible (a11y checks and gallery where
  applicable). The API may still change in a minor, with a migration note;
  not covered by the semver guarantee. Adoption in a real app is a plus, not
  a requirement.
- `stable` — tested through the public API, accessible for UI, documented,
  and API-frozen under semver (breaking changes are a major). Consumer usage
  is a plus, not a requirement. Shown on the docs site **without a badge**.
- `deprecated` — do not adopt; the entry names its replacement and will
  be removed in a future major.

An entry stays `beta` when it has no tests, when its API broke in its
package's last minor, or when it is still settling after a recent break
(for example `ui` Form / `useValidatedForm` after 0.9.0).

Regenerate after any catalog edit: `pnpm catalog:build`, then commit the
result. CI fails when `catalog.json` drifts from the package catalogs.

## Package header

Above the first `## <need>`, every package `CATALOG.md` carries a header
that is the single source for its npm discoverability fields —
`description`, `keywords`, `homepage`, `bugs`, `repository.directory`:

```md
# Catalog — @zedtech/zedkit-core

- Keywords: typescript, utilities, result-type, ...
- Audience: Who the package is for, in plain words.
- Purpose: What it does, in plain words (becomes the npm description).
- Attribution: Original work by the same author. (optional, appended to
  the description; keep the origin note here, never a project path)
```

`pnpm catalog:build` writes those fields into `package.json` (8–12
English keywords per package); `pnpm catalog:check` fails a public
package whose manifest is missing them or drifts from the header. Edit
the header, never the manifest fields directly. `catalog.json` also
carries `keywords` and `audience` per package for the docs site and
agents.
