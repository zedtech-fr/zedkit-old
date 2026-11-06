# @zedtech/zedkit-ai

## 1.0.1

### Patch Changes

- cd538d6: Observable proportionate workflow: a routing rule in the agent template and Cursor rule (atomic inline with a check, multi-step through orchestrate), marked inline fallbacks with briefs-first, plan/implement playbooks and commands in the setup preset, a shared Skill-tool fallback, verifier evidence (revision and output, one gate, pending stays pending), git-ignored `.scratch/` working plans by default, and honest setup validation wording.
- cd538d6: Definition of done and the verifier run the area cheap loop after an edit; full CI and e2e stay the PR's job.
- cd538d6: Adopt sidecars no longer duplicate live skill names: a fresh `zk-<name>` sidecar carries `name: zk-<name>`, re-running `setup` migrates sidecars an older adopt left behind (user files untouched), and `validate` fails duplicate skill names with the fix.

## 1.0.0

### Major Changes

- a2100b0: Cut `@zedtech/zedkit-ai` to 1.0.0 with the setup-ai kit (tokenomics, sync, installer).

  0.21.x -> 1.0.0: pin `~1.0.0`. Existing `~0.21.0` and `^0.21.0` ranges stay on 0.21.x.

### Minor Changes

- 9bd0065: Agents declare `role`, `default_needs` (reasoning and context defaults a call may override) and, where useful, a `kinds` allowlist and a `default_kind` hint, in `agents.meta.json` next to `tokenomics.md` (the kit ships one for its 18 agents). The headers are not in agent frontmatter: at least one supported tool silently skips an agent whose frontmatter has a key it does not know, so `validate` now rejects those keys in an agent file. `kind` is per invocation, never an agent property. `validate` rejects `needs` and `kind` in an entry, requires the write deny list in the agent file when `kinds` has no `build`, and requires an entry for every agent only when `strict_headers: true`. A kit agent without an entry uses the shipped table, so no refresh is needed.
- 67b75b6: Add the `compose-ui` skill: write a persona chain brief (métier, client personas, customers, customer personas, UI decisions) before composing UI, then justify each choice against it. Ships in the `setup` and `core` presets; the `ui-designer` subagent expects the brief.
- 9cf8040: Add `runGate` and `zedkit-ai gate <log> -- <command>`: run one gate command into a setup-log gate log (`CMD:`, `START:`, output, `END:`, `CAUSE:` on timeout, signal or out-of-memory, `EXIT:<code>` last). Output streams to the file, the V8 heap is capped at 4096 MB unless `NODE_OPTIONS` sets one, and a TERM or INT to the wrapper still closes the log.
- 3e53b27: `zedkit-ai sync` writes Muse-native agent files (closed frontmatter, Muse `disallowedTools`) as marked regular files in `.agents/agents`. Unmarked and kit files stay the canonical source. Cursor check-kind agents get `readonly: true`. Sync never writes through a symlink.
- 8ff4ecd: Breaking: `init` and `setup` write each tool's agent files with `sync`, and `validate` checks them the same way. Generated files keep the model in `.agents/tokenomics.md`, the `.claude/agents` link becomes a real directory, and Cursor commands become one link each. Existing copies of kit files are replaced; your own files stay, with the kit version beside them. Migration: copied .cursor/agents -> generated (run `npx zedkit-ai sync`); see docs/migrations/zedkit-ai-tokenomics.md.
- 19a4fb6: `setup-ai` now checks what each extracted rule says, not only that its citation exists: a second reader opens the cited function or transaction and returns match, partial or mismatch (every order, atomicity or timing rule is checked, never sampled). The reading log gains a `## Meaning check` section and `validate --setup` fails on an unchecked sequencing rule or an unresolved mismatch.
- e4feab8: `validate --setup` now asks for proofs, not claims: a repo with a `check` script must have that full gate persisted as a gate log (`CMD:` first, `EXIT:` last, any exit code) or a Gate outcomes row saying why it did not run. A persisted `.agents/setup-log/validate.log` must come from a clean run and be named in the setup-log. `setup-ai` teaches both.
- af38523: `setup-ai` now records a repo's visual signature in `design.md`: colour roles with exact variable names and values, font families by role, the one accent role kept for the primary action, and exact alias exceptions, each with `file:line`. Readers extract it from stylesheets and tokens, improve mode keeps the rows as written, and `validate --setup` fails when stylesheets define colours and fonts but `design.md` has no `## Signature` section.
- 28bd822: `/setup-ai` now fills `.agents/tokenomics.md` from the tool's model listing and runs `zedkit-ai sync`, instead of writing `.agents/model-routing.md`. `validate --setup` D4 accepts the new file (a real model on at least `build.standard` and `decide.sensitive`, pointed at from `AGENTS.md`). A leftover `model-routing.md` still passes D4 with a deprecation note, and model names in that file are warnings, not errors, until support is removed two minors later.
- 8209845: Stakes on tickets, plans and PRs. A task carries `Stakes: trivial|standard|sensitive|critical` (frontmatter key or line; `standard` when absent), optionally `Kind:` and `Needs:`. New `zedkit-ai stakes <file> [--base <ref>]` prints them with the gates for those stakes and fails when the stakes are lowered against the ref, raised without a `Stakes raised: a -> b: <reason>` line, or `critical` without `Second review:` and `Human validation:` lines. The `plan`, `implement`, `review`, `orchestrate`, `parallel-work` and `definition-of-done` skills set the stakes, route every spawn through `zedkit-ai route` with its kind, and apply the gate; `review` tells a `check` spawn it is read-only and compares `git status --porcelain` before and after, and `sensitive` or higher runs the full lens set.
- 2cefa4a: New `zedkit-ai sync` and `syncKit`: write each tool's agent files from `.agents/agents` and `.agents/tokenomics.md`. `.cursor/agents` and `.claude/agents` get one generated copy per agent with `model` set from the route of the agent's default kind at `standard` stakes and a marker comment on line 2; Codex and Muse read `.agents/agents` directly and get a note. A marked file is regenerated, a plain copy of the source is replaced, any other file is kept with the generated version beside it as `<name>.kit.md`, and a source that pins a `model` keeps it. `--check` exits 1 when a file is out of date, `--dry-run` writes nothing, orphaned generated files are pruned (`--no-prune` keeps them; `--prune` with `--provider` also removes the files of a provider left out), and a `.claude/agents` link made by `init` becomes a real directory. `Action.kind` gains `generate`, `convert` and `prune`.
- a241ca8: `validate` now fails on a model name written outside `.agents/tokenomics.md`. It scans skills, subagents, commands, top-level `.agents/*.md`, root `AGENTS.md` / `CLAUDE.md` and Cursor rules for id-shaped names (`claude-…`, `gpt-…`, `gemini-…`, `sonnet 4`, and so on), for every id-shaped model your cells pin, and for your own `hardcode.extra_patterns`. Keep a name on purpose with `<!-- zk:model-ok -->` on the same line or the line above, or list the file under `hardcode.allow_paths`. The legacy `.agents/model-routing.md` is not scanned. A command with a `model:` other than `inherit` is now an error, like a subagent.
- 306f2d8: Add `resolveRoute` and `zedkit-ai route <agent> --stakes <s> [--kind decide|design|build|check] [--reasoning ...] [--context ...] [--provider ...] [--json]`: resolve one agent call to a model and effort from `.agents/tokenomics.md` (kind x stakes, shifted one stakes column right for high reasoning or large context, effort lowered one step for low reasoning on trivial and standard tasks). The result carries the gates of the task's stakes, read-only for `check`, the context window, where each need came from, and the second review route for `critical`.
- 23a171e: Add `.agents/tokenomics.md`: one policy file that maps kind (`decide`, `design`, `build`, `check`) times stakes (`trivial`, `standard`, `sensitive`, `critical`) to a model and effort per provider, plus review gates per stakes. The full default policy ships in the package and is read at run time; `init` and `setup` install a short stub and never overwrite it. `validate` checks the file when present: schema, unknown keys, all 16 cells per provider, gate floors, and no model name outside `providers`.

