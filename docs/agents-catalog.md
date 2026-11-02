# Agents catalog

When to call which agent, and the chains they form. Agents live in
`packages/ai/kit/agents/`; `setup-ai` installs the ones listed in
`packages/ai/kit/kit.json`. Review lenses route over
`packages/ai/kit/skills/review/lenses.md`.

| Agent | Call it when | Writes? |
|---|---|---|
| `architect` | before a feature, module, integration or cross-cutting change; produces the plan | no |
| `explorer` | you need files, symbols, usages, producers/consumers — paths and lines only | no |
| `researcher` | before building, to scout prior art and mature packages (adopt/wrap/build) | no |
| `skeptic` | after a plan or decision, before building; one angle per brief (plan, ui/ux, security, scope, data/ops, copy) | no |
| `test-writer` | with or after implementation, to add adversarial tests (skill: `adversarial-tests`) | tests only |
| `improver` | after a review returned findings; applies the smallest diff in risk order | yes |
| `verifier` | before calling work done or merging; runs gates + definition of done + two review passes | no |
| `security-reviewer` | the change touches auth, tenancy, secrets, user data, logging, input parsing or external calls | no |
| `ui-designer` | the change touches components, pages, styles or previews; critiques composition, not only kit reuse | no |
| `copywriter` | user-visible strings changed (microcopy, errors, empty states, CTAs); i18n-first | no |
| `a11y-auditor` | components, forms, tables or pages changed; WCAG basics | no |
| `seo-auditor` | pages, metadata, sitemap, redirects or the seo package changed | no |
| `dependency-auditor` | `package.json`, lockfiles or catalogs changed; new or updated deps | no |
| `docs-writer` | README, AGENTS.md, catalog entries or docs changed; drift and compiling examples | yes |
| `release-manager` | public API, changesets or catalog Status changed; semver + migration notes | no |
| `console-architecture` | frontend changes; checks route/view/data layer boundaries | no |
| `orchestrator` | a task spans several steps or lenses and needs one coordinator (plan, review, implement, audit, research, or a mix) | no |
| `product-director` | you need a delivery brief for the director over a scope (branch, PRs, milestone) | no |

All rows are shipped. The table stays in sync with `kit.json` (agent list)
and the lens registry (triggers). Read-only agents carry
`disallowedTools: Write, Edit, NotebookEdit` and never apply fixes.

## Typical chains

- New feature: `researcher` -> `architect` -> `skeptic` -> `implement` ->
  `verifier` + `security-reviewer` (+ `ui-designer` when UI changed) ->
  `improver` -> `verifier` again.
- UI change: `implement` -> `ui-designer` -> `a11y-auditor` + `copywriter` ->
  `improver` -> `verifier`.
- New dependency: `researcher` -> `dependency-auditor` -> `implement` ->
  `verifier`.
- Docs change: `docs-writer` -> `verifier` (drift check).
- Release: `release-manager` (changeset, semver, migration notes, maturity)
  before the version PR.
- Status: `product-director` over the merged scope, any time.
- Multi-step task: `orchestrator` (frames, dispatches playbooks and specialists,
  aggregates, verifies) — or `/orchestrate` with the task text.
