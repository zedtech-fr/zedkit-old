# Model routing

Copy to `.agents/model-routing.md`. Tells every future agent in this repo which model does which job, so the strongest model is not spent on reading and listing. Filled from what the tool in this run showed you, never from memory (`ground-truth`).

**Provider running this setup:** {cursor | claude | codex | muse} — detected from {the spawn tool's own schema or the session's tool list}, not from which provider folders the repo wires.
**Models the tool accepts:** {the list you read from the tool, or `UNVERIFIED: no listing available`}

## Tiers

| Tier       | Jobs                                                                                                                     | Model for this provider               | Reasoning effort |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- | ---------------- |
| **scout**  | read a slice, inventory, list files, grep, run a read-only gate and summarise, check links, collect `file:line` evidence | {cheapest fast model the tool lists}  | low              |
| **worker** | draft from evidence: nested `AGENTS.md`, domain files, tests, repetitive edits, mechanical refactors                     | {mid model}                           | medium           |
| **lead**   | synthesis, conflicts, interview, plan, design and money decisions, security and review verdicts, final report            | {the session's strong model: inherit} | high             |

A scout never decides. A scout reports evidence; the lead decides.

## Roles in this repo

Map the subagents the repo already has (`.agents/agents`, `.cursor/agents`, `.claude/agents`) to a tier, by what each one does. Their frontmatter stays as it is; the tier is applied when the agent is spawned.

| Agent         | Does                                | Tier   |
| ------------- | ----------------------------------- | ------ |
| `explorer`    | facts-only lookup, read-only        | scout  |
| `implementer` | writes one unit from a frozen brief | worker |
| `reviewer`    | judges a change                     | lead   |

## How a spawn picks its model

| Provider | Mechanism (verify in the tool before relying on it)                                                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `cursor` | The subagent spawn call takes a `model`; leave it out and the subagent inherits the parent, so a strong session spends strong tokens on reading. Always pass the scout model for reading spawns. |
| `claude` | A subagent file or the spawn call takes a `model` (a tier alias or `inherit`). Pass the scout alias for reading spawns.                                                                          |
| `codex`  | The model comes from the session or profile config. Say so; start a cheaper profile or session for bulk reading when the tool allows it.                                                         |
| `muse`   | No per-spawn control known. Keep `inherit`, shrink the reading budget and say so in the setup-log.                                                                                               |

If the tool cannot choose a model per spawn, write that here as **no routing available** and keep `inherit`. Never pin an id the tool did not list: an unknown id can fall back silently.

## Rules for agents in this repo

- Fan-out reading, search and inventory goes to **scout**. Say the tier in the brief.
- Writes that follow a settled plan go to **worker**. Anything with money, auth, data loss or a public contract stays on **lead**.
- Never run synthesis, review verdicts or the final report on **scout**.
- Subagent files in `.agents/agents/` keep `model` omitted or `inherit` (`zedkit-ai validate` enforces it); the model is chosen at spawn time, per this file.
- Record the tier and model used in the plan and the setup-log. When no tier fits, ask before spending the strong model.
- Update this file when the provider or its model list changes.
