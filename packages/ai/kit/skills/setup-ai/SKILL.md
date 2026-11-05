---
name: setup-ai
description: "Set up or improve this repo's AI setup from what the repo actually contains: reads the code first with parallel read-only subagents, mines docs and CI, runs a short interview on what the code could not answer, then writes or upgrades AGENTS.md, product/domain/design artifacts, nested rules, and repo-specific skills. Use when asked to set up AI, onboard agents, audit or improve existing agent instructions, or after installing the kit. Takes provider names (setup-ai cursor claude); with none, asks once which providers to wire."
---

# Setup AI

**Before ANY tool call** after reading this skill, print the **Tell the user first** block below as the opening text of your reply — no phase A inventory, no subagent spawns, no repo reads, no file writes before it.

**The intro is not a turn boundary.** After printing it, **continue in the same turn without waiting**: go straight into phase A (inventory, explore, gaps) and keep going until you show the plan and the phase B batched interview. Do not end your turn, ask "shall I continue?", or wait for a reply after the intro. The **only** stop points in the whole run are: (1) the **phase B batched interview**, (2) **plan approval before writes**, and (3) the **final report**.

> **Intro text** (print as the opening of your first reply, then keep working in the same turn; replace `{…}` only with what you already know, or keep it generic):
>
> **Modes:** We'll run **fresh** or **improve** for this repo — {one sentence from what you already know or will confirm in phase A}.
> **Phases:** **A** audit → **B** read the code with parallel read-only subagents, then one batched interview (≤ 8 questions, only what the code cannot answer) → **C–D** artifacts and repo skills → write, verify, report → **E** score and learn.
> **What you get / time:** Verified `AGENTS.md`, `.agents/` product, domain rules read from the code, personas, design when UI exists, nested `AGENTS.md` where folders differ, model routing for your provider, and thin provider layers — about **15–45 minutes** typical; you approve the plan before writes and answer the batched interview in phase B.

Make the AI setup of **this** repo true and specific. Generic advice is already in the kit; your job is what only this repo can say: its product, domain rules, commands, layout, traps, and repeated workflows.

## Tell the user first

**Output order:** This block is the **first output after `/setup-ai` starts** (the opening text of your first reply once the skill is loaded) — before phase A inventory, subagent spawns, or file writes — including **headless**, **CI**, and **non-interactive** runs. Paste it as plain text; never skip it because nobody is chatting live. **Do not** open with "Running phase A…", inventory lists, or tool calls — the intro **is** phase A's start from the user's perspective. Once it is printed, **immediately continue with phase A in the same turn** — do not stop or wait for the user after the intro. **Exclude** mechanical install output that ran **before** the skill loaded (for example `npx zedkit-ai setup` or package manager lines); those stay above this block in the transcript.

**Resume:** when a plan or setup-log from an earlier run already exists, the intro is resume-aware: its first line says `resumed at phase <X>` (the actual resume point), not the fresh-start "straight into phase A" wording.

When `/setup-ai` starts (or the user asks to set up AI), say this in plain language before phase A — no interview yet, and no pause after it:

- **Modes:** **fresh** (little or no agent setup yet) or **improve** (you already have `AGENTS.md`, rules, or provider folders — audit and extend, do not replace blindly).
- **Phases:** **A** audit (inventory + parallel explore + gaps) → **B** discovery (parallel read-only subagents read the code and report the rules already in place with file evidence; mine docs; then **one batched interview of at most 8 questions**, only on what the code did not answer) → **C** build deep artifacts from kit templates → **D** propose repo skills from the catalog → write provider layers, verify, report → **E** score and learn.
- **What they get:** verified root `AGENTS.md`, `.agents/product.md`, domain rules under `.agents/domain/` read from the code, `.agents/personas.md`, `.agents/design.md` with identity rules when the repo has UI, nested `AGENTS.md` where folders differ, `.agents/model-routing.md` (cheap models read, the strong model decides), optional repo-specific skills and subagents, and thin Cursor/Claude layers that match `.agents/`.
- **Time:** about **15–45 minutes** for a typical app repo; large monorepos or workspace roots can take longer. They approve the plan before writes; in phase B they **answer or delegate the batched interview** (do not skip it). Asking **which** providers to wire is optional when names are already known; **recording all four provider values** (see Providers) in the plan and setup-log is **not** optional.

