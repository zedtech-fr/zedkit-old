# @zedtech/zedkit-ai

## 0.14.0

### Minor Changes

- 356d2ab: Provider parity: setup-ai offers cursor, claude, codex and muse with a one-line value each; drift checks cover the claude layer (deleted entries, dangling links) and dangling cursor skill links with non-destructive re-run hints; every preset × provider cell is install-tested in CI. Init into pre-existing real `.claude/` dirs links kit skills in and copies agents/commands (adopt sidecars on collision) instead of dead `zk-*` links.

## 0.13.0

### Minor Changes

- 1778b77: `init --adopt` keeps colliding user files and writes the kit version beside them; a second run skips copies that already match the kit. Validate ignores `*.kit.md` sidecars, reports drift without asking to overwrite, ignores host `/ask` and `/improve`, filters `lenses.md` so uninstalled runners are `planned`, and links kit skills into a real `.cursor/skills` directory.
- 6407f33: Setup-ai v2: discovery interview, deep artifact templates, and catalog repo skills for the setup preset.
- 7529a41: Add a `setup` preset: starter plus domain modeling, the review lenses, retro, rules-upkeep, and the product/UI/copy subagents. Every shipped preset still validates closed.

### Patch Changes

- 07e2e10: Add `zedkit-ai setup` (init with adopt) and README first-5-minutes path; Cursor docs at /docs/ai/setup with copy-paste prompt and https://zedkit.app/ai/setup.md agent instructions.

## 0.12.0

### Minor Changes

- e8dbb21: Add the `evidence-grounded-analysis` skill (full preset): analyse customer or audit material with every claim tagged [VERBATIM], [INFERENCE] or [ABSENT], a source inventory first, solidity ratings and one 24h action.

## 0.11.1

### Patch Changes

- 2fde8ae: `security-reviewer` treats generated output as untrusted input (validate it at both ends, never render it as code) and checks that paid calls are capped and reserved before the work. `docs-writer` forbids hand-written install snippets that can drift. `release-manager` applies semver per version line (a stable surface at 1.0 and above breaks in a major). `ui-designer` points at the project's visual contract for ownership and traps instead of restating them, and defers to its motion durations.
- @zedtech/zedkit-core@1.0.0

## 0.11.0

### Minor Changes

- f283163: Catalog maturity Option B: 60 stable, 39 beta, and 8 alpha needs; docs badges only for alpha (sidebar), beta (page + catalog), and none for stable or on the home gallery.

  **1.0.0** on ui, core, server, nest, seo, quality, and payload-seo marks stable catalog entries under real semver. This release does not change runtime behavior by itself — it is a honesty and labeling step. The semver guarantee applies to **stable** needs only (no badge on the docs site). Alpha and beta entries in the same package can still change in minors with migration notes and are not covered by that guarantee.

  **Consumers:** move dependencies from `~0.x` to `^1.0.0` on the packages you use. Follow each package `CHANGELOG.md` for any migrations you have not applied yet (for example ui 0.8–0.9). Packages that stay on 0.x (ai, observability, flags, devtools, i18n, storage) receive minor bumps for catalog status only.

### Patch Changes

- Updated dependencies [f283163]
  - @zedtech/zedkit-core@1.0.0

## 0.10.0

### Minor Changes

- e1ce9e5: Fail install and validate when an installed skill, agent, or command references a skill absent from the selected preset. Fix vendored skills that pointed at unshipped grilling, prototype, or setup-matt-pocock-skills calls.
- e1ce9e5: Add a `starter` preset (five skills, three subagents, two commands) and make it the default for `init`. Use `--preset core` or `--preset full` to opt into the previous layouts.

### Patch Changes

- 28b0dba: Narrow exported `Provider` to claude/cursor/codex; shared-source runtime ids stay runtime strings on install options.

## 0.9.1

### Patch Changes

- fa7ce48: Declare `engines.node` (`>=22`) on every published package; CI blocks tarballs that omit it (reliability R33).
- Updated dependencies [fa7ce48]
  - @zedtech/zedkit-core@0.2.2

