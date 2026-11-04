---
name: setup-ai
description: "Set up or improve this repo's AI setup from what the repo actually contains: explores code, docs and CI, runs a short discovery interview, then writes or upgrades AGENTS.md, product/domain/design artifacts, nested rules, and repo-specific skills. Use when asked to set up AI, onboard agents, audit or improve existing agent instructions, or after installing the kit. Takes provider names (setup-ai cursor claude); with none, asks once which providers to wire."
---

# Setup AI

**Before ANY tool call** after reading this skill, output the **Tell the user first** block below as your **next** assistant message — no phase A inventory, no subagent spawns, no repo reads, no file writes until after that message is sent.

Make the AI setup of **this** repo true and specific. Generic advice is already in the kit; your job is what only this repo can say: its product, domain rules, commands, layout, traps, and repeated workflows.

## Tell the user first

**Output order:** This block is the **first output after `/setup-ai` starts** (your first assistant message once the skill is loaded) — before phase A inventory, subagent spawns, or file writes — including **headless**, **CI**, and **non-interactive** runs. Paste it as plain text; never skip it because nobody is chatting live. **Do not** open with "Running phase A…", inventory lists, or tool calls — the intro **is** phase A's start from the user's perspective until this message is sent. **Exclude** mechanical install output that ran **before** the skill loaded (for example `npx zedkit-ai setup` or package manager lines); those stay above this block in the transcript.

When `/setup-ai` starts (or the user asks to set up AI), say this in plain language before phase A — no interview yet:

- **Modes:** **fresh** (little or no agent setup yet) or **improve** (you already have `AGENTS.md`, rules, or provider folders — audit and extend, do not replace blindly).
- **Phases:** **A** audit (inventory + parallel explore + gaps) → **B** discovery (mine docs and code, then **one batched interview of at most 8 questions**) → **C** build deep artifacts from kit templates → **D** propose repo skills from the catalog → write provider layers, verify, report → **E** score and learn.
- **What they get:** verified root `AGENTS.md`, `.agents/product.md`, domain rules under `.agents/domain/`, `.agents/personas.md`, `.agents/design.md` when the repo has UI, nested rules where folders differ, optional repo-specific skills and subagents, and thin Cursor/Claude layers that match `.agents/`.
- **Time:** about **15–45 minutes** for a typical app repo; large monorepos or workspace roots can take longer. They approve the plan before writes; in phase B they **answer or delegate the batched interview** (do not skip it). Asking **which** providers to wire is optional when names are already known; **recording all four provider values** (see Providers) in the plan and setup-log is **not** optional.

## Phases (whole run)

| Phase | Name            | What happens                                                                              |
| ----- | --------------- | ----------------------------------------------------------------------------------------- |
| **A** | Audit           | Inventory, parallel explore, gap list (provider-neutral)                                  |
| **B** | Discovery       | Mine README, docs, vision, routes, schema; then **one batched interview** (≤ 8 questions) |
| **C** | Build           | Deep artifacts under `.agents/` from kit templates (evidence + owner answers)             |
| **D** | Skills          | Propose repo skills from the kit **catalog**; tier the plan (must / should / could)       |
| **—** | Write           | Shared source, provider layers, verify, report                                            |
| **E** | Score and learn | Self-score against the rubric, setup-log retro, kit-issue drafts, re-audit cadence        |

Two modes, decided in phase A step 1: **fresh** (little or nothing exists) and **improve** (a setup exists: keep it, fix it, extend it).

One shared source, then thin provider layers. Phases **A–D** are provider-neutral. Write the shared source first (`AGENTS.md`, `.agents/`), then wire only the chosen providers. Providers: `cursor`, `claude`, `codex`, `muse`.

## Rules for the whole run

