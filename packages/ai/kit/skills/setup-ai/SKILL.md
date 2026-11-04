---
name: setup-ai
description: "Set up or improve this repo's AI setup from what the repo actually contains: explores code, docs and CI, runs a short discovery interview, then writes or upgrades AGENTS.md, product/domain/design artifacts, nested rules, and repo-specific skills. Use when asked to set up AI, onboard agents, audit or improve existing agent instructions, or after installing the kit. Takes provider names (setup-ai cursor claude); with none, asks once which providers to wire."
---

# Setup AI

Make the AI setup of **this** repo true and specific. Generic advice is already in the kit; your job is what only this repo can say: its product, domain rules, commands, layout, traps, and repeated workflows.

## Tell the user first

When `/setup-ai` starts (or the user asks to set up AI), say this in plain language before phase A — no interview yet:

- **Modes:** **fresh** (little or no agent setup yet) or **improve** (you already have `AGENTS.md`, rules, or provider folders — audit and extend, do not replace blindly).
- **Phases:** **A** audit (inventory + parallel explore + gaps) → **B** discovery (mine docs and code, then **one batched interview of at most 8 questions**) → **C** build deep artifacts from kit templates → **D** propose repo skills from the catalog → write provider layers, verify, report.
- **What they get:** verified root `AGENTS.md`, `.agents/product.md`, domain rules under `.agents/domain/`, `.agents/personas.md`, `.agents/design.md` when the repo has UI, nested rules where folders differ, optional repo-specific skills and subagents, and thin Cursor/Claude layers that match `.agents/`.
- **Time:** about **15–45 minutes** for a typical app repo; large monorepos or workspace roots can take longer. They approve the plan before writes; in phase B they **answer or delegate the batched interview** (do not skip it). One extra provider question only when wiring is unclear.

## Phases (whole run)

| Phase | Name      | What happens                                                                              |
| ----- | --------- | ----------------------------------------------------------------------------------------- |
| **A** | Audit     | Inventory, parallel explore, gap list (provider-neutral)                                  |
| **B** | Discovery | Mine README, docs, vision, routes, schema; then **one batched interview** (≤ 8 questions) |
| **C** | Build     | Deep artifacts under `.agents/` from kit templates (evidence + owner answers)             |
| **D** | Skills    | Propose repo skills from the kit **catalog**; tier the plan (must / should / could)       |
| **—** | Write     | Shared source, provider layers, verify, report, self-improvement                          |

Two modes, decided in phase A step 1: **fresh** (little or nothing exists) and **improve** (a setup exists: keep it, fix it, extend it).

One shared source, then thin provider layers. Phases **A–D** are provider-neutral. Write the shared source first (`AGENTS.md`, `.agents/`), then wire only the chosen providers. Providers: `cursor`, `claude`, `codex`, `muse`.

## Rules for the whole run

- **Evidence only.** Every command, path, version and convention you write comes from a file you opened or a command you ran (see `ground-truth`). Mark the rest `UNVERIFIED` or leave it out.
- **Owner answers.** Text that comes from the interview or explicit owner reply is tagged **`source: owner`** on the same line or table row (discovery axis in the setup scorecard).
- **Additive.** Never delete or rewrite the user's existing text without asking. Propose, then apply what they accept.
- **Setup depth.** When the repo uses preset **`setup`** or the owner asked for product/domain depth, fill the artifact table in phase C and propose catalog skills in phase D even if a workflow appeared only once so far. Outside that, keep **`ponytail`** minimalism (no skill for a one-off).
- **Prefer enforcement to prose.** If a linter, type check, test or CI job can enforce a rule, configure that and mention it in one line. Prose is for what tools cannot check.
- A public repo gets no private names, customer data or internal URLs in any file you write.

## Phase A — Audit

### A1. Inventory what exists