## Phases (whole run)

| Phase | Name            | What happens                                                                                                        |
| ----- | --------------- | ------------------------------------------------------------------------------------------------------------------- |
| **A** | Audit           | Inventory, parallel explore, gap list (provider-neutral)                                                            |
| **B** | Discovery       | **Read the code** with parallel read-only readers; mine docs; **one batched interview** (≤ 8 questions) on the gaps |
| **C** | Build           | Domain, identity, nested `AGENTS.md`, model routing from kit templates (evidence + owner answers)                   |
| **D** | Skills          | Propose repo skills from the kit **catalog**; tier the plan (must / should / could)                                 |
| **—** | Write           | Shared source, provider layers, verify, report                                                                      |
| **E** | Score and learn | Self-score against the rubric, setup-log retro, kit-issue drafts, re-audit cadence                                  |

Two modes, decided in phase A step 1: **fresh** (little or nothing exists) and **improve** (a setup exists: keep it, fix it, extend it).

One shared source, then thin provider layers. Phases **A–D** are provider-neutral. Write the shared source first (`AGENTS.md`, `.agents/`), then wire only the chosen providers. Providers: `cursor`, `claude`, `codex`, `muse`.

## Rules for the whole run

- **Evidence only.** Every command, path, version and convention you write comes from a file you opened or a command you ran (see `ground-truth`). Mark the rest `UNVERIFIED` or leave it out.
- **Read before asking.** Rules come from the code first (phase B1 readers, `file:line` evidence); the owner is asked only what the code cannot say, and confirms the rest.
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

## Model routing (whole run)

Without routing, every subagent inherits the session's model: start under the strongest model and the whole run, readers included, is billed at that price. Route by **tier**, on the provider this run executes on.

1. **Detect the running provider** from your own tool list and the spawn tool's schema (not from which provider folders the repo wires): `cursor`, `claude`, `codex` or `muse`. Not sure: say so and treat it as no routing available.
2. **List the models the tool accepts** (the spawn tool's model parameter or the tool's own listing). Never pin an id you did not see listed.
3. **Assign tiers**, and map the repo's own subagents to them too (a facts-only explorer is a scout; a builder is a worker; a reviewer or boundary guard is a lead). **scout** (cheapest fast model): phase A explorers, phase B readers, link and path checks, read-only gate runs. **worker** (mid): drafting from settled evidence. **lead** (the session's strong model): synthesis, conflicts, interview, plan, money and policy decisions, consistency pass, scoring, final report.
4. **Pass the model on every spawn**; leaving it out means inherit, and inherit means the strong model. If the tool cannot pick per spawn, say so, keep `inherit`, and use fewer, narrower readers.
5. **Record it:** provider, model list source, tier to model mapping and the tier of each fan-out go in the plan appendix and the setup-log entry (fields `Routing`, `Reading`).
6. **Write it into the repo** (phase C): `.agents/model-routing.md` from `templates/model-routing.template.md`, and a short **Model routing** section in root `AGENTS.md` pointing at it, so later agent work in this repo follows the same tiers.

A scout reports evidence and never decides; the lead never reads a whole slice when a scout can.

## Phase A — Audit

### A1. Inventory what exists

List, with paths: `AGENTS.md` (root and nested), `CLAUDE.md`, `GEMINI.md`, `.cursor/rules`, `.cursorrules`, `.github/copilot-instructions.md`, `.agents/`, `.claude/`, `.cursor/`, `.codex/`, `CONTRIBUTING.md`, PR and issue templates, `CODEOWNERS`, `GLOSSARY.md`, `docs/vision`, product/marketing content, route trees, schema/migrations.

