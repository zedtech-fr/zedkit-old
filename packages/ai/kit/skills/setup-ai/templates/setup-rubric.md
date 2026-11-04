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
- 3: As 2, plus evidence per persona (docs, tickets, analytics, owner answer) and a link from each persona to the journeys and tests that cover it.

### 3. Domain rules

- 0: No domain artifact.
- 1: A "traps" line or a glossary only.
- 2: `.agents/domain/<area>.md` for each money-, state- or policy-bearing area: rules, invariants, edge cases, source `file:line`.
- 3: As 2, plus each rule points to a test (or a "no test" flag), refund/cancel/limit policies are owner-confirmed, and a domain-change skill enforces a rules check.

### 4. Design and identity

- 0: Nothing.
- 1: Mentions the design system in passing.
- 2: `.agents/design.md` with real tokens, components, voice and languages, taken from the code.
- 3: As 2, plus do/don't examples from real screens, copy rules for each language, and an agent (or skill) wired to apply them.

### 5. Architecture and conventions

- 0: Wrong or invented.
- 1: Directory listing.
- 2: Boundaries, ownership, ADRs and conventions with paths; unenforced rules found and listed.
- 3: As 2, plus each unenforced rule has a follow-up ticket draft or lint proposal.

### 6. Commands and gates verified

- 0: Commands copied from docs, never run.
- 1: Some run; the main gate untested and unexplained.
- 2: Every gate (`check`, test, lint, typecheck, build) was run, or skipped with a stated reason and a safe alternative (for example a throwaway worktree).
- 3: As 2, plus real durations, prerequisites (services, env) and known-flaky steps recorded.

### 7. Skills and subagents relevance

- 0: Dangling or irrelevant.
- 1: The preset as shipped, nothing repo-specific.
- 2: Every proposed skill or agent maps to a real, repeated workflow of this repo; each is tiered must/should/could with a one-line value.
- 3: As 2, plus a skill for each high-risk change type (capability, migration, domain change) and no installed file left unused.

### 8. Provider parity

- 0: One provider, others never mentioned.
- 1: Others mentioned without value.
- 2: Cursor, Claude, Codex and Muse offered with a one-line value each; at least two wired from the same `.agents` source.
- 3: As 2, and `validate` is green for every wired provider with no manual copy.

### 9. UX friction

- 0: The user had to leave the flow to fix the tool (copy files by hand, edit config).
- 1: Several detours or surprise questions.
- 2: Zero manual file copies; at most the batched interview; a clear next step at each phase.
- 3: As 2, with intro (modes, phases, deliverables, time) and an end summary the owner could act on in a minute.

### 10. Self-improvement

- 0: Nothing recorded.
- 1: A summary in chat only.
- 2: `.agents/setup-log.md` retro entry (what worked, what hurt, scores) and a drafted kit issue for each friction found.
- 3: As 2, plus a re-audit cadence, an owner decision log, and each friction mapped to a kit root cause.

## Hard gates (binary, any failure fails the run)

1. **Zero dangling references.** `zedkit-ai validate` is green and no installed file references a skill or agent that is not installed.
2. **Zero lost user files.** Every file that existed before setup is byte-identical or was changed on purpose and listed in the plan.
3. **Zero manual file copies** between `.agents/` and a provider folder.
4. **Gates ran.** The repo's main check ran or its absence is justified in the log.
5. **No secrets** written to any file or transcript.
6. **Public-safe kit.** Nothing from the target repo (names, customers, content) was written into the kit itself.

## Reviewer protocol

1. Read only: the diff, the transcript, the repo. Do not ask the run's agent anything.
2. Score each axis independently, evidence first, number second.
3. Write one line per axis: `axis | score | evidence`.
4. Compute the mean. Report pass or fail against targets and gates.
5. List friction in the form: what happened, which kit file caused it, proposed fix. Each item becomes a fix PR or a kit issue.
