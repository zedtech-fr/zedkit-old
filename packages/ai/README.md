# @zedtech/zedkit-ai

[![npm version](https://img.shields.io/npm/v/@zedtech/zedkit-ai.svg)](https://www.npmjs.com/package/@zedtech/zedkit-ai)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/zedtech-fr/zedkit/blob/main/LICENSE)

Give every coding agent the same setup: an `AGENTS.md` template, skills,
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

## Usage

Advanced / CI paths:

```sh
npx zedkit-ai init . --provider cursor --adopt   # same files as setup; explicit init
npx zedkit-ai validate                           # must print: ok
npx zedkit-ai validate --setup [--plan file]     # opt-in: PLAN covers git changes
```

**Starter (default for `init`):** `setup-ai`, `ground-truth`, `review`, `definition-of-done`,
`orchestrate` (so setup can hand off bigger work), `parallel-work`, `tdd`, and
`adversarial-tests`, plus subagents `explorer`, `verifier`, and `orchestrator`,
and commands `/setup-ai` and `/review`. Enough to onboard a repo, verify facts,
run one review workflow, and check done-ness without loading the whole kit.

**Setup preset (default for `setup`):** everything in starter, plus
`domain-modeling`, `persona-review`, `code-review`, `ponytail-review`,
`retro`, `rules-upkeep`, and `writing-for-agents`, and subagents
`product-director`, `ui-designer`, and `copywriter`. Use this for the
first-5-minutes path and `/setup-ai` discovery depth.

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
left as-is. It also skips
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
| `cursor` | `.cursor/rules/project.mdc`, `.cursor/skills` link (or per-skill links if that path is already a real directory), agents and commands as real-file copies | its `.cursor/` layer |
| `claude` | `CLAUDE.md` link, `.claude/{skills,agents,commands}` links (per-skill links and file copies when those paths are already real directories) | its `.claude/` layer |
| `codex` | none | `AGENTS.md` and `.agents/skills` directly |
| `muse` | none | `.agents/` directly |

Every preset × provider cell is install-tested: install green, validate
clean, re-run a no-op, drift clean.

Other provider ids with no install layer behave like `codex` (see `zedkit-ai init --help`).

Cursor gets copies because a symlinked folder shows up empty there. Copies
can drift when `.agents/` changes: `zedkit-ai validate` reports each missing
or differing copy and never tells you to overwrite a user file. Re-run
`init --adopt` to install a kit sidecar next to the user copy.
`setup-ai` takes provider names (`setup-ai cursor claude`) and asks once
which providers to wire when it cannot tell.

## What you get

```
AGENTS.md                  instructions every tool reads
CLAUDE.md -> AGENTS.md
.agents/skills/            workflows (the Agent Skills layout)
.agents/agents/            subagents
.agents/commands/          one-keystroke commands (thin: each runs a skill)
.claude/{skills,agents,commands}  symlinks to .agents/
.cursor/skills             symlink to .agents/skills (or per-skill links)
.cursor/{agents,commands}  real-file copies (a link shows up empty)
.cursor/rules/project.mdc  one always-on rule pointing at AGENTS.md
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
`review`, `plan`, `challenge`, `audit`, `orchestrate`,
`evidence-grounded-analysis` (answers about customer or audit material only
from that material, every claim tagged verbatim, inference or absent).

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
  copies into `.cursor/agents` anyway so a Cursor-only repo needs nothing else.
- Codex reads `.agents/skills` (it follows symlinks) and `AGENTS.md`
  ([docs](https://developers.openai.com/codex/skills), checked 2026-10-24), so
  it needs no adapter. The subagent files are not wired for Codex.
- Muse reads `AGENTS.md`, `.agents/skills` and `.agents/agents` directly
  (verified empirically 2026-10-24 with `muse skills list` and a headless
  `muse exec` run: every core skill and all installed subagents load), so it needs
  no adapter either. It ignores the `.claude/` and `.cursor/` links. This is
  how the `readonly:` ban above was found: files setting it never appear in
  its agent list.
- Symlinks need a filesystem that supports them (Windows: developer mode or
  WSL).

## API

`installKit(options)` and `validateKit(dir)`: see [CATALOG.md](CATALOG.md).

## Verify

```sh
pnpm --filter @zedtech/zedkit-ai typecheck && pnpm --filter @zedtech/zedkit-ai lint && pnpm --filter @zedtech/zedkit-ai build && pnpm --filter @zedtech/zedkit-ai test
```

The tests also validate the whole bundled kit.