### Patch Changes

- 2f67a33: The root `AGENTS.md` template is about 75 lines (was 98): same sections, ladder, routing rule, model line and conditional skill pointers, with shorter wording. The test budget moves from under 100 to at most 76 lines.
- af60a44: The `setup-ai` catalog skills (`add-capability`, `add-migration`, `domain-change`) are now ready to install: frontmatter included, no placeholders, links that resolve once phase C wrote `product.md` and `domain/`. Phase D installs each with one `cp` instead of rewriting it, so `add-capability` is no longer deferred.
- 538d795: Point the kit at `compose-ui` before UI work: AGENTS, orchestrator, definition-of-done, copywriter, verifier, review lenses, and implement. Persona chain is client business → personas → the client's customers → their personas → UI choices. Starter stays closed via install-time conditionals.
- 1763c98: `/setup-ai` now prints its intro at the start of every session and resume, not once per project. `validate --setup` accepts markdown emphasis or list markers around the `intro-first:` plan line (`- **Intro-first:** …`).
- 4a4313c: `init` and `setup` no longer print "next: run /setup-ai" (or the phase C notes) when `.agents/product.md` already exists; they point to `validate` and the phase E score instead.
- 12672c8: The setup-ai skill now refreshes the reading log's Rule map after phase C: pointer cells written in phase B are checked against the nested `AGENTS.md` files that now exist (`test -e`, and the file names the rule file), moved or missing pointers are fixed, and a `rule-map: refreshed after phase C` line plus a phase E checklist item record it.
- cd07a14: Install fills AGENTS.md Commands as Observed vs Test recommendation from existing scripts, so a legacy E2E battery stays listed as observation and is not copied into the desired test strategy.
- db5925a: setup-ai product output now recommends unit and integration tests as primary, contract/Pact when a boundary earns them, and E2E/browser only for an explicitly justified critical user path. Observed CI is recorded, not copied as the desired strategy, and existing CI is left alone unless the owner asked.
- e0e8b76: `validate --setup` D2 now also requires the Unenforced rules inventory to cite `current (documented, not enforced)` Identity rules in `design.md` (for example `I-04`) and every nested `AGENTS.md` that carries `documented, not enforced` rules. It also catches an unenforced domain rule that is not on the first line of its file (the old check only read the first line). The setup-ai skill adds domain purity to the architecture reconciliation.