## 0.9.0

### Minor Changes

- 58fa0aa: Fail install and validate when an installed skill, agent, or command references a skill absent from the selected preset. Fix vendored skills that pointed at unshipped grilling, prototype, or setup-matt-pocock-skills calls.

## 0.8.1

### Patch Changes

- 0b2fcd8: Docs: agents package row links to Quickstart path A (#301).
- Updated dependencies [a810ef0]
- Updated dependencies [867edd7]
- Updated dependencies [6cf1204]
  - @zedtech/zedkit-core@0.2.1

## 0.8.0

### Minor Changes

- 4cfdff5: Add the loading and feedback rule to the UI lens.

### Patch Changes

- da6091f: Test that adapters ship only with upstream skills.
- 13ce665: Test that skill companion docs are referenced.
- 3d1916f: Pin the excluded-skills floor in the notices test.
- 286986f: Read the first-party skill list from notices in tests.
- 8f66f94: Test that flag values are documented in the README.
- 3197603: Pin the demo and doc frontend rules in a test.
- 6c6fa9e: Test that agent and command files are all listed in the manifest.
- bdf9d9e: Test that the manifest carries no unknown keys.
- 088addf: Share the markdown walker between kit tests.
- 76edf64: Drop the stale subagent count from the README and ban counts.
- 1c6759d: Test that excluded skills stay unvendored.
- f7aa027: Pin upstream title counts to their skill lists.
- 15305ef: Test that notices file paths point at shipped files.
- f2e221e: Test that the repo tracks every template persona.
- 6be391a: Resolve prose CLI flags and values against USAGE.
- 47ac61a: Cover guides pages in the prose references test.
- d2c6345: Test that bare names in AI docs prose resolve to kit concepts.
- fe699e0: Check CLI providers against the installer list.
- 21ae4e1: Lock CLI provider acceptance to the installer list.
- 27a6d90: Test that README commands use defined package scripts.
- fcb53ff: Cover plural role mentions in the role-mentions test.
- d3f21da: Cover reversed role mentions in the role-mentions test.
- 73eed38: Test that role mentions in kit docs resolve to that kind.
- 121ea12: Pin floors under the shipped skill, agent and command sets.
- 43b0e35: Count only skill directories as skills in tests.
- 974898b: Test that USAGE lists the manifest presets.
- 9bb2f48: Test that USAGE lists the accepted providers.
- Updated dependencies [f6df11a]
- Updated dependencies [b4ceccb]
  - @zedtech/zedkit-core@0.2.0

## 0.7.2

### Patch Changes

- 1cd249f: Test that no shipped agent pins a concrete model (omitted or inherit only).

## 0.7.1

### Patch Changes

- 43afbd0: Refactor test name resolvers into one shared helper with identical behavior.

## 0.7.0

### Minor Changes

- e59db59: Remove the deprecated `plan-challenger` alias as promised for 0.6.0; briefs must name `skeptic` with an angle.

### Patch Changes

- @zedtech/zedkit-core@0.1.3

## 0.6.5

### Patch Changes

- 031723d: Test that the README Entry points paragraph names only shipped kit content.

## 0.6.4

### Patch Changes

- 7a2814c: Test that third-party notices and shipped LICENSE files match exactly.

## 0.6.3

### Patch Changes

- 9eaf700: Test that skill and agent names cited in agent bodies resolve to shipped content.

## 0.6.2

### Patch Changes

- 79c3dbc: Test that the README vendored paragraph names only shipped skills.

## 0.6.1

### Patch Changes

- 784bd72: Test that the lens registry and the review skill route the same minimum lens set.

## 0.6.0

### Minor Changes

- 2b35617: Add the `console-architecture` agent (route/view/data layer-boundary reviewer for frontend changes) and wire it in the lens registry and agents catalog.
- 83e0f67: Activate the `doc-demos` review lens (registry + frame + drift checks for doc apps and demo registries); both runners (`docs-writer`, `ui-designer`) already exist.
- e39bfe7: Add the `orchestrator` agent plus `orchestrate` and `research` commands for multi-step coordination across existing playbooks and specialists.
- 8ffe2f5: Add the `product-director` agent (one-page delivery brief over a scope: shipped/next/needs/risks with links) and wire it in the agents catalog.
- e900417: Add the `release-manager` agent (release gatekeeper: semver 0.x rules, changesets, migration notes, deprecations, maturity) and wire it in the lens registry and agents catalog.

### Patch Changes

- de8f031: Test that the agents catalog Writes column matches each agent's frontmatter write guards.
- e848e85: Test that `docs/agents-catalog.md` covers every agent the kit ships.
- d38aefd: Ship the `audit` skill in the `core` preset: the `audit` command always installs, so a fresh core install failed its own `validate`.
- 308f534: Bound the agents-catalog chains and persona-fallback test parsers to their sections so later doc additions cannot leak in.
- a5266f7: Test that every Typical chains name in docs/agents-catalog.md resolves to a skill, agent or command the kit ships.
- 46a4592: Name the removal version (0.6.0) on the deprecated `plan-challenger` alias, in the agent description and the agents catalog.
- ae91eb5: CLI errors carry next steps (`unexpected argument` points at `--help`, `no such directory` points at the project root or `init`); validate-errors doc example fixed (`diagnosing-bugs`, not `audit`, needs `--preset full`).
- b7f21d3: Test that the package README documents every CLI usage flag.
- 2c885df: List the first-party `audit` skill in THIRD_PARTY_NOTICES and cover `use-zedkit` in the core-closure test list.
- 5e86c2f: Test that every kit command routes to its same-named skill with the $ARGUMENTS contract.
- 7f2b740: Move `diagnosing-bugs` from the `core` preset to full-only (still shipped; fresh core installs stay lean) and cap the core preset size by test.
- 5a048ad: Test that re-running `init` against a newer kit adds new files without touching edited ones.
- 8bbf647: Lock both agents tables to exactly the shipped agent set: fail on stale rows, not just missing ones.
- 951ff68: Test that `THIRD_PARTY_NOTICES.md` names every shipped skill.
- 7963a67: Align persona-review fallback generics with personas.template.md and lock the persona name set with a test.
- 2c885df: Ship the `ponytail-audit` skill in the `core` preset: the core `audit` skill runs it, so core installs referenced a missing skill.
- 2775028: Name the `skeptic` agent in the README entry-points paragraph: `challenge` briefs `skeptic`, not the deprecated alias.
- 300a492: Test that the README command list matches the manifest and command files stay thin.
- 3f51547: Fix stale README inventories: complete the first-party skills list and point subagents at the agents catalog instead of a frozen subset.
- f6db15d: Ship the `research` skill in the `core` preset: the core `wayfinder` skill invokes it via the Skill tool.
- 81e9503: Miss-to-rule from downstream propagation: setup-ai verify now requires the repo lint to ignore installed kit dirs.
- 05eb888: Teach setup-ai to replace local copies of published zedkit configs with the install (propagation prep).
- 862989a: Align the `setup-ai` subagent guidance with the kit convention: `model` omitted or `inherit`.
- 0dc1ad8: Document why skills are exempt from the single-line description rule and lock folded descriptions as valid.
- 28ea655: Test that shipped skills partition exactly into first-party plus upstream notices, and that the README first-party list matches.
- b0e21c1: AGENTS template states the subagent `model` rule as omit-or-`inherit`, matching the skill and the validator; test pins the three wordings together.
- 89c7b6b: Test that bare skill/agent/command names in the kit templates resolve to shipped content.
- e85fb10: Point the `use-zedkit` skill links at absolute public URLs: repo-relative links break once installed in a consumer repo.
- be8a56c: Test that the root README consumer snippet stays identical to the use-zedkit core rule.
- e4b6ee7: Validate-errors doc matches the CLI summary (`1 problem` / `N problems`); test pins documented error strings to source.
- f55bd78: Pluralize the `validate` summary (`1 problem` / `N problems`).
- f0908dc: Test that the agents catalog Writes column only holds yes, no or tests only.
- Updated dependencies [4a1b579]
  - @zedtech/zedkit-core@0.1.3

## 0.5.0

### Minor Changes

- 4024c51: Add the `docs-writer` agent (docs author for README/AGENTS.md/catalog entries; grounded examples, de-drift) and wire it in the lens registry and agents catalog.
- ca6694c: Add the `researcher` read-only reuse-by-design scout (adopt/wrap/build with sources); the `research` skill now delegates to it and the lens row names it.
- 16ef547: Add the `test-writer` agent (adversarial test author; test files only) and wire it in the lens registry and agents catalog.

## 0.4.0

### Minor Changes

- 9167ada: Add the `dependency-auditor` agent (need/size/license/maintenance/duplicates/supply-chain checks for new or updated deps) and wire it in the lens registry and agents catalog.
- 9618386: Gentle motion by default + reduced-motion everywhere: requirement in `ui-designer`, rule 6 of the ui lens (with refusal example), both personas, and the `verifier` gate; content test locks it.

### Patch Changes

- 03cacd0: Catalog: every need documents its short name, audience, purpose, when to (not) use it, and related needs (single-sourced from CATALOG.md, enforced by `pnpm catalog:check`), feeding the doc pages.
- Updated dependencies [03cacd0]
  - @zedtech/zedkit-core@0.1.2

## 0.3.0

### Minor Changes

- fa3b613: Add the `copywriter` read-only i18n-first microcopy reviewer (keys, tone, doubtful-client bar, FR/EN proposals); flip the `copy` lens to exists.
- b99b3c4: Quality loop: `frontend-quality` + `doc-demos` lens rows (planned until their runners land), miss-to-rule step in `review`, new `audit` skill + command with content tests.
- 1a858c7: Enrich the lazy end-client persona with interrupted and flaky-network bars (auto-save, resume where left off, reload-safe idempotent flows) and add the Stressed user persona (named loading feedback, no naked spinners); matching checks in `ui-designer` and the `skeptic` ui/ux angle.
- d5ba31f: Add the `seo-auditor` and `a11y-auditor` read-only reviewers (seo package rules; WCAG basics); flip both lenses to exists.
- 0c81d35: Add the `ui-designer` read-only UI reviewer (kit reuse, states, responsive, themes, lazy-client bar) and `docs/agents-catalog.md` (when to call which agent, typical chains); flip the `ui` lens to exists.

### Patch Changes

- 3809828: Lens registry: docs trigger also covers agents and commands (dogfood finding — new kit content matched no content lens).
- b35e593: Fix two pre-review findings: `audit` skill says owner (not the internal lanes term), `copywriter` key rule scoped to products with i18n.
- 59a12be: Discoverability: benefit-oriented descriptions, 8–12 npm keywords, homepage and bugs links per package (single-sourced from the CATALOG.md header, enforced by `pnpm catalog:check`), plus README badges and Install/Usage/When-to-use sections.
- Updated dependencies [59a12be]
  - @zedtech/zedkit-core@0.1.1

## 0.2.0

### Minor Changes

- 93b16af: Add the review lens registry (`skills/review/lenses.md`): `review` now routes path/type to mandatory lenses over one table, with a lenses-run report and a resolver test.
- c515c4e: Personas as data: kit `personas.template.md` installed to `.agents/personas.md` (existing file kept), `persona-review` reads it with a generic fallback, `setup-ai` customizes it per project.
- ba05241: Replace `plan-challenger` with one generic `skeptic` agent (angle per brief: plan, ui/ux, security, scope, data/ops, copy); `plan-challenger` stays as a deprecated alias for one release. Lens registry updated (single skeptic row), lens test asserts trigger/output columns.

## 0.1.0

### Minor Changes

- 7426a08: Initial release: agent-agnostic AI kit (AGENTS.md template, skills, subagents), installer and validator.

### Patch Changes

- Updated dependencies [48b6f4a]
  - @zedtech/zedkit-core@0.1.0
