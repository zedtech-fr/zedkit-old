# Lens registry

One row per review lens. `review` routes over this table: path/type ->
mandatory lenses. Runner `Status` `planned` means the skill/agent does not
exist yet (kit-agents roadmap): the lens reports skipped-planned, never a
blocker, until the runner lands. Skipping a mandatory lens whose runner
exists IS a blocker.

| Lens              | Runner (skill or agent)                                                         | Status | Trigger (changed paths/types)                                               | Mandatory?     | Output                                                                                 |
| ----------------- | ------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------- | -------------- | -------------------------------------------------------------------------------------- |
| code              | skill `code-review` (Standards applies `ponytail-review`)                       | exists | always                                                                      | yes            | findings + verdict                                                                     |
| ponytail          | skill `ponytail-review` (via code lens, surfaced separately)                    | exists | always                                                                      | yes            | ladder table + lean findings                                                           |
| persona           | skill `persona-review` + repo `.agents/personas.md`                             | exists | always                                                                      | yes            | per-persona Pass/Rough/Fail + evidence                                                 |
| quality gate      | agent `verifier`                                                                | exists | always                                                                      | yes            | gate results + DoD checklist                                                           |
| adversarial-tests | agent `test-writer` (method: skill `adversarial-tests`)                         | exists | logic, handlers, endpoints, state machines                                  | when triggered | edge cases + missing tests                                                             |
| security          | agent `security-reviewer`                                                       | exists | auth, secrets, tenancy, user data, external calls, crypto                   | when triggered | threats + fixes, file:line                                                             |
| skeptic           | agent `skeptic` (angle per brief: plan, ui/ux, security, scope, data/ops, copy) | exists | plans, specs, ADRs, estimates, product/UI/scope decisions                   | when triggered | pre-mortem + ranked objections                                                         |
| ui                | agent `ui-designer`                                                             | exists | `packages/ui/**`, `**/*.tsx`, styles, preview/gallery                       | when triggered | kit/composition/hierarchy/state findings + examined screenshots + persona(lazy client) |
| copy              | agent `copywriter`                                                              | exists | user-visible strings, messages, errors, CTAs                                | when triggered | keys + FR/EN proposals                                                                 |
| a11y              | agent `a11y-auditor`                                                            | exists | `**/*.tsx`, components, forms, tables                                       | when triggered | WCAG findings + fixes, file:line                                                       |
| seo               | agent `seo-auditor`                                                             | exists | `packages/seo/**`, pages, metadata, sitemap, redirects                      | when triggered | rule findings + fixes                                                                  |
| dependencies      | agent `dependency-auditor`                                                      | exists | `package.json`, lockfiles, catalogs, `Dockerfile`                           | when triggered | need/size/license/maintenance/duplicates                                               |
| docs              | agent `docs-writer`                                                             | exists | `README.md`, `AGENTS.md`, `CATALOG.md`, `docs/**`, skills, agents, commands | when triggered | drift + fixes, compiling examples                                                      |
| release           | agent `release-manager`                                                         | exists | `.changeset/**`, public API, catalog `Status`, `package.json` metadata      | when triggered | semver + migration-note + package-metadata (keywords/homepage/bugs/README) check       |
| research          | agent `researcher` (method: skill `research`)                                   | exists | new capability with no in-repo precedent                                    | optional       | adopt/wrap/build + sources                                                             |
| frontend-quality  | agents `ui-designer` + `console-architecture`                                   | exists | app routes, views, `**/*.tsx`, styles, preview/gallery                      | when triggered | layer + composition + design critique + one-file-one-job findings, file:line           |
| doc-demos         | agent `docs-writer` (demos: `ui-designer`)                                      | exists | doc apps, `**/demos/**`, preview registries, generated pages                | when triggered | registry + frame + drift findings per §Frontend rules, file:line                       |

At `Stakes: sensitive` or higher the full lens set runs: every lens whose
trigger matches the diff is mandatory, and an "optional" lens is not skipped.
Route each lens agent with `zedkit-ai route <agent> --kind check --stakes <s>`.
A review may raise the stakes and writes `Stakes raised: <old> -> <new>: <reason>`;
it never lowers them. At `critical` a second, independent review runs in a
separate session (`route ... --stakes critical` gives its route; when the model
is `inherit`, name the model that session used) and the PR carries `Second review:`
and `Human validation:` lines before merge. A `check` call that changed
`git status --porcelain` fails the step.

## Frontend rules (the `ui` lens fails the review on any of these)

1. One demo = one file (`demos/<name>.tsx` or colocated with its doc).
   No grab-bag module importing dozens of components.
2. Demos render inside one shared frame (title, description,
   light/dark preview, shown source, props link), consumed by the doc
   through a demo registry (key -> demo), never by direct page imports.
3. Doc pages stay thin: load content + doc layout only. No direct
   imports of dozens of components.
4. Zero raw structural HTML and zero ad-hoc styles in demos and doc
   pages: structure comes from `Stack`/`Section`/`Heading`/`Text` from the
   kit (visually hidden text is `Text as="span"` with `sr-only`), utilities
   are tokens only.
5. A lint rule or test bans bulk imports in doc pages (it fails on the
   grab-bag it replaces, passes after).
6. Motion that explains a transition or preserves context (overlay
   entry/exit, list reorder, focus-following panel), with reduced-motion
   respected (fade or instant, never displacement). Not required on every
   state change; instant is fine for small feedback. Example refusal: a
   modal that appears with no fade and hides what changed.
7. Loading and feedback named, never naked: where a wait exists, there are
   zero naked spinners and zero generic 'loading' — it names what loads,
   skeletons match the real content shape, retry keeps state. A page or
   example with no wait has no loading state.
   Example refusal: a spinner with no label on a slow save.

<!-- if:skill=compose-ui -->

The `ui` lens also fails when the change is visual and there is no
`/compose-ui` persona-chain brief (client business → personas → the client's
customers → their personas → UI choices) with a `because` on each UI decision.
<!-- /if -->
