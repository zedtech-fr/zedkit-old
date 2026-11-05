---
"@zedtech/zedkit-ai": patch
---

Unenforced-rule reconciliation: the skill and rubric require walking every `current` rule in root/nested `AGENTS.md` and `.agents/domain/*.md` so each genuinely unenforced rule lands in the Unenforced rules inventory (domain rows cited by ID). `validate --setup` flags a `current (documented, not enforced)` domain row whose ID appears in neither root `AGENTS.md` nor `.agents/setup-log.md`.