- Nothing or only boilerplate: **fresh**. Run `zedkit-ai init` (preset **`setup`** when depth is wanted) if the kit is not installed yet and continue.
- Anything real: **improve**. Read all of it first. Note what each file is for and which tool reads it.
- Audit only files the repo owns. A vendored or symlinked kit (for example `.agents/skills` pointing into a package) is listed once and not audited.
- Note uncommitted changes. Treat the current working state as the baseline and do not revert anything.
- **Provider-scoped rules and run budgets.** List every rule or skill file the repo owns for one provider: `.cursor/rules/*.mdc` (note each `globs:`), `<folder>/.cursor/rules` and `skills`, `.claude/rules`. Other providers never see them. Also note any **run budget** in an always-on rule or `AGENTS.md` (time, files read, retries, diff size): the readers obey it. Both feed the reading log (rule map, reader budget).
- Settle the providers: the names given after `setup-ai` win; otherwise reuse the providers the repo already wires (`.cursor/`, `.claude/`, `CLAUDE.md`, docs saying so). If neither tells you, ask exactly one question — which of cursor, claude, codex, muse to **wire** (several allowed) — before writing; with nobody to ask, wire all four. **Regardless, copy the full Providers value table into the plan and setup-log.**
- Workspace check: two or more child directories that are themselves git checkouts, or a manifest listing member projects, means a multi-repo workspace root: switch to Workspace mode below instead of phases B–D.

### A2. Explore in parallel

Launch read-only `explorer` subagents on the **scout** tier (see Model routing) in one batch, one question each, with the brief format of `parallel-work`. Ask each to return `file:line` evidence and nothing else. If you cannot spawn subagents, ask the same questions yourself, one after the other.

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

**Ignored logs:** gate logs under an ignored path (check with `git check-ignore <log>`) are invisible evidence — either track the file (`git add -f`, or narrow the ignore rule so `gates/*.log` is tracked) or mark the Gate outcomes row `ignored-locally` so the scorer knows. Do not rename logs to dodge the ignore: `validate --setup` only reads `*.log`.

**Killed gates:** when the wrapper shell itself may be signaled (a timeout or OOM kill aimed at the process group), trap `TERM`/`INT` so the log still ends with a cause and **`EXIT:<code>`** — `validate --setup` accepts extra lines like `CAUSE:` between `END:` and `EXIT:`. Put the trap after `START:`, before the command, and disarm it with `trap - TERM INT` once the command returns:

```sh
trap 'echo "END: $(date -Iseconds)"; echo "CAUSE: killed by signal"; echo "EXIT:143"; exit 143' TERM INT
```

A `SIGKILL`ed wrapper cannot trap — re-run smaller (see below) and replace the file.

**OOM-safe fallback:** When the repo's main gate is `pnpm check` (or similar) and it **cannot take flags** and dies from memory pressure, run the **underlying turbo chain explicitly** with `--concurrency=2` and a capped heap (for example `NODE_OPTIONS=--max-old-space-size=4096`, lower if the host requires). Record that exact command in setup-log and in **domain rules / generated repo skills** — never leave a generic `pnpm check` if that is not what you verified.

### A3. Find the gaps

In **improve** mode, audit each existing file and report before you edit:

| Check                      | How                                                                                                                                                                                                                                                |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stale                      | paths that no longer exist, commands that fail, tools the repo no longer uses. Check each path and run each command; do not judge by reading.                                                                                                      |
| Contradictory              | two files giving different commands or rules                                                                                                                                                                                                       |
| Duplicated                 | a paragraph, or three or more lines, repeated across files; keep one home and link to it                                                                                                                                                           |
| Copied shared config       | a local copy of what a published `@zedtech/*` package ships (ESLint preset/boundaries, tsconfig base): replace the copy with the install, thin wrapper only, never copy-paste; verify with the package's verify command                            |
| Too long for always-loaded | root file over about 100 lines, nested file over about 60, skill over about 150; or details only one folder needs; fix by moving inventories to setup-log, root keeps pointers                                                                     |
| Missing trigger            | skills or agents whose `description` does not say when to use them                                                                                                                                                                                 |
| Unenforced                 | prose rules a tool could check. Before calling a rule unenforced, open the lint, type and CI configs and search them for it.                                                                                                                       |
| Missing ladder             | root `AGENTS.md`, or the <!-- if:skill=plan -->`plan` / `implement` / <!-- /if -->`review` skills, does not state the 7-question ladder. Search for the ladder section or the 7 rungs; an existing `AGENTS.md` without it is a gap like any other. |
| Missing product/domain     | no `.agents/product.md`, no `.agents/domain/*.md`, personas still generic, no design voice doc when the repo has UI                                                                                                                                |
| Missing nested rules       | folders with their own rules or traps (features, ui, design, api, db) and no nested `AGENTS.md`, or nested files that are stubs and never point at `.agents/domain` or `.agents/design`                                                            |
| Missing model routing      | no `.agents/model-routing.md`, or root `AGENTS.md` does not say which tier does reading and which does decisions                                                                                                                                   |
| Missing signature pointer  | a visual signature spec or identity state-matrix test exists, and no nested AGENTS.md points at them. Link the files; do not copy the spec into always-loaded files.                                                                               |