- **Evidence only.** Every command, path, version and convention you write comes from a file you opened or a command you ran (see `ground-truth`). Mark the rest `UNVERIFIED` or leave it out.
- **Owner answers.** Text that comes from the interview or explicit owner reply is tagged **`source: owner`** on the same line or table row (discovery axis in the setup scorecard).
- **Additive.** Never delete or rewrite the user's existing text without asking. Propose, then apply what they accept.
- **Setup depth.** When the repo uses preset **`setup`** or the owner asked for product/domain depth, fill the artifact table in phase C and propose catalog skills in phase D even if a workflow appeared only once so far. Outside that, keep <!-- if:skill=ponytail -->**`ponytail`** <!-- /if -->minimalism (no skill for a one-off).
- **Prefer enforcement to prose.** If a linter, type check, test or CI job can enforce a rule, configure that and mention it in one line. Prose is for what tools cannot check.
- A public repo gets no private names, customer data or internal URLs in any file you write.

## Providers

**Always record** the value table below in the **plan table appendix** and in **every setup-log entry** (even when the user pre-selected providers or the run is headless). Wire every provider the owner names (several allowed). Only the **selection question** ("which providers to wire?") is conditional — when names are already known, skip the question but **still paste the table**.

| Provider | Value                                                      |
| -------- | ---------------------------------------------------------- |
| `cursor` | Rules, skills, agents and commands inside the IDE          |
| `claude` | The same setup for Claude Code sessions, linked not copied |
| `codex`  | Reads the shared source directly; nothing extra to install |
| `muse`   | Reads the shared source directly; nothing extra to install |

Add a **Wired:** line listing the providers you actually installed for this repo.

## Phase A — Audit

### A1. Inventory what exists

List, with paths: `AGENTS.md` (root and nested), `CLAUDE.md`, `GEMINI.md`, `.cursor/rules`, `.cursorrules`, `.github/copilot-instructions.md`, `.agents/`, `.claude/`, `.cursor/`, `.codex/`, `CONTRIBUTING.md`, PR and issue templates, `CODEOWNERS`, `GLOSSARY.md`, `docs/vision`, product/marketing content, route trees, schema/migrations.

- Nothing or only boilerplate: **fresh**. Run `zedkit-ai init` (preset **`setup`** when depth is wanted) if the kit is not installed yet and continue.
- Anything real: **improve**. Read all of it first. Note what each file is for and which tool reads it.
- Audit only files the repo owns. A vendored or symlinked kit (for example `.agents/skills` pointing into a package) is listed once and not audited.
- Note uncommitted changes. Treat the current working state as the baseline and do not revert anything.
- Settle the providers: the names given after `setup-ai` win; otherwise reuse the providers the repo already wires (`.cursor/`, `.claude/`, `CLAUDE.md`, docs saying so). If neither tells you, ask exactly one question — which of cursor, claude, codex, muse to **wire** (several allowed) — before writing; with nobody to ask, wire all four. **Regardless, copy the full Providers value table into the plan and setup-log.**
- Workspace check: two or more child directories that are themselves git checkouts, or a manifest listing member projects, means a multi-repo workspace root: switch to Workspace mode below instead of phases B–D.

### A2. Explore in parallel

Launch read-only `explorer` subagents in one batch, one question each, with the brief format of `parallel-work`. Ask each to return `file:line` evidence and nothing else. If you cannot spawn subagents, ask the same questions yourself, one after the other.

| Question                                                               | Where it looks                                                                                             |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Stack, layout, entry points, workspaces                                | manifests, lockfiles, top-level folders, build config                                                      |
| The real commands: install, dev, typecheck, lint, test, build, migrate | manifest scripts, `Makefile`, task runners, CI workflow files                                              |
| Conventions already enforced                                           | lint, format and compiler configs, test layout, naming seen in the code                                    |
| What the docs say                                                      | README, `docs/`, ADRs, glossary, contributing guide, vision                                                |
| Product surface                                                        | routes, pages, CMS/content, public API, pricing/checkout copy if present                                   |
| Domain and money                                                       | auth, tenancy, bookings/orders, refunds, migrations, generated code, vendored folders                      |
| How the team works                                                     | `git log` (commit style, PR size, hotfix habits), templates, branch rules, CI jobs and what blocks a merge |

Then **run the gate commands you found**, preferring forms without side effects (note any that write build output). Judge a command by its exit code, not by parsed output. A command that fails is a finding, not something to hide.<!-- if:agent=product-director --> Invoke **`product-director`** when the repo has a customer-facing product.<!-- /if --><!-- if:skill=domain-modeling --> Invoke **`domain-modeling`** when glossary or policy language is unclear.<!-- /if -->