## 0.21.0

### Minor Changes

- be11e7d: `/setup-ai` v3. Phase B now reads the code first: read-only subagents, one per slice of the repo (1-5 on a small repo, up to 20 on a big one), report the domain, business, identity, architecture and convention rules already in place with `file:line` evidence, and the interview asks only what the code could not answer. The merged rules land in `.agents/domain/`, an identity table in `.agents/design.md`, and a nested `AGENTS.md` per folder that differs. The run routes models by tier (scout reads, worker drafts, lead decides) on the provider it runs on and writes `.agents/model-routing.md` plus a short rule in the generated `AGENTS.md`. New `zedkit-ai scan [dir]` sizes the repo and cuts the slices; `validate --setup` now also fails a setup with no reading log, no domain rules, no nested `AGENTS.md` (or stated reason) or no model routing. The rubric gains depth axes D1-D4.
- be11e7d: Opt-in `zedkit-ai validate --setup [--plan file]`: the PLAN must name every git-changed path, and setup-log gate logs must be well-formed. Plain `validate` is unchanged.

### Patch Changes

- be11e7d: Setup-log write order: the normal path captures every gate's persisted output first, writes the setup-log entry in one atomic write (no stub grown by appends), and runs `validate --setup` only against the finished file — validation reads whatever is on disk. No checker change: a half-written log is procedural, and no mtime heuristic belongs in the checker.
- be11e7d: Rubric D4 reaches 3 on small repos with zero fan-out: the setup-log states `no fan-out: lead read inline`, which satisfies the fan-out record. Personas allow code-path journeys (`import → call → assert`) with unit tests, not only routes with e2e — the whole-journey rule still applies.
- be11e7d: Scope the `evidence-grounded-analysis` skill to customer and user material. A technical audit inventories the files and answers without the three-source quota or a wait-for-question stop.
- be11e7d: Gate inventory completeness: the setup-log template requires one Gate outcomes row per persisted gate log file (named, killed logs included), and `validate --setup` issues when a file in `.agents/setup-log/gates/` has no mention in `.agents/setup-log.md`.
- be11e7d: `validate --setup` now requires an `intro-first:` line in the plan appendix, so a skipped intro fails mechanically instead of passing silently. The setup-ai skill also makes the resume intro resume-aware: on a resume it opens with `resumed at phase <X>` instead of the fresh-start phase-A wording.
- be11e7d: Setup-ai gate logs: document a `TERM`/`INT` trap so a signaled wrapper shell still writes the cause and `EXIT:` tail instead of leaving a shapeless killed log. A `SIGKILL`ed wrapper cannot trap — re-run smaller and replace the file.
- be11e7d: `zedkit-ai scan` now prints the `prettier:` hint (kit paths missing from `.prettierignore`) so the run sees it in phase A, before planning — not after. `validate --setup` requires the `.prettierignore` plan row whenever the hint fires.
- be11e7d: `validate --setup` D1 now requires a `**Budget:**` line in `.agents/setup-log/reading.md`: the run states the repo's read budget (or `none found`), and the only allowed overrun is an owner-approved exception line. The setup-ai skill and reader brief say the same: batch smaller and read entry points first rather than exceed the budget.
- be11e7d: Root length vs inventories: the Unenforced rules inventory lives in setup-log by default, with a one-line pointer in root `AGENTS.md` — no longer inlined in root against the ~100-line target. The too-long audit flag points at the same remedy.
- be11e7d: Setup-ai templates: the domain rules table gains an `Enforced by` column (the checker that makes the rule true, or `documented, not enforced`), matching what the D2 depth axis scores; the personas table gains a `Partial coverage` column so a `no test — flag` row can say what the nearest test does cover.
- be11e7d: Unenforced-rule reconciliation: the skill and rubric require walking every `current` rule in root/nested `AGENTS.md` and `.agents/domain/*.md` so each genuinely unenforced rule lands in the Unenforced rules inventory (domain rows cited by ID). `validate --setup` flags a `current (documented, not enforced)` domain row whose ID appears in neither root `AGENTS.md` nor `.agents/setup-log.md`.
- be11e7d: Add the `use-signature` skill (full preset): follow a project's visual signature and identity state matrix when changing type, motion, composition, or identity UI. Kit primitives that wear their own look skip it.
- be11e7d: Install hints detect a pnpm workspace without `node_modules` and suggest `pnpm install`. The setup-ai skill warns that git-ignored gate logs are invisible evidence: track the file or mark the Gate outcomes row `ignored-locally` (logs stay `*.log` — renaming dodges the checker).
- be11e7d: Clarify nested AGENTS.md signature links in setup-ai (audit table stays on goal).
- be11e7d: Sample-2 setup-ai: repo-skill links, intro-before-tools, T3a capabilities, PLAN.md ladder rows, kit file verification steps, 8-axis pass mean with owner-dependent axes reported apart.
- be11e7d: Validate now checks relative markdown links in every skill directory, including repo-authored skills the kit does not ship (previously only kit skills were scanned, so broken links in agent-written skills passed silently). Also skips `mailto:` links, and the post-setup hint points past phase C once `.agents/product.md` exists instead of repeating the phase C note.