In both modes, list **gaps**: repo facts an agent would otherwise get wrong.

## Phase B — Discovery

Order: **B1 read the code**, **B2 mine the docs**, **B3 interview on the gaps**. Phases A and B1–B2 run in the same turn with no stop; the only stop is the B3 interview.

### B1. Read the code (parallel read-only readers)

The owner should not be asked what the code already says. Before any interview question, spawn readers that find the rules already in place.

1. **Size and slice.** Run `npx zedkit-ai scan` (list, then cut, tracked and untracked files). It prints the size class, the reader count and one slice per reader. Without the CLI, count `git ls-files` and use the table, cutting by top-level folder or workspace package:

| Repo size                | Readers        |
| ------------------------ | -------------- |
| small (under ~300 files) | 1–5            |
| medium (~300–2000 files) | 6–10           |
| large (over ~2000 files) | 11–20 (cap 20) |

2. **Respect the repo's own budgets.** A run budget found in A1 (for example "stop after 5 files read with no write", one broad pass, 30 minutes) caps every reader: cut slices smaller (up to 20 readers) and read entry points first rather than exceed it; if it still cannot fit, that is an interview gap, not a license to overrun: the only exception is owner-approved, recorded in reading.md (reader, files read vs budget, approving interview question).
3. **Spawn one reader per slice, in one batch** (waves of the tool's parallel limit if it has one), on the **scout** tier, each with the brief from `templates/reader-brief.template.md` filled in. Readers are read-only: no writes, no installs. Each returns rules with `path:line` evidence across six lanes: **domain**, **business**, **identity**, **architecture**, **convention**, **enforcement**; plus conflicts, owner-only gaps and folder notes. If you cannot spawn subagents, read the slices yourself one after the other with the same brief and the same log.
4. **Check what each rule says (adversarial pass).** A citation proves the line exists, not that the rule matches it. Spawn a second reader per slice, on the **scout** tier and not the reader that wrote the rules, with `templates/rule-check-brief.template.md`: it gets only the rule text and its `path:line`, opens the cited line **and the whole enclosing function, transaction or handler** (one hop into what it calls when the rule is about order, atomicity, timing, retries or who calls whom), and returns `match`, `partial` or `mismatch` with one phrase for what the code does. Never sample a rule that says _after_, _before_, _same transaction_, _atomic_, _retry_, _idempotent_, _exactly once_, _at most once_, _within <time>_, _only when_: every one is checked. Example of a mismatch the check exists for: a doc says "the event is enqueued after commit", while the cited handler stores the event and writes the outbox row in the **same** transaction.
5. **Synthesize on the lead tier.** Merge and dedupe; open at least three cited lines per reader and drop any rule the line does not support (and re-read a reader whose spot-checks fail). For each `partial` or `mismatch`, rewrite the rule to what the code does (resolution `rewritten`), drop it (`dropped`), or keep the doc's claim as a code vs docs conflict (`conflict`); never merge a rule the check contradicted. Mark each rule `current`, `target` or `UNVERIFIED`; list code vs docs conflicts; collect the folder notes that need a nested `AGENTS.md`.
6. **Map what already exists.** Fill the **Rule map** (every provider-scoped rule file from A1, by full path: kept as owner, mirrored by a nested `AGENTS.md` pointer, or not a rule) and the **Policy docs** table (each playbook, ADR, vision or runbook that states rules lands in a domain, design or nested file, or is `not a rule: <reason>`). Do not copy a rule from its owner into `.agents/`: one law, one owner; point at it.
7. **Persist** the result as `.agents/setup-log/reading.md` from `templates/reading-log.template.md`: one numbered row per reader, the rule map, the policy docs, the merged rules, the **meaning check** (one row per checked rule: verdict, what the code does, resolution), the interview gaps, and the "found in code, confirm" list. `npx zedkit-ai validate --setup` checks that the log exists, that the reader count fits the repo size, that it cites `file:line`, that it states the run budget, that every order or atomicity rule has a meaning-check row, that no `mismatch` or `partial` is left unresolved, and that its rule map names every provider rule file.

### B2. Mine the docs

Summarize business model, customers, journeys, policies, brand, and design signals from README, docs, routes, schema, and content — each claim with `file:line` or mark `UNVERIFIED`. Reconcile with the readers' rules: a doc claim the code does not follow is a conflict, not a rule.

### B3. One batched interview, only on the gaps

1. **Ask only what the code could not answer.** Start from the interview gaps in the reading log: intent behind a rule (rule or accident?), policy that lives in nobody's code, code vs docs conflicts, `target` rules, non-goals. Cite the gap id with each question.
2. **One batched interview.** Ask **at most eight questions in one message**, only for gaps the readers and mining could not close. Show what the code already answered as **"found in code — confirm?"** lines in the same message (not counted as questions); the owner confirms or corrects them. Suggested set (skip any the readers answered with evidence and use the slot for the highest-value open gap):

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

| Artifact          | Path                                          | Template                                             |
| ----------------- | --------------------------------------------- | ---------------------------------------------------- |
| Product summary   | `.agents/product.md`                          | `templates/product.template.md`                      |
| Domain rules      | `.agents/domain/<area>.md`                    | `templates/domain/booking.template.md` (rename area) |
| Nested rules      | `<folder>/AGENTS.md` per folder that differs  | `templates/nested-agents.template.md`                |
| Model routing     | `.agents/model-routing.md`                    | `templates/model-routing.template.md`                |
| Personas v2       | `.agents/personas.md`                         | edit the installed v2 file in place                  |
| Design / identity | `.agents/design.md` (with **Identity rules**) | `templates/design.template.md`                       |
| Glossary          | `GLOSSARY.md` or `.agents/glossary.md`        | `templates/glossary.template.md`                     |

**Rules come from the reading log** (`.agents/setup-log/reading.md`), not from the templates: every merged rule lands in exactly one home (domain file for `domain` and `business` lanes, `design.md` **Identity rules** for `identity`, a nested `AGENTS.md` for folder-specific `architecture` and `convention`, root `AGENTS.md` for repo-wide ones) and keeps its `file:line` and `source: owner` answers. A repo with money, state or policy in its code and no domain file is an incomplete setup.

Each domain file includes **rules, invariants, edge cases**, sources (`file:line` or `source: owner`), a **Status** column (**`current`** = enforced in code today, **`target`** = planned policy), and a **Test** column. For **Test** paths: **open the test file**, confirm it asserts the rule's behavior (not merely a nearby module); use **`no test — flag`** when nothing applies. **`current`** rules must be verified in code; **`target`** rules must not be written as if already enforced.<!-- if:agent=ui-designer --> Use **`ui-designer`** and **`copywriter`** for `design.md` when UI exists.<!-- /if -->

### Nested AGENTS.md (after domain files)

Use the readers' **folder notes**. Write one `<folder>/AGENTS.md` (`templates/nested-agents.template.md`) for each folder whose rules, boundaries or traps differ from the root: features, ui, design, api, db, jobs, tests. Only what differs, link to the domain and design files, under about 60 lines, every rule with `file:line`. With Cursor wired, add a `.cursor/rules/<folder>.mdc` (globs on the folder) that only points at the nested file. **Provider-scoped rules:** a rule file only one provider reads (Cursor `.mdc` with `globs:`, a folder's own `.cursor/rules`) gets a nested `AGENTS.md` at its folder with a one-line summary and a pointer, so the other providers find it; the rule file stays the owner and is never copied (one law, one owner). **Improve mode:** nested files the repo already has are audited in A3, then **extended in place**: add the folder's rules the readers found, a link to the matching `.agents/domain/` and `.agents/design.md` files, and `file:line` evidence; keep the author's wording and never replace the file. Thin stubs (a few lines, no rules, no pointer to `.agents/`) are the usual gap. A repo with no folder that differs, or whose files you deliberately keep, records `nested-agents: none — <reason>` or `nested-agents: kept — <reason>` in the setup-log instead.