### Gate execution log (persisted evidence)

Every gate you cite in setup-log, domain rules, or a repo skill must be **persisted**, not chat-only. **One gate = one log file** (for example `.agents/setup-log/gates/main-check.log`). Do not append validate, prettier, or a second command to the same file after **`EXIT:<code>`**.

| Field   | Required                                                              |
| ------- | --------------------------------------------------------------------- |
| Command | First line **`CMD: <exact shell line>`**                              |
| Timing  | **`START:`** timestamp, command output, **`END:`** timestamp          |
| Result  | **`EXIT:<code>`** as the **last line of the file** (nothing after it) |

Example persisted log (self-describing; copy this shape):

```sh
LOG=.agents/setup-log/gates/typecheck.log
mkdir -p "$(dirname "$LOG")"
{
  echo "CMD: pnpm exec turbo run typecheck --concurrency=2"
  echo "START: $(date -Iseconds)"
  pnpm exec turbo run typecheck --concurrency=2
  code=$?
  echo "END: $(date -Iseconds)"
  echo "EXIT:$code"
} > "$LOG" 2>&1
code=$(tail -1 "$LOG" | sed 's/^EXIT://')
case "$(tail -1 "$LOG")" in EXIT:[0-9]*) ;; *) echo "bad gate log"; false;; esac
# exit "$code" or act on it; use `tail -n 20 "$LOG"` to inspect output (no live tee stream)
```

If a log file you referenced is **empty**, or the last line is not **`EXIT:<n>`**, re-run and replace the file before scoring. Table rows in setup-log are a summary only.

**OOM-safe fallback:** When the repo's main gate is `pnpm check` (or similar) and it **cannot take flags** and dies from memory pressure, run the **underlying turbo chain explicitly** with `--concurrency=2` and a capped heap (for example `NODE_OPTIONS=--max-old-space-size=4096`, lower if the host requires). Record that exact command in setup-log and in **domain rules / generated repo skills** — never leave a generic `pnpm check` if that is not what you verified.

### A3. Find the gaps

In **improve** mode, audit each existing file and report before you edit:

| Check                      | How                                                                                                                                                                                                                                                |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stale                      | paths that no longer exist, commands that fail, tools the repo no longer uses. Check each path and run each command; do not judge by reading.                                                                                                      |
| Contradictory              | two files giving different commands or rules                                                                                                                                                                                                       |
| Duplicated                 | a paragraph, or three or more lines, repeated across files; keep one home and link to it                                                                                                                                                           |
| Copied shared config       | a local copy of what a published `@zedtech/*` package ships (ESLint preset/boundaries, tsconfig base): replace the copy with the install, thin wrapper only, never copy-paste; verify with the package's verify command                            |
| Too long for always-loaded | root file over about 100 lines, nested file over about 60, skill over about 150; or details only one folder needs                                                                                                                                  |
| Missing trigger            | skills or agents whose `description` does not say when to use them                                                                                                                                                                                 |
| Unenforced                 | prose rules a tool could check. Before calling a rule unenforced, open the lint, type and CI configs and search them for it.                                                                                                                       |
| Missing ladder             | root `AGENTS.md`, or the <!-- if:skill=plan -->`plan` / `implement` / <!-- /if -->`review` skills, does not state the 7-question ladder. Search for the ladder section or the 7 rungs; an existing `AGENTS.md` without it is a gap like any other. |
| Missing product/domain     | no `.agents/product.md`, no `.agents/domain/*.md`, personas still generic, no design voice doc when the repo has UI                                                                                                                                |

In both modes, list **gaps**: repo facts an agent would otherwise get wrong.

## Phase B — Discovery

1. **Mine first.** Summarize business model, customers, journeys, policies, brand, and design signals from README, docs, routes, schema, and content — each claim with `file:line` or mark `UNVERIFIED`.
2. **One batched interview.** Ask **at most eight questions in one message**, only for gaps mining could not close. Suggested set (skip any already answered):

   1. Business model — who pays, for what, and what is out of scope?
   2. Primary customers and integrators?
   3. Top three user journeys (happy path)?
   4. Domain invariants the code must never break?
   5. Money, refund, and cancellation policies?
   6. Brand tone and languages (FR/EN)?
   7. Design system or identity source of truth?
   8. Explicit **non-goals** for the next release?