## 0.20.2

### Patch Changes

- 96b877b: setup-ai: the intro is no longer a turn boundary. SKILL, /setup-ai command and Cursor onboarding now say to print the intro and continue into phase A in the same turn; only stop points are the phase B interview, plan approval before writes, and the final report.

## 0.20.1

### Patch Changes

- bb50f00: Docs parity for the 0.20 setup flow: agent onboarding names adopt sidecars and the setup-ai intro-first step; guides list the full preset enum and all five setup-ai phases.
- 48347ff: Adopt installs no longer write a `personas.kit.md` sidecar when `.agents/personas.md` already carries the v2 schema headers; the file is kept as already customized, so repeat `setup` runs stay no-ops. Files without v2 headers (v1, hand-written) still get the kit sidecar.
- 8be0c56: `validate` flags leftover placeholder links (`](<...>)`) in installed AGENTS.md, CLAUDE.md and `.agents/**`; the AGENTS map template shows the example path as code instead of a link.

## 0.20.0

### Minor Changes

- 554cb58: Since 0.12: `zedkit-ai setup` (adopt on, preset `setup` by default), colliding user files kept with `*.kit.md` / `zk-<name>` sidecars, a closed `setup` preset, setup-ai discovery phases, personas v2 on that preset, `validate --setup` for plan coverage and gate-log shape, and cursor/claude/codex/muse on one `.agents` source. Catalog needs move from beta to stable. Package stays on the 0.x line (minor, not 1.0): this package versions features as minors; a 1.0 freeze is a later bump. Measured `/setup-ai` quality: mean 2.25/3 on the eight measurable rubric axes, every axis at least 2, hard gates pass. Measured with composer-2.5 and a simulated owner, on one private repo and one fictional sample repo.

### Patch Changes

- f5e32ce: Setup-ai diligence r6: journey-test whole-path rule, enforced-by wording, installed-kit Kit file paths, domain Status consistency pass.
- 46dff33: /setup-ai command file requires the Tell-the-user-first intro before running the skill; setup-ai SKILL adds a three-line First message paste template.
- 78abc80: `validate --setup` suggests the exact plan row to add when a git path is not covered by the plan, with tailored reasons for known setup outputs (package.json, lockfiles, AGENTS.md, CLAUDE.md, .prettierignore, provider dirs).

## 0.19.0

### Minor Changes

- 67b3ded: Opt-in `zedkit-ai validate --setup [--plan file]`: the PLAN must name every git-changed path, and setup-log gate logs must be well-formed. Plain `validate` is unchanged.

### Patch Changes