### Model routing (after nested files)

Write `.agents/model-routing.md` from `templates/model-routing.template.md` with the provider, the model list and the tiers you actually used in this run (see **Model routing** above), then add a short **Model routing** section to root `AGENTS.md`: three lines (reading and inventory go to the scout tier, synthesis and decisions to the lead, the file to read). Plan rows for both.

### Domain vs docs reconciliation (after domain files)

Compare **product docs, README, ADRs**, and other policy sources against each `.agents/domain/*.md` file. For every rule or constraint documented outside domain files but **absent** from them (for example business hours or slot length in README only), add a **`current`** row with doc source (`file:line` or `source: owner`) or list it under **Plan gaps** / product open questions — do not leave silent drift.

### State-bearing capabilities (domain coverage)

From **VISION**, **ADRs**, README, and code, **enumerate state-bearing capabilities** — for example **ingestion/sync**, **payments**, **booking**, **auth**, **queues**, and any area where docs describe lifecycle or policy (raw-before-parse, quarantine, trace linkage, refunds, etc.). For **each** capability that has rules in docs, ship **one** `.agents/domain/<area>.md` (or one file with clear sections per capability). If a documented capability has **no** domain file, record **why** in setup-log or product open questions — not silent omission.

**Personas (score 3 path):** add a **Journey tests** column — test path per persona or **`no test — flag`** (see `templates/personas-v2.template.md`). A **positive** test cell (not **`no test — flag`**) must cite a test you **opened** that exercises the **whole** journey in **Key journeys** — every listed route, step, or code path, not a subset. If only part of the journey is covered, use **`no test — flag`** or narrow **Key journeys** to what the test actually hits. When the journey column names a **route**, the test must exercise that route (e2e or integration); when it names a **code path**, unit tests exercising the whole path qualify; otherwise use **`no test — flag`**. When the cell names a **script or test file**, **open** it and confirm the repo's **main gate** actually runs it (`package.json` scripts, CI workflow) — do not claim a path is part of **`pnpm check`** unless that chain invokes it.