List, with paths: `AGENTS.md` (root and nested), `CLAUDE.md`, `GEMINI.md`, `.cursor/rules`, `.cursorrules`, `.github/copilot-instructions.md`, `.agents/`, `.claude/`, `.cursor/`, `.codex/`, `CONTRIBUTING.md`, PR and issue templates, `CODEOWNERS`, `GLOSSARY.md`, `docs/vision`, product/marketing content, route trees, schema/migrations.

- Nothing or only boilerplate: **fresh**. Run `zedkit-ai init` (preset **`setup`** when depth is wanted) if the kit is not installed yet and continue.
- Anything real: **improve**. Read all of it first. Note what each file is for and which tool reads it.
- Audit only files the repo owns. A vendored or symlinked kit (for example `.agents/skills` pointing into a package) is listed once and not audited.
- Note uncommitted changes. Treat the current working state as the baseline and do not revert anything.
- Settle the providers: the names given after `setup-ai` win; otherwise reuse the providers the repo already wires (`.cursor/`, `.claude/`, `CLAUDE.md`, docs saying so). If neither tells you, ask exactly one question — which of cursor, claude, codex, muse (several allowed) — before writing; with nobody to ask, wire all four.
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

Then **run the gate commands you found**, preferring forms without side effects (note any that write build output). Judge a command by its exit code, not by parsed output. A command that fails is a finding, not something to hide. Invoke **`product-director`** when the repo has a customer-facing product; **`domain-modeling`** when glossary or policy language is unclear.

### A3. Find the gaps

In **improve** mode, audit each existing file and report before you edit:

| Check                      | How                                                                                                                                                                                                                     |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stale                      | paths that no longer exist, commands that fail, tools the repo no longer uses. Check each path and run each command; do not judge by reading.                                                                           |
| Contradictory              | two files giving different commands or rules                                                                                                                                                                            |
| Duplicated                 | a paragraph, or three or more lines, repeated across files; keep one home and link to it                                                                                                                                |
| Copied shared config       | a local copy of what a published `@zedtech/*` package ships (ESLint preset/boundaries, tsconfig base): replace the copy with the install, thin wrapper only, never copy-paste; verify with the package's verify command |
| Too long for always-loaded | root file over about 100 lines, nested file over about 60, skill over about 150; or details only one folder needs                                                                                                       |
| Missing trigger            | skills or agents whose `description` does not say when to use them                                                                                                                                                      |
| Unenforced                 | prose rules a tool could check. Before calling a rule unenforced, open the lint, type and CI configs and search them for it.                                                                                            |
| Missing ladder             | root `AGENTS.md`, or the `plan` / `implement` / `review` skills, does not state the 7-question ladder. Search for the ladder section or the 7 rungs; an existing `AGENTS.md` without it is a gap like any other.        |
| Missing product/domain     | no `.agents/product.md`, no `.agents/domain/*.md`, personas still generic, no design voice doc when the repo has UI                                                                                                     |

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

Open **`templates/README.md`** in this skill folder (after install: `.agents/skills/setup-ai/templates/README.md`). Copy from the **`templates/`** files below; replace fiction with repo facts.

| Artifact          | Path                                   | Template                                             |
| ----------------- | -------------------------------------- | ---------------------------------------------------- |
| Product summary   | `.agents/product.md`                   | `templates/product.template.md`                      |
| Domain rules      | `.agents/domain/<area>.md`             | `templates/domain/booking.template.md` (rename area) |
| Personas v2       | `.agents/personas.md`                  | `templates/personas-v2.template.md`                  |
| Design / identity | `.agents/design.md`                    | `templates/design.template.md`                       |
| Glossary          | `GLOSSARY.md` or `.agents/glossary.md` | `templates/glossary.template.md`                     |

Each domain file includes **rules, invariants, edge cases**, sources (`file:line` or `source: owner`), and a **Test** column (test path or `no test — flag`). Use **`ui-designer`** and **`copywriter`** for `design.md` when UI exists.

## Phase D — Catalog skills