- 6c43f69: Document `validate --setup` in setup-ai plan reconciliation, rubric reviewer notes, phase E checklist, and templates.
- b2a9e3e: Sample-2 setup-ai: repo-skill links, intro-before-tools, T3a capabilities, PLAN.md ladder rows, kit file verification steps, 8-axis pass mean with owner-dependent axes reported apart.
- 09e7fa9: Validate now checks relative markdown links in every skill directory, including repo-authored skills the kit does not ship (previously only kit skills were scanned, so broken links in agent-written skills passed silently). Also skips `mailto:` links, and the post-setup hint points past phase C once `.agents/product.md` exists instead of repeating the phase C note.

## 0.18.0

### Minor Changes

- 0a8eec4: Dist size review (no behavior change): CLI help text lives in shipped `kit/usage.txt` instead of inline, and duplicated logic is merged behind shared seams (drift sidecar/user-copy compare, frontmatter parse, provider skills-dir and layer-copy wiring, kit universe as sets, adopt sidecar path). Gzip(dist) 17540 → 17148; budget lowered to 17400. Minor (not patch) because this PR also carries the overdue `validateKit(kit?)` API report refresh, whose signature-change hunk the report gate reads as renamed; no public API change.
- 87bdd5b: Type-aware reference closure: `/name` references now demand an installed command when the kit defines one (a skill with the same name no longer satisfies them), `Skill tool` and `skill `x`` references demand the skill, and `agent `x`` references demand the agent. Bare backticked names and hyphenated whole words keep matching any installed kind in kit-origin files, and a file's own `/self` mention stays satisfied. Minor (not patch) because this PR also carries the overdue `validateKit(kit?)` API report refresh, whose signature-change hunk the report gate reads as renamed; no public API change.

### Patch Changes

- bd8690e: Sync the public API report: `validateKit(root, kit?)` accepts an optional kit path.
- 0fc0a03: Run-4 setup-ai scorer: git-derived plan rows, gate log CMD/EXIT format, depth templates, presetCommands slash rules.

## 0.17.0

### Minor Changes

- c37338b: Reference closure v3: validate detects hyphenated kit names (e.g. `a11y-auditor`) as whole words anywhere in kit-origin installed files, not only when backticked — single-word names stay backtick-only so prose never false-positives. The `ui-designer` handoffs line and the `verifier` UI-design verdict now use install-time availability blocks so presets without those agents stay closed. New broken-relative-link check over kit-origin installed files (skips web links, `#anchors`, and fenced code); the `domain-modeling` glossary example, the `setup-ts-deep-modules` README pointer, and the `wayfinder` ticket-index example render paths as code instead of dead links.

### Patch Changes

- f5e39df: Tighten setup-ai SKILL and templates for run-3 scorer: provider table always logged, headless intro, gate EXIT lines, sidecar cleanup, kit-issue per friction.

## 0.16.0

### Minor Changes

- 0ee85d8: Reference closure v2: validate flags any kit skill/agent named (backticked, Skill-tool, or `/command` form) that the preset does not install, with no false positives on user-authored files. Starter and setup presets gain `parallel-work`, `tdd`, and `adversarial-tests`; optional references in kit files use install-time `<!-- if:skill=x -->` / `if:agent=y` availability blocks (rows removed, sentences dropped) so every preset validates closed. Coverage extends to kit-written root docs (installed `AGENTS.md` template lines and `.agents/personas.md`); the attribution notice is exempt by design.

## 0.15.1

### Patch Changes

- 921a2f1: The `setup` preset installs the v2 personas schema as `.agents/personas.md` so setup-ai edits it in place. `starter`, `core` and `full` still get the v1 Task/Bar template.
- 907e829: Re-running `setup` (or `init --adopt`) links repo-added skills under `.agents/skills` into a real `.cursor/skills` or `.claude/skills` directory. After a catalog copy in setup-ai phase D, re-run `npx zedkit-ai setup` — never `ln`/`cp` by hand.
- e287d03: After install, print phase-C artifact expectations and optional Prettier ignore lines; document pnpm workspace `-w` install in onboarding copy.

## 0.15.0

### Minor Changes

- 93be210: Setup rubric and score-and-learn phase: setup-ai ships `templates/setup-rubric.md` (ten 0–3 axes plus binary hard gates), ends with phase E (self-score against the rubric, `.agents/setup-log.md` retro entry, public-safe kit issue drafts, re-audit cadence), and adds `templates/setup-log.template.md` and `templates/kit-issue.template.md`. Every preset that ships setup-ai installs the new templates; validate stays green and adopt re-runs stay no-ops.

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
