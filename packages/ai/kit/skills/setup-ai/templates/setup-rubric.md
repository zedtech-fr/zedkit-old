# Setup rubric

Scores a finished `/setup-ai` run. Used twice: by the agent as a **self-score** at the end of setup, and by an **independent reviewer** who has not seen the run (reads the diff, the transcript and the repo only).

Score each axis 0-3. Cite evidence (file path, `file:line`, or transcript quote) for every score. No evidence, no score above 1.

**Targets:** every axis >= 2, mean >= 2.5. Any 0 or any hard gate failure below fails the run, whatever the mean.

| Score | Meaning                                                                                               |
| ----- | ----------------------------------------------------------------------------------------------------- |
| 0     | Absent, wrong or harmful                                                                              |
| 1     | Present but generic, unverified, or copied from a template                                            |
| 2     | Specific to this repo and evidence-backed; minor gaps                                                 |
| 3     | Specific, verified, owner-confirmed where it matters; a new teammate or agent could act on it unaided |

## Axes

### 1. Discovery

- 0: No product or business input read; no questions asked.
- 1: Tech facts only (stack, commands). Business model guessed.
- 2: README, docs, routes and schema mined; one batched interview (<= 8 questions) asked; answers recorded.
- 3: As 2, plus every owner answer tagged `source: owner`, conflicts between docs and code listed, non-goals recorded, open questions explicit.

### 2. Personas

- 0: None, or the template untouched.
- 1: Renamed template rows.
- 2: Each persona has goals, jobs, frustrations, key journeys and routes, from evidence.
- 3: As 2, plus evidence per persona, **Journey tests** column filled (path or `no test — flag`), and each journey linked to a test that covers it when claimed.

### 3. Domain rules

- 0: No domain artifact.
- 1: A "traps" line or a glossary only.
- 2: `.agents/domain/<area>.md` for each money-, state- or policy-bearing area: rules, invariants, edge cases, source `file:line`.
- 3: As 2, plus each **current** rule has a test you opened and verified, **target** rules labelled, refund/cancel policies owner-confirmed, and a domain-change skill when money paths exist.

### 4. Design and identity

- 0: Nothing.
- 1: Mentions the design system in passing.
- 2: `.agents/design.md` with real tokens, components, voice and languages, taken from the code.
- 3: As 2, plus **Do / don't by language** from cited screens when multilingual, and `ui-designer` / `copywriter` wired where UI exists.

### 5. Architecture and conventions

- 0: Wrong or invented.
- 1: Directory listing.
- 2: Boundaries, ownership, ADRs and conventions with paths; unenforced rules found and listed.
- 3: As 2, plus **Unenforced rules** inventory in `AGENTS.md` or setup-log with a lint proposal or ticket draft per rule.

### 6. Commands and gates verified

- 0: Commands copied from docs, never run.
- 1: Some run; the main gate untested and unexplained.
- 2: Every gate (`check`, test, lint, typecheck, build) was run, or skipped with a stated reason and a safe alternative (for example a throwaway worktree).
- 3: As 2, plus each persisted gate log has **`CMD:`** first line and **`EXIT:<code>`** last line (nothing appended after), in a dedicated file per command; **Gate outcomes** table in setup-log matches those logs.

### 7. Skills and subagents relevance

- 0: Dangling or irrelevant.
- 1: The preset as shipped, nothing repo-specific.
- 2: Every proposed skill or agent maps to a real, repeated workflow of this repo; each is tiered must/should/could with a one-line value.
- 3: As 2, plus a skill for each high-risk change type (capability, migration, domain change) and no installed file left unused.

### 8. Provider parity

- 0: One provider, others never mentioned.
- 1: Others mentioned without value.
- 2: Cursor, Claude, Codex and Muse **value table recorded** in plan and setup-log (all four one-line values); at least two wired from the same `.agents` source.
- 3: As 2, and `validate` is green for every wired provider with no manual copy.

### 9. UX friction

- 0: The user had to leave the flow to fix the tool (copy files by hand, edit config).
- 1: Several detours or surprise questions.
- 2: Zero manual file copies; at most the batched interview; a clear next step at each phase.
- 3: As 2, with **Tell the user first** as the first assistant output **after `/setup-ai` loads** (install output before the skill is excluded) — **before** any "Running phase A…" or tool call — and an end summary the owner could act on in a minute.

### 10. Self-improvement

- 0: Nothing recorded.
- 1: A summary in chat only.
- 2: `.agents/setup-log.md` retro entry (what worked, what hurt, scores) and a drafted kit issue for each friction found.
- 3: As 2, plus re-audit cadence, owner decision log, **one kit-issue draft per friction including completion defects** (plan/git mismatch, bad gate log, intro not first, broken repo-skill links), each with kit root cause and a **verified Kit file** path (or **`UNVERIFIED`**).

## Hard gates (binary, any failure fails the run)

1. **Zero dangling references.** `zedkit-ai validate` is green and no installed file references a skill or agent that is not installed.
2. **Zero lost user files.** Every file that existed before setup is byte-identical or was changed on purpose and **listed in the plan table**. Reviewer: re-run `git diff --name-only` against plan rows — **`package.json`**, **lockfile**, and **root `AGENTS.md`** ladder edits must appear. Paths derived from **`git status --porcelain`** before the plan, not from memory.
3. **Zero manual file copies** between `.agents/` and a provider folder.
4. **Gates ran.** The repo's main check ran or its absence is justified in the log.
5. **No secrets** written to any file or transcript.
6. **Public-safe kit.** Nothing from the target repo (names, customers, content) was written into the kit itself.
7. **Repo skill links resolve.** From each `.agents/skills/<name>/` directory, **`test -e`** succeeds on every relative link target in that skill's `SKILL.md` (use **`../../domain/…`**, not `../domain/…`, for `.agents/domain/`).

## Reviewer protocol

1. Read only: the diff, the transcript, the repo. Do not ask the run's agent anything.
2. Score each axis independently, evidence first, number second.
3. Write one line per axis: `axis | score | evidence`.
4. Compute the mean. Report pass or fail against targets and gates.
5. For hard gate 2, compare `git diff --name-only` (and status) to the plan table in the transcript or `PLAN.md`.
6. List friction in the form: what happened, which kit file caused it, proposed fix. Each item becomes a fix PR or a kit issue.
