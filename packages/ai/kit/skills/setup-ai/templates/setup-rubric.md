# Setup rubric

Scores a finished `/setup-ai` run. Used twice: by the agent as a **self-score** at the end of setup, and by an **independent reviewer** who has not seen the run (reads the diff, the transcript and the repo only).

Score each axis 0-3. Cite evidence (file path, `file:line`, or transcript quote) for every score. No evidence, no score above 1.

**Targets:** every one of the **10 axes** must score **>= 2** (no 0 or 1). **Pass mean:** **>= 2.5** computed only over the **8 measurable axes** — **2** Personas, **4** Design, **5** Architecture, **6** Gates, **7** Skills, **8** Providers, **9** UX, **10** Self-improvement — that a reviewer can score from files alone. **Discovery (1)** and **Domain rules (3)** are **owner-dependent**: still score 0–3, **report separately**, and **exclude from the mean**. In an **eval run** with a **simulated owner** (not a live human confirming), cap Discovery and Domain rules at **2** and state that in the review. With a **human owner** confirming (`source: owner`), they may score **3** as each axis text allows. Any hard gate failure fails the run regardless of mean.

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
- 3: As 2, plus evidence per persona, **Journey tests** column filled (path or `no test — flag`), and each positive test path covers the **whole** **Key journeys** column when claimed (reviewer: open the test).

### 3. Domain rules

- 0: No domain artifact.
- 1: A "traps" line or a glossary only.
- 2: `.agents/domain/<area>.md` for each money-, state- or policy-bearing area: rules, invariants, edge cases, source `file:line`.
- 3: As 2, plus each **current** rule has a test you opened and verified, **target** rules labelled, refund/cancel policies owner-confirmed, domain-change skill when money paths exist, and **Status** consistent (no **current** row that is prose-only unenforced without **`documented, not enforced`** in **Status**).

### 4. Design and identity

- 0: Nothing.
- 1: Mentions the design system in passing.
- 2: `.agents/design.md` with real tokens, components, voice and languages, taken from the code.
- 3: As 2, plus **Do / don't by language** from cited screens when multilingual, and `ui-designer` / `copywriter` wired where UI exists.

### 5. Architecture and conventions

- 0: Wrong or invented.
- 1: Directory listing.
- 2: Boundaries, ownership, ADRs and conventions with paths; unenforced rules found and listed.
- 3: As 2, plus **Unenforced rules** inventory in `AGENTS.md` or setup-log with a lint proposal or ticket draft per **genuinely** unenforced rule (no **`enforced by`** without opening the checker; no already-enforced rules listed as prose-only).

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

## Depth axes (v3)

Four more axes, scored 0-3 like the others, each measurable from files. **Every depth axis must score >= 2; a 0 on any of them fails the run.** They sit outside the 8-axis mean so the mean stays comparable across runs; `npx zedkit-ai validate --setup` runs the mechanical half of each (tag `D1`-`D4` in its messages).

### D1. Code reading

- 0: No reading phase; facts come from docs and the owner only.
- 1: One agent skimmed the code, or readers ran with no log and no citations.
- 2: `.agents/setup-log/reading.md` lists one numbered reader row per slice (inside any run budget the repo already sets, such as a cap on files read), scaled to repo size (1-5 small, 6-10 medium, 11-20 large; see `npx zedkit-ai scan`), with `file:line` evidence; the interview asked at most what the code left open.
- 3: As 2, plus the lead spot-checked citations per reader and dropped the failures, a second reader checked that each rule says what the cited code does (every order, atomicity or timing rule, with a `## Meaning check` row and no unresolved `partial` or `mismatch`), conflicts between code and docs are listed, and every interview question cites the gap it closes (an owner asked something the code answered counts against).

### D2. Domain and identity rules

- 0: No business, domain, invariant or brand rule written down.
- 1: A traps line or glossary; rules without citations; template text left in.
- 2: `.agents/domain/<area>.md` per state-, money- or policy-bearing area and an **Identity rules** section in `.agents/design.md` when UI exists, every rule with `file:line` or `source: owner`, from the reading log; when stylesheets define colours and fonts, a **Signature** section in `design.md` with colour roles, font families by role, the single accent role and exact alias exceptions, each cited.
- 3: As 2, plus every policy doc (playbook, ADR, vision, runbook) is landed in a domain, design or nested file or marked `not a rule: <reason>`, **Status** (`current` / `target`) and **Enforced by** are honest (a checker opened, or `documented, not enforced`), and every `current` rule has a test cell or `no test — flag`.

### D3. Nested rules

- 0: Only a root `AGENTS.md`, and folders with their own rules exist.
- 1: A nested file that copies the root, a folder list without rules, or existing nested stubs left untouched and unlinked.
- 2: Nested `AGENTS.md` (or an equivalent folder rule) in each folder that differs (features, ui, design, api, db), only what differs, with `file:line`, and linking the matching `.agents/domain` and `.agents/design` files; existing nested files were extended in place, not left alone as stubs; or `nested-agents: none|kept — <reason>` in the setup-log with a reason that holds.
- 3: As 2, plus the reading log's **Rule map** accounts for every provider-scoped rule file (kept as owner, mirrored by a pointer, or not a rule; none copied), links to domain and design files instead of copies, about 60 lines or fewer, every link resolves, and the Cursor rule (when wired) only points at the nested file.