3. Record answers with **`source: owner`**. List doc vs code conflicts and open questions in `.agents/product.md`.

## Phase C — Build artifacts

Open **`templates/README.md`** in this skill folder (after install: `.agents/skills/setup-ai/templates/README.md`). Copy from the **`templates/`** files below; replace fiction with repo facts. **Personas:** the `setup` preset already installed `.agents/personas.md` from `templates/personas-v2.template.md` — **edit the installed v2 file in place** (do not recopy the template over it).

| Artifact          | Path                                   | Template                                             |
| ----------------- | -------------------------------------- | ---------------------------------------------------- |
| Product summary   | `.agents/product.md`                   | `templates/product.template.md`                      |
| Domain rules      | `.agents/domain/<area>.md`             | `templates/domain/booking.template.md` (rename area) |
| Personas v2       | `.agents/personas.md`                  | edit the installed v2 file in place                  |
| Design / identity | `.agents/design.md`                    | `templates/design.template.md`                       |
| Glossary          | `GLOSSARY.md` or `.agents/glossary.md` | `templates/glossary.template.md`                     |

Each domain file includes **rules, invariants, edge cases**, sources (`file:line` or `source: owner`), a **Status** column (**`current`** = enforced in code today, **`target`** = planned policy), and a **Test** column. For **Test** paths: **open the test file**, confirm it asserts the rule's behavior (not merely a nearby module); use **`no test — flag`** when nothing applies. **`current`** rules must be verified in code; **`target`** rules must not be written as if already enforced.<!-- if:agent=ui-designer --> Use **`ui-designer`** and **`copywriter`** for `design.md` when UI exists.<!-- /if -->

### Domain vs docs reconciliation (after domain files)

Compare **product docs, README, ADRs**, and other policy sources against each `.agents/domain/*.md` file. For every rule or constraint documented outside domain files but **absent** from them (for example business hours or slot length in README only), add a **`current`** row with doc source (`file:line` or `source: owner`) or list it under **Plan gaps** / product open questions — do not leave silent drift.

### State-bearing capabilities (domain coverage)

From **VISION**, **ADRs**, README, and code, **enumerate state-bearing capabilities** — for example **ingestion/sync**, **payments**, **booking**, **auth**, **queues**, and any area where docs describe lifecycle or policy (raw-before-parse, quarantine, trace linkage, refunds, etc.). For **each** capability that has rules in docs, ship **one** `.agents/domain/<area>.md` (or one file with clear sections per capability). If a documented capability has **no** domain file, record **why** in setup-log or product open questions — not silent omission.

**Personas (score 3 path):** add a **Journey tests** column — test path per persona or **`no test — flag`** (see `templates/personas-v2.template.md`). When the journey column names a **route**, the test must exercise that route (e2e or integration); otherwise use **`no test — flag`**. When the cell names a **script or test file**, **open** it and confirm the repo's **main gate** actually runs it (`package.json` scripts, CI workflow) — do not claim a path is part of **`pnpm check`** unless that chain invokes it.

**AGENTS non-negotiables:** for each claim **enforced by** a command (for example `pnpm test`, `pnpm lint`), **open** what that script runs (package.json script, CI job, turbo task). If the command cannot detect the rule (module boundary, policy prose, etc.), move it to the **Unenforced rules** inventory — do not label it enforced.

**Design (score 3 path, multilingual repos):** add **Do / don't by language** with real UI strings from cited screens (`file:line`), not generic placeholders.

**Architecture (score 3 path):** add an **Unenforced rules** inventory to root `AGENTS.md` (or setup-log if `AGENTS.md` is frozen): each prose-only rule, lint proposal or ticket draft line, evidence `file:line`.

### Phase C close — stale adopt sidecars

After you replace a kit placeholder (for example `.agents/personas.md`), a later `npx zedkit-ai setup` may write a `<basename>.kit.md` sidecar that still holds the old fictional template.

Before phase D (or at phase C end):