**AGENTS and domain enforcement wording:** never write **`enforced by`** (or equivalent) in root **`AGENTS.md`**, nested **`AGENTS.md`**, or **`.agents/domain/*.md`** unless you **opened** that checker (script, CI job, linter rule) and confirmed it **fails when the rule is broken**. Otherwise say **`documented, not enforced`** (or omit enforcement claims). Do **not** list rules that are already enforced (or **partially** enforced — say which part is enforced and which is prose-only) in the **Unenforced rules** inventory; each **genuinely** unenforced rule gets its own row with a **concrete** lint/CI proposal or ticket draft line and evidence `file:line`.

**Design (score 3 path, multilingual repos):** add **Do / don't by language** with real UI strings from cited screens (`file:line`), not generic placeholders.

**Architecture (score 3 path):** add an **Unenforced rules** inventory to setup-log (`.agents/setup-log.md`), not root: root `AGENTS.md` keeps a one-line pointer (`Unenforced rules: see .agents/setup-log.md`) so the file stays under the ~100-line target; inline the table in root only when the owner asks for it. Each **genuinely** prose-only rule only (skip rules already covered by lint/CI/tests, or split partial coverage explicitly), one lint/CI proposal or ticket draft line per row, evidence `file:line`. Never claim **`enforced by`** without opening the checker and verifying it catches violations. Reconcile against every `current` rule in root `AGENTS.md`, nested `AGENTS.md`, and `.agents/domain/*.md`: each genuinely unenforced rule gets a row (cite the domain rule ID, e.g. `B-01`, for domain rules), each row traces to a rule.

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