### D4. Tokenomics

- 0: Nothing; every spawn inherits the session model.
- 1: A sentence in chat or in the setup-log, not written into the repo.
- 2: `.agents/tokenomics.md` has a real model (from the tool's listing, not `inherit`) on at least `providers.<p>.build.standard` and `providers.<p>.decide.sensitive`; root `AGENTS.md` points at it; `zedkit-ai sync` was run; reading spawns used `route --kind check`.
- 3: As 2, plus the setup-log records the cell (`kind`, `stakes`, model) of each fan-out, a provider that cannot route per spawn is stated plainly instead of papered over, and kit subagent files still say `model` omitted or `inherit`. A small repo with zero fan-out (the lead read inline, no reader spawns) reaches 3 when the setup-log states that plainly (`no fan-out: lead read inline`, which satisfies the fan-out record) and the rest holds.

## Hard gates (binary, any failure fails the run)

1. **Zero dangling references.** `zedkit-ai validate` is green and no installed file references a skill or agent that is not installed.
2. **Zero lost user files.** Every file that existed before setup is byte-identical or was changed on purpose and **listed in the plan table** (`PLAN.md` or `.agents/setup-log/plan.md`). Reviewer: re-run `git diff --name-only` (and `git status --porcelain -uall`) against the plan — **`package.json`**, **lockfile**, and **root `AGENTS.md`** (including **ladder append**) must each have a **dedicated plan row**. Paths derived from git before the plan, not from memory. Also run **`npx zedkit-ai validate --setup`** (add **`--plan <file>`** if the plan is not **`PLAN.md`** at the repo root or **`.agents/setup-log/plan.md`**) and treat every reported issue as a gate failure; it checks that every **`git status --porcelain -uall`** path is covered by the plan text (a parent folder with a trailing slash counts) and that each **`.agents/setup-log/gates/*.log`** starts with **`CMD:`** and ends with **`EXIT:<code>`**.
3. **Zero manual file copies** between `.agents/` and a provider folder.
4. **Gates ran.** The repo's main check ran or its absence is justified in the log. Reviewer: run **`npx zedkit-ai validate --setup`** (add **`--plan <file>`** if the plan is not **`PLAN.md`** at the repo root or **`.agents/setup-log/plan.md`**) and treat every reported issue as a gate failure; it checks that every **`git status --porcelain -uall`** path is covered by the plan text (a parent folder with a trailing slash counts) and that each **`.agents/setup-log/gates/*.log`** starts with **`CMD:`** and ends with **`EXIT:<code>`**.
5. **No secrets** written to any file or transcript.
6. **Public-safe kit.** Nothing from the target repo (names, customers, content) was written into the kit itself.
7. **Repo skill links resolve.** From each `.agents/skills/<name>/` directory, **`test -e`** succeeds on every relative link target in that skill's `SKILL.md` (use **`../../domain/…`**, not `../domain/…`, for `.agents/domain/`).

## Reviewer protocol

1. Read only: the diff, the transcript, the repo. Do not ask the run's agent anything.
2. Score each axis independently, evidence first, number second.
3. Write one line per axis: `axis | score | evidence`.
4. Compute the **mean over axes 2, 4, 5, 6, 7, 8, 9, and 10 only**. On a separate line report **Owner-dependent axes:** Discovery (1) and Domain rules (3) with their scores; note **simulated owner cap at 2** on those two when the run did not have a live human owner. Report pass or fail: every axis >= 2, mean >= 2.5 on the eight measurable axes, and hard gates.
5. **Report format (required):** one line `mean (8 axes) | <value> | pass|fail`; one line `Owner-dependent axes | discovery <n>, domain rules <n> | <optional: simulated owner cap>`; one line `Depth axes | D1 <n>, D2 <n>, D3 <n>, D4 <n> | pass|fail` (pass: every one >= 2).
6. For hard gate 2, compare `git diff --name-only` and status to the plan in the transcript, **`PLAN.md`**, or **`.agents/setup-log/plan.md`** — confirm an **`AGENTS.md` ladder** row exists when the ladder changed.
7. List friction in the form: what happened, which kit file caused it, proposed fix. Each item becomes a fix PR or a kit issue.
8. **Personas:** any positive **Journey tests** cell must cite a test that covers the **whole** stated journey (open the test); otherwise expect **`no test — flag`**.
9. **Domain / AGENTS:** **Status** vs **Unenforced rules** must agree; spot-check **`enforced by`** claims against opened checkers. Reconcile: walk every `current` rule in root/nested `AGENTS.md` and `.agents/domain/*.md` — each genuinely unenforced one is inventoried (domain rows by ID); no inventoried rule is actually enforced.