Propose copies from **`templates/catalog/`** (each skill folder has `SKILL.md.tmpl`) into `.agents/skills/<name>/SKILL.md` (see **`templates/README.md`**). Customize paths and gate commands. Prefer **domain-change** when money or policy edits are common; **add-migration** when schema changes are frequent; **add-capability** for full-stack features.

| Tier       | Meaning                                          |
| ---------- | ------------------------------------------------ |
| **must**   | Blocks safe work without it; install in this run |
| **should** | High value; install if time allows               |
| **could**  | Nice; note in plan only                          |

Every row states **one-line value** for the owner.

## Plan table (before write)

Present one table covering phase A gaps, phase C artifacts, phase D skills, and hygiene edits:

| Tier | Artifact / skill | Path | Why (evidence) | Action                         | Value (one line) | OK              |
| ---- | ---------------- | ---- | -------------- | ------------------------------ | ---------------- | --------------- |
| must | …                | …    | …              | create / edit / dedupe / leave | …                | safe / needs OK |

**Wait for the user's go before writing.** If nobody can answer (non-interactive run), output the table and stop.

## Write shared source and providers

`zedkit-ai init --provider <names>` does the mechanical part; you do the repo-specific part.

| Provider | Layer on top of `AGENTS.md` + `.agents/`                                                                                                                                   |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cursor` | `.cursor/rules/project.mdc` (skip it when an always-on rule exists), `.cursor/skills` link, agents and commands as real-file copies (a linked folder shows up empty there) |
| `claude` | `CLAUDE.md` link, `.claude/{skills,agents,commands}` links                                                                                                                 |
| `codex`  | none: reads `AGENTS.md` and `.agents/skills` directly                                                                                                                      |
| `muse`   | none: reads `.agents/` directly                                                                                                                                            |

- **Root `AGENTS.md`**: start from the kit template if there is none; when one exists, keep it and add the missing ladder section (the same 7 questions as the template). Replace every `<placeholder>` with a verified fact or delete the line. Non-negotiables name how each is enforced. Link `.agents/product.md` and domain docs from the map section.
- **Role and style**: fill it from evidence and owner answers, not taste. Tag owner choices `source: owner`.
- **Nested `AGENTS.md`**: only what differs from the root. Link, do not copy.
- **Repo skills**: folder `.agents/skills/<name>/SKILL.md`. The `description` says when to use it. Steps use this repo's real paths and commands, end with the command that proves the result, and point at an existing example file as the model. Follow `rules-upkeep` for format.
- **Subagents**: `.agents/agents/<name>.md`, one-line description, `model` omitted or `inherit`. Read-only unless the job needs writes.
- **Improve mode**: edit in place, smallest change, keep the author's wording where it is correct. Log what changed.

## Verify

- Every command in the written files was run, or is marked `UNVERIFIED` with the reason.
- Every path and link exists: check each one (`test -e`).
- No placeholder like `<Project>` is left.
- `zedkit-ai validate` is clean, the tool folders (`.claude/`, `.cursor/`) resolve, and the `.cursor` copies match `.agents/` (no drift).
- The repo's own lint ignores the installed kit dirs (`.agents/`, provider folders): skills ship helper scripts, and a bare lint run must stay green — run it once to prove it.
- A fresh reader, or a subagent given only the new files, can answer: what does this product do, what are the refund rules, how do I run the tests, where does X live, what must I never do here?

## Report and self-improvement

Short report: what you created or changed, what you left alone and why, findings not fixed, everything marked `UNVERIFIED`.

Then:

1. **Self-score** — score 0–3 on each axis: discovery, personas, domain rules, design/identity, architecture, gates verified, skills relevance, provider parity, UX friction, self-improvement. Cite evidence per axis. (When the kit ships `setup-rubric.md`, use its definitions.)
2. **`.agents/setup-log.md`** — append a retro entry (date, what worked, what hurt, scores, open kit frictions).
3. **Kit friction** — for each setup friction caused by the kit, draft a short public issue title + body (no private repo names); give the owner the draft to paste.

For a bigger follow-up task, point the user at `/orchestrate` with the goal in one line.

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
