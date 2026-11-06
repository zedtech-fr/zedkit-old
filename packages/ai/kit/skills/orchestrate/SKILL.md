---
name: orchestrate
description: "Hand a multi-step task to the orchestrator subagent: framing, parallel dispatch, aggregation, and a single closing report. Use when the work needs more than one lens or phase and you want one coordinator."
---

Hand the task to the **`orchestrator`** subagent with the user's text, repo
state you already know, success criteria, and the task's `Stakes:` (and any
`Needs:`). Every spawn is routed with
`zedkit-ai route <agent> --kind <how it is used now> --stakes <s>`: the
orchestrator itself as `decide`, planners as `design`, implementers as `build`,
reviewers as `check`.

If subagents are unavailable, return ready-to-run briefs (`dispatch plan`)
when a capable caller can run them; otherwise follow the same steps yourself
in this conversation (the steps live in `agents/orchestrator.md` only — do not
copy them here) and open your report with
`Mode: inline fallback (<observed cause>)`.