1. For each `*.kit.md` beside a file you created or heavily edited in phase C, read the sidecar and the user file.
2. When the sidecar is **only** the superseded template placeholder (the user file is the real content now), **delete** the sidecar; keep the user file.
3. Record each deletion in setup-log under **Sidecar cleanup** (path + reason).

Do not delete sidecars that differ materially from the template in ways the user still needs to merge.

## Phase D — Catalog skills

Propose copies from the **`templates/catalog`** folder (each skill folder has `SKILL.md.tmpl`) into `.agents/skills/<name>/SKILL.md` (see **`templates/README.md`**). Customize paths and gate commands. Prefer **domain-change** when money or policy edits are common; **add-migration** when schema changes are frequent; **add-capability** for full-stack features. After adding a repo skill, re-run `npx zedkit-ai setup` (no flags needed) to wire it into provider layers; never `ln` or `cp` by hand.

**Links in repo skills:** paths in `.agents/skills/<name>/SKILL.md` are relative to **that skill folder**. Docs under `.agents/` use **`../../`** — for example `../../domain/booking.md` (domain rules) and `../../product.md` (product summary); rename `booking` to your area. Copy the link shape from **`templates/catalog/domain-change/SKILL.md.tmpl`** (and sibling catalog files). After writing, **`cd`** to the skill directory and run **`test -e`** on every relative link target (or fix the path). Do not use `../domain/…` from a skill folder — that resolves under `.agents/skills/domain/`, not `.agents/domain/`.

| Tier       | Meaning                                          |
| ---------- | ------------------------------------------------ |
| **must**   | Blocks safe work without it; install in this run |
| **should** | High value; install if time allows               |
| **could**  | Nice; note in plan only                          |

Every row states **one-line value** for the owner.

**Deferred high-risk skills (score 3 path):** for each of **add-capability**, **add-migration**, **domain-change** you tier **could** or skip, either install the repo skill in this run **or** add a one-line **stub** in setup-log (`skill: <name> — deferred because …`) with kit root cause if the kit blocked you.

## Plan table (before write)

### Derive touched files from git (required before the plan table)

Do **not** recall paths from memory. Run from the repo root:

```sh
git status --porcelain
git diff --name-only
git diff --cached --name-only
```

Every path that is **modified, created, or staged** before you present the plan — including **`package.json`**, **lockfile**, **root `AGENTS.md`** (ladder append counts as `edit`), **`.prettierignore`**, **provider folders**, and adopt sidecars — gets its **own plan row** with action and OK column. Union git output with paths you **will** create in phase C/D. Missing a git-visible path fails the **zero lost user files** hard gate.

Present one table covering phase A gaps, phase C artifacts, phase D skills, hygiene edits, and **every file the run will touch** (nothing may change outside this table):

| Tier | Artifact / skill | Path | Why (evidence) | Action                         | Value (one line) | OK              |
| ---- | ---------------- | ---- | -------------- | ------------------------------ | ---------------- | --------------- |
| must | …                | …    | …              | create / edit / dedupe / leave | …                | safe / needs OK |

| must | dependency manifest | `package.json` | `git diff` after install adds `@zedtech/zedkit-ai` | edit (dependency added by setup) | Manifest matches kit scripts | safe |
| must | lockfile | `pnpm-lock.yaml` | lockfile drift with `package.json` | edit (dependency added by setup) | Lock matches manifest | safe |
| must | AGENTS ladder | `AGENTS.md` | missing or incomplete 7-question ladder (gap audit) | edit or append | Map + ladder for agents | safe |

**Required rows when they apply (do not omit):**

- **`package.json`** (and the lockfile that changes with it: `pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`, or `bun.lock`) when adding `@zedtech/zedkit-ai` or changing scripts — action **`edit (dependency added by setup)`** when install or adopt changed deps (never **leave** / **unchanged** if `git status` or `git diff` shows them).
- **Root `AGENTS.md`** when appending the **ladder**, replacing placeholders, or linking product/domain docs — **dedicated row**, action **`edit`** or **`append`**, not silent; ladder-only edits still need this row.
- Any **`.prettierignore`**, **provider folder**, or **user-owned** path the install or your writes will touch (including adopt sidecars).

After the owner approves the table, **persist** it as **`PLAN.md`** at the repo root **or** **`.agents/setup-log/plan.md`** (one path; record which in setup-log).

