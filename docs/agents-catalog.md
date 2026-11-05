# Agents catalog

When to call which agent, and the chains they form. Agents live in
`packages/ai/kit/agents/`; `setup-ai` installs the ones listed in
`packages/ai/kit/kit.json`. Review lenses route over
`packages/ai/kit/skills/review/lenses.md`.

| Agent | Call it when | Writes? | default_needs (reasoning, context) | kinds (allowed) | default_kind (hint) |
|---|---|---|---|---|---|
| `architect` | before a feature, module, integration or cross-cutting change; produces the plan | no | high, large | all | design |
| `explorer` | you need files, symbols, usages, producers/consumers — paths and lines only | no | low, small | check | check |
| `researcher` | before building, to scout prior art and mature packages (adopt/wrap/build) | no | medium, large | check, design, decide | design |
| `skeptic` | after a plan or decision, before building; one angle per brief (plan, ui/ux, security, scope, data/ops, copy) | no | high, medium | check, decide | check |
| `test-writer` | with or after implementation, to add adversarial tests (skill: `adversarial-tests`) | tests only | medium, medium | all | build |
| `improver` | after a review returned findings; applies the smallest diff in risk order | yes | medium, medium | all | build |
| `verifier` | before calling work done or merging; runs gates + definition of done + two review passes | no | high, medium | check, decide | check |
| `security-reviewer` | the change touches auth, tenancy, secrets, user data, logging, input parsing or external calls | no | high, medium | check, design, decide | check |
| `ui-designer` | the change touches components, pages, styles or previews; critiques composition, not only kit reuse | no | medium, medium | all | design |
| `copywriter` | user-visible strings changed (microcopy, errors, empty states, CTAs); i18n-first | no | medium, small | all | check |
| `a11y-auditor` | components, forms, tables or pages changed; WCAG basics | no | medium, medium | all | check |
| `seo-auditor` | pages, metadata, sitemap, redirects or the seo package changed | no | medium, medium | all | check |
| `dependency-auditor` | `package.json`, lockfiles or catalogs changed; new or updated deps | no | medium, medium | all | check |
| `docs-writer` | README, AGENTS.md, catalog entries or docs changed; drift and compiling examples | yes | medium, medium | all | build |
| `release-manager` | public API, changesets or catalog Status changed; semver + migration notes | no | medium, medium | all | check |
| `console-architecture` | frontend changes; checks route/view/data layer boundaries | no | medium, medium | all | check |
| `orchestrator` | a task spans several steps or lenses and needs one coordinator (plan, review, implement, audit, research, or a mix) | no | high, large | decide, design, check | decide |
| `product-director` | you need a delivery brief for the director over a scope (branch, PRs, milestone) | no | medium, large | all | decide |

All rows are shipped. The table stays in sync with `kit.json` (agent list)
and the lens registry (triggers). Read-only agents carry
`disallowedTools: Write, Edit, NotebookEdit` and never apply fixes.

## One agent, four kinds

`kind` is how an agent is used for one call, never a property of the agent:
`decide` (coordinating a run), `design` (planning), `build` (execution) or
`check` (review, read-only). The same agent serves all four, so there are no
per-kind copies. The caller passes the kind on every spawn;
`default_kind` is only the hint used when a caller omits it, and `kinds` is an allowlist that
forbids a use (a lookup agent is `check` only; an agent without `build` also
denies the write tools in its own file).

The three columns come from `agents.meta.json` (the kit ships one; a project
adds its own next to `.agents/tokenomics.md`, and an entry there wins over the
shipped one). They are not in the agent files: some tools skip an agent whose
frontmatter has a key they do not know.

`default_needs` are defaults, not fixed values. A call can override either
field (a `Needs:` line on the task or step); precedence
per field is call, then the agent's default, then the global default in
`.agents/tokenomics.md`. Stakes remain the main lever. Two calls to
`ui-designer`:

- Fix a footer link: `Stakes: trivial`, `Kind: build`, `Needs: reasoning=low,
  context=small`. It reads the `build.trivial` cell at the lowest effort with a
  small context window.
- Fix the loading state of the pay button: triage sets `Stakes: critical`
  (money), `Kind: build`, `Needs: reasoning=high, context=large`. It reads the
  `build.critical` cell at maximum effort with a large context window, and the
  gates ask for a second independent review and a human validation.

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
