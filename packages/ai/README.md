# @zedtech/zedkit-ai

[![npm version](https://img.shields.io/npm/v/@zedtech/zedkit-ai.svg)](https://www.npmjs.com/package/@zedtech/zedkit-ai)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/zedtech-fr/zedkit/blob/main/LICENSE)

The AI half of zedkit, a UI/AI kit: one prompt gets your repo a top-notch AI
setup (see [First 5 minutes](#first-5-minutes)). Give every coding agent the same setup: an `AGENTS.md` template, skills,
subagents, and a small installer and validator. Works with Claude Code,
Cursor, Codex, Muse and any tool that reads `AGENTS.md` or Agent Skills.
Original work by the same author, plus vendored MIT skills (see
[kit/THIRD_PARTY_NOTICES.md](kit/THIRD_PARTY_NOTICES.md)).

## Install

```sh
pnpm add -D @zedtech/zedkit-ai
```

At a **pnpm workspace root** (`pnpm-workspace.yaml` present), use **`pnpm add -D -w @zedtech/zedkit-ai`** so install does not fail with `ERR_PNPM_ADDING_TO_ROOT`.

Or skip the devDependency for a first try: `npx @zedtech/zedkit-ai setup` downloads the CLI once.

## First 5 minutes

**Pick your scope**

| Situation | What to run |
|---|---|
| **One git repo** (an app, library, or service) | Commands below in that repo's root |
| **Workspace root** (several sibling checkouts, or a meta repo listing members) | `setup` at the root only; `/setup-ai` runs in **workspace mode** and proposes per-repo setup inside each child — do not treat the root as the app |

**Two commands to `/setup-ai`**

```sh
npx @zedtech/zedkit-ai setup --provider cursor   # preset setup + adopt; wire Cursor
# in your agent: /setup-ai   (or: "run the setup-ai skill")
```

Use `cursor`, `claude`, `codex`, `muse`, or comma-separated names; omit `--provider` to wire every supported runtime. **`setup` defaults to the `setup` preset** (discovery skills and agents for `/setup-ai`); override with `--preset starter|setup|core|full`. When you already added the package: `npx zedkit-ai setup . --provider cursor`.

After `/setup-ai` finishes:

```sh
npx zedkit-ai validate   # must print: ok
```

### Cursor: one paste

Docs walkthrough: [zedkit.app/docs/ai/setup](https://zedkit.app/docs/ai/setup). Agent steps (raw markdown): [zedkit.app/ai/setup.md](https://zedkit.app/ai/setup.md).

Paste this single message in a new Cursor chat at the repo root:

```text
Set up zedkit AI on this repo following https://zedkit.app/ai/setup.md
```

The agent should install the package, run `npx zedkit-ai setup --provider cursor`, execute `/setup-ai`, then run `validate` until stdout is `ok`.

## Upgrading from 0.12

Re-run:

```sh
npx @zedtech/zedkit-ai setup
```

That command is `init` with **`--preset setup`** and **`--adopt`**. It does not overwrite your files. On a name collision it keeps your copy and writes the kit version beside it (`review.kit.md` for files, `zk-review` for skill folders). Identical kit copies are skipped. A skill sidecar takes the `zk-<name>` skill name so providers never see two skills with one name; the re-run also refreshes sidecars an older adopt left behind. `init` without flags still defaults to **`starter`**.

Then run **`/setup-ai`** if you want the discovery artifacts (`product.md`, `domain/`, `design.md`, glossary). The CLI install alone does not write those.

What changed since 0.12 (all already in the package; this re-run picks them up):

- **`setup` command** — onboarding entry. Defaults to the `setup` preset. `init` still defaults to `starter`.
- **`setup` preset** — starter plus `domain-modeling`, `persona-review`, `compose-ui`, `code-review`, `ponytail-review`, `retro`, `rules-upkeep`, `writing-for-agents`, and subagents `product-director`, `ui-designer`, `copywriter`. `starter` stays the small closed preset.
- **`*.kit.md` sidecars** — adopt keeps a colliding user file and writes the kit copy next to it. Validate ignores `*.kit.md`. If you already had `.agents/personas.md` (v1 Task/Bar columns), a re-run keeps it and may add `personas.kit.md` (v2 schema). Merge or replace when you want the v2 columns (goals, jobs, frustrations, journeys, evidence, routes). The `setup` preset installs v2 on a blank tree; `starter`, `core`, and `full` still install v1.
- **`.agents/setup-log.md`** — `/setup-ai` phase E appends a retro entry here. The plan file is `PLAN.md` at the repo root or `.agents/setup-log/plan.md`. Gate command logs go in `.agents/setup-log/gates/*.log`.
- **`validate --setup`** — opt-in; plain `validate` is unchanged. With `--setup`, every path from `git status --porcelain -uall` must appear in the plan text (a parent folder with a trailing slash counts), and each gate log must start with `CMD:` and end with `EXIT:<code>`. Pass `--plan <file>` if the plan is not at those default paths. It also runs the four depth checks below (tags `D1`–`D4`).
- **Read the code first** — `/setup-ai` phase B spawns read-only subagents, one per slice of the repo, before it asks anything: 1–5 on a small repo, 6–10 medium, 11–20 large. `npx zedkit-ai scan` sizes the repo and prints the slices. Each reader reports the business, domain, identity, architecture and convention rules already in the code with `file:line` evidence; the lead merges them into `.agents/setup-log/reading.md`. The interview then asks only what the code could not answer (at most 8 questions, plus "found in code, confirm" lines). Check **D1**: the reading log exists, has enough reader rows for the repo size, and cites evidence.
- **Domain and identity rules** — the merged rules land in `.agents/domain/<area>.md` and the **Identity rules** table of `.agents/design.md`. Check **D2**: every domain file cites `file:line` or `source: owner`, and a repo with UI files has an **Identity rules** section with evidence.
- **Nested `AGENTS.md`** — one per folder whose rules differ (features, ui, design, api, db), only what differs, linking to the domain and design files. Existing nested files are extended in place, not left as stubs. Provider-scoped rules (Cursor `.mdc`, folder `.cursor/rules`) stay the owner and get a pointer, never a copy; the reading log's rule map must name each one. Check **D3**: at least one nested file links `.agents/domain` or `.agents/design`, or the setup-log says `nested-agents: none|kept — <reason>`.
- **Tokenomics** — the run knows its provider (`cursor`, `claude`, `codex`, `muse`), lists the models the tool accepts, and fills `.agents/tokenomics.md` cells from that listing: cheap models on `check`/`build` at `trivial`/`standard`, the strong model on every `sensitive`/`critical` cell. Then it runs `zedkit-ai sync` and points `AGENTS.md` at the file. Check **D4**: at least `build.standard` and `decide.sensitive` have a real model (not `inherit`), and `AGENTS.md` links the file. A leftover `.agents/model-routing.md` still passes D4 with a deprecation note.
- **Preset closure** — `validate` fails when an installed kit file names a skill, agent, or command the preset does not install.
- **Providers** — `cursor`, `claude`, `codex`, `muse` share one `.agents` source. Re-run `setup` after adding a repo skill so provider layers pick it up; do not `ln` or `cp` by hand.

The rubric adds four depth axes (D1 code reading, D2 domain and identity rules, D3 nested rules, D4 tokenomics); each must reach 2, and they are not part of the 8-axis mean below, which was measured before they existed.

Measured `/setup-ai` quality: mean **2.25/3** on the eight measurable rubric axes, every axis at least 2, hard gates pass. Measured with composer-2.5 and a simulated owner, on one private repo and one fictional sample repo.

## Usage

Advanced / CI paths:

```sh
npx zedkit-ai init . --provider cursor --adopt   # same files as setup; explicit init
npx zedkit-ai validate                           # must print: ok
npx zedkit-ai validate --setup [--plan file]     # opt-in: PLAN covers git changes, setup went deep (D1-D4)
npx zedkit-ai scan [dir]                         # repo size and one slice per read-only reader
npx zedkit-ai route verifier --kind check --stakes sensitive   # model and effort for one call
npx zedkit-ai stakes PLAN.md --base origin/main  # stakes, kind, needs and gates of a plan, ticket or PR body
npx zedkit-ai sync --provider cursor,claude       # write each tool's agent files, model from tokenomics.md (--check in CI)
```

**Starter (default for `init`):** `setup-ai`, `ground-truth`, `review`, `definition-of-done`,
`orchestrate` (so setup can hand off bigger work), `parallel-work`, `tdd`, and
`adversarial-tests`, plus subagents `explorer`, `verifier`, and `orchestrator`,
and commands `/setup-ai` and `/review`. Enough to onboard a repo, verify facts,
run one review workflow, and check done-ness without loading the whole kit.

**Setup preset (default for `setup`):** everything in starter, plus
`domain-modeling`, `persona-review`, `compose-ui`, `code-review`,
`ponytail-review`, `retro`, `rules-upkeep`, and `writing-for-agents`, and subagents
`product-director`, `ui-designer`, and `copywriter`. Use this for the
first-5-minutes path and `/setup-ai` discovery depth. Before composing,
restyling or personalising UI, run `/compose-ui`: client business → personas
→ the client's customers → their personas → UI choices.

**Already on `core`?** Nothing is removed from your tree automatically.
`zedkit-ai validate` reports drift; add skills with `zedkit-ai init
--preset core` on a fresh clone or copy missing folders from `.agents/`.

```sh
npx zedkit-ai init . --preset core   # previous default: planning, implement, triage, …
```

`init` installs generic instructions. The `setup-ai` skill makes them specific:
it explores the repo (code, docs, CI, history), runs the commands it finds,
then fills `AGENTS.md` with verified facts and proposes repo-specific nested
rules, skills and subagents. If a setup already exists (`AGENTS.md`,
`.cursor/rules`, `CLAUDE.md`, ...), it audits it first (stale, contradictory,
duplicated, too long) and improves it in place instead of replacing it.
`setup-ai` also fills the template's `Role and style` section (role, tone,
reply language) from repo evidence — docs language, commit style — asking a
single question when the evidence cannot tell. At a multi-repo workspace
root (several child checkouts) it switches to workspace mode: it inventories
each repo, maps cross-repo dependencies, and writes a root `AGENTS.md`
without touching the children unasked.

Developing the kit itself? From a zedkit checkout, build once and call
the binary directly: `pnpm --filter @zedtech/zedkit-ai build`, then
`node packages/ai/dist/bin.js init <dir>`.

`init` options: `--preset starter|setup|core|full`, `--provider cursor,claude,codex,all`
(`--target` is an alias; `--help` lists every provider id), `--adopt`, `--dry-run`.
**`setup`** runs the same install with **`--preset setup` by default** (override with
`--preset starter|setup|core|full`), **`--adopt` enabled**, and the same file rules as
`init`. It copies files (you own them
afterwards) and never overwrites an existing one; the one exception is an
existing `AGENTS.md` without the ladder, which gets the ladder section
appended (reported as `append`). `--adopt` keeps a colliding user file that
differs from the kit and writes the kit version beside it (`review.kit.md`
for files, `zk-review` for skill folders); an already-installed kit copy is
left as-is. A skill sidecar's `SKILL.md` is renamed to `zk-<name>` so the
live skill name stays unique, and `validate` fails a sidecar that still
claims the base name as a duplicate. It also skips
`.cursor/rules/project.mdc` (with a skip line naming the rule) when another
rule in `.cursor/rules/` is already always on (`alwaysApply: true`), instead
of adding a second one. A real `.cursor/skills` directory is kept; kit skills
are linked inside it one by one. Run `zedkit-ai list` to see presets, subagents and
commands.

## When to use

Reach for this package when a repo is read by coding agents (or several
different ones) and you want one verified, provider-agnostic setup
instead of per-tool folklore. If you only need runtime helpers, install
the other kit packages instead.

## Providers

One shared source (`.agents/`), then a thin layer per provider:

| Provider | Layer | Reads |
|---|---|---|
| `cursor` | `.cursor/rules/project.mdc`, `.cursor/skills` link (or per-skill links if that path is already a real directory), generated agent files, one link per command | its `.cursor/` layer |
| `claude` | `CLAUDE.md` link, `.claude/{skills,commands}` links (per-skill links and file copies when those paths are already real directories), generated agent files in a real `.claude/agents` | its `.claude/` layer |
| `codex` | none | `AGENTS.md` and `.agents/skills` directly |
| `muse` | native marked files in `.agents/agents` | `.agents/` source; Muse catalog reads the marked files |

Every preset × provider cell is install-tested: install green, validate
clean, re-run a no-op, drift clean.

Other provider ids with no install layer behave like `codex` (see `zedkit-ai init --help`).

Agents are written, not copied: each tool gets a generated file per agent
with the `model` from `.agents/tokenomics.md` (see Tokenomics), and a marker
on line 2. `init` and `setup` run the same code as `zedkit-ai sync`, so
`sync` after a policy edit is the whole refresh. Cursor shows a symlinked
folder as empty, so its commands are one link per file to
`.agents/commands/<name>.md` (same bytes, nothing to go stale). A provider
folder that is itself a link (for example `.cursor -> .agents`) is left
alone, so a write never lands in the source. `zedkit-ai validate` reports
each generated file that is missing or out of date, an old copy of a kit
file (`stale copy of the kit, run: npx zedkit-ai sync`), and a user file
that is kept while its generated version is not beside it yet; it never
asks you to overwrite a user file. Moving from 0.x:
[migration note](../../docs/migrations/zedkit-ai-tokenomics.md).
`setup-ai` takes provider names (`setup-ai cursor claude`) and asks once
which providers to wire when it cannot tell.

## Tokenomics

`.agents/tokenomics.md` is the one policy file for which model and effort each kind of work gets. Its frontmatter maps **kind** (`decide`, `design`, `build`, `check`) times **stakes** (`trivial`, `standard`, `sensitive`, `critical`) to a `{ model, effort }` cell, per provider: 16 cells each for `cursor`, `claude`, `codex` and `muse`. It also holds the review gates per stakes: `sensitive` needs a review, `critical` also needs a second independent review on a different model and a human validation line. `validate` refuses a file that weakens those floors, leaves a cell out, uses an unknown key, or names a model anywhere in the frontmatter except `providers`.

The kit ships the full policy (every `model` is `inherit`) and reads it from the package at run time, so a project file only holds what it changes and later default changes still reach it. `init` and `setup` install a short stub and never overwrite an existing file. This slice adds the file and its check. `zedkit-ai route <agent> --stakes <s>` resolves one call to its cell: the call's `--kind`, the stakes column, the effective needs (`--reasoning` and `--context` on the call beat the agent's `default_needs`, which beat the global default; `--dir` points at another project root), and `--json` for scripts. A call that needs `reasoning: high` or `context: large` reads one stakes column to the right (never past `sensitive` unless the task is `critical`); `reasoning: low` lowers effort one step on `trivial` and `standard` tasks; `check` calls are read-only. The gates always follow the task's own stakes. `zedkit-ai sync` writes it into the agent files (below). `/setup-ai` fills the cells from the tool's listing and runs `zedkit-ai sync`. A leftover `.agents/model-routing.md` is still accepted by D4 with a deprecation note, for two minors.

`validate` also fails when a model name is written outside `tokenomics.md`: in a skill, subagent, command, top-level `.agents/*.md`, root `AGENTS.md` / `CLAUDE.md` or a `.cursor/rules/*.mdc` file. It matches id-shaped names (`claude-…`, `gpt-…`, `gemini-…`, `sonnet 4`, and so on), every id-shaped model your cells pin, and your own `hardcode.extra_patterns`; the bare words "sonnet" or "opus", `claude-code` and `GEMINI.md` stay clean. Each hit prints `path:line`, one per file and name. To keep a name on purpose, put `<!-- zk:model-ok -->` on the same line or the line above, or list the file under `hardcode.allow_paths` (globs, relative to the project root or to `.agents/`). `*.kit.md` sidecars and the setup log are not scanned. Hits in a leftover `.agents/model-routing.md` are warnings with a deprecation line, not errors; nested `AGENTS.md` files are scanned only with `hardcode.scan_nested: true`. Commands always run on the session model, so a `model:` other than `inherit` in a command is an error too.

Stakes ride on the task, not the agent. A ticket, plan or PR body carries `Stakes: trivial|standard|sensitive|critical` (a frontmatter key works too; `standard` when absent), optionally `Kind:` (how an agent is used in that step) and `Needs: reasoning=high, context=large`. Stakes only go up: `zedkit-ai stakes <file> --base <ref>` fails when the value is lower than at the ref, or higher without a `Stakes raised: a -> b: <reason>` line. `sensitive` makes a recorded review mandatory and runs the full lens set; `critical` also needs a second independent review and a `Human validation:` line, which `stakes` checks on a PR body file. The workflow skills `plan`, `implement`, `review`, `orchestrate`, `parallel-work` and `definition-of-done` set the stakes, route every spawn through `zedkit-ai route`, and apply the gate. A `check` call is read-only: the caller records `git status --porcelain` before and after and fails the step if it changed, which detects a write but does not prevent one. Checked 2026-11-05: Cursor lets a spawn override a named agent's model only with a slug from its own short list; the other tool tested ignores extra spawn arguments; neither restricts tools per call. Where the tool cannot override the model, stakes drive the gates only.

`zedkit-ai sync` turns `.agents/agents` and `.agents/tokenomics.md` into each tool's own agent files, so the model lives in one place. `.cursor/agents` and `.claude/agents` get one generated copy per agent: the source with the header keys removed, `model` set to the route of the agent's `default_kind` at `standard` stakes (a call with another kind or `Needs:` routes at spawn time, where the tool allows an override), and a marker comment on line 2. `sync` regenerates a file that has the marker, replaces a plain copy of the source, and keeps any other file: the generated version goes beside it as `<name>.kit.md`. A source that pins a `model` other than `inherit` keeps it. A generated file whose source is gone is removed unless you pass `--no-prune`; `--prune` with `--provider` also removes the generated files of a provider you left out, except Muse natives in `.agents/agents` (that directory is the shared source). Without `--provider`, layers are inferred from non-empty `.cursor/` and `.claude/` and from Muse-native marked files in `.agents/agents`. `--check` writes nothing and exits 1 when a file is out of date (for CI), `--dry-run` prints the plan, `--quiet` prints only the changes, and a second run prints only `skip` lines. A `.claude/agents` link to `.agents/agents` made by `init` becomes a real directory; any other link is left alone. Effort is not written: neither tool has a per-agent effort key that was seen to work, and `sync` says so. Codex reads `.agents` directly, so nothing is generated for it. Muse gets native marked files in `.agents/agents` (closed frontmatter, Muse tool names); unmarked and kit files stay the canonical source. Kit `a11y-auditor` is written as `accessibility-auditor` (Muse drops digits); the unmarked source name stays for Cursor/Claude. Muse 1.4.14 lists and spawns the alias. Checked 2026-11-05: Cursor reads `.cursor/agents` before `.claude/agents` and lists a name once, so selecting both gives no duplicates; it ignores a quoted `model` (sync writes it plain) and falls back to the session model for an unknown id without an error, so check the ids in `tokenomics.md` against your tool's model list; `readonly: true` is enforced on Cursor, so check-kind generated Cursor agents set it; it is never written into a Muse file or an unmarked source. Muse native files map `Write`/`Edit` to `write_file`, `edit_file`, `bash`. Default sandbox still allows project-relative shell writes when `bash` is not denied (`write_file`/`edit_file` alone is the unsafe skip, not a write gate). Checked 2026-11-06 on an isolated probe: a Muse 1.4.14 child with that fail-closed denylist left a new project-relative sentinel absent (`edit=no-tool`, `shell=no-tool`) while `read_file` still quoted README. Muse has no read-only bash slice — check agents lose the executor; writers without `disallowedTools` keep it. `read_file`/`search` stay. One symlink in `.agents/agents` still empties the Muse catalog, so sync refuses to write through links and converts only a directory symlink that points at the kit. `init` and `setup` call the same code, so a fresh install is already synced.

Each agent's role, default needs (`reasoning` and `context`, which a call may override) and optional `kinds` allowlist and `default_kind` hint live in `agents.meta.json`: the kit ships one for its agents, yours goes next to `tokenomics.md` and wins per agent. They are never in agent frontmatter, because some tools silently skip an agent with a key they do not know; `validate` rejects those keys in an agent file, and rejects `needs` or `kind` in an entry (`kind` is per call, never an agent property). A kit agent without an entry uses the shipped table, so existing installs need no refresh.

## What you get

```
AGENTS.md                  instructions every tool reads
CLAUDE.md -> AGENTS.md
.agents/skills/            workflows (the Agent Skills layout)
.agents/agents/            subagents
.agents/commands/          one-keystroke commands (thin: each runs a skill)
.claude/{skills,commands}  symlinks to .agents/
.claude/agents, .cursor/agents  generated from .agents/agents + tokenomics.md
.cursor/skills             symlink to .agents/skills (or per-skill links)
.cursor/commands/*.md      one link per command to .agents/commands/
.cursor/rules/project.mdc  one always-on rule pointing at AGENTS.md
.agents/tokenomics.md      model and effort per kind x stakes (yours to edit)
```

One source (`.agents/`), thin per-tool links. Nested `AGENTS.md` files hold
per-folder rules. When to call which subagent: the
[agents catalog](../../docs/agents-catalog.md).

Commands (`review`, `plan`, `challenge`, `implement`, `setup-ai`, `pr`,
`handoff`, `audit`, `orchestrate`, `research`) are 3-6 line files: each runs its skill on the command arguments
(or the current context). Both tools also list skills as `/` commands
nowadays; the files stay as the explicit one-keystroke path and as fallback
when the skills link is not followed.

## The kit

**Principles it enforces**

- *Verify, do not guess* (`ground-truth`): read the source before relying on a
  name, shape, flag or version; cite `file:line`; say what was not checked.
- *Smallest complete change* (`ponytail`, MIT, vendored): reuse before adding.
- *Parallel and context-aware* (`parallel-work`): fan out independent work to
  subagents with self-contained briefs; contract first, disjoint files.
  Multi-step work can go through the `orchestrator` agent or `/orchestrate`.
- *Proven done* (`definition-of-done`, agent `verifier`): gates on the final
  state, no weakened tests, refactor parity by reading bodies, cold second
  review.

**Skills first-party:** `ground-truth`, `parallel-work`, `definition-of-done`,
`adversarial-tests`, `rules-upkeep`, `persona-review`, `setup-ai`, `use-zedkit`,
`use-signature`, `compose-ui` (persona chain brief before composing UI), `review`, `plan`, `challenge`, `audit`, `orchestrate`,
`evidence-grounded-analysis` (answers about customer or user material only
from that material, every claim tagged verbatim, inference or absent;
technical audits skip the source quota and the wait-for-question stop).

**Entry points (one command per phase):** `review` (pins the diff, fans out
`code-review` + `persona-review` + `adversarial-tests`/`security-reviewer`
when relevant, one verdict), `plan` (`to-spec`/`to-tickets`/`wayfinder`, then
`challenge`), `challenge` (`skeptic` angle plan + domain/design checks),
`implement` (extended: challenged plan in, `definition-of-done`, `review`).
All four live in the `core` preset; the detailed skills stay reusable and are
never copied into them.

**Skills vendored (MIT):** `ponytail` (+ review, audit, debt, gain, help) and
the Matt Pocock engineering skills (`tdd`, `code-review`, `diagnosing-bugs`,
`handoff`, `pr`, `to-spec`, `triage`, ...).

**Subagents:** lookup, plan, review/audit specialists, writers, release and
director briefs — the full table (role + when to call) lives in
`docs/agents-catalog.md`, the installed set in `kit.json`.

**Presets:** `starter` (default: onboard, review, done — eight skills, three
subagents, two commands), `setup` (starter plus domain modeling, the review
lenses, retro, rules-upkeep, and subagents `product-director`, `ui-designer`,
`copywriter`), `core` (planning, implement, and the rest;
`zedkit-ai list` shows the skill list), and `full` (every skill). Keep the
skill count low: every skill's name and description is loaded into context
up front (Codex caps that list at about 2%
of the context window and shortens descriptions past it). With `starter`,
`setup` or `core`, only that preset's subagents and commands are copied;
`full` still installs the full agent and command lists from `kit.json`.

## Choices worth knowing

- Subagent `model` is left unset (inherits). An unknown model id silently
  falls back in some tools, so pin one in your project only after listing what
  your tool accepts. The validator rejects any other value in the kit.
- Subagent `description` is one line: a block (`>`) can be shown literally and
  the agent is then never chosen. The validator checks it.
- Read-only subagents say so in their prompt body and set
  `disallowedTools: Write, Edit` (Claude Code honors it; other tools tolerate
  the key). There is deliberately no `readonly:` key: at least one tool
  silently drops a subagent file with an unknown field, so the validator
  rejects it.
- Cursor reads `.cursor/agents`, `.claude/agents` and `.codex/agents`
  ([docs](https://cursor.com/docs/subagents), checked 2026-10-24); the installer
  generated files go into `.cursor/agents` anyway so a Cursor-only repo needs nothing else.
- Codex reads `.agents/skills` (it follows symlinks) and `AGENTS.md`
  ([docs](https://developers.openai.com/codex/skills), checked 2026-10-24), so
  it needs no adapter. The subagent files are not wired for Codex.
- Muse reads `AGENTS.md`, `.agents/skills` and `.agents/agents` directly
  (verified empirically 2026-10-24 with `muse skills list` and a headless
  `muse exec` run: every core skill and all installed subagents load), so it needs
  no adapter either. It ignores the `.claude/` and `.cursor/` links. This is
  how the `readonly:` ban above was found: files setting it never appear in
  its agent list.
- Agent headers (`role`, `default_needs`, `kinds`, `default_kind`) live in
  `agents.meta.json`, not in agent frontmatter. Checked 2026-11-05: one tool
  loaded agents with those keys (a nested mapping and a list included) and one
  silently dropped any agent with a key outside its fixed set; a third could
  not be tested here. One failing tool is enough, so no tool gets the keys in
  frontmatter.
- Symlinks need a filesystem that supports them (Windows: developer mode or
  WSL).

## API

`installKit(options)` and `validateKit(dir)`: see [CATALOG.md](CATALOG.md).

## Verify

```sh
pnpm --filter @zedtech/zedkit-ai typecheck && pnpm --filter @zedtech/zedkit-ai lint && pnpm --filter @zedtech/zedkit-ai build && pnpm --filter @zedtech/zedkit-ai test
```

The tests also validate the whole bundled kit.