**Appendix (always include):** paste the full **Providers** value table and **Wired:** line from the Providers section, the **Routing** line (provider, tier to model mapping), the **Reading** line (repo size, reader count, slices from `npx zedkit-ai scan`), and an **Intro-first** line (`intro-first: printed before any tool call (<fresh|improve>)`, or `intro-first: resumed at phase <X>` on a resume) — `npx zedkit-ai validate --setup` checks it is there.

**Wait for the user's go before writing.** If nobody can answer (non-interactive run), output the table and stop.

## Write shared source and providers

`zedkit-ai init --provider <names>` does the mechanical part; you do the repo-specific part.

| Provider | Layer on top of `AGENTS.md` + `.agents/`                                                                                                                                   |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cursor` | `.cursor/rules/project.mdc` (skip it when an always-on rule exists), `.cursor/skills` link, agents and commands as real-file copies (a linked folder shows up empty there) |
| `claude` | `CLAUDE.md` link, `.claude/{skills,agents,commands}` links (per-skill links and file copies when those paths are already real directories)                                 |
| `codex`  | none: reads `AGENTS.md` and `.agents/skills` directly                                                                                                                      |
| `muse`   | none: reads `.agents/` directly                                                                                                                                            |

- **Root `AGENTS.md`**: start from the kit template if there is none; when one exists, keep it and add the missing ladder section (the same 7 questions as the template). Replace every `<placeholder>` with a verified fact or delete the line. Non-negotiables say **`documented, not enforced`** or name a checker you opened and verified — never **`enforced by`** without that proof. Link `.agents/product.md` and domain docs from the map section.
- **Role and style**: fill it from evidence and owner answers, not taste. Tag owner choices `source: owner`.
- **Nested `AGENTS.md`**: one per folder that differs (see phase C), only what differs from the root. Link, do not copy. When identity UI exists, close a **missing signature pointer** by linking the signature spec and state-matrix proof; **do not copy the spec** into always-loaded files.
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

Run **`npx zedkit-ai validate --setup`** (add **`--plan <file>`** if the plan is not **`PLAN.md`** at the repo root or **`.agents/setup-log/plan.md`**) and fix every issue before the closing report; it checks that every **`git status --porcelain -uall`** path is covered by the plan text (a parent folder with a trailing slash counts) and that each **`.agents/setup-log/gates/*.log`** starts with **`CMD:`**, ends with **`EXIT:<code>`**, and is inventoried by name in `.agents/setup-log.md`.

## Verify

- Every command in the written files was run, or is marked `UNVERIFIED` with the reason.
- **Re-open every `file:line` citation** you wrote (product, domain, design, AGENTS.md): read that line range and confirm the text **supports the claim**; fix or delete citations that do not.
- **Paths and tests:** every path you name must exist (`test -e`). Domain **Test** cells use a **real test file path** or the exact phrase **`no test — flag`** — never prose like "booking flow tests" or other invented paths.
- Every link exists: check each one (`test -e`).
- No placeholder like `<Project>` is left.
- `zedkit-ai validate` is clean, the tool folders (`.claude/`, `.cursor/`) resolve, and the `.cursor` copies match `.agents/` (no drift).
- The repo's own lint ignores the installed kit dirs (`.agents/`, provider folders): skills ship helper scripts, and a bare lint run must stay green — run it once to prove it. When Prettier is in use, add the kit paths to `.prettierignore` (approve as a plan row when `scan` or install printed a `prettier:` hint — `validate --setup` requires the row).
- A fresh reader, or a subagent given only the new files, can answer: what does this product do, what are the refund rules, how do I run the tests, where does X live, what must I never do here?

## Phase E — Score and learn

If the run may be **cut short** (time, OOM, or a long main gate): still attempt Phase E **first as a minimal closing report** — append the **setup-log entry** (scores stub + gate table below) **before** starting the heaviest gate; run the **main gate last** (or in the background) and update the log when it finishes. On the normal path do the reverse: capture every gate's persisted output first, write the entry in **one atomic write** (no stub, no progressive appends), and run `validate --setup` only against the finished file — validation reads whatever is on disk, so a half-written log fails on rows you meant to add.

Short report first: what you created or changed, what you left alone and why, findings not fixed, everything marked `UNVERIFIED`.

Then:

1. **Self-score** — open `templates/setup-rubric.md` and score 0–3 on each of the 10 axes. Cite evidence per axis (file path, `file:line`, or transcript quote); no evidence means no score above 1. Compute **mean over the 8 measurable axes (2, 4–10)** only; show **Discovery** and **Domain rules** on a separate **owner-dependent** line (see rubric). Then score the four **depth axes D1–D4** (code reading, domain and identity rules, nested rules, model routing); each must be **>= 2**. The rubric sets pass targets and hard gates.
2. **Setup log** — append a retro entry to `.agents/setup-log.md` from `templates/setup-log.template.md`: date, what worked, what hurt, **Providers table + Wired**, scores, decisions (`source: owner` where the owner chose), **Sidecar cleanup**, gate outcomes (see template), open kit frictions.
3. **Kit friction** — for **each** friction you observed (stale sidecar, validate gap, tool detour, bad gate log format, **missing plan row**, plan/git mismatch, **intro skipped**, broken repo-skill links, …), draft **one** public-safe issue from `templates/kit-issue.template.md` with **Kit root cause** filled; map friction → kit file → fix. **Kit file** must be a path that **`test -e`** confirms in the **installed kit** (`.agents/skills/setup-ai/…` in the repo under setup) or in the **runtime package** (`node_modules/@zedtech/zedkit-ai/kit/…`; kit monorepo authors may use `packages/ai/kit/…`). Use **`grep`** / **`rg`** when unsure. Write **`UNVERIFIED: <why>`** only when no path passes **`test -e`**. **Completion defects count** (log missing `CMD:`/`EXIT:`, prettier appended after `EXIT:`). If there were zero frictions, say so in the log — do not skip the checklist.
4. **Re-audit cadence** — set the next check: after the next release, or when product, domain rules, or providers change; record the trigger in the log entry.
5. **Consistency pass** — re-read **`.agents/domain/*.md`**, **`.agents/personas.md`**, and root **`AGENTS.md`**: **Status** must not contradict enforcement (a rule cannot be **`current`** in the rules table and prose-only in **Unenforced rules** without **`current (documented, not enforced)`** or similar in **Status**); persona **Journey tests** positive cells must match tests you opened against **Key journeys**; no unverified **`enforced by`** lines remain; every `current (documented, not enforced)` domain row is cited by ID in the **Unenforced rules** inventory.

**Phase E checklist (before you finish):**

- [ ] Providers value table + **Wired:** in setup-log, plus the **Routing** and **Reading** lines
- [ ] Depth: `.agents/setup-log/reading.md` (readers scaled to size), `.agents/domain/*.md` with evidence, nested `AGENTS.md` (or `nested-agents: none`), `.agents/model-routing.md` pointed at from root `AGENTS.md`
- [ ] Plan rows cover **`git status` / `git diff --name-only`** after Write (or **Plan gaps** documented)
- [ ] **`npx zedkit-ai validate --setup`** is clean before the closing report (add **`--plan <file>`** when the plan is not **`PLAN.md`** at the repo root or **`.agents/setup-log/plan.md`**)
- [ ] Gate log files: **`CMD:`** first line, **`EXIT:<code>`** last line (separate files per command)
- [ ] Repo skill links: from each `.agents/skills/*/`, **`test -e`** every relative markdown link target
- [ ] One kit-issue draft per friction (or explicit "none"); each **Kit file** **`test -e`** on installed kit or runtime package path, or **`UNVERIFIED`**
- [ ] **Consistency pass:** domain **Status**, persona **Journey tests**, and **`enforced by`** claims aligned (see phase E step 5)
- [ ] Sidecar cleanup recorded if any `*.kit.md` removed
- [ ] Self-score: **mean (8 axes)** >= 2.5 and **owner-dependent axes** (Discovery, Domain rules) reported separately; hard gates noted

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