**Appendix (always include):** paste the full **Providers** value table and **Wired:** line from the Providers section.

**Wait for the user's go before writing.** If nobody can answer (non-interactive run), output the table and stop.

## Write shared source and providers

`zedkit-ai init --provider <names>` does the mechanical part; you do the repo-specific part.

| Provider | Layer on top of `AGENTS.md` + `.agents/`                                                                                                                                   |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cursor` | `.cursor/rules/project.mdc` (skip it when an always-on rule exists), `.cursor/skills` link, agents and commands as real-file copies (a linked folder shows up empty there) |
| `claude` | `CLAUDE.md` link, `.claude/{skills,agents,commands}` links (per-skill links and file copies when those paths are already real directories)                                 |
| `codex`  | none: reads `AGENTS.md` and `.agents/skills` directly                                                                                                                      |
| `muse`   | none: reads `.agents/` directly                                                                                                                                            |

- **Root `AGENTS.md`**: start from the kit template if there is none; when one exists, keep it and add the missing ladder section (the same 7 questions as the template). Replace every `<placeholder>` with a verified fact or delete the line. Non-negotiables name how each is enforced. Link `.agents/product.md` and domain docs from the map section.
- **Role and style**: fill it from evidence and owner answers, not taste. Tag owner choices `source: owner`.
- **Nested `AGENTS.md`**: only what differs from the root. Link, do not copy.
- **Repo skills**: folder `.agents/skills/<name>/SKILL.md`. The `description` says when to use it. Steps use this repo's real paths and commands, end with the command that proves the result, and point at an existing example file as the model.<!-- if:skill=rules-upkeep --> Follow `rules-upkeep` for format.<!-- /if -->
- **Subagents**: `.agents/agents/<name>.md`, one-line description, `model` omitted or `inherit`. Read-only unless the job needs writes.
- **Improve mode**: edit in place, smallest change, keep the author's wording where it is correct. Log what changed.

### Plan reconciliation (after Write, before Verify)

Re-run:

```sh
git status --porcelain
git diff --name-only
```

Compare to plan rows in **`PLAN.md`** or **`.agents/setup-log/plan.md`**. **Every changed path needs a matching row.** Any gap goes into the closing report, setup-log **Plan gaps** section, and (if kit-caused) a kit-issue draft — do not treat silent edits as success.

<!-- setup-ai:validate-setup (enable after L1 merges — use if:command=validate-setup): Run `npx zedkit-ai validate --setup` (optional `--plan PLAN.md` or `--plan .agents/setup-log/plan.md`) and fix every issue before the closing report. Every path from `git status --porcelain -uall` must appear in the plan text; directory prefixes with a trailing `/` count; gate logs under `.agents/setup-log/gates/*.log` must start with `CMD:` and end with `EXIT:<n>`. -->

## Verify

- Every command in the written files was run, or is marked `UNVERIFIED` with the reason.
- **Re-open every `file:line` citation** you wrote (product, domain, design, AGENTS.md): read that line range and confirm the text **supports the claim**; fix or delete citations that do not.
- **Paths and tests:** every path you name must exist (`test -e`). Domain **Test** cells use a **real test file path** or the exact phrase **`no test — flag`** — never prose like "booking flow tests" or other invented paths.
- Every link exists: check each one (`test -e`).
- No placeholder like `<Project>` is left.
- `zedkit-ai validate` is clean, the tool folders (`.claude/`, `.cursor/`) resolve, and the `.cursor` copies match `.agents/` (no drift).
- The repo's own lint ignores the installed kit dirs (`.agents/`, provider folders): skills ship helper scripts, and a bare lint run must stay green — run it once to prove it. When Prettier is in use, add the kit paths to `.prettierignore` (approve as a plan row if the CLI printed a `prettier:` hint).
- A fresh reader, or a subagent given only the new files, can answer: what does this product do, what are the refund rules, how do I run the tests, where does X live, what must I never do here?

## Phase E — Score and learn

If the run may be **cut short** (time, OOM, or a long main gate): still attempt Phase E **first as a minimal closing report** — append the **setup-log entry** (scores stub + gate table below) **before** starting the heaviest gate; run the **main gate last** (or in the background) and update the log when it finishes.

Short report first: what you created or changed, what you left alone and why, findings not fixed, everything marked `UNVERIFIED`.

Then:

1. **Self-score** — open `templates/setup-rubric.md` and score 0–3 on each of the 10 axes. Cite evidence per axis (file path, `file:line`, or transcript quote); no evidence means no score above 1. The rubric sets the pass targets and hard gates.
2. **Setup log** — append a retro entry to `.agents/setup-log.md` from `templates/setup-log.template.md`: date, what worked, what hurt, **Providers table + Wired**, scores, decisions (`source: owner` where the owner chose), **Sidecar cleanup**, gate outcomes (see template), open kit frictions.
3. **Kit friction** — for **each** friction you observed (stale sidecar, validate gap, tool detour, bad gate log format, **missing plan row**, plan/git mismatch, intro not first, broken repo-skill links, …), draft **one** public-safe issue from `templates/kit-issue.template.md` with **Kit root cause** filled; map friction → kit file → fix. **Kit file** must be a path that **exists** in the kit tree — run **`test -e`** on `packages/ai/kit/…` in the kit monorepo or on the installed `@zedtech/zedkit-ai/kit/…` path; use **`grep`** / **`rg`** on the kit tree when unsure. Write **`UNVERIFIED: <why>`** only when the path truly cannot be confirmed. **Completion defects count** (log missing `CMD:`/`EXIT:`, prettier appended after `EXIT:`). If there were zero frictions, say so in the log — do not skip the checklist.

<!-- setup-ai:validate-setup (enable after L1 merges — use if:command=validate-setup): Before the closing report, run `npx zedkit-ai validate --setup` and fix every issue. -->

4. **Re-audit cadence** — set the next check: after the next release, or when product, domain rules, or providers change; record the trigger in the log entry.

**Phase E checklist (before you finish):**

- [ ] Providers value table + **Wired:** in setup-log
- [ ] Plan rows cover **`git status` / `git diff --name-only`** after Write (or **Plan gaps** documented)
- [ ] Gate log files: **`CMD:`** first line, **`EXIT:<code>`** last line (separate files per command)
- [ ] Repo skill links: from each `.agents/skills/*/`, **`test -e`** every relative markdown link target
- [ ] One kit-issue draft per friction (or explicit "none"); each **Kit file** verified or **`UNVERIFIED`**
- [ ] Sidecar cleanup recorded if any `*.kit.md` removed
- [ ] Self-score mean and hard gates noted

For a bigger follow-up task, give your agent the goal in one line<!-- if:skill=orchestrate --> and point it at the **`orchestrate`** skill<!-- /if -->.

## Workspace mode

For a multi-repo workspace root (a folder or meta repo holding several
separate git checkouts). The root gets a workspace setup, not a repo setup;
each child keeps its own.

- **Inventory each child** (read-only): path, git remote, stack, package
  manager, real commands (run the read-only ones to verify), and whether
  it already has `AGENTS.md` or rules of its own. One row per repo.
- **Map cross-repo dependencies from evidence**: manifests depending on a
  sibling's package name, git remotes in the same group, docs and CI
  referencing another child, shared tooling and scripts. Write them as a
  small table in the root `AGENTS.md`; if the workspace already has a map
  doc, put the table there and link it from `AGENTS.md`.
- **Root `AGENTS.md` says**: this is a workspace of separate checkouts;
  work inside one repo at a time; the nested `AGENTS.md` wins over the
  root; which repo owns what; visibility rules (which repos are public or
  private, and what may reference what); how to sync every checkout;
  and the 7-question ladder (same section as the kit template).
- **Children are proposals, not targets**: for each child without a setup,
  propose running `setup-ai` inside it. Never write inside a child repo
  without asking, and never audit child files from the root as if the root
  owned them.

Example: a `workspace/` root holding `services-api/` and `services-web/`
(each with its own `.git`) gets a root `AGENTS.md` declaring the workspace,
a two-row inventory, and:

| Repo           | Depends on     | Evidence                                                   |
| -------------- | -------------- | ---------------------------------------------------------- |
| `services-web` | `services-api` | `package.json` needs `@example/api-client`, same git group |
