---
"@zedtech/zedkit-ai": minor
---

Type-aware reference closure: `/name` references now demand an installed command when the kit defines one (a skill with the same name no longer satisfies them), `Skill tool` and `skill `x`` references demand the skill, and `agent `x`` references demand the agent. Bare backticked names and hyphenated whole words keep matching any installed kind in kit-origin files, and a file's own `/self` mention stays satisfied. Minor (not patch) because this PR also carries the overdue `validateKit(kit?)` API report refresh, whose signature-change hunk the report gate reads as renamed; no public API change.
